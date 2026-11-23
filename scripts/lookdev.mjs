// Look-dev stills (AGENT.md rule 1, PRD §7 M0): renders named shots of the live site at 1440×900 and 390×844.
//
//   bun run dev --host 127.0.0.1 --port 8080        (in another terminal)
//   node scripts/lookdev.mjs --base http://127.0.0.1:8080 --out docs/lookdev/m0 [--only knight]
//
// Each shot is frozen with ?shot=<name>&t=<0..1> (see src/world/Stage.tsx): scroll shots jump to that point of
// their section; cinematic shots (knight, rook, …) play in slow motion up to t and hold.
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const arg = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const base = arg("--base", "http://127.0.0.1:8080").replace(/\/$/, "");
const out = arg("--out", "docs/lookdev/m0");
const only = arg("--only", null);
const sizes = (arg("--sizes", "desktop,mobile") || "").split(",");

export const SHOTS = [
  { name: "01-loader", shot: "loader", t: 0.58, wait: 2500 },
  { name: "02-welcome", shot: "welcome", t: 0.08, wait: 4500 },
  { name: "03-name", shot: "name", t: 0.62, wait: 7000 },
  { name: "04-board", shot: "board", t: 0.35, wait: 9000 },
  { name: "05-knight", shot: "knight", t: 0.6, wait: 14000, mobileWait: 3600 },
  { name: "06-where", shot: "map", t: 0.1, wait: 5000 },
];
const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
};

mkdirSync(out, { recursive: true });
const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
for (const s of SHOTS.filter((x) => !only || x.shot === only || x.name.includes(only))) {
  for (const size of sizes) {
    const vp = VIEWPORTS[size];
    const page = await browser.newPage({
      viewport: vp,
      deviceScaleFactor: size === "desktop" ? 1 : 2,
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    const tier = size === "desktop" ? "&tier=high" : "";
    await page.goto(`${base}/?shot=${s.shot}&t=${s.t}${tier}`, { waitUntil: "load" });
    // phones play the recorded video: catch it mid-gallop rather than after it has finished
    await page.waitForTimeout(size === "mobile" && s.mobileWait ? s.mobileWait : s.wait);
    const file = `${out}/${s.name}-${size}.jpg`;
    await page.screenshot({ path: file, type: "jpeg", quality: 88 });
    console.log(file, errors.length ? `ERRORS: ${errors.slice(0, 3).join(" | ")}` : "ok");
    await page.close();
  }
}
await browser.close();
