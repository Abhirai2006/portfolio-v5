// Route smoke checks for "Abhishek's World", run against a live dev or preview server.
//
//   bun run dev --host 127.0.0.1 --port 8080   (in another terminal)
//   bun run smoke -- --base http://127.0.0.1:8080
//
// For every route in tests/smoke.config.json, at five widths: no page errors or console errors, no sideways
// scroll, no broken images, and every "mustContain" string present. Then a pass with JavaScript disabled, which
// checks "mustContain" in the server HTML alone, plus SEO basics. The homepage also gets behaviour checks:
// keyboard path (Skip intro, the six hero pieces), a live transformation that ends in the right chapter,
// reduced motion (no flash, quick arrival), no-WebGL fallback (board still + video), Churn Lab and Breslau 1912.
// Software WebGL in CI is slow, so live checks force the live tier with ?tier=high and use generous waits.
import { readFileSync, mkdirSync } from "node:fs";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const arg = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const base = arg("--base", "http://127.0.0.1:8080").replace(/\/$/, "");
const only = arg("--only", null);
const shots = process.env.SMOKE_SHOTS || "";
const config = JSON.parse(
  readFileSync(new URL("../tests/smoke.config.json", import.meta.url), "utf8"),
);
const WIDTHS = [360, 390, 768, 1280, 1440];
// Third-party fetches the sandbox or a visitor's network may block; not our bugs.
const IGNORE = [
  /github-contributions-api/,
  /api\.github\.com/,
  /supabase\.co/,
  /Failed to load resource/,
  /kitsu/,
];
const GL = ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];

if (shots) mkdirSync(shots, { recursive: true });
const failures = [];
const seenTitles = {};
const seenDescriptions = {};
const fail = (msg) => failures.push(msg);
const routes = config.routes.filter((r) => !only || r.path === only);
const watch = (page) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error" && !IGNORE.some((r) => r.test(m.text())))
      errors.push(`console: ${m.text()}`);
  });
  return errors;
};
const sectionTop = (page, id) =>
  page.evaluate(
    (i) => Math.abs(document.getElementById(i)?.getBoundingClientRect().top ?? 9999),
    id,
  );

