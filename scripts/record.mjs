// A frame-stepped recording of the opening (SwiftShader is too slow for live capture):
// scroll title → coast → maths → Mysuru → ink bleed → room → Code Awakening, hold to run, the flood.
//   node scripts/record.mjs --base http://127.0.0.1:8080 --out rec/   (then ffmpeg assembles rec/*.png)
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");

const args = process.argv.slice(2);
const arg = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const base = arg("--base", "http://127.0.0.1:8080");
const out = arg("--out", "rec");
const w = Number(arg("--w", 1280));
const h = Number(arg("--h", 800));
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage({ viewport: { width: w, height: h } });
await page.goto(`${base}/?beat=title&t=0&tier=high`, { waitUntil: "domcontentloaded" });
await page.waitForSelector(".loader.is-done", { state: "attached", timeout: 60000 });
await page.waitForTimeout(2500);
let n = 0;
const shot = async () => page.screenshot({ path: `${out}/f${String(n++).padStart(4, "0")}.png` });
const frames = async () =>
  page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

// 1. title idle
for (let i = 0; i < 12; i++) {
  await frames();
  await shot();
}
// 2. scroll to the Code Awakening gate
const target = await page.evaluate(() => {
  const st = window.__aw.stage;
  const b = st.story.find((x) => x.id === "awaken");
  return b.start + b.gate.at * b.len;
});
const steps = Number(arg("--steps", 160));
for (let i = 1; i <= steps; i++) {
  const u = i / steps;
  const s = target * (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2) * 0.999;
  await page.evaluate((y) => window.scrollTo(0, y * innerHeight), s);
  await frames();
  await shot();
}
// 3. hold to run (keyboard), then the impact and the colour flood
const ring = page.locator(".story-hold .hold-btn");
await ring.waitFor({ timeout: 8000 });
await ring.focus();
await page.keyboard.down(" ");
for (let i = 0; i < 30; i++) {
  await frames();
  await shot();
}
await page.keyboard.up(" ");
for (let i = 0; i < 45; i++) {
  await frames();
  await shot();
}
await browser.close();
console.log(`${n} frames in ${out}`);
