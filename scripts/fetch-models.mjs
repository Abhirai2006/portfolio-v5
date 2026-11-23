// Downloads the two licensed creature models into public/models/. Run once with: bun scripts/fetch-models.mjs
// Both are by Quaternius and released under CC0 1.0 (verified on quaternius.com, 2026-11-22; see CREDITS.md).
// Source: the public mirror github.com/trebeljahr/quaternius-showcase (the original sites are not reachable
// from the build sandbox). The other four creatures (elephant, lion, Garuda, phoenix) are built in code.
import { mkdirSync, writeFileSync } from "node:fs";

const MIRROR = "https://raw.githubusercontent.com/trebeljahr/quaternius-showcase/main/public/glb";
const MODELS = [
  // Knight → horse (Ultimate Animated Animal Pack: Gallop, Walk, ...)
  { from: `${MIRROR}/animals_pack/Horse_White.glb`, to: "horse.glb" },
  // Pawn → foot soldier (Animated Knight Pack: Walking, Run, ...)
  { from: `${MIRROR}/single_knight_pack/KnightCharacter.glb`, to: "soldier.glb" },
];

const out = new URL("../public/models/", import.meta.url);
mkdirSync(out, { recursive: true });
for (const m of MODELS) {
  const res = await fetch(m.from);
  if (!res.ok) throw new Error(`${m.from}: HTTP ${res.status}`);
  const buf = new Uint8Array(await res.arrayBuffer());
  if (buf.length > 2.5 * 1024 * 1024) throw new Error(`${m.to} is over the 2.5 MB budget`);
  writeFileSync(new URL(m.to, out), buf);
  console.log(`${m.to}  ${(buf.length / 1024).toFixed(0)} KB`);
}
