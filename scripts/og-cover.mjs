// Renders the 1200×630 share image (LinkedIn, WhatsApp, X) into public/media/og-cover.jpg, straight from the
// live site: the name shot, with the 3D board rising in front of the giant name. Rerun after look changes.
//
//   bun run dev --host 127.0.0.1 --port 8080        (in another terminal)
//   node scripts/og-cover.mjs [--base http://127.0.0.1:8080] [--t 0.34]
import { chromium } from "playwright";

const args = process.argv.slice(2);
const arg = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const base = arg("--base", "http://127.0.0.1:8080").replace(/\/$/, "");
const t = arg("--t", "0.34");

const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(`${base}/?shot=name&t=${t}&tier=high&clean=1`, { waitUntil: "load" });
await page.waitForTimeout(9000);
await page.screenshot({ path: "public/media/og-cover.jpg", type: "jpeg", quality: 86 });
await browser.close();
console.log("public/media/og-cover.jpg");
