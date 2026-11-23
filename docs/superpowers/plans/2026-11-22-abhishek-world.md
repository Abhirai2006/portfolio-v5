# Abhishek's World Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the starter's placeholder with the full "Abhishek's World" site (loader → welcome → name → 3D board →
six piece-to-creature cinematics → "Where are you going?" map → manga sections → restyled sub-pages).

**Architecture:** TanStack Start SSR renders every word; one lazy, client-only R3F canvas sits fixed behind the DOM
and is driven by GSAP ScrollTrigger + Lenis. Pure logic (tiers, progress, sequence, geometry, curves) lives in
small tested modules under `src/world/`; React components are thin shells over them.

**Tech Stack:** React 19, TanStack Start, Tailwind 4, three 0.185, @react-three/fiber 9, @react-three/drei 10,
postprocessing + @react-three/postprocessing, gsap (+ScrollTrigger), lenis, Web Audio, bun test, Playwright, ffmpeg.

**Spec:** `docs/superpowers/specs/2026-11-22-abhishek-world-design.md` (+ PRD, DESIGN, ARCHITECTURE, CONTENT, ASSETS, SEO)

## Global Constraints
- Copy exactly as `docs/CONTENT.md` §3; facts only from `src/lib/facts.ts`, `src/lib/projects.ts`, `ml/README.md`. No salary/package/LPA figure.
- Palette tokens exactly DESIGN §2.1 (`--ink #0B0B0C`, `--paper #F2EEE6`, `--grey-1..4 #1A1A1C #3A3A3E #8A8780 #C9C4BA`, `--blue-fire #3D7BFF`/`#9CC2FF`, `--orange-fire #FF6A1A`/`#FFC38A`, `--red-fire #FF2E2E`, `--gold #FFC34D`). Colour only as light.
- Fonts: Big Shoulders Display 900, Dela Gothic One, Yuji Boku, Inter 400/600, JetBrains Mono 500 — self-hosted woff2, OFL, listed in `CREDITS.md`.
- Every homepage text block ≤ ~25 words. One `<h1>` per page (the name on `/`).
- Canvas `aria-hidden`; all meaning also in SSR DOM; page fully readable with JS disabled.
- Skip intro visible and first in tab order during loader/welcome/name. Sound off by default, one toggle, remembered (`localStorage["aw:sound"]`).
- Reduced motion: no flashes, no shake, no particle bursts; flashes never > 3 per second in any mode.
- No sideways scroll at 360/390/768/1280/1440 widths.
- Do not modify logic in `src/lib/churn/*`, `src/lib/projects.ts`, `src/lib/facts.ts`, `src/routes/api/chat.ts`, `src/lib/seo.ts`, `src/lib/chess/marshall.ts` (data/content fixes only if asked).
- Every third-party asset in `CREDITS.md` (name, author, source URL, license). CC0 / CC-BY / OFL only.
- No git commits (AGENT.md rule 6); each task ends with `bun run test` green + `bun run build` succeeding.
- Products = `MAIN_ARCS` (five volumes, Churn system included).
- Site is single-theme (ink world); `ThemeToggle` and light theme are removed (DESIGN §3 HUD has no theme control).

## Review Focus
1. JavaScript disabled → every section's words, links and the name are in the HTML (smoke no-JS pass, Task 15).
2. No WebGL2 / context lost / phone width → 2D board still with working hotspots and video cinematics, never a blank stage (Task 2 tests + smoke `webglOff` check in Task 12).
3. `prefers-reduced-motion` → cinematics become crossfades, no flash panel, no shake (Task 11 test "reduced spec has no flash/shake").
4. Server sends no `Content-Length` / slow network → loader progress still advances to READY and never exceeds 100% (Task 3 tests).
5. Returning visitor → loader skippable immediately; deep link `/#contact` lands on Contact without forcing the intro (Task 4 tests).

---

### Task 1: Foundations — deps, fonts, tokens, base layout

**Files:**
- Modify: `package.json` (add `gsap`, `lenis`, `postprocessing`, `@react-three/postprocessing`)
- Create: `public/fonts/*.woff2` (Latin subsets), `scripts/fetch-fonts.mjs`
- Modify: `src/styles.css` (replace theme vars with DESIGN tokens, `@font-face`, `.font-display/.font-sfx/.font-brush/.font-hud`, grain overlay, focus ring `--blue-fire`)
- Modify: `src/routes/__root.tsx` (dark-only, preload display font, new 404 copy without anime quote)
- Delete: `src/components/portfolio/ThemeToggle.tsx`, `src/hooks/use-is-light.ts` (after replacing usages)
- Modify: `CREDITS.md`

