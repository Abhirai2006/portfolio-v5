// Draws every panel in src/art/registry.ts and writes WebP layers to public/art/.
//   bun scripts/build-art.ts            (all panels)
//   bun scripts/build-art.ts coast room (only these)
// Output: public/art/<panel>/<layer>-<mode>.webp (≤2048 px), <layer>-<mode>-lite.webp (≤1024 px),
// and public/art/static/<panel>.webp (flattened, for the no-JS webtoon).
import { mkdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";
import { ART } from "../src/art/registry";

const only = process.argv.slice(2);
const out = new URL("../public/art/", import.meta.url).pathname;
mkdirSync(out + "static", { recursive: true });

const PORTRAIT = new URL("../public/media/abhishek-portrait.jpg", import.meta.url).pathname;

/**
 * Turns a crop of the real portrait into a comic plate.
 * ink: ink outlines (Sobel edges) + black shadows + screentone mid-tones + paper highlights.
 * colour: posterised cel colours with ink outlines.
 * mask (cx, cy, rx, ry in 0..1): outside this soft ellipse the photo fades into a flat backdrop.
 */
async function photoPlate(def: (typeof ART)[string], mode: "ink" | "colour", W: number, H: number) {
  const [cx0, cy0, cw, ch] = def.photo!.crop;
  const { data, info } = await sharp(PORTRAIT)
    .extract({ left: cx0, top: cy0, width: cw, height: ch })
    .resize(W, H, { kernel: "lanczos3" })
    .blur(1.1)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const n = info.width * info.height;
  const L = new Float32Array(n);
  for (let i = 0; i < n; i++)
    L[i] = (0.299 * data[i * 3] + 0.587 * data[i * 3 + 1] + 0.114 * data[i * 3 + 2]) / 255;
  // normalise contrast
  const sorted = Float32Array.from(L).sort();
  const lo = sorted[Math.floor(n * 0.03)];
  const hi = sorted[Math.floor(n * 0.97)];
  for (let i = 0; i < n; i++) L[i] = Math.min(1, Math.max(0, (L[i] - lo) / (hi - lo)));
  const w = info.width;
  const h = info.height;
  const edge = new Float32Array(n);
  for (let y = 1; y < h - 1; y++)
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const gx =
        L[i - w + 1] + 2 * L[i + 1] + L[i + w + 1] - L[i - w - 1] - 2 * L[i - 1] - L[i + w - 1];
      const gy =
        L[i + w - 1] + 2 * L[i + w] + L[i + w + 1] - L[i - w - 1] - 2 * L[i - w] - L[i - w + 1];
      edge[i] = Math.hypot(gx, gy);
    }
  const out = Buffer.alloc(n * 4);
  const mask = def.photo!.mask;
  const ink = [14, 14, 16];
  const paper = [242, 239, 232];
  const gap = Math.max(5, Math.round(W / 160));
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      let m = 1;
      if (mask) {
        const dx = (x / w - mask[0]) / mask[2];
        const dy = (y / h - mask[1]) / mask[3];
        const d = Math.hypot(dx, dy);
        m = Math.min(1, Math.max(0, (1.12 - d) / 0.22));
      }
      const e = edge[i] > 0.55 ? 1 : 0;
      let rgb: number[];
      if (mode === "ink") {
        const l = L[i];
        // screentone: dot radius grows as it gets darker
        const gx = (x % gap) - gap / 2;
        const gy = (y % gap) - gap / 2;
        const dot = Math.hypot(gx, gy) < (1 - l) * gap * 0.62;
        if (e || l < 0.2) rgb = ink;
        else if (l < 0.62) rgb = dot ? ink : paper;
        else rgb = paper;
        // eyes plate: electric blue only inside the irises (screen light reflected in his eyes)
        if (def.photo!.crop[3] < 200) {
          for (const ex of [0.385, 0.64]) {
            const d = Math.hypot((x / w - ex) / 0.042, (y / h - 0.6) / 0.12);
            if (d < 1) {
              if (l < 0.3) rgb = [10, 42, 136];
              else if (l > 0.8) rgb = [98, 174, 255];
            }
          }
        }
      } else {
        const r = data[i * 3] / 255;
        const g = data[i * 3 + 1] / 255;
        const b = data[i * 3 + 2] / 255;
        const mx = Math.max(r, g, b);
        const mn = Math.min(r, g, b);
        const v = Math.min(1, Math.round((0.15 + L[i] * 0.95) * 4) / 4 + 0.08);
        const sat = mx === 0 ? 0 : Math.min(1, ((mx - mn) / mx) * 1.35);
        const k = v / (mx || 1);
        rgb = [r, g, b].map((c) => {
          const base = c * k;
          const grey = v;
          return Math.round(
            Math.min(1, grey + (base - grey) * (sat / ((mx - mn) / (mx || 1) || 1))) * 255,
          );
        });
        // cool night grade + blue rim light from the left
        rgb = [rgb[0] * 0.92, rgb[1] * 0.95, Math.min(255, rgb[2] * 1.08 + 8)].map(Math.round);
        if (e) rgb = ink;
      }
      const bg = mode === "ink" ? paper : [12, 22, 64];
      const o = i * 4;
      out[o] = Math.round(rgb[0] * m + bg[0] * (1 - m));
      out[o + 1] = Math.round(rgb[1] * m + bg[1] * (1 - m));
      out[o + 2] = Math.round(rgb[2] * m + bg[2] * (1 - m));
      out[o + 3] = 255;
    }
  return sharp(out, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .toBuffer();
}

