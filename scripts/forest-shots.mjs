// Screenshots of the forest opening at fixed scroll positions, desktop and phone.
//
//   bun run dev            (in another terminal)
//   node scripts/forest-shots.mjs [out-dir] [p1,p2,...]
//
// Uses the ?p= debug parameter, which pins the opening at a scroll position (0..1).
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const out = process.argv[2] ?? "shots";
const ps = (process.argv[3] ?? "0,0.25,0.4,0.75,1").split(",");
const base = process.env.BASE_URL ?? "http://localhost:8080";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
for (const [w, h, name] of [
  [1440, 900, "desktop"],
  [390, 844, "phone"],
]) {
  for (const p of ps) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.goto(`${base}/?p=${p}`, { waitUntil: "networkidle", timeout: 240000 });
    await page.waitForSelector(".opening[data-phase=on]", { timeout: 240000 });
    await page.waitForFunction(() => window.__forest?.info?.treeLoaded, null, { timeout: 240000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${out}/${name}-p${p}.png` });
    console.log("saved", `${out}/${name}-p${p}.png`);
    await page.close();
  }
}
await browser.close();
