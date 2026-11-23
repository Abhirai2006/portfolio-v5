// Records the phone / no-WebGL fallbacks from the live desktop build (ARCHITECTURE §6):
//   1. public/media/board-still.jpg + src/world/fallback/hotspots.json (where the six hero pieces are)
//   2. public/media/cinematics/{id}-{landscape|portrait}.{mp4,webm,jpg} and {id}.vtt for all six pieces
//
//   bun run dev --host 127.0.0.1 --port 8080        (in another terminal)
//   node scripts/record-cinematics.mjs [--base http://127.0.0.1:8080] [--only knight] [--skip-still]
//
// Frames are captured deterministically with Playwright's fake clock (each step advances exactly 1/30 s,
// requestAnimationFrame included), so the videos are smooth even when the GPU is slow. Frames are rendered at
// half size and scaled ×2 by ffmpeg (1920×1080 / 1080×1920). Needs ffmpeg with libx264 and libvpx-vp9.
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const arg = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const base = arg("--base", "http://127.0.0.1:8080").replace(/\/$/, "");
const only = arg("--only", null);
const FPS = 30;
const OUT = "public/media/cinematics";
mkdirSync(OUT, { recursive: true });

// Kept in sync with src/world/cinematics/spec.ts (durations, captions, impact beat).
const SPEC = {
  knight: {
    ms: 4600,
    impact: 0.88,
    caption:
      "The knight cracks open. A horse wrapped in red and blue flames gallops to the ML lab.",
  },
  rook: {
    ms: 5600,
    impact: 0.86,
    caption:
      "The rook becomes a giant glowing elephant. The floor shatters under each step until it crashes into Products.",
  },
  bishop: {
    ms: 4400,
    impact: 0.86,
    caption:
      "The bishop becomes Garuda, an eagle that dives diagonally through lightning to Algorithms.",
  },
  pawn: {
    ms: 5200,
    impact: 0.86,
    caption:
      "The pawn becomes a foot soldier, marches to the last rank and is promoted into a queen of light: student to engineer.",
  },
  king: {
    ms: 4800,
    impact: 0.85,
    caption:
      "The king becomes a lion with a crown of fire. Its roar sends a golden shockwave across the board, toward About.",
  },
  queen: {
    ms: 4600,
    impact: 0.86,
    caption:
      "The queen becomes a phoenix that bursts into rays of light in every direction and re-forms at Contact.",
  },
};
const ORIENT = {
  landscape: { width: 960, height: 540, scale: "1920:1080" },
  portrait: { width: 540, height: 960, scale: "1080:1920" },
};

const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});

// ---- 1. board still + hotspots ----
if (!args.includes("--skip-still")) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1080 } });
  await page.goto(`${base}/?shot=board&t=0.35&tier=high&clean=1`, { waitUntil: "load" });
  await page.waitForTimeout(9000);
  const spots = await page.evaluate(() => {
    const s = window.__aw.get().heroScreen;
    const out = {};
    for (const [id, p] of Object.entries(s))
      out[id] = { x: +(p.x / innerWidth).toFixed(4), y: +(p.y / innerHeight).toFixed(4) };
    return out;
  });
  writeFileSync("src/world/fallback/hotspots.json", JSON.stringify(spots, null, 2) + "\n");
  await page.screenshot({ path: "public/media/board-still.jpg", type: "jpeg", quality: 82 });
  console.log("board-still.jpg + hotspots.json", spots);
  await page.close();
}

// ---- 2. cinematics ----
for (const [id, spec] of Object.entries(SPEC)) {
  if (only && only !== id) continue;
  const vtt = `WEBVTT\n\n00:00.000 --> 00:${(spec.ms / 1000).toFixed(3).padStart(6, "0")}\n${spec.caption}\n`;
  writeFileSync(`${OUT}/${id}.vtt`, vtt);
  for (const [name, o] of Object.entries(ORIENT)) {
    const dir = join(tmpdir(), `aw-${id}-${name}`);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    const page = await browser.newPage({ viewport: { width: o.width, height: o.height } });
    await page.clock.install({ time: 0 });
    await page.goto(`${base}/?shot=board&t=0.35&tier=high&clean=1`, { waitUntil: "load" });
    // let the page boot, load models and settle on the board (fake time, but real loading)
    for (let i = 0; i < 60; i++) await page.clock.runFor(100);
    await page.waitForTimeout(3000);
    for (let i = 0; i < 20; i++) await page.clock.runFor(100);
    // stop natural time: from here on, time only moves when we step it (exactly one frame per screenshot)
    const now = await page.evaluate(() => Date.now());
    await page.clock.pauseAt(now + 500);
    await page.evaluate(
      (hero) => window.dispatchEvent(new CustomEvent("aw:choose", { detail: hero })),
      id,
    );
    const frames = Math.ceil((spec.ms / 1000) * FPS);
    for (let f = 0; f < frames; f++) {
      await page.clock.runFor(1000 / FPS);
      await page.screenshot({
        path: join(dir, `f${String(f).padStart(4, "0")}.jpg`),
        type: "jpeg",
        quality: 92,
      });
    }
    await page.close();
    const base_ = `${OUT}/${id}-${name}`;
    const input = [
      "-y",
      "-framerate",
      String(FPS),
      "-i",
      join(dir, "f%04d.jpg"),
      "-vf",
      `scale=${o.scale}:flags=lanczos`,
    ];
    execFileSync(
      "ffmpeg",
      [
        ...input,
        "-c:v",
        "libx264",
        "-preset",
        "slow",
        "-crf",
        "27",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        `${base_}.mp4`,
      ],
      { stdio: "ignore" },
    );
    execFileSync(
      "ffmpeg",
      [...input, "-c:v", "libvpx-vp9", "-crf", "38", "-b:v", "0", "-row-mt", "1", `${base_}.webm`],
      { stdio: "ignore" },
    );
    const poster = String(Math.min(frames - 1, Math.round(frames * spec.impact) - 2)).padStart(
      4,
      "0",
    );
    execFileSync(
      "ffmpeg",
      [
        "-y",
        "-i",
        join(dir, `f${poster}.jpg`),
        "-vf",
        `scale=${o.scale}:flags=lanczos`,
        "-q:v",
        "4",
        `${base_}.jpg`,
      ],
      { stdio: "ignore" },
    );
    rmSync(dir, { recursive: true, force: true });
    const mb = (f) => (statSync(f).size / 1e6).toFixed(2);
    console.log(`${base_}: mp4 ${mb(`${base_}.mp4`)} MB, webm ${mb(`${base_}.webm`)} MB`);
  }
}
await browser.close();