**Interfaces:** Produces CSS classes `font-display`, `font-sfx`, `font-brush`, `font-hud`, `font-body`; CSS vars above.

- [ ] Step 1: `bun add gsap lenis postprocessing @react-three/postprocessing`; write `scripts/fetch-fonts.mjs` that downloads woff2 (latin) for the five families from Google Fonts CSS API into `public/fonts/`.
- [ ] Step 2: Replace tokens/fonts in `styles.css`; remove light theme; 404 copy: "LOST IN THE VOID." / "This square is empty. The board is this way." + link home.
- [ ] Step 3: Replace `useIsLight` usages with constant dark behaviour; delete ThemeToggle.
- [ ] Step 4: Verify: `bun run test` → 58 pass; `bun run build` succeeds; `rg -n "use-is-light|ThemeToggle|Roronoa" src` → no matches.

### Task 2: Quality tiers

**Files:** Create `src/world/quality.ts`; Test `tests/quality.test.ts`

**Interfaces:** Produces `type Tier = "ultra" | "high" | "video"`; `detectTier(i: TierInput): Tier` with
`TierInput = { webgl2: boolean; cores: number; memoryGb?: number; reducedMotion: boolean; saveData: boolean; width: number; frameMs?: number }`; `adaptiveDpr(frameMs: number, current: number): number` clamped 0.75–1.5.

- [ ] Step 1: Tests: no webgl2 → video; width < 900 → video; saveData → video; memoryGb 2 → video; cores ≥ 8 && frameMs ≤ 12 → ultra; cores 4, frameMs 18 → high; frameMs > 40 → video; reducedMotion alone does NOT force video (returns high); `adaptiveDpr(30, 1.5)` < 1.5 and ≥ 0.75; `adaptiveDpr(8, 1)` ≤ 1.5.
- [ ] Step 2: Run `bun test tests/quality.test.ts` → FAIL (module missing).
- [ ] Step 3: Implement.
- [ ] Step 4: Run → PASS.

### Task 3: Real loading progress

**Files:** Create `src/world/loading.ts`; Test `tests/loading.test.ts`

**Interfaces:** Produces `type Stage = "DOWNLOADING" | "COMPILING SHADERS" | "BUILDING BOARD" | "READY"`;
`createTracker(totalHint: number): Tracker` where `Tracker = { add(bytes: number): void; markStage(s: Stage): void; snapshot(): { bytes: number; fraction: number; stage: Stage } }`;
`trackFetch(url: string, t: Tracker): Promise<ArrayBuffer>` (streams `response.body`, calls `t.add` per chunk);
`formatBytes(n: number): string` (`"2.4 MB"`, `"512 KB"`).
Fraction = 0.8 × min(bytes/totalHint, 1) + 0.1 per completed later stage; READY ⇒ 1.

- [ ] Step 1: Tests: fraction never > 1 even if bytes exceed hint; stays < 1 until READY; READY → 1; stage order is monotone (marking an earlier stage after a later one is ignored); `formatBytes(2_400_000) === "2.4 MB"`, `formatBytes(524_288) === "512 KB"`; `trackFetch` with a mock Response lacking content-length still sums chunk bytes.
- [ ] Step 2: Run → FAIL. Step 3: Implement. Step 4: Run → PASS.

### Task 4: Intro sequence state + skip

**Files:** Create `src/world/sequence.ts`; Test `tests/sequence.test.ts`

**Interfaces:** Produces `type Beat = "loader" | "welcome" | "name" | "board" | "cinematic" | "map" | "section"`;
`initialBeat(o: { visited: boolean; hash: string }): Beat` (hash naming a section id → "section"; else "loader");
`canSkipLoader(o: { visited: boolean; ready: boolean }): boolean` (visited || ready);
`HERO_IDS = ["knight","rook","bishop","pawn","king","queen"] as const`; `type HeroId`;
`SECTION_FOR: Record<HeroId, SectionId>` = knight→`ml`, rook→`products`, bishop→`algorithms`, pawn→`skills`, king→`about`, queen→`contact`;
`type SectionId = "about"|"ml"|"products"|"algorithms"|"skills"|"contact"|"ask"|"github"|"breslau"`.

- [ ] Step 1: Tests: first visit no hash → loader; `#contact` → section; unknown hash → loader; `canSkipLoader({visited:true,ready:false})` true, `({visited:false,ready:false})` false; SECTION_FOR mapping exactly as above.
- [ ] Step 2–4: FAIL → implement → PASS.