const browser = await chromium.launch({ args: GL });
for (const route of routes) {
  for (const width of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await ctx.newPage();
    const errors = watch(page);
    const tag = `${route.path} [${width}px]`;
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
    for (const s of [...(route.mustContain ?? []), ...(route.mustContainJsOnly ?? [])])
      if (!text.includes(s)) fail(`${tag}: missing "${s}"`);

    if (route.a11yChecks && width === 1280) {
      // First visit: the loader must finish and get out of the way on its own (real progress → READY → outro).
      const loaderGone = await page
        .waitForFunction(() => document.documentElement.classList.contains("intro-done"), null, {
          timeout: 30000,
        })
        .then(() => true)
        .catch(() => false);
      if (!loaderGone) fail(`${tag}: the loader never went away`);
      // The intro never locks the page: scrolling works at once, and Tab reaches "Skip intro" first.
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.mouse.wheel(0, 1200);
      const scrolled = await page
        .waitForFunction(() => window.scrollY >= 200, null, { timeout: 3000 })
        .then(() => true)
        .catch(() => false);
      if (!scrolled) fail(`${tag}: page did not scroll right after load`);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.evaluate(() => document.activeElement?.blur?.());
      let reached = false;
      for (let i = 0; i < 3 && !reached; i++) {
        await page.keyboard.press("Tab");
        reached = await page.evaluate(() =>
          (document.activeElement?.textContent ?? "").includes("Skip intro"),
        );
      }
      if (!reached) fail(`${tag}: Tab did not reach "Skip intro" within 3 presses`);
      // Six hero links, each with a name that says where it leads.
      const heroes = await page.locator("#board .hero-label").allInnerTexts();
      if (heroes.length !== 6) fail(`${tag}: expected 6 hero piece links, found ${heroes.length}`);
    }
    if (route.labCheck && width === 1280) {
      // arrive the way a shared link does: a deep link straight to the chapter
      await page.goto("about:blank"); // a same-page hash change would not reload; open the link fresh
      await page.goto(`${base}/#ml`, { waitUntil: "domcontentloaded" });
      // the lab and its 150-tree model load lazily when scrolled near (first dev compile can be slow)
      const loaded = await page
        .getByRole("tab", { name: "Pick the threshold" })
        .waitFor({ timeout: 20000 })
        .then(() => true)
        .catch(() => false);
      await page
        .waitForFunction(() => /\d+%/.test(document.getElementById("ml")?.innerText ?? ""), null, {
          timeout: 10000,
        })
        .catch(() => {});
      // innerText is the rendered text: HUD labels are uppercase, so compare case-insensitively
      const lab = (
        await page.evaluate(() => document.getElementById("ml")?.innerText ?? "")
      ).toLowerCase();
      if (!loaded || !lab.includes("score a customer")) fail(`${tag}: Churn Lab tabs missing`);
      if (!/\d+%/.test(lab)) fail(`${tag}: Churn Lab shows no probability`);
      if (loaded) {
        await page.getByRole("tab", { name: "Pick the threshold" }).click();
        await page.waitForTimeout(400);
        const thr = await page.evaluate(() => document.getElementById("ml").innerText);
        if (!thr.includes("0.485"))
          fail(`${tag}: threshold label should read 0.485 at Abhishek's threshold`);
      }
    }
    if (route.chessCheck && width === 1280) {
      await page.evaluate(() => document.getElementById("breslau").scrollIntoView());
      await page.waitForTimeout(600);
      const fin0 = page.locator("#breslau");
      await fin0
        .getByRole("button", { name: "c3, black queen" })
        .click({ timeout: 8000 })
        .catch(() => fail(`${tag}: Breslau board has no c3 queen button`));
      await fin0
        .getByRole("button", { name: "g3", exact: true })
        .click({ timeout: 8000 })
        .catch(() => {});
      await page.waitForTimeout(500);
      const fin = await page.evaluate(() => document.getElementById("breslau").innerText);
      if (!fin.includes("Qg3!!")) fail(`${tag}: playing c3→g3 did not solve the Breslau finale`);
    }
    for (const e of errors) fail(`${tag}: ${e}`);
    if (shots) {
      const name = route.path.replace(/\W+/g, "_").replace(/^_|_$/g, "") || "home";
      await page.screenshot({ path: `${shots}/${name}-${width}.png` });
    }
    await ctx.close();
  }

  if (route.cinematicChecks) {
    // Live world: keyboard to the knight, Enter → the transformation plays (world above the page), then the
    // visitor lands in the ML chapter with focus on its heading.
    {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await ctx.newPage();
      const errors = watch(page);
      await page.goto(`${base}/?tier=high#board`, { waitUntil: "load" });
      await page
        .waitForFunction(() => document.documentElement.classList.contains("intro-done"), null, {
          timeout: 30000,
        })
        .catch(() => fail(`/ [live]: the loader never went away`));
      await page.waitForTimeout(3000);
      const knight = page.locator("#board .hero-label").first();
      await knight.focus();
      const hovered = await page.evaluate(() =>
        document.activeElement?.textContent?.includes("KNIGHT"),
      );
      if (!hovered) fail(`/ [live]: could not focus the knight link`);
      await page.keyboard.press("Enter");
      const playing = await page
        .waitForFunction(() => document.documentElement.classList.contains("cinematic-on"), null, {
          timeout: 4000,
        })
        .then(() => true)
        .catch(() => false);
      if (!playing) fail(`/ [live]: Enter on the knight did not start the transformation`);
      await page
        .waitForFunction(() => !document.documentElement.classList.contains("cinematic-on"), null, {
          timeout: 15000,
        })
        .catch(() => {});
      await page.waitForTimeout(2500);
      if ((await sectionTop(page, "ml")) > 240)
        fail(`/ [live]: the knight did not arrive at the ML chapter`);
      const focusIn = await page.evaluate(() => document.activeElement?.closest("section")?.id);
      if (focusIn !== "ml")
        fail(`/ [live]: focus did not move into the ML chapter (was ${focusIn})`);
      for (const e of errors) fail(`/ [live]: ${e}`);
      await ctx.close();
    }
    // WebGL context lost mid-visit (GPU reset, tab woken from sleep): never a blank stage — fall back to the still.
    {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await ctx.newPage();
      await page.goto(`${base}/?tier=high#board`, { waitUntil: "load" });
      await page
        .waitForFunction(() => document.documentElement.classList.contains("intro-done"), null, { timeout: 30000 })
        .catch(() => {});
      await page.waitForSelector("canvas", { timeout: 10000 }).catch(() => {});
      const lost = await page.evaluate(() => {
        const c = document.querySelector("canvas");
        const gl = c?.getContext("webgl2");
        const ext = gl?.getExtension("WEBGL_lose_context");
        ext?.loseContext();
        return Boolean(ext);
      });
      if (lost) {
        const still = await page
          .waitForSelector('#board img[src="/media/board-still.jpg"]', { timeout: 5000 })
          .then(() => true)
          .catch(() => false);
        if (!still) fail(`/ [context lost]: the board did not fall back to the still image`);
      }
      await ctx.close();
    }
    // Reduced motion: a calm crossfade — no flash panel, and the visitor arrives quickly.
    {
      const ctx = await browser.newContext({
        viewport: { width: 1280, height: 900 },
        reducedMotion: "reduce",
      });
      const page = await ctx.newPage();
      await page.goto(`${base}/?tier=high#board`, { waitUntil: "load" });
      await page
        .waitForFunction(() => document.documentElement.classList.contains("intro-done"), null, {
          timeout: 30000,
        })
        .catch(() => fail(`/ [reduced motion]: the loader never went away`));
      await page.evaluate(() => document.getElementById("board")?.scrollIntoView());
      await page.waitForTimeout(1500);
      await page.evaluate(() => {
        window.__flashes = 0;
        new MutationObserver(() => {
          if (document.querySelector(".bg-white.fixed")) window.__flashes++;
        }).observe(document.body, { childList: true, subtree: true });
      });
      await page
        .locator("#board .hero-label-box")
        .first()
        .click({ timeout: 8000 })
        .catch(() => fail(`/ [reduced motion]: knight link not clickable`));
      await page.waitForTimeout(2500);
      const flashes = await page.evaluate(() => window.__flashes);
      if (flashes > 0) fail(`/ [reduced motion]: a flash panel appeared`);
      if ((await sectionTop(page, "ml")) > 240)
        fail(`/ [reduced motion]: did not arrive at the ML chapter within 2.5 s`);
      await ctx.close();
    }
    // No WebGL / phones: the board is a still with six choices; choosing plays the recorded video, then lands.
    {
      const nogl = await chromium.launch({
        args: ["--disable-3d-apis", "--disable-webgl", "--disable-webgl2"],
      });
      const ctx = await nogl.newContext({
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true,
      });
      const page = await ctx.newPage();
      const errors = watch(page);
      await page.goto(`${base}/#board`, { waitUntil: "load" });
      await page.waitForTimeout(2500);
      const still = await page.locator('#board img[src="/media/board-still.jpg"]').count();
      if (!still) fail(`/ [no WebGL]: the board still is missing`);
      if (await page.locator("canvas").count()) fail(`/ [no WebGL]: a canvas was mounted anyway`);
      const touch = await page.evaluate(() =>
        [...document.querySelectorAll("*")].some(
          (el) => getComputedStyle(el).touchAction === "none",
        ),
      );
      if (touch) fail(`/ [no WebGL]: something sets touch-action: none (page can't be swiped)`);
      await page
        .getByRole("button", { name: /KNIGHT → ML/ })
        .first()
        .click({ timeout: 8000 })
        .catch(() => fail(`/ [no WebGL]: no knight button on the board still`));
      const video = await page
        .waitForSelector("video", { timeout: 3000 })
        .then(() => true)
        .catch(() => false);
      if (!video) fail(`/ [no WebGL]: choosing the knight did not play the video`);
      await page.waitForTimeout(6500);
      if ((await sectionTop(page, "ml")) > 240)
        fail(`/ [no WebGL]: did not land on the ML chapter after the video`);
      for (const e of errors) fail(`/ [no WebGL]: ${e}`);
      await nogl.close();
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

  // No-JS pass: server-rendered HTML alone.
  const ctx = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 900 },
  });
  const page = await ctx.newPage();
  await page.goto(base + route.path, { waitUntil: "domcontentloaded" });
  const html = await page.content();
  const txt = await page.evaluate(() => document.body.innerText);
  for (const s of route.mustContain ?? [])
    if (!html.includes(s) && !txt.includes(s)) fail(`${route.path} [no-JS]: missing "${s}"`);
  if (route.path === "/" && (await page.locator("h1").count()) !== 1)
    fail(`/ [no-JS]: expected exactly one <h1>`);
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
  `SMOKE PASS (${routes.length} routes x ${WIDTHS.length} widths + behaviour checks + no-JS)`,
);
