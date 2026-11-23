# Abhishek's World

The portfolio of **Abhishek Rai A**, an aspiring machine learning engineer from Mysuru, India, looking for ML
internships. A black-and-white manga world lit by blue and orange fire, where chess pieces turn into legends and
carry you to the work.

> **Status: built (M0–M7).** Loader → welcome → name → 3D board → six piece-to-creature transformations →
> "Where are you going?" map → manga chapters → restyled sub-pages. Phones and no-WebGL browsers get the same story
> with a board still and recorded videos. Every word is server-rendered. Decisions: `docs/DECISIONS.md`.

## How it is put together
| Where | What |
|---|---|
| `src/routes/index.tsx` | The homepage: all text is server HTML; `<Stage />` adds the world on the client |
| `src/world/` | The WebGL world: one canvas, ink compositor, board + 32 carved pieces, six creatures, effects, cinematics, loader, scroll engine, quality tiers |
| `src/sections/` | DOM shots and chapters (welcome, name, board labels, map, ML lab, volumes, algorithms, skills, about, ask, GitHub, contact, Breslau 1912) |
| `src/hud/` | HUD (plate, Skip intro, sound, menu) and the synthesised sound effects |
| `public/models/` | CC0 Quaternius horse + knight character (see `CREDITS.md`) |
| `public/media/cinematics/` | Phone / no-WebGL videos (MP4 + WebM + poster + captions) |

## Scripts
| Command | Does |
|---|---|
| `node scripts/lookdev.mjs --out docs/lookdev/m0` | Renders the look-dev stills (1440×900 and 390×844) from the running dev server |
| `node scripts/record-cinematics.mjs` | Re-records the board still, hotspots and all twelve cinematic videos |
| `node scripts/og-cover.mjs --t 0.27` | Re-renders the share image from the name shot |
| `bun scripts/fetch-fonts.mjs` / `bun scripts/fetch-models.mjs` | Re-download the self-hosted fonts / CC0 models |

URL helpers (for stills and recordings only): `?shot=board&t=0.35`, `?tier=high` (force the live world),
`?clean=1` (hide the HUD).

## Start here
| File | What it is |
|---|---|
| `AGENT.md` | Rules and workflow for whoever (or whichever AI) builds the site. Read first. |
| `docs/PRD.md` | What we're building and why; milestones |
| `docs/DESIGN.md` | Visual language and the full storyboard (loader, welcome, board, six transformations, "Where are you going?") |
| `docs/ARCHITECTURE.md` | Stack, rendering model, effects pipeline, performance budgets, folder plan |
| `docs/CONTENT.md` | Every word and where each fact comes from |
| `docs/ASSETS.md` | 3D models, sounds and fonts, and the licensing rules |
| `docs/SEO.md` | SEO, AEO and GEO plan and the one-time setup |
| `docs/DEPLOY.md` | GitHub Desktop + Cloudflare Workers, step by step |
| `docs/DECISIONS.md` | Every judgment call |
| `docs/references/` | Frames from the reference sites |
| `CREDITS.md` | Third-party assets and their licenses |

## What already works (verified engine)
- Live **Churn Lab** model: Abhishek's real LightGBM model in the browser, matching Python within 1e-6
  (`src/lib/churn`, `ml/`).
- Project data, facts, résumé, project episodes, reviews, anime shelf, Ask Abhishek chat, GitHub activity.
- SEO: server rendering, structured data, sitemap, `/llms.txt`, AI-friendly `robots.txt`.
- 162 unit tests (`bun run test`) and a Playwright smoke suite (`bun run smoke`) covering 9 routes × 5 widths, the live transformation, reduced motion, the no-WebGL fallback and no-JS.

## Quick commands
```bash
bun install
bun run dev
bun run test
bun run build
```

Deploying: see `docs/DEPLOY.md`.

Made in Mysuru.