### Task 5: HUD + sound

**Files:** Create `src/hud/Hud.tsx`, `src/hud/SkipIntro.tsx`, `src/hud/SoundToggle.tsx`, `src/hud/Menu.tsx`, `src/hud/sound.ts`; Test `tests/sound.test.ts`

**Interfaces:** `readSoundPref(raw: string | null): boolean` (only `"on"` ⇒ true); `play(name: Sfx): void` no-op when off;
`type Sfx = "chime"|"hoof"|"flame"|"neigh"|"footfall"|"crack"|"trumpet"|"thunder"|"wing"|"screech"|"drum"|"choir"|"roar"|"boom"|"whoosh"|"rise"`, each a Web Audio synth recipe (noise + oscillators + envelopes), lazy `AudioContext` created on first toggle.
HUD: top-left `ABHISHEK'S WORLD — PLATE nn`, top-right Sound ◯ / Skip intro / Menu, bottom-left status line, bottom-right `RECEIVED x MB`, corner crop marks, live X/Y cursor readout (hidden on touch).

- [ ] Step 1: Tests: `readSoundPref(null)` false, `"off"` false, `"on"` true, `"ON "` false.
- [ ] Step 2–4: FAIL → implement → PASS. Menu lists all destinations as real `<a href="#id">` links.

### Task 6: Homepage SSR skeleton + DOM shots (loader, welcome, name, map)

**Files:** Rewrite `src/routes/index.tsx`; Create `src/world/shots/Loader.tsx` (SVG equations + orbits + black hole), `src/world/shots/Welcome.tsx`, `src/world/shots/NameShot.tsx`, `src/sections/WhereLine.tsx`, `src/world/where.ts`; Test `tests/where.test.ts`

**Interfaces:** `buildChamferPath(words: Rect[], o: { chamfer: number; margin: number }): string` (SVG path that frames each word in order, alternating sides, 45° chamfers); `samplePath(points: [number,number][], t: number): [number,number]` (arc-length param, t∈[0,1]).
Equations exactly: `e^{iπ}+1=0`, `∇·E=ρ/ε₀`, `iħ∂ψ/∂t=Ĥψ`, `θ←θ−η∇L`, `softmax(QKᵀ/√d)V`, `E=mc²`, each revealed as tracker fraction passes (i+1)/7.
Index page keeps `head()` (title, description, JSON-LD) unchanged; contains `<h1>` name, the role line, QUICK_FACTS, every section heading/splash copy, all MAIN_ARCS + SIDE_STORIES links, contact links.

- [ ] Step 1: Tests: `buildChamferPath` for 4 rects returns a path starting with `M`, containing only `M`/`L` commands, whose bounding box encloses all rects; `samplePath(pts,0)` = first point, `(pts,1)` = last, `(square,0.5)` = half perimeter point.
- [ ] Step 2–4: FAIL → implement → PASS.
- [ ] Step 5: `curl -s localhost:8080/ | grep -c "WHERE ARE YOU GOING"` ≥ 1 with dev server; name in `<h1>`.

### Task 7: World canvas + ink post-processing

**Files:** Create `src/world/Canvas.tsx` (lazy, client-only, `aria-hidden`, one renderer), `src/world/fx/InkOutline.ts` (Sobel on depth+normal), `src/world/fx/Screentone.ts`, `src/world/fx/Finish.ts` (grain, chromatic aberration, vignette), `src/world/materials/inkToon.ts`

**Interfaces:** `<WorldCanvas tier={Tier} beat={Beat} />`; `inkToonMaterial(o: { color: string; rim: { left: string; right: string }; steps: 3|4; emissive?: string }): THREE.ShaderMaterial`.
Lighting: rim `--blue-fire` left, `--orange-fire` right, fog `--ink`. Bloom on emissive only (luminance threshold ≥ 0.9).

- [ ] Step 1: Build + load `/` in Playwright at 1440×900; screenshot shows board area rendered with outlines (manual look) and zero console errors.

### Task 8: Board + 32 carved pieces

**Files:** Create `src/world/pieces/profiles.ts`, `src/world/pieces/Piece.tsx`, `src/world/pieces/layout.ts`, `src/world/shots/BoardShot.tsx`, `src/sections/HeroLabels.tsx` (DOM buttons over the canvas); Test `tests/pieces.test.ts`

