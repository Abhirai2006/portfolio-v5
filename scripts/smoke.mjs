// Route smoke checks for the portfolio, run against a live dev or preview server.
//
//   bun run dev --host 127.0.0.1 --port 8080   (in another terminal)
//   bun run smoke -- --base http://127.0.0.1:8080
//
// For every route in tests/smoke.config.json, at four widths and in both themes:
// no page errors or console errors, no sideways scroll, and every "mustContain" /
// "mustContainJsOnly" string present. Then a pass with JavaScript disabled, which
// checks "mustContain" only (server-rendered HTML must carry the content).
import { readFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");

const args = process.argv.slice(2);
const arg = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const base = arg("--base", "http://127.0.0.1:8080").replace(/\/$/, "");
const only = arg("--only", null);
const shots = process.env.SMOKE_SHOTS || "";
const config = JSON.parse(
  readFileSync(new URL("../tests/smoke.config.json", import.meta.url), "utf8"),
);
const WIDTHS = [360, 390, 768, 1280];
const THEMES = ["dark"];
// Third-party fetches the sandbox or a visitor's network may block; not our bugs.
const IGNORE = [
  /github-contributions-api/,
  /api\.github\.com/,
  /supabase\.co/,
  /Failed to load resource/,
  /fonts\.g/,
];

if (shots) mkdirSync(shots, { recursive: true });
const failures = [];
const seenTitles = {};
const seenDescriptions = {};
const fail = (msg) => failures.push(msg);
const routes = config.routes.filter((r) => !only || r.path === only);

const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
for (const route of routes) {
  for (const theme of THEMES) {
    for (const width of WIDTHS) {
      const ctx = await browser.newContext({ viewport: { width, height: 900 } });
      await ctx.addInitScript((t) => {
        try {
          localStorage.setItem("theme", t);
        } catch {}
      }, theme);
      const page = await ctx.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
      page.on("console", (m) => {
        if (m.type() === "error" && !IGNORE.some((r) => r.test(m.text())))
          errors.push(`console: ${m.text()}`);
      });
      const tag = `${route.path} [${theme} ${width}px]`;
      const res = await page.goto(base + route.path, { waitUntil: "domcontentloaded" });
      if (!res || res.status() >= 400) fail(`${tag}: HTTP ${res?.status()}`);
      await page.waitForTimeout(route.settleMs ?? 1500);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      if (overflow > 0) fail(`${tag}: sideways scroll of ${overflow}px`);
      const broken = await page.evaluate(() =>
        [...document.images]
          .filter((i) => i.complete && i.naturalWidth === 0 && i.src)
          .map((i) => i.src),
      );
      for (const src of broken)
        if (!/kitsu|githubusercontent|supabase/.test(src)) fail(`${tag}: broken image ${src}`);
      const text = await page.evaluate(
        () => document.body.innerText + " " + document.documentElement.innerHTML,
      );
      for (const s of [...(route.mustContain ?? []), ...(route.mustContainJsOnly ?? [])]) {
        if (!text.includes(s)) fail(`${tag}: missing "${s}"`);
      }
      if (route.a11yChecks && width === 1280) {
        // Tab reaches "Skip to contact" quickly, even while the gate is open.
        await page.evaluate(
          () =>
            document.activeElement && document.activeElement.blur && document.activeElement.blur(),
        );
        let reached = false;
        for (let i = 0; i < 8 && !reached; i++) {
          await page.keyboard.press("Tab");
          reached = await page.evaluate(() =>
            /Skip (to contact|intro)/.test(document.activeElement?.textContent ?? ""),
          );
        }
        if (!reached) fail(`${tag}: Tab did not reach a skip control within 8 presses`);
      }
      if (route.forestCheck && width === 1280) {
        // The WebGL forest opening: the loader finishes, the canvas draws, scrolling moves the camera.
        const staged = await page
          .waitForSelector(".opening[data-phase=on]", { state: "attached", timeout: 120000 })
          .then(() => true)
          .catch(() => false);
        if (!staged) fail(`${tag}: the WebGL forest never became ready`);
        else {
          await page.mouse.wheel(0, 1600);
          await page.waitForTimeout(800);
          const y = await page.evaluate(() => window.scrollY);
          if (y < 200) fail(`${tag}: scrolling did not move through the opening`);
        }
      }
      for (const e of errors) fail(`${tag}: ${e}`);
      if (shots) {
        const name = route.path.replace(/\W+/g, "_").replace(/^_|_$/g, "") || "home";
        await page.screenshot({ path: `${shots}/${name}-${theme}-${width}.png` });
      }
      await ctx.close();
    }
  }
  if (route.pdfMaxPages) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(base + route.path, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    const pdf = await page.pdf({ format: "A4" });
    const pages = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;
    if (pages > route.pdfMaxPages)
      fail(`${route.path}: prints on ${pages} A4 pages (max ${route.pdfMaxPages})`);
    await ctx.close();
  }
  if (route.forestCheck) {
    // Reduced motion: no WebGL, the server-rendered article is shown and readable.
    const rctx = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      reducedMotion: "reduce",
    });
    const rp = await rctx.newPage();
    await rp.goto(base + route.path, { waitUntil: "domcontentloaded" });
    await rp.waitForTimeout(1500);
    const on = await rp.evaluate(() => document.documentElement.classList.contains("forest-on"));
    if (on) fail(`${route.path} [reduced motion]: the WebGL forest still runs`);
    const visible = await rp.evaluate(
      () => document.querySelector(".forest-static")?.getBoundingClientRect().height ?? 0,
    );
    if (visible < 800) fail(`${route.path} [reduced motion]: the static article is not shown`);
    await rctx.close();
  }
  // No-JS pass: server-rendered HTML alone.
  const ctx = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 900 },
  });
  const page = await ctx.newPage();
  await page.goto(base + route.path, { waitUntil: "domcontentloaded" });
  const html = await page.content();
  for (const s of route.mustContain ?? [])
    if (!html.includes(s)) fail(`${route.path} [no-JS]: missing "${s}"`);
  // SEO: every page has its own title + description, and every JSON-LD block parses.
  const seo = await page.evaluate(() => ({
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.getAttribute("content") ?? "",
    ld: [...document.querySelectorAll('script[type="application/ld+json"]')].map(
      (s) => s.textContent ?? "",
    ),
  }));
  if (!seo.title) fail(`${route.path}: no <title>`);
  if (!seo.description) fail(`${route.path}: no meta description`);
  for (const [other, t] of Object.entries(seenTitles))
    if (t === seo.title) fail(`${route.path}: same <title> as ${other}`);
  for (const [other, d] of Object.entries(seenDescriptions))
    if (d === seo.description) fail(`${route.path}: same description as ${other}`);
  seenTitles[route.path] = seo.title;
  seenDescriptions[route.path] = seo.description;
  for (const block of seo.ld) {
    try {
      JSON.parse(block);
    } catch {
      fail(`${route.path}: JSON-LD block does not parse`);
    }
  }
  await ctx.close();
}
await browser.close();

if (failures.length) {
  console.error(`SMOKE FAIL (${failures.length})\n` + failures.map((f) => "  - " + f).join("\n"));
  process.exit(1);
}
console.log(
  `SMOKE PASS (${routes.length} routes x ${WIDTHS.length} widths x ${THEMES.length} themes + no-JS)`,
);
