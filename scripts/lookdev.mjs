// Look-dev captures of the comic: any beat at any moment, desktop + phone.
//   node scripts/lookdev.mjs --base http://127.0.0.1:8080 --out shots/ [--only coast,room]
// Each shot loads /?beat=<id>&t=<t>&clean=1 with WebGL on SwiftShader and waits for the stage.
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");

const args = process.argv.slice(2);
const arg = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const base = arg("--base", "http://127.0.0.1:8080").replace(/\/$/, "");
const out = arg("--out", "shots");
const only = arg("--only", null)?.split(",");
const sizes = arg("--sizes", "desktop,phone").split(",");
mkdirSync(out, { recursive: true });

export const SHOTS = [
  ["gate", "gate=1", 0],
  ["title", "beat=title&t=0.05", 0],
  ["title-pull", "beat=title&t=0.8", 0],
  ["coast", "beat=coast&t=0.5", 0],
  ["maths", "beat=maths&t=0.5", 0],
  ["mysuru", "beat=mysuru&t=0.5", 0],
  ["inkbleed", "beat=mysuru&t=0.885", 0],
  ["burn", "beat=rise&t=0.955", 0],
  ["shatter", "beat=breakout&t=0.86", 0],
  ["tear", "beat=choose&t=0.975", 0],
  ["room", "beat=room&t=0.62", 0],
  ["awaken", "beat=awaken&t=0.48&hold=0.6", 0],
  ["rise", "beat=rise&t=0.42&hold=0.5", 0],
  ["breakout", "beat=breakout&t=0.5", 0],
  ["dawn", "beat=dawn&t=0.5", 0],
  ["choose", "beat=choose&t=0.5", 0],
  ["path-ml", "beat=path-ml&t=0.5", 0],
  ["path-product", "beat=path-product&t=0.1", 0],
  ["path-problem", "beat=path-problem&t=0.1", 0],
  ["enter", "beat=enter&t=0.3", 0],
  ["void", "beat=void&t=0.25", 0],
  ["power", "beat=power&t=0.5", 0],
  ["ask", "beat=ask&t=0.5", 0],
];

const VIEW = { desktop: { width: 1440, height: 900 }, phone: { width: 390, height: 844 } };

const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
for (const size of sizes) {
  const ctx = await browser.newContext({
    viewport: VIEW[size],
    deviceScaleFactor: 1,
    hasTouch: size === "phone",
  });
  // every shot starts fresh (no remembered gates or colour flood from the previous shot)
  await ctx.addInitScript(() => {
    try {
      if (!sessionStorage.getItem("lookdev")) {
        localStorage.clear();
        sessionStorage.setItem("lookdev", "1");
      }
    } catch {}
  });
  for (const [name, q, settle] of SHOTS) {
    if (only && !only.includes(name)) continue;
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    await page.goto(`${base}/?${q}&clean=1&tier=high`, { waitUntil: "domcontentloaded" });
    try {
      await page.waitForSelector(".loader.is-done", { state: "attached", timeout: 60000 });
    } catch {
      errors.push("stage never became ready");
    }
    await page.waitForTimeout(2200 + settle);
    await page.screenshot({ path: `${out}/${name}-${size}.png` });
    if (errors.length) console.log(name, size, errors.slice(0, 3).join(" | "));
    await page.close();
  }
  await ctx.close();
}
await browser.close();
console.log("done");
