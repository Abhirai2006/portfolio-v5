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
import { chromium } from "playwright";

const args = process.argv.slice(2);
const arg = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const base = arg("--base", "http://127.0.0.1:8080").replace(/\/$/, "");
const only = arg("--only", null);
const shots = process.env.SMOKE_SHOTS || "";
const config = JSON.parse(readFileSync(new URL("../tests/smoke.config.json", import.meta.url), "utf8"));
const WIDTHS = [360, 390, 768, 1280];
const THEMES = ["dark", "light"];
// Third-party fetches the sandbox or a visitor's network may block; not our bugs.
const IGNORE = [/github-contributions-api/, /api\.github\.com/, /supabase\.co/, /Failed to load resource/, /fonts\.g/];

if (shots) mkdirSync(shots, { recursive: true });
const failures = [];
const seenTitles = {};
const seenDescriptions = {};
const fail = (msg) => failures.push(msg);
const routes = config.routes.filter((r) => !only || r.path === only);

const browser = await chromium.launch();
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
        if (m.type() === "error" && !IGNORE.some((r) => r.test(m.text()))) errors.push(`console: ${m.text()}`);
      });
      const tag = `${route.path} [${theme} ${width}px]`;
      const res = await page.goto(base + route.path, { waitUntil: "domcontentloaded" });
      if (!res || res.status() >= 400) fail(`${tag}: HTTP ${res?.status()}`);
      await page.waitForTimeout(route.settleMs ?? 1500);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (overflow > 0) fail(`${tag}: sideways scroll of ${overflow}px`);
      const broken = await page.evaluate(() =>
        [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.src).map((i) => i.src),
      );
      for (const src of broken) if (!/kitsu|githubusercontent|supabase/.test(src)) fail(`${tag}: broken image ${src}`);
      const text = await page.evaluate(() => document.body.innerText + " " + document.documentElement.innerHTML);
      for (const s of [...(route.mustContain ?? []), ...(route.mustContainJsOnly ?? [])]) {
        if (!text.includes(s)) fail(`${tag}: missing "${s}"`);
      }
      if (route.a11yChecks && theme === "dark") {
        // The chess must never lock the page: scrolling works at once, and Tab reaches the skip link fast.
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.mouse.wheel(0, 1200);
        // Polled: the software WebGL in CI delays frames; on a GPU this is instant.
        const scrolled = await page
          .waitForFunction(() => window.scrollY >= 200, null, { timeout: 2000 })
          .then(() => true)
          .catch(() => false);
        if (!scrolled) fail(`${tag}: page did not scroll right after load`);
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
        let reached = false;
        for (let i = 0; i < 5 && !reached; i++) {
          await page.keyboard.press("Tab");
          reached = await page.evaluate(() => (document.activeElement?.textContent ?? "").includes("Skip to the work"));
        }
        if (!reached) fail(`${tag}: Tab did not reach "Skip to the work" within 5 presses`);
      }
      if (route.labCheck && theme === "dark") {
        // The Churn Lab loads when scrolled near: scroll there, then the real model must answer.
        await page.evaluate(() => document.getElementById("lab")?.scrollIntoView());
        await page.waitForTimeout(3000);
        const lab = await page.evaluate(() => document.getElementById("lab")?.innerText ?? "");
        if (!lab.includes("Score a customer")) fail(`${tag}: Churn Lab tabs missing`);
        if (!/\d+%/.test(lab)) fail(`${tag}: Churn Lab shows no probability`);
      }
      if (route.chessCheck && theme === "dark" && width === 1280) {
        // Main board: a knight move travels to the Churn Lab; "Back to the board" returns; the finale solves c3→g3.
        await page.evaluate(() => window.scrollTo(0, 0));
        // Wait for the 3D board (if WebGL works), switch it to 2D, then play 1...Nf6 on the main board.
        const hasCanvas = await page
          .waitForSelector("#board canvas", { timeout: 8000 })
          .then(() => true)
          .catch(() => false);
        if (hasCanvas) await page.locator("#board").getByRole("button", { name: "2D board" }).click();
        const main = page.locator("#board");
        await main.getByRole("button", { name: "g8, black knight" }).click();
        await main.getByRole("button", { name: "f6", exact: true }).click();
        // Lights out: the dark layer must cover the page while the piece moves (polled: software WebGL is slow).
        const wentDark = await page
          .waitForFunction(
            () => Number(getComputedStyle(document.querySelector("#board > div[aria-hidden]")).opacity) > 0.5,
            null,
            { timeout: 4000 },
          )
          .then(() => true)
          .catch(() => false);
        if (!wentDark) fail(`${tag}: the room did not go dark during the move`);
        await page.waitForFunction(() => Math.abs(document.getElementById("lab").getBoundingClientRect().top) < 220, null, { timeout: 9000 }).catch(() => {});
        const atLab = await page.evaluate(() => Math.abs(document.getElementById("lab").getBoundingClientRect().top) < 220);
        if (!atLab) fail(`${tag}: knight move did not travel to the Churn Lab`);
        await page.getByRole("button", { name: /Back to the board/ }).click();
        await page.waitForTimeout(1500);
        const atBoard = await page.evaluate(() => Math.abs(document.getElementById("board").getBoundingClientRect().top) < 220);
        if (!atBoard) fail(`${tag}: "Back to the board" did not return to the board`);
        const moves = await page.evaluate(() => document.getElementById("board").innerText);
        if (!/1\.Nf3 Nf6 2\./.test(moves)) fail(`${tag}: white did not answer the knight move`);
        await page.evaluate(() => document.getElementById("finale").scrollIntoView());
        await page.waitForTimeout(600);
        const fin0 = page.locator("#finale");
        await fin0.getByRole("button", { name: "c3, black queen" }).click();
        await fin0.getByRole("button", { name: "g3", exact: true }).click();
        await page.waitForTimeout(500);
        const fin = await page.evaluate(() => document.getElementById("finale").innerText);
        if (!fin.includes("Qg3!!")) fail(`${tag}: playing c3→g3 did not solve the finale`);
      }
      if (route.reviewChecks && theme === "dark" && width === 1280) {
        // Keyboard: following a legend link moves focus into the destination chapter.
        await page.evaluate(() => window.scrollTo(0, 0));
        const knightLink = page.locator("#board aside a").first();
        await knightLink.focus();
        await page.keyboard.press("Enter");
        await page.waitForTimeout(1500);
        const focusIn = await page.evaluate(() => document.activeElement?.closest("section")?.id ?? document.activeElement?.tagName);
        if (focusIn !== "lab") fail(`${tag}: keyboard focus did not move to the Churn Lab after the legend link (was ${focusIn})`);
        // Threshold label shows enough precision that 0.4848 and 0.48 never look the same.
        await page.getByRole("tab", { name: "Pick the threshold" }).click();
        await page.waitForTimeout(400);
        const thr = await page.evaluate(() => document.getElementById("lab").innerText);
        if (!thr.includes("0.485")) fail(`${tag}: threshold label should read 0.485 at Abhishek's threshold`);
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
    if (pages > route.pdfMaxPages) fail(`${route.path}: prints on ${pages} A4 pages (max ${route.pdfMaxPages})`);
    await ctx.close();
  }
  if (route.reviewChecks) {
    // Phone with a touchscreen: a swipe that starts on the 3D board must scroll the page.
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    await page.goto(base + route.path, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#board canvas", { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(800);
    const touchAction = await page.evaluate(() => {
      let el = document.querySelector("#board canvas");
      const seen = [];
      while (el) {
        seen.push(getComputedStyle(el).touchAction);
        el = el.parentElement;
      }
      return seen;
    });
    if (touchAction.includes("none")) fail(`${route.path} [touch 390px]: an element around the 3D board sets touch-action: none (page can't be swiped)`);
    await ctx.close();
    // Reduced motion: no full-screen blackout when a piece moves.
    const rctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
    const rp = await rctx.newPage();
    await rp.goto(base + route.path, { waitUntil: "domcontentloaded" });
    await rp.waitForTimeout(1500);
    const main = rp.locator("#board");
    await main.getByRole("button", { name: "g8, black knight" }).click();
    await main.getByRole("button", { name: "f6", exact: true }).click();
    await rp.waitForTimeout(600);
    const op = await rp.evaluate(() => Number(getComputedStyle(document.querySelector("#board > div[aria-hidden]")).opacity));
    if (op > 0.1) fail(`${route.path} [reduced motion]: the page still blacks out when a piece moves`);
    await rctx.close();
  }
  // No-JS pass: server-rendered HTML alone.
  const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(base + route.path, { waitUntil: "domcontentloaded" });
  const html = await page.content();
  for (const s of route.mustContain ?? []) if (!html.includes(s)) fail(`${route.path} [no-JS]: missing "${s}"`);
  // SEO: every page has its own title + description, and every JSON-LD block parses.
  const seo = await page.evaluate(() => ({
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.getAttribute("content") ?? "",
    ld: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent ?? ""),
  }));
  if (!seo.title) fail(`${route.path}: no <title>`);
  if (!seo.description) fail(`${route.path}: no meta description`);
  for (const [other, t] of Object.entries(seenTitles)) if (t === seo.title) fail(`${route.path}: same <title> as ${other}`);
  for (const [other, d] of Object.entries(seenDescriptions)) if (d === seo.description) fail(`${route.path}: same description as ${other}`);
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
console.log(`SMOKE PASS (${routes.length} routes x ${WIDTHS.length} widths x ${THEMES.length} themes + no-JS)`);
