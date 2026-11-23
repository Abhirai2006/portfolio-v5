# Design — building "Abhishek's World" end to end (one session)

Date: 2026-11-22 · Status: approved by Abhishek (2026-11-22)
Reads on top of: `AGENT.md`, `docs/PRD.md`, `docs/DESIGN.md`, `docs/ARCHITECTURE.md`, `docs/CONTENT.md`,
`docs/ASSETS.md`, `docs/SEO.md`. Those stay the source of truth; this file records what this build session decided
and how it will run.

## 1. Intent
Turn the starter into the full site described in PRD §3 / DESIGN §4: loader → welcome → name → 3D board → six
piece-to-creature cinematics → "Where are you going?" map → manga-chapter sections → restyled sub-pages, SEO intact.
Goal: an award-level portfolio that gets Abhishek ML internships. Anti-goals: DESIGN §8 (template look, long text,
fake loaders, invented numbers, copied art).

## 2. Decisions made with Abhishek (this session)
| # | Decision |
|---|---|
| D1 | Build the **whole site in this session** (M0–M7). |
| D2 | **One look check**: M0 still frames (loader, welcome, name, board, knight mid-gallop, "Where are you going?") at 1440×900 + 390×844 go to Abhishek; after approval, build straight through; screenshots of everything at the end. |
| D3 | **Creatures = mix**: Quaternius CC0 rigged **Horse** (knight) and a CC0 animated **humanoid** (pawn soldier), downloaded from the public `trebeljahr/quaternius-showcase` GitHub mirror (CC0 verified against Quaternius' pack page and recorded in `CREDITS.md`). **Elephant, lion, Garuda and phoenix are built by us in code** as original 3D creatures (sculpted from lathe/extruded/skinned primitives, procedural animation). All six share the same ink-toon shader + outline + screentone so they read as one world. |

## 3. Calls I made (Abhishek can override)
| # | Call | Why |
|---|---|---|
| C1 | **Sound is synthesised** with Web Audio (hoofbeats, footfalls, thunder, roar, whoosh, chime…), no sample files | freesound/pixabay are unreachable here; synthesis is 100% original, zero licensing, tiny download |
| C2 | Phone cinematics are **recorded from the desktop build** with Playwright + ffmpeg (installed), H.264 MP4 + WebM + poster | Matches ARCHITECTURE §6 |
| C3 | Fonts self-hosted woff2 from Google Fonts (OFL): Big Shoulders Display, Dela Gothic One, Yuji Boku, Inter, JetBrains Mono | DESIGN §2.2; reachable |
| C4 | Look-dev frames are rendered **from the real site code**, not throwaway mockups | Approved frames become the product; no rework |
| C5 | Chess pieces are generated in code (lathe profiles + carved detail), hero shells pre-fractured in code (Voronoi-ish slicing) | ASSETS §2; no Blender here |
| C6 | Rapier physics only if shatter needs it; first try instanced shards with analytic motion (no WASM) | Smaller bundle, simpler CSP |
| C7 | Old v5/art/lab UI deleted once replaced; logic modules untouched | ARCHITECTURE §2 |
| C8 | 404 page loses the One Piece quote (existing work's character line) and gets an original manga line | PRD N5 (no characters from existing works) |

## 4. Approaches considered
- **A. Single persistent R3F canvas behind SSR DOM, GSAP ScrollTrigger + Lenis (chosen).** Exactly ARCHITECTURE §1/§3.
  Crawlable, one renderer, scroll-scrubbed shots.
- B. Per-section canvases — rejected: multiple WebGL contexts, worse perf, violates ARCHITECTURE §3.
- C. Pre-rendered video for desktop too — rejected: loses live interaction and "real craft" judges look for.

## 5. Build order
1. **M0** foundation + look-dev: tokens/fonts, HUD, loader (real progress), welcome, name, board shot, knight frame,
   map line → screenshots → **wait for approval**.
2. M1 scroll engine + skip intro + SSR text; M2 board (32 pieces, hover/focus labels, keyboard); M3–M4 six
   cinematics + reduced-motion + video fallback; M5 sections + sub-pages restyled; M6 sound, perf, a11y;
   M7 SEO checklist, smoke extended, final screenshots, zip (no node_modules/.output/dist) + DEPLOY steps.
3. Every milestone: `bun run test` green, smoke extended, decisions appended to `docs/DECISIONS.md`.

## 6. Answered by Abhishek
- **Products "FIVE VOLUMES"** = all five main arcs (`MAIN_ARCS`): Customer Churn Intelligence System, MUSE Students
  Voice, Arthra, Ro-Bio, Earth & Ethos. The Churn system appears both as volume one and in the ML section.
- Design approved 2026-11-22.

## 7. Left to the builder
Exact shader constants, camera paths, timings within DESIGN's ranges, file layout within ARCHITECTURE §8.