**Interfaces:** `PROFILES: Record<PieceType, [number, number][]>` (lathe radius/height; lotus base, ornate collar); `boardLayout(): { type: PieceType; color: "w"|"b"; square: string; hero?: HeroId }[]`; heroes = white Nb1→knight, Ra1→rook, Bc1→bishop, e2 pawn→pawn, Ke1→king, Qd1→queen.
Hero labels exactly `♞ KNIGHT → ML + CHURN LAB` · `♜ ROOK → PRODUCTS` · `♝ BISHOP → ALGORITHMS` · `♟ PAWN → SKILLS + RÉSUMÉ` · `♚ KING → ABOUT` · `♛ QUEEN → CONTACT`; cue *Choose a piece. It knows the way.* Hover/focus lifts piece, brightens rim, `play("chime")`.

- [ ] Step 1: Tests: 32 entries, 16 per colour, unique squares, exactly 6 heroes with the mapping above; every profile has ≥ 12 points, radius ≥ 0, heights non-decreasing.
- [ ] Step 2–4: FAIL → implement → PASS. Tab order reaches the six labels; Enter triggers `startCinematic(id)`.

### Task 9: Creatures — CC0 downloads + code-built

**Files:** Create `scripts/fetch-models.mjs`, `public/models/horse.glb`, `public/models/soldier.glb`, `src/world/creatures/{Horse,Soldier,Elephant,Lion,Garuda,Phoenix}.tsx`, `src/world/creatures/gait.ts`; Test `tests/gait.test.ts`; Modify `CREDITS.md`

**Interfaces:** each creature `({ progress: number; reduced: boolean }) => JSX` positioned by parent along a curve.
`gaitPhase(t: number, legs: number, pattern: "gallop"|"walk"): number[]` per-leg phase in [0,1).
Sources: `https://raw.githubusercontent.com/trebeljahr/quaternius-showcase/main/public/glb/animals_pack/Horse.glb`; soldier from `single_knight_pack` or `modular_men` (whichever has a walk clip). Verify CC0 on the Quaternius pack page before use; record author "Quaternius", license CC0 1.0. Optimise with `gltf-transform optimize --compress meshopt` → each < 2.5 MB.

- [ ] Step 1: Tests: `gaitPhase` returns `legs` values in [0,1); walk phases are offset by 0.25 between legs (4 legs); gallop front pair offset < walk offset.
- [ ] Step 2–4: FAIL → implement → PASS. `ls -la public/models` each < 2.5 MB.

### ⛔ CHECKPOINT — M0 look check
- [ ] Render stills at 1440×900 and 390×844: loader (mid-progress), welcome (focus pulling), name, board (labels visible), knight mid-gallop (flames), "Where are you going?" (Stage 2 with cards). Script: `scripts/lookdev.mjs` (Playwright, `?shot=<name>` query freezes a beat). Send to Abhishek; **wait for approval**; apply changes.

### Task 10: FX library

**Files:** Create `src/world/fx/{Flames,Lightning,Shockwave,Shatter,Rays,LightColumn,Shards}.tsx`, `src/world/fx/bolt.ts`, `src/world/fx/fracture.ts`; Test `tests/fx.test.ts`

**Interfaces:** `branchBolt(seed: number, from: V3, to: V3, depth: number): V3[][]` (deterministic); `fracture(seed: number, count: number, size: V3): Shard[]` (`Shard = { center: V3; size: V3 }`, cells tile the box).

- [ ] Step 1: Tests: same seed ⇒ identical bolt; main branch starts at `from` and ends at `to`; `fracture(1, 60, [1,2,1])` returns 60 shards whose volumes sum to 2 ± 1%.
- [ ] Step 2–4: FAIL → implement → PASS.

### Task 11: Six cinematics

**Files:** Create `src/world/cinematics/spec.ts`, `src/world/cinematics/Director.tsx`, `src/world/cinematics/ImpactOverlay.tsx` (DOM SFX word + flash panel + shake); Test `tests/cinematics.test.ts`

**Interfaces:** `CINEMATICS: Record<HeroId, CinematicSpec>`; `CinematicSpec = { creature; durationMs; sfxWord; beats: { at: number; kind: "awaken"|"shatter"|"emerge"|"charge"|"impact" }[]; sounds: Sfx[] }`;
`reducedSpec(s: CinematicSpec): CinematicSpec` (durationMs ≤ 800, only awaken→impact crossfade, flash false, shake 0).
SFX words: knight "VRRM", rook "CRACK", bishop "KRAK-THOOM", pawn "RISE", king "ROAR", queen "FWOOSH". Duration 3000–6000 ms each. Ends with `scrollTo("#" + SECTION_FOR[id])`. Replay button on each section splash.

