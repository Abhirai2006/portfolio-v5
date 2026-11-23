# ASSETS — models, sounds, fonts

All assets must be licensed for use on a personal website and listed in `CREDITS.md`.
Order of preference: **CC0** → **CC-BY** (credit required) → nothing else. Never use "editorial", "personal use
only", ripped game models, or anything without a clear license.

## 1. Models needed (rigged + animated, GLB)
| For | Model | Animations needed | Notes |
|---|---|---|---|
| Knight | Horse | gallop (loop), rear/neigh | Flames are our effect, not baked |
| Rook | Elephant | walk (heavy), trumpet | Rendered white with emissive rim glow |
| Bishop | Eagle (Garuda) | fly, dive | Wings spread silhouette matters |
| Pawn | Foot soldier (humanoid) | march | Promotion is a shader/morph effect |
| King | Lion | walk/idle, roar | Crown of fire is our effect |
| Queen | Phoenix / large bird | fly, wings open | Can reuse the eagle rig with a different material |

Where to look (check each model's license page before use and record it):
- **Quaternius** (quaternius.com) — CC0 low/mid-poly animated animal packs.
- **Poly Pizza** (poly.pizza) — CC0/CC-BY, filter by license.
- **Sketchfab** (sketchfab.com) — filter *Downloadable* + *CC0* or *CC BY*; check "animated".
- **Mixamo** (Adobe) for humanoid animation of the soldier (Adobe terms allow use in projects; verify current terms
  and record them).
- If a suitable licensed model can't be found, ask Abhishek before buying anything.

Processing: Blender (cleanup, fracture shells for chess pieces), `gltf-transform optimize --compress meshopt
--texture-compress webp` (or KTX2), target < 2.5 MB per creature.

## 2. Chess pieces
Carved Indian chaturanga style, made by us: lathe profiles + sculpted details in code or Blender, original design.
Pre-fractured shells for the six hero pieces (Voronoi fracture, ~40–80 shards).

## 3. Sound (off by default)
Hoofbeats, flame roar, neigh, heavy footfalls, stone cracking, elephant trumpet, thunder, wing beats, eagle screech,
drum steps, choir swell, lion roar, low boom, whoosh, UI chime. Sources: **freesound.org** (filter CC0 or CC-BY),
**Sonniss GDC bundles** (royalty-free, check terms), **pixabay.com/sound-effects** (Pixabay content license).
Record each in `CREDITS.md`. Normalise to -16 LUFS, pack into sprites (Opus/WebM + MP3 fallback).

## 4. Fonts
Google Fonts (SIL Open Font License): Big Shoulders Display, Dela Gothic One, Yuji Boku/Yuji Syuku, Inter,
JetBrains Mono. Self-host the subsets used (woff2) for speed.

## 5. Existing assets in the repo
`public/media/abhishek-portrait.jpg` (his photo), `public/media/og-cover.jpg` (share image, regenerate with
`scripts/og-cover.mjs` in the new style), `public/media/live/*.jpg` (project screenshots, his own sites; Earth &
Ethos images approved by the client).
