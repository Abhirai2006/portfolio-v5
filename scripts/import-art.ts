// Drops ChatGPT panels into the comic.
//   1. Save images as art-src/incoming/<panel>.<layer>.<mode>.png   (e.g. coast.sky.ink.png)
//   2. bun scripts/import-art.ts
// Each image is cover-cropped to its slot (size from src/art/registry.ts), written as
// public/art/<panel>/<layer>-<mode>.webp (+ -lite), the code-drawn layers it replaces are cleared
// (made transparent), and the flattened no-JS stills are rebuilt. Originals stay in art-src/incoming/.
import { existsSync, readdirSync } from "node:fs";
import sharp from "sharp";
import { ART } from "../src/art/registry";

const IN = new URL("../art-src/incoming/", import.meta.url).pathname;
const OUT = new URL("../public/art/", import.meta.url).pathname;

/** A full scene plate also contains what these code layers drew, so they are cleared. */
const CLEARS: Record<string, string[]> = {
  "coast.sky": ["sea", "land"],
  "hands.back": ["hands"],
  "maths.sky": ["ground"],
  "mysuru.sky": ["city"],
  "room.back": ["desk"],
  "altar.sky": ["slab"],
};

if (!existsSync(IN)) {
  console.log("No art-src/incoming/ folder yet. Put the ChatGPT PNGs there first.");
  process.exit(0);
}

const touched = new Set<string>();
for (const file of readdirSync(IN).filter((f) => /\.(png|jpe?g|webp)$/i.test(f))) {
  const [panel, layer, mode] = file.replace(/\.(png|jpe?g|webp)$/i, "").split(".");
  const def = ART[panel];
  if (!def || !def.layers.includes(layer) || !["ink", "colour"].includes(mode)) {
    console.warn(
      `skip ${file}: expected <panel>.<layer>.<ink|colour>.png with a panel/layer from src/art/registry.ts`,
    );
    continue;
  }
  const scale = Math.min(1, 2048 / Math.max(def.w, def.h));
  const W = Math.round(def.w * scale);
  const H = Math.round(def.h * scale);
  const png = await sharp(`${IN}${file}`)
    .resize(W, H, { fit: "cover", position: "centre" })
    .ensureAlpha()
    .png()
    .toBuffer();
  await sharp(png)
    .webp({ quality: 84, alphaQuality: 90 })
    .toFile(`${OUT}${panel}/${layer}-${mode}.webp`);
  await sharp(png)
    .resize(Math.round(W / 2))
    .webp({ quality: 78 })
    .toFile(`${OUT}${panel}/${layer}-${mode}-lite.webp`);
  for (const clear of CLEARS[`${panel}.${layer}`] ?? []) {
    const empty = sharp({
      create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    });
    await empty.clone().webp().toFile(`${OUT}${panel}/${clear}-${mode}.webp`);
    await empty
      .clone()
      .resize(Math.round(W / 2))
      .webp()
      .toFile(`${OUT}${panel}/${clear}-${mode}-lite.webp`);
    console.log(`  cleared ${panel}/${clear}-${mode} (now inside ${file})`);
  }
  touched.add(panel);
  console.log(`imported ${file} → public/art/${panel}/${layer}-${mode}.webp`);
}

// rebuild the flattened stills for every panel that changed
for (const panel of touched) {
  const def = ART[panel];
  const mode = def.staticMode ?? def.modes[0];
  const layers = def.layers.map((l) => `${OUT}${panel}/${l}-${mode}.webp`);
  const [first, ...rest] = layers;
  const merged = await sharp(first)
    .composite(rest.map((input) => ({ input })))
    .png()
    .toBuffer();
  await sharp(merged).resize(1200).webp({ quality: 78 }).toFile(`${OUT}static/${panel}.webp`);
  console.log(`still rebuilt: public/art/static/${panel}.webp`);
}
if (!touched.size) console.log("Nothing imported.");
