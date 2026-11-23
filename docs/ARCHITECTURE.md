# ARCHITECTURE — "Abhishek's World"

## 1. Stack (decided)

| Layer | Choice | Why |
|---|---|---|
| App framework | **TanStack Start (React 19, TypeScript)** — already in this repo | Server-side rendering on Cloudflare Workers = crawlable HTML; server routes for chat/sitemap/llms.txt already work |
| Hosting | **Cloudflare Workers** (build `bun run build`, deploy `npx wrangler deploy`) | Same deploy Abhishek already uses; free tier |
| 3D | **three.js** + **@react-three/fiber** + **@react-three/drei** | Scene graph in React, mature ecosystem |
| Post-processing | **postprocessing** / **@react-three/postprocessing** + custom passes | Ink outline (Sobel), screentone, bloom, DOF, chromatic aberration, film grain |
| Physics (shatter) | **@react-three/rapier** (WASM) | Floor fracture plates, shard bursts |
| Particles | Custom GPU particle shader (instanced points / curl-noise) | Flames, embers, dust, lightning sparks |
| Scroll + timelines | **GSAP** + **ScrollTrigger** + **Lenis** smooth scroll | Industry standard for scrubbed cinematics |
| Animated creatures | **glTF/GLB** rigged models + `AnimationMixer` | Realistic run/walk/fly cycles (decision: licensed models + ink shader) |
| Asset pipeline | **gltf-transform** (Meshopt + KTX2/WebP textures), Draco optional | Small downloads |
| Sound | **Howler.js** (or Web Audio), off by default | Sprites per creature |
| Styling | **Tailwind 4** (already set up) + CSS variables from DESIGN §2.1 | |
| Tests | `bun test` (unit) + Playwright smoke (`scripts/smoke.mjs`) | Already in repo |

## 2. What already exists in this starter (reuse; do not rewrite)

Verified in the previous build (58 unit tests passing):
- `src/lib/churn/*` + `src/data/churn/*.json` + `ml/export_churn.py` — the real LightGBM churn model running in the
  browser with TreeSHAP; parity with Python within 1e-6 on 1,409 customers. **Reuse for the Churn Lab.**
- `src/lib/projects.ts` — all projects, metrics, case studies, screenshots (source of truth for content).
- `src/lib/facts.ts` — `PERSON` + `QUICK_FACTS` (source of truth for bio facts).
- `src/lib/assistant-context.ts` + `src/routes/api/chat.ts` — Ask Abhishek (Gemini, rate-limited, same-origin).
- `src/lib/github.functions.ts` + `github-shape.ts` — GitHub data with rate-limit fallbacks.
- `src/lib/seo.ts`, `src/routes/sitemap[.]xml.ts`, `src/routes/llms[.]txt.ts`, `public/robots.txt` — SEO/AEO.
- `src/lib/chess/*` — chess helpers + the Breslau 1912 finale logic (tests pass).
- `src/server.ts` — security headers + CSP. `supabase/` — reviews, visitor counter, anime recommendations.
- Routes `/resume`, `/reviews`, `/anime`, `/projects/$slug`, `/thank-you` — working, but **visually to be redone**
  in the manga language.

To be replaced: everything visual in `src/components/v5`, `src/components/art`, `src/components/lab` (old v5 UI)
and the placeholder `src/routes/index.tsx`. Delete the old components once the new ones replace them.

## 3. Rendering model

```
<html> (SSR: all text, links, headings, JSON-LD — crawlable, works without JS)
 ├── <Canvas> fixed full-screen behind content (client-only, lazy-loaded after first paint)
 │     one persistent three.js scene: board, creatures, particles, post-processing
 ├── DOM sections (manga panels, type) — scroll positions drive the scene via GSAP ScrollTrigger
 └── HUD overlay (fixed): plate label, sound, skip intro, status line
```

- One `WebGLRenderer` for the whole page (never one per section). Scenes are "shots" switched by scroll.
- The Canvas is `aria-hidden`; every meaning it carries also exists as DOM text.
- **Quality tiers** chosen at runtime: `ultra` (desktop dGPU), `high` (desktop iGPU), `video` (phones, no WebGL2,
  low memory, reduced data). Detect via WebGL2 support, `navigator.hardwareConcurrency`, `deviceMemory`, a 1-second
  frame-time probe, and `prefers-reduced-motion`.