- [ ] Step 1: Tests: six specs; each duration within 3000–6000; beats ordered awaken<shatter<emerge<charge<impact; reduced spec has no flash, shake 0, duration ≤ 800; flash count per spec ≤ 3 and gap ≥ 334 ms.
- [ ] Step 2–4: FAIL → implement → PASS.

### Task 12: Phone / no-WebGL fallback + recorded videos

**Files:** Create `src/world/fallback/BoardStill.tsx` (pre-rendered still + DOM hotspots), `src/world/fallback/CinematicVideo.tsx` (muted, inline, captions `.vtt`), `scripts/record-cinematics.mjs`, `public/media/cinematics/{id}-{portrait|landscape}.{mp4,webm,jpg}`, `public/media/cinematics/{id}.vtt`, `public/media/board-still.jpg`

- [ ] Step 1: Record via Playwright frame capture + ffmpeg: 1080×1920 and 1920×1080, H.264 + VP9, 3–6 s, each < 3 MB (`ls -la` check).
- [ ] Step 2: Smoke check `webglOff` (launch with `--disable-webgl`): board hotspots visible, clicking knight plays video then lands on `#ml`.

### Task 13: Destination sections

**Files:** Create `src/sections/{About,MLLab,Products,Algorithms,Skills,Contact,Ask,GithubCity,Breslau,Splash}.tsx`; restyle (logic untouched) from `src/components/lab/ChurnLab.tsx`, `portfolio/AskAbhishek.tsx`, `portfolio/GithubLive.tsx`, `v5/Finale.tsx`; then delete `src/components/v5`, `src/components/art`, `src/components/lab` and other now-unused components.

Content: splashes exactly CONTENT §3; About 4–6 panel page (Mangaluru → Mysuru, maths first, B.E. AI & ML GPA 9.44, Bluemind) with halftone portrait; ML lab ink dial + speed-line SHAP bars, keep strings "Churn Lab", "not proven causes", "match the Python model"; Products = 5 tilted volume covers (`MAIN_ARCS`) linking "Read the {title} episode"; Algorithms = ink bar-sort diagram + O(patience)/Binary Search links; Skills = tiers S/A/B from CONTENT §4 + `/resume` link; Contact = "LET'S TALK." + `mailto("internship")` + GitHub/LinkedIn/Instagram; Ask = speech bubbles; GitHub = isometric ink city; Breslau 1912 after Contact; honesty line kept.

- [ ] Step 1: Existing tests still pass; smoke `/` mustContain updated (Task 15) passes; lab check (enter values → probability renders) passes.

### Task 14: Sub-pages restyled

**Files:** Modify `src/routes/projects.$slug.tsx` (chapter layout), `resume.tsx` (printable, 2 A4 pages), `anime.tsx` + `src/components/anime/*` (manga library), `reviews.tsx` (reader letters), `thank-you.tsx`; new shared `src/sections/PageShell.tsx` replacing `portfolio/Nav.tsx`.

- [ ] Step 1: Smoke for those routes (existing mustContain) passes; `/resume` PDF ≤ 2 pages.

### Task 15: Smoke, a11y, perf, SEO, delivery

**Files:** Modify `tests/smoke.config.json`, `scripts/smoke.mjs` (reducedMotion, keyboard path through six heroes, webglOff, widths incl. 1440, drop theme loop), `src/server.ts` (CSP `'wasm-unsafe-eval'` only if WASM used), `scripts/og-cover.mjs` (new style), `docs/DECISIONS.md`

New `/` mustContain: "Abhishek Rai A", "looking for ML internships", "WELCOME TO ABHISHEK", "Skip intro", "Choose a piece. It knows the way.", "WHERE ARE YOU GOING?", "THE MODEL RUNS HERE.", "FIVE VOLUMES.", "ALGORITHMS, DRAWN.", "FROM PAWN TO QUEEN.", "ORIGIN.", "LET'S TALK.", all five MAIN_ARCS titles, "Churn Lab", "not proven causes", "match the Python model", "Breslau, 1912", GitHub + LinkedIn URLs.

- [ ] Step 1: `bun run test` all green; `bun run build`; `bun run smoke -- --base http://127.0.0.1:8080` → 0 failures.
- [ ] Step 2: Lighthouse mobile on `/`, `/resume`, one episode: SEO 100, A11y ≥ 95, BP ≥ 95; desktop fps probe ≥ 50 at `high` (report honestly if the sandbox GPU can't measure).
- [ ] Step 3: Final screenshots of every shot/section at 1440×900 + 390×844 → Abhishek; zip repo without `node_modules`, `.output`, `dist`, `.wrangler`; DEPLOY steps in the hand-off message.
