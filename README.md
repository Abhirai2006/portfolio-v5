# Abhishek's World

The portfolio of **Abhishek Rai A**, an aspiring machine learning engineer from Mysuru, looking for ML internships.
An interactive manhwa told in one continuous scroll: a boy from the coast of Mangaluru who grew up around keyboards,
followed maths into AI/ML, and builds real things at night. Draw the neurons to enter, hold to awaken the code,
choose a path, and enter the system where every project lives.

## Docs
| File | What's in it |
|---|---|
| `AGENT.md` | How to build this site (rules, workflow, skills) |
| `docs/PRD.md` | Why, who for, requirements, milestones |
| `docs/DESIGN.md` | Art direction, palette, type, interactions, the storyboard, motion, sound |
| `docs/REFERENCE.md` | The reference videos (Santioni Spirits, why.zero.university) analysed second by second |
| `docs/ARCHITECTURE.md` | Stack, rendering model, look pipeline, budgets, folder plan |
| `docs/ART-PIPELINE.md` | How the manhwa art is generated in ChatGPT and processed |
| `docs/CONTENT.md` | Sources of truth and the copy deck |
| `docs/ASSETS.md` | Fonts, sounds and licensing rules |
| `docs/SEO.md`, `docs/DEPLOY.md` | Search/AI visibility and deployment |
| `docs/DECISIONS.md` | Every decision and judgment call |

## Run
```bash
bun install
```
```bash
bun run dev
```
```bash
bun run test
```
```bash
bun run build
```
```bash
bun run smoke -- --base http://127.0.0.1:8080
```

## Where things live
| Path | What |
|---|---|
| `src/story/story.ts` | The whole comic as data: beats, panels, layers, captions, camera keys, gates, transitions |
| `src/engine/core.ts` | Pure, tested logic: scroll → beat, camera spline, gates, hold, neuron check, path order, tiers |
| `src/engine/Stage.ts`, `shaders.ts`, `fx.ts`, `sound.ts` | The WebGL stage, GLSL, set pieces, synthesised score + SFX |
| `src/components/comic/` | SSR static webtoon, the client experience (loader, gate, HUD, holds), finale + footer |
| `src/art/` | Code-drawn placeholder plates (SVG) → `bun run art` writes `public/art/` |
| `art-src/prompts.md` | The ChatGPT prompts; `bun scripts/import-art.ts` drops the generated PNGs into their slots |
| `docs/milestones/M0/` | Screenshots next to the Santioni / Zero reference frames, storyboard sheets, the motion recording |

## Look-dev
- `/?beat=<id>&t=<0..1>` jumps to any beat (unlocking earlier gates), `&hold=0.6` previews a hold, `&clean=1` hides the
  HUD, `&tier=ultra|high|lite|static` forces a quality tier, `&gate=1` shows the neuron gate again.
- `bun run lookdev -- --base http://127.0.0.1:8080 --out shots` captures every beat at 1440×900 and 390×844.
- `bun run record -- --base http://127.0.0.1:8080 --out rec` captures the opening frame by frame (then `ffmpeg`).