## 4. Look (shader pipeline)
1. Scene render (MeshStandard/Physical, rim lights blue left / orange right, fog).
2. **Normal + depth pre-pass** → **Sobel edge detection** = ink outlines (thickness scales with distance).
3. **Screentone** pass: luminance → halftone dots in shadow bands.
4. Emissive layer → **bloom** (fire, glow, lightning only).
5. **DOF** for focus-pulls (welcome, name masking).
6. **Chromatic aberration** + **film grain** + vignette.
Creature materials: ink toon ramp (3–4 steps) + rim light; elephant uses an emissive white rim for the glow.

## 5. Transformations (technical)
- Hero piece = carved GLB (or lathe-generated in code with added detail) with a pre-fractured shell
  (Voronoi fracture done offline in Blender or with a script; stored as separate shard meshes).
- Sequence per piece = one GSAP timeline: crack (shader dissolve along a noise mask) → shard burst (Rapier impulses)
  → creature fades in (dissolve reversed) → AnimationMixer clip (run/walk/fly) while following a `CatmullRomCurve3`
  sampled from the "Where are you going?" line → impact (flash panel, shake, SFX word) → `scrollTo(section)`.
- Floor shatter (rook): board floor split into instanced fracture plates; each footstep applies impulses in a radius.
- Flames (knight): GPU particles with curl noise, two colour ramps (red→orange, blue→cyan), additive blending.
- Lightning (bishop): procedural branching line geometry, flicker, bloom.
- Shockwave (king): screen-space distortion ring + gold emissive ring mesh.
- Phoenix (queen): ribbon trails + radial light-ray sprites.
- Promotion (pawn): light column, mesh morph/dissolve to the queen-figure.

## 6. Phones and fallbacks
- For each of the six cinematics, record a **video** from the desktop build (Playwright + ffmpeg capture or
  CCapture), 1080×1920 and 1920×1080, H.264 MP4 + WebM, 3–6 s, < 3 MB each, with a poster frame.
- Store in `public/media/cinematics/`. Phones play them inline, muted, with captions.
- Board on phones = pre-rendered still with DOM hotspots.

## 7. Performance budgets
| Metric | Budget |
|---|---|
| First paint (SSR HTML + CSS) | < 1.5 s on 4G |
| JS before the loader shows | < 150 KB gzip (loader is plain DOM/SVG/Canvas2D) |
| 3D core (three + r3f + post) | Lazy, after first paint |
| Each creature GLB | < 2.5 MB (Meshopt + KTX2), loaded on hover/intent, never all at once |
| Desktop frame rate | ≥ 50 fps on an iGPU at `high`; adaptive DPR (0.75–1.5) |
| Cloudflare static asset | Each file < 25 MiB (Workers limit) |
| Lighthouse (mobile) | SEO 100, Accessibility ≥ 95, Best Practices ≥ 95 |

## 8. Folder plan (new code)
```
src/world/                 the WebGL world
  Canvas.tsx               single renderer + quality tier + post-processing
  shots/                   Loader, Welcome, Name, Board, WhereAreYouGoing
  pieces/                  carved piece meshes + fracture
  creatures/               Horse, Elephant, Garuda, Soldier, Lion, Phoenix (model + effect + timeline)
  fx/                      particles, flames, lightning, shockwave, shatter, screentone, ink-outline passes
  quality.ts               tier detection
src/sections/              DOM manga sections (About, MLLab, Products, Algorithms, Skills, Contact, Ask, GitHub)
src/hud/                   HUD overlay, sound toggle, skip intro
public/models/             GLB files (licensed; listed in CREDITS.md)
public/media/cinematics/   phone videos + posters
public/audio/              sound sprites (licensed)
```

## 9. Security and CSP changes needed
- Rapier/Draco/Basis use WebAssembly: add `'wasm-unsafe-eval'` to `script-src` in `src/server.ts`.
- Videos and audio are same-origin: `media-src 'self' blob:` (already).
- Keep: no secrets in the client; `AI_API_KEY`, `GITHUB_TOKEN` only as Cloudflare Secrets.

## 10. Testing
- Unit: keep `bun run test` green (58 tests) and add tests for any pure logic (quality-tier detection, curve
  sampling, sequence state machine).
- Smoke: extend `tests/smoke.config.json` (routes, required SSR text, no console errors, no sideways scroll,
  reduced motion, keyboard path through the board).
- Visual: Playwright screenshots of every shot at 1440×900 and 390×844, sent to Abhishek at each milestone.
