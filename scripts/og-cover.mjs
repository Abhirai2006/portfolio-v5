// Renders the 1200x630 share image used by link previews (LinkedIn, WhatsApp, X) into
// public/media/og-cover.jpg. Rerun it after changing the numbers below.
//
//   node scripts/og-cover.mjs
//
// Needs Playwright with Chromium, and network access to Google Fonts.
import { readFileSync } from "node:fs";
import { chromium } from "playwright";

const portrait = readFileSync("public/media/abhishek-portrait.jpg").toString("base64");
const projectCount = (readFileSync("src/lib/projects.ts", "utf8").match(/^\s{4}slug: "/gm) ?? [])
  .length;

const stats = [
  ["9.44", "avg GPA / 10"],
  ["0.849", "churn ROC-AUC"],
  [String(projectCount), "projects shipped"],
];

const html = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=JetBrains+Mono:wght@400;500&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
<style>
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; overflow: hidden; background: oklch(0.11 0.015 250);
         color: oklch(0.96 0.005 250); font-family: "Space Grotesk", sans-serif; position: relative; }
  .glow { position: absolute; border-radius: 50%; filter: blur(90px); }
  .g1 { width: 520px; height: 520px; left: -160px; top: -200px; background: oklch(0.7 0.17 240 / .35); }
  .g2 { width: 460px; height: 460px; right: 120px; bottom: -260px; background: oklch(0.75 0.19 155 / .22); }
  .grid { position: absolute; inset: 0; opacity: .07;
          background-image: linear-gradient(oklch(0.96 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(0.96 0 0) 1px, transparent 1px);
          background-size: 48px 48px; }
  .wrap { position: relative; display: grid; grid-template-columns: 1fr 340px; gap: 56px; padding: 48px 72px 72px; height: 100%; align-items: center; }
  .kicker { font-family: "JetBrains Mono", monospace; font-size: 17px; letter-spacing: .3em; text-transform: uppercase;
            color: oklch(0.68 0.02 250); display: flex; align-items: center; gap: 16px; }
  .kicker i { width: 40px; height: 2px; background: oklch(0.7 0.17 240); display: block; }
  h1 { font-weight: 600; font-size: 108px; line-height: .92; letter-spacing: -.03em; margin-top: 22px; }
  .gold { background: linear-gradient(180deg, oklch(0.96 0.005 250), oklch(0.7 0.17 240));
          -webkit-background-clip: text; background-clip: text; color: transparent; }
  .role { margin-top: 22px; font-size: 27px; line-height: 1.35; color: oklch(0.68 0.02 250); }
  .role b { color: oklch(0.96 0.005 250); font-weight: 600; }
  .stats { display: flex; gap: 44px; margin-top: 28px; }
  .n { font-family: "Bebas Neue", sans-serif; font-size: 62px; line-height: 1; letter-spacing: .02em; }
  .l { font-family: "JetBrains Mono", monospace; font-size: 14px; letter-spacing: .18em; text-transform: uppercase; color: oklch(0.68 0.02 250); margin-top: 6px; }
  .photo { position: relative; }
  .photo::before { content: ""; position: absolute; inset: -14px; border-radius: 36px; filter: blur(28px); opacity: .7;
                   background: linear-gradient(135deg, oklch(0.7 0.17 240 / .6), oklch(0.75 0.19 155 / .3), oklch(0.65 0.24 25 / .4)); }
  .photo img { position: relative; width: 340px; height: 420px; object-fit: cover; border-radius: 28px;
               border: 1px solid oklch(0.25 0.02 250); display: block; }
  .host { position: absolute; left: 72px; bottom: 30px; font-family: "JetBrains Mono", monospace; font-size: 16px;
          color: oklch(0.68 0.02 250); letter-spacing: .08em; }
  .host span { color: oklch(0.7 0.17 240); }
</style></head><body>
  <div class="glow g1"></div><div class="glow g2"></div><div class="grid"></div>
  <div class="wrap">
    <div>
      <div class="kicker"><i></i>Portfolio · Mysuru, India</div>
      <h1>ABHISHEK<br><span class="gold">RAI A</span></h1>
      <p class="role"><b>Aspiring ML Engineer</b><br>B.E. AI &amp; ML · Mysore University</p>
      <div class="stats">
        ${stats.map(([n, l]) => `<div><div class="n gold">${n}</div><div class="l">${l}</div></div>`).join("")}
      </div>
    </div>
    <div class="photo"><img src="data:image/jpeg;base64,${portrait}" alt=""></div>
  </div>
  <div class="host"><span>●</span> portfolio.abhirai2006.workers.dev</div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});
await page.setContent(html, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: "public/media/og-cover.jpg", type: "jpeg", quality: 88 });
await browser.close();
console.log(`wrote public/media/og-cover.jpg (${projectCount} projects)`);
