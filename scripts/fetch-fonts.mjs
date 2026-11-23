// Downloads the Latin woff2 subsets of the site's five Google Fonts (all SIL Open Font License) into
// public/fonts/, so the site self-hosts them. Run once with: bun scripts/fetch-fonts.mjs
// (Bun's fetch honours HTTPS_PROXY; plain Node's fetch does not.)
import { mkdirSync, writeFileSync } from "node:fs";

const FAMILIES = [
  { family: "Big Shoulders Display", weights: [900], file: "big-shoulders-display" },
  { family: "Dela Gothic One", weights: [400], file: "dela-gothic-one" },
  { family: "Yuji Boku", weights: [400], file: "yuji-boku" },
  { family: "Inter", weights: [400, 600], file: "inter" },
  { family: "JetBrains Mono", weights: [500], file: "jetbrains-mono" },
];
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const out = new URL("../public/fonts/", import.meta.url);
mkdirSync(out, { recursive: true });

for (const f of FAMILIES) {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(f.family)}:wght@${f.weights.join(";")}&display=swap`;
  const css = await (await fetch(url, { headers: { "User-Agent": UA } })).text();
  // Each block is preceded by a /* subset */ comment; keep the latin one per weight.
  const blocks = [...css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g)];
  for (const w of f.weights) {
    const block =
      blocks.find((b) => b[1] === "latin" && b[2].includes(`font-weight: ${w};`)) ??
      blocks.find((b) => b[2].includes(`font-weight: ${w};`));
    if (!block) throw new Error(`No @font-face for ${f.family} ${w}`);
    const src = block[2].match(/url\((https:[^)]+\.woff2)\)/)?.[1];
    if (!src) throw new Error(`No woff2 url for ${f.family} ${w}`);
    const buf = new Uint8Array(await (await fetch(src)).arrayBuffer());
    const name = `${f.file}-${w}.woff2`;
    writeFileSync(new URL(name, out), buf);
    console.log(`${name}  ${(buf.length / 1024).toFixed(0)} KB  (${block[1]})`);
  }
}