for (const [id, def] of Object.entries(ART)) {
  if (only.length && !only.includes(id)) continue;
  const t0 = Date.now();
  mkdirSync(`${out}${id}`, { recursive: true });
  const scale = Math.min(1, 2048 / Math.max(def.w, def.h));
  const W = Math.round(def.w * scale);
  const H = Math.round(def.h * scale);
  for (const mode of def.modes) {
    const svgs = def.draw ? def.draw(mode) : {};
    const flat: Buffer[] = [];
    for (const layer of def.layers) {
      let png: Buffer;
      if (def.photo) png = await photoPlate(def, mode, W, H);
      else {
        const src = svgs[layer];
        if (!src) throw new Error(`${id}: missing layer ${layer} (${mode})`);
        png = await sharp(Buffer.from(src)).resize(W, H).png().toBuffer();
      }
      await sharp(png)
        .webp({ quality: 82, alphaQuality: 90, effort: 5 })
        .toFile(`${out}${id}/${layer}-${mode}.webp`);
      await sharp(png)
        .resize(Math.round(W / 2))
        .webp({ quality: 76, alphaQuality: 85, effort: 5 })
        .toFile(`${out}${id}/${layer}-${mode}-lite.webp`);
      flat.push(png);
    }
    const [first, ...rest] = flat;
    const merged = await sharp(first)
      .composite(rest.map((input) => ({ input })))
      .png()
      .toBuffer();
    if (mode === (def.staticMode ?? def.modes[0])) {
      await sharp(merged).resize(1200).webp({ quality: 78 }).toFile(`${out}static/${id}.webp`);
    }
    // ART_PREVIEW=<dir>: also write a flattened JPG per mode for look-dev
    if (process.env.ART_PREVIEW) {
      mkdirSync(process.env.ART_PREVIEW, { recursive: true });
      await sharp(merged)
        .resize(1100)
        .jpeg({ quality: 84 })
        .toFile(`${process.env.ART_PREVIEW}/${id}-${mode}.jpg`);
    }
  }
  console.log(
    `${id}: ${def.layers.length} layers × ${def.modes.length} modes in ${Date.now() - t0} ms`,
  );
}

const manifest = Object.fromEntries(
  Object.entries(ART).map(([id, d]) => [id, { w: d.w, h: d.h, layers: d.layers, modes: d.modes }]),
);
writeFileSync(`${out}manifest.json`, JSON.stringify(manifest, null, 1));
