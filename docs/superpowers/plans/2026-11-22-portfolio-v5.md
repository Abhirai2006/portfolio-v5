# Portfolio v5 "The Réti Volume" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild everything visitors see on Abhishek's portfolio as a webtoon-style vertical strip navigated by chess, with his real churn model running in the browser, while keeping the existing engine, pages and deploy.

**Architecture:** Same TanStack Start app on Cloudflare Workers. Pure logic (chess lines, churn model runtime, game state, project data) lives in `src/lib/**` with `bun test` unit tests; UI lives in `src/components/v5/**`, `src/components/lab/**` and `src/components/art/**`; a Playwright smoke script checks every route for SSR content, overflow, console errors and both themes. The churn model is exported once by a pinned Python script to JSON committed under `src/data/churn/`.

**Tech Stack:** TanStack Start + React 19 + TypeScript, Tailwind 4, Bun (`bun test`), chess.js, Python 3 (scikit-learn 1.8.0, LightGBM) for the one-time export, Playwright (preinstalled) for smoke checks.

**Spec:** `docs/superpowers/specs/2026-11-22-portfolio-v5-design.md`

## Global Constraints

- Work on branch `v5-redesign`. Never push to `main`; Abhishek pushes himself. Final delivery is a whole-repo zip (no `.git`) plus instructions (spec §11.5).
- The site asks for **ML internships now**. No salary/package figure ("LPA", "CTC", "per annum") anywhere: copy, metadata, JSON-LD, `/llms.txt`, chat context, docs.
- No characters, art, logos or fonts copied from One Piece, TBATE or any other work. Remove `one-piece-font.ttf` usage everywhere (licence unknown).
- Every number shown comes from spec §9 sources. Churn figures (reproduced during planning from the saved model): test ROC-AUC **0.847** (0.8468), CV ROC-AUC **0.849** (always labelled CV), recall **82%** (0.8182) and precision 0.5285 at threshold **0.48477971204830717**, **579** flagged of **1,409** test customers, retention success **35% (labelled assumption)**. Game costs are labelled "illustrative".
- The churn model is never described as causal; tab B carries verbatim: "These are the model's predictions, not proven causes. A real retention team would A/B test an offer before rolling it out."
- Nothing gated behind chess: hero text, CTAs, "Skip to the work →" and contact links are in the SSR HTML and visible without playing or JS.
- Phone first (360, 390, 430 px), dark + light themes, `prefers-reduced-motion`, full keyboard use.
- No new external hosts in the CSP (`src/server.ts`). Everything new is bundled.
- Commit after every task, author `Abhirai2006 <abhirai2006@gmail.com>`, with the session attribution lines.

## Review Focus

1. **JS disabled or slow to load:** every section's text, project list, quick facts and contact links still render (SSR). Pinned by Task 1's smoke no-JS pass, with strings added in Tasks 8–10.
2. **Visitor ignores the chess** (scrolls, Tab, Esc during the 1.Nf3 animation): no scroll lock, no focus trap. Pinned in Task 7 Step 5.
3. **Impossible customer combinations in the Lab** ("No internet service" + TechSupport "Yes", tenure 0, TotalCharges 0): `normalizeCustomer` fixes dependent fields; scoring never yields NaN. Pinned in Tasks 4 and 5.
4. **Light theme legibility** of ink, panels, board and Lab bars. Pinned by Task 1 smoke screenshots in both themes, reviewed by eye in Tasks 7–10.
5. **360 px phones with the docked board:** bottom sheet collapsed by default, never covers CTAs or Lab controls, no sideways scroll. Pinned by Task 1 smoke (overflow at 360) and Task 7 Step 3.

---

## File Structure

```
ml/export_churn.py, ml/requirements.txt, ml/README.md   one-time export
src/data/churn/{model,test-set,parity}.json               generated, committed
src/lib/chess/{lines,marshall}.ts                         chess logic
src/lib/churn/{types,model,metrics,game}.ts               churn runtime + game
src/lib/projects.ts                                       extended episode data
src/lib/facts.ts                                          QUICK_FACTS + PERSON
src/lib/assistant-context.ts                              chat contexts (moved)
src/components/art/                                       Panel, Bubble, SpeedLines, Screentone, EpisodeCover, ChessPiece
src/components/v5/                                        Board, Entrance, DockedBoard, Finale, Origin, Arcs, StatSheet, LiveActivity, AskPanel, SideQuest, QuickFacts
src/components/lab/                                       ChurnLab, ScoreTab, SaveTab, ThresholdTab
src/routes/llms[.]txt.ts                                  /llms.txt
tests/*.test.ts, tests/smoke.config.json                  unit tests + smoke config
scripts/smoke.mjs                                         Playwright route checks
```

---

### Task 1: Foundation: test runner, smoke harness, webtoon tokens, art primitives

**Files:** Modify `package.json`, `src/styles.css`, `src/routes/__root.tsx`, `src/routes/anime.tsx` + anime components using `font-one-piece`. Create `scripts/smoke.mjs`, `tests/smoke.config.json`, `src/components/art/{Panel,Bubble,SpeedLines,Screentone}.tsx`, `src/components/art/README.md`. Delete `public/media/one-piece-font.ttf`, `src/assets/one-piece-font.ttf.asset.json`.

**Interfaces:**
- Produces: `bun run test` (= `bun test tests`) and `bun run smoke -- --base http://127.0.0.1:8080`. Smoke reads `tests/smoke.config.json`: `{ "routes": [{ "path": "/", "mustContain": ["…"], "mustContainJsOnly": ["…"] }] }`; later tasks append entries.
- Produces: `<Panel tone="ink"|"wash" chapter?: ChapterId art?: string>`, `<Bubble from="left"|"right">`, `<SpeedLines/>`, `<Screentone density?: number/>` (SVG/CSS, theme-aware).
- Produces CSS tokens: `--ink`, `--paper`, `--wash-origin … --wash-finale`, `--gutter` in both themes.

- [ ] **Step 1:** Add the two scripts to `package.json`.
- [ ] **Step 2: Write `scripts/smoke.mjs`:** for each route, at widths 360/390/768/1280, in dark and light (set the key `ThemeToggle` reads), fail on `pageerror`/console error, `scrollWidth > innerWidth`, or a missing `mustContain`/`mustContainJsOnly` string; then a `javaScriptEnabled: false` pass that checks `mustContain` only. Screenshots go to `/tmp/claude-0/-home-user-portfolio-v4/9daa99a1-6a3f-5aca-95a4-3ceaf16ce8e1/scratchpad/smoke/`.
- [ ] **Step 3:** Seed the config with the current routes (`/`, `/resume`, `/reviews`, `/anime`, `/projects/arthra`, `/thank-you`) and one string each; with `bun run dev --host 127.0.0.1 --port 8080` running, `bun run smoke` → PASS.
- [ ] **Step 4:** New tokens and fonts (builder's choice; body text ≥ 4.5:1 contrast both themes; Google Fonts only). Remove the One Piece font face, utility and files; swap its uses for the new display face.
- [ ] **Step 5:** Build the four art primitives; `README.md` documents each art slot and how to replace it with a hand-drawn image via `art`.
- [ ] **Step 6:** `bun run build` and `bun run smoke` → PASS. **Commit** `feat(v5): test runner, smoke harness, webtoon tokens and art primitives`.

### Task 2: Chess logic

**Files:** Modify `package.json` (`bun add chess.js`). Create `src/lib/chess/lines.ts`, `src/lib/chess/marshall.ts`, `tests/chess.test.ts`.

**Interfaces:**
- Produces:
  - `type ChapterId = "origin" | "arcs" | "lab" | "stats" | "activity" | "ask" | "sidequest" | "finale"`; `CHAPTERS: ChapterId[]` in that order.
  - `type Reply = "d5" | "Nf6" | "c5" | "g6"`; `REPLY_LINES: Record<Reply, { label: string; firstChapter: ChapterId; moves: string[]; chapterAtPly: Record<Exclude<ChapterId,"finale">, number> }>` (`moves` = SAN from move 1, white first).
  - `positionAt(reply: Reply, ply: number): string` (FEN).
  - `MARSHALL: { pgn: string; puzzleFen: string; solution: "Qg3"; finalBoard: string }`; `checkFinaleMove(san: string): "solved" | "legal-wrong" | "illegal"`.

- [ ] **Step 1: Failing tests:**
  - each line replays legally with chess.js and starts `["Nf3", reply]`;
  - each line's `chapterAtPly` is strictly increasing in `CHAPTERS` order and ≤ `moves.length`;
  - replaying `1.d4 e6 2.e4 d5 3.Nc3 c5 4.Nf3 Nc6 5.exd5 exd5 6.Be2 Nf6 7.O-O Be7 8.Bg5 O-O 9.dxc5 Be6 10.Nd4 Bxc5 11.Nxe6 fxe6 12.Bg4 Qd6 13.Bh3 Rae8 14.Qd2 Bb4 15.Bxf6 Rxf6 16.Rad1 Qc5 17.Qe2 Bxc3 18.bxc3 Qxc3 19.Rxd5 Nd4 20.Qh5 Ref8 21.Re5 Rh6 22.Qg5 Rxh3 23.Rc5 Qg3` ends with board field `5rk1/pp4pp/4p3/2R3Q1/3n4/6qr/P1P2PPP/5RK1`;
  - `MARSHALL.puzzleFen` = position before `23...Qg3`, black to move;
  - `checkFinaleMove("Qg3") === "solved"`, `("Qb4") === "legal-wrong"`, `("Ke7") === "illegal"`.
- [ ] **Step 2:** `bun test tests/chess.test.ts` → FAIL (modules missing).
- [ ] **Step 3:** Implement. The four lines are natural Réti continuations, ~16 plies, chosen by the implementer.
- [ ] **Step 4:** → PASS. **Commit** `feat(v5): chess lines and Levitsky–Marshall finale logic`.

### Task 3: Churn model export (Python, one-time)

**Files:** Create `ml/export_churn.py`, `ml/requirements.txt`, `ml/README.md`, `src/data/churn/{model,test-set,parity}.json`.

**Interfaces:**
- Consumes: read-only clone `/home/user/abhirai2006/telco-churn-intelligence-system` (`app/churn_model.pkl`: Pipeline `pre`=ColumnTransformer[StandardScaler on SeniorCitizen, tenure, MonthlyCharges, TotalCharges; OneHotEncoder(handle_unknown="ignore") on 15 categoricals] → `clf`=LGBMClassifier, 150 trees, 45 features; `app/model_meta.pkl`: `{threshold: 0.48477971204830717}`), data `https://raw.githubusercontent.com/IBM/telco-customer-churn-on-icp4d/master/data/Telco-Customer-Churn.csv`.
- Produces:
  - `model.json`: `{ threshold, numeric: {name, mean, scale}[], categorical: {name, categories: string[]}[], featureNames: string[45], trees: Node[] }`, `Node = { f, t, dl, c, l, r } | { v, c }` (split feature index, threshold, default_left, cover, children / leaf value, cover) from `booster.dump_model()`.
  - `test-set.json`: `{ rows: { x: Customer, y: 0|1, p: number }[] }` (1,409 rows; `p` = Python `predict_proba`).
  - `parity.json`: 50 rows `{ x: Customer, raw: number, contrib: number[46] }` (`booster.predict(..., pred_contrib=True)`, last entry = bias).

- [ ] **Step 1:** `ml/requirements.txt`: `scikit-learn==1.8.0`, `lightgbm>=4.0`, `pandas>=2.0`, `numpy>=1.24`, `joblib>=1.3`.
- [ ] **Step 2:** Write the export, reproducing the notebook: `TotalCharges` → `pd.to_numeric(errors="coerce")` → fill `MonthlyCharges * tenure`; drop `customerID`; `Churn` Yes/No → 1/0; `train_test_split(test_size=0.2, stratify=y, random_state=42)`. Before writing, assert: `len(test)==1409`, `round(roc_auc,4)==0.8468`, `round(recall,4)==0.8182`, `flagged==579`, `num_trees()==150`. A failed assert means stop and report (spec §11.2).
- [ ] **Step 3:** Run with a scratchpad venv: `…/venv/bin/pip install -r ml/requirements.txt` then `…/venv/bin/python -I ml/export_churn.py --repo /home/user/abhirai2006/telco-churn-intelligence-system --out src/data/churn`. Expected: the five checks print OK; `model.json` < 400 KB.
- [ ] **Step 4:** `ml/README.md`: how to regenerate. **Commit** `feat(v5): export churn LightGBM model and test set to JSON`.

### Task 4: Churn runtime in TypeScript

**Files:** Create `src/lib/churn/{types,model,metrics}.ts`, `tests/churn-model.test.ts`, `tests/churn-metrics.test.ts`.

**Interfaces:**
- Consumes: Task 3 JSON.
- Produces:
  - `type Customer` = the 19 Telco columns (`gender, SeniorCitizen, Partner, Dependents, tenure, PhoneService, MultipleLines, InternetService, OnlineSecurity, OnlineBackup, DeviceProtection, TechSupport, StreamingTV, StreamingMovies, Contract, PaperlessBilling, PaymentMethod, MonthlyCharges, TotalCharges`).
  - `normalizeCustomer(c): Customer`: PhoneService "No" ⇒ MultipleLines "No phone service"; InternetService "No" ⇒ OnlineSecurity, OnlineBackup, DeviceProtection, TechSupport, StreamingTV, StreamingMovies = "No internet service"; clamp tenure 0–72, MonthlyCharges 18–120, TotalCharges ≥ 0.
  - `encode(m, c): number[]` (45), `predictRaw(m, c): number`, `predictProba(m, c): number`.
  - `explain(m, c): { base: number; parts: { column: keyof Customer; value: number }[] }` (TreeSHAP summed per original column, sorted by |value|).
  - `metricsAt(rows: {y: 0|1; p: number; monthly: number}[], threshold: number, retention = 0.35): { tp, fp, fn, tn, recall, precision, flagged, alertsPer100, monthlyAtRisk, recoverableMonthly }` (`monthlyAtRisk` = Σ MonthlyCharges of flagged rows, as the notebook does); `rocAuc(rows): number`.

- [ ] **Step 1: Failing tests:**
  - all 1,409 rows: `|predictProba − p| < 1e-6`;
  - 50 parity rows: `|predictRaw − raw| < 1e-6`; each column's `explain` value equals the sum of that column's `contrib` entries within 1e-6; `base + Σ parts === raw` within 1e-6;
  - `metricsAt(test, 0.48477971204830717)`: `flagged === 579`, recall → 0.8182, precision → 0.5285 (4 dp);
  - `rocAuc(test)` → 0.8468;
  - `normalizeCustomer({…, InternetService: "No", TechSupport: "Yes"}).TechSupport === "No internet service"`; a tenure-0, TotalCharges-0 customer gives a finite probability.
- [ ] **Step 2:** → FAIL.
- [ ] **Step 3:** Implement. Encoding: scale the 4 numerics in `numeric` order, then one-hot each categorical in `categories` order (unknown ⇒ zeros). Tree walk: `x[f] <= t ? l : r`. Explanations: path-dependent TreeSHAP (Lundberg et al. 2018, Algorithm 2) using node cover `c`, summed over trees.
- [ ] **Step 4:** → PASS. **Commit** `feat(v5): in-browser churn inference, TreeSHAP and metrics with Python parity tests`.

### Task 5: Churn Lab UI

**Files:** Create `src/lib/churn/game.ts`, `tests/churn-game.test.ts`, `src/components/lab/{ChurnLab,ScoreTab,SaveTab,ThresholdTab}.tsx`.

**Interfaces:**
- Consumes: Task 4; JSON loaded via dynamic `import()` so the Lab is its own chunk.
- Produces: `<ChurnLab />`. `game.ts`: `BUDGET = 100`; `MOVES: { id: "contract1y"|"techSupport"|"onlineSecurity"|"discount10"; label; cost /* 60, 25, 20, 30, illustrative */; applies(c): boolean; apply(c): Customer }[]`; `startGame(rows, seed): GameState` (`{ customer, spent, played: MoveId[], error?: string }`); `play(state, id): GameState`.

- [ ] **Step 1: Failing tests:** `startGame` with a fixed seed always returns the same row, whose `p ≥ 0.48477971204830717`; `play` deducts cost and records the move; replaying a move, exceeding the budget, or `techSupport` on an InternetService "No" customer returns an unchanged customer with `error` set; `discount10` sets MonthlyCharges to `round(0.9 × original, 2)`; `contract1y` sets Contract "One year".
- [ ] **Step 2:** → FAIL. **Step 3:** implement `game.ts`. **Step 4:** → PASS.
- [ ] **Step 5:** Build the tabs per spec §5.4: A defaults to the test customer nearest the median; B shows the verbatim causal note at all times; C slider 0.05–0.95 with a marker at the chosen threshold, the 35% labelled "assumption", and the CV vs test AUC distinction. "How this runs" note: real LightGBM trees in TypeScript, matched to Python within 1e-6 on all 1,409 test customers. Probability readout `aria-live="polite"`; everything keyboard-operable.
- [ ] **Step 6:** `bun run build` → OK. **Commit** `feat(v5): Churn Lab with score, save-the-customer and threshold tabs`.

### Task 6: Project data, new episodes, facts

**Files:** Modify `src/lib/projects.ts`. Create `src/lib/facts.ts`, `tests/projects.test.ts`, new screenshots in `public/media/live/`.

**Interfaces:**
- Produces: `ProjectEntry` adds `kind: "ml"|"product"|"algo"|"practice"`, `arc: "main"|"side"`, `hook: string`, `client?: { name: string; paid: true }`, `prequel?: { title: string; repo: string; story: string }`, `pendingRepo?: { url: string; label: string; isPublic: boolean }`; exports `MAIN_ARCS`, `SIDE_STORIES`. `facts.ts`: `PERSON` (name "Abhishek Rai A", role "Aspiring Machine Learning Engineer", seeking "ML internships", Mysuru, Mysore University School of Engineering, GPA 9.44, GitHub/LinkedIn/Instagram URLs) and `QUICK_FACTS: string[]`.

- [ ] **Step 1: Failing tests:** `MAIN_ARCS` slugs = `customer-churn-intelligence-system, muse-students-voice, arthra, ro-bio, earth-and-ethos`; `SIDE_STORIES` = `o-patience, binary-search-visualizer, ittige, git-github-viva-prep, lab-programs, cpp-console-suite, wonderland`; no `logbook`; slugs unique; all URLs `https://`; churn `repo === "https://github.com/Abhirai2006/telco-churn-intelligence-system"` and `pendingRepo` = `{ url: "https://github.com/Abhirai2006/bluemind-ml-internship-2026", isPublic: false }`; earth-and-ethos `client.paid` and `live === "https://portfolio.earth-and-ethos.workers.dev/"`; ro-bio `live === "https://ro-bio.hub-muse.workers.dev/"`; arthra `live === "https://arthrafin-7qakibfj.manus.space/"`, `prequel.repo === "https://github.com/Abhirai2006/tally-my-cents"`; serialised `PROJECTS` + `QUICK_FACTS` contain none of "LPA", "CTC", "per annum".
- [ ] **Step 2:** → FAIL.
- [ ] **Step 3:** Clone read-only (`GIT_LFS_SKIP_SMUDGE=1 git clone --depth 1`) `Ro-Bio`, `earth-and-ethos`, `tally-my-cents`, `IV-semester-lab-programs` into `/home/user/abhirai2006/`; write the new entries only from their READMEs/sites (no invented numbers; descriptive "metrics" when none exist).
- [ ] **Step 4:** Screenshots of the two new live sites via `scripts/capture-projects.mjs --only …` (add them to its list); if the sandbox blocks the hosts, use Firecrawl screenshots. Name files `ro-bio-N.jpg`, `earth-and-ethos-N.jpg`.
- [ ] **Step 5:** → PASS. **Commit** `feat(v5): new episodes, arcs metadata and quick facts`.

### Task 7: Chess UI

**Files:** Create `src/components/art/ChessPiece.tsx`, `src/components/v5/{Board,Entrance,DockedBoard,Finale}.tsx`.

**Interfaces:**
- Consumes: Task 2, Task 1 tokens.
- Produces: `<Board fen size interactive? orientation? onMove?(san) highlight? />` (SVG; arrow keys move a cursor, Enter picks/drops; each square has `aria-label` like "f3, white knight"); `<Entrance onReply(reply: Reply) />`; `<DockedBoard reply activeChapter onJump(chapter) />`; `<Finale onSolved() />`.

- [ ] **Step 1:** `ChessPiece`: original ink-style SVG for 6 types × 2 colours. `Board` on top.
- [ ] **Step 2:** `Entrance`: SSR renders the board after 1.Nf3, "Abhishek opens 1.Nf3. Your move.", four reply `<button>`s and the "Skip to the work →" link; client animates the knight g1→f3 unless reduced motion. No scroll lock or focus trap.
- [ ] **Step 3:** `DockedBoard`: corner card ≥ 1024 px; on phones a collapsed pill (expands on tap, never overlaps CTAs); `IntersectionObserver` sets `activeChapter`; tapping a move scrolls to its chapter.
- [ ] **Step 4:** `Finale`: panel "Breslau, 1912"; visitor plays black from `MARSHALL.puzzleFen`; a legal wrong move shows a hint; `Qg3` → `onSolved` (reveal animation; contact links are already in SSR). Copy calls the gold coins a legend.
- [ ] **Step 5:** Smoke (after Task 8 mounts them): `/` mustContain "Abhishek opens 1.Nf3", "Skip to the work", "Breslau, 1912"; extra check that `scrollY` changes right after load when scrolling, and Tab from page start reaches "Skip to the work" within 5 presses.
- [ ] **Step 6: Commit** `feat(v5): chess board, entrance, docked navigator and Marshall finale`.

### Task 8: Homepage rebuild

**Files:** Rewrite `src/routes/index.tsx`. Restyle (logic untouched) `src/components/portfolio/{GithubLive,ContributionHeatmap,AskAbhishek}.tsx`. Create `src/components/v5/{Origin,Arcs,StatSheet,LiveActivity,AskPanel,SideQuest,QuickFacts}.tsx`, `src/components/art/EpisodeCover.tsx`.

**Interfaces:**
- Consumes: Tasks 1, 2, 5, 6, 7. Section ids = `CHAPTERS` plus `contact` inside the finale.
- Produces: `<EpisodeCover project size="lg"|"sm" />` (reused in Task 9).

- [ ] **Step 1:** Hero/entrance copy: name, "Aspiring Machine Learning Engineer · looking for ML internships", GPA 9.44, Bluemind internship, buttons Résumé + Hire me (Hire me uses the **Internship** mailto template in `src/lib/contact.ts`; add it if only a generic one exists). Then chapters in spec §5.1 order, finale, contact (v4 email-reveal behaviour kept; no `<a>` inside `<button>`), footer. Keep `track`, `recordVisit`, `observeSections` with the new ids and `<CommandPalette />`. Lab is `lazy()` with an SSR placeholder holding its heading and description.
- [ ] **Step 2:** Arcs: main arcs as large covers, side stories as a compact strip; piece filters are `aria-pressed` buttons.
- [ ] **Step 3:** Origin: 4–6 panels (Mangaluru → Mysuru, maths first, Bluemind internship, languages) plus `<QuickFacts />`. StatSheet: the v4 S/A/B tiers, same items. LiveActivity wraps `GithubLive` and exports `CHESS_PROFILE: { site: "lichess"|"chess.com"; username: string } | null = null`; when `null` nothing chess-related renders (the documented slot for his future account).
- [ ] **Step 4:** Smoke config for `/`: mustContain name, "looking for ML internships", each main-arc title, "Churn Lab", "Abhishek opens 1.Nf3", "Skip to the work", "Breslau, 1912", the GitHub and LinkedIn URLs; mustContainJsOnly "not proven causes".
- [ ] **Step 5:** `bun run build`, `bun run smoke` → PASS; review 360 px and light screenshots. **Commit** `feat(v5): webtoon homepage`.

### Task 9: Episode pages

**Files:** Modify `src/routes/projects.$slug.tsx`.

- [ ] **Step 1:** Vertical episode layout (cover → problem → constraints → built → trade-offs → outcome → screenshots → links). Render `client` as "Paid client project", `prequel` as the Tally → Arthra story with code link, `pendingRepo` as "Internship repo going public soon" (no link) while `!isPublic`, a link otherwise.
- [ ] **Step 2:** JSON-LD: `@type` `["CreativeWork","SoftwareSourceCode"]` when a repo exists (else `CreativeWork`), `codeRepository`, `author` Person (`url: ${SITE}/`), plus `BreadcrumbList` (Home → Arcs → title).
- [ ] **Step 3:** Smoke adds `/projects/ro-bio`, `/projects/earth-and-ethos` ("Paid client project"), `/projects/arthra` ("Tally"), `/projects/customer-churn-intelligence-system` ("going public soon") → PASS. **Commit** `feat(v5): episode pages`.

### Task 10: Other pages and shared chrome

**Files:** Modify `src/routes/{resume,reviews,thank-you,anime}.tsx`, `src/routes/__root.tsx` (404 + error), `src/components/portfolio/{Nav,ThemeToggle,CommandPalette}.tsx`.

- [ ] **Step 1:** Nav + footer in the new language; 404 keeps its quote as plain text.
- [ ] **Step 2:** Résumé: `<QuickFacts />`, "Seeking ML internships", projects in arc order incl. new episodes; smoke renders `page.pdf({ format: "A4" })` and expects ≤ 2 pages.
- [ ] **Step 3:** Reviews, thank-you and anime chrome restyled (anime internals untouched).
- [ ] **Step 4:** Command palette lists `CHAPTERS` and every episode.
- [ ] **Step 5:** Smoke all routes → PASS. **Commit** `feat(v5): restyle résumé, reviews, anime, 404, nav, palette`.

### Task 11: Assistant context

**Files:** Create `src/lib/assistant-context.ts`, `tests/assistant-context.test.ts`. Modify `src/routes/api/chat.ts` (import contexts).

- [ ] **Step 1: Failing test:** `RESUME_CONTEXT` contains "Ro-Bio", "Earth & Ethos", "paid", "Tally", "1.Nf3", "Marshall", "looking for ML internships"; `PERSONAL_CONTEXT` contains "The Beginning After the End" and "maths"; neither contains "LPA", "CTC", "per annum"; the BOUNDARIES block is byte-identical to v4's.
- [ ] **Step 2:** → FAIL. **Step 3:** move + update. **Step 4:** → PASS, `bun run build`. **Commit** `feat(v5): update Ask Abhishek context`.

### Task 12: SEO, GEO, AEO and cleanup

**Files:** Create `src/routes/llms[.]txt.ts`, `tests/seo.test.ts`. Modify `public/robots.txt`, `src/routes/index.tsx` head, `src/routes/sitemap[.]xml.ts` (add `/llms.txt`), `README.md`, `roadmap.md`. Delete unused v4 components (`ProjectOrbit`, `ProjectModal`, `HeroScene`, `MagicCard`, `CursorGlow`, `SpotlightPortrait`, `TechniqueVault`, unused `src/components/motion/*` and `src/components/ui/*`) and dependencies no longer imported; `bun install` to refresh `bun.lock`.

- [ ] **Step 1: Failing tests:** the `/llms.txt` builder returns text starting `# Abhishek Rai A` that links `/`, `/resume` and every main-arc episode; home JSON-LD parses, includes `@type: "ProfilePage"` with `mainEntity["@type"] === "Person"` and `sameAs` containing the GitHub and LinkedIn URLs; no head string contains "LPA".
- [ ] **Step 2:** → FAIL. **Step 3:** implement. `robots.txt` explicitly allows `Googlebot`, `Bingbot`, `GPTBot`, `OAI-SearchBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`; keeps the sitemap line.
- [ ] **Step 4:** Smoke checks every route has a unique `<title>` and meta description and that every JSON-LD block parses.
- [ ] **Step 5:** Remove unused files/deps (verify each with `grep -r` first); `bun run build`, `bun test`, `bun run smoke` → PASS; note homepage initial JS size (excluding the Lab chunk) in the commit. README gains the v5 overview, the Search Console + Bing checklist and the delivery steps. **Commit** `feat(v5): llms.txt, robots, ProfilePage JSON-LD, docs; remove v4 leftovers`.

### Task 13: Final verification and delivery

- [ ] **Step 1:** `bun test`, `npx tsc --noEmit`, `bun run build`, `bun run smoke` all PASS; secret scan of `.output` (same patterns as the v4 check: `AIza…`, `ghp_…`, `github_pat_…`, `sk-…`, private keys) finds nothing; `GITHUB_TOKEN`/`AI_API_KEY` absent from `.output/public`.
- [ ] **Step 2:** `git archive --format=zip --prefix=portfolio-v4/ -o portfolio-v5.zip v5-redesign` (repo root, excluded locally via `.git/info/exclude`); send it with spec §11.5 delivery steps, the manual follow-ups (flip `pendingRepo.isPublic`; Search Console + Bing submissions) and screenshots of `/` at 390 and 1280 px in both themes.

### Task 8b: Main 3D board (spec §12)

**Files:** Create `src/lib/chess/play.ts`, `tests/chess-play.test.ts`, `src/components/v5/MainBoard.tsx` (2D + legend + logic hook), `src/components/v5/Board3D.tsx` (lazy three.js scene), `src/components/v5/BackToBoard.tsx`. Delete `src/components/v5/{Entrance,DockedBoard}.tsx`; remove `REPLY_LINES`/`positionAt`/`moveText` from `lines.ts` and their tests. Modify `src/routes/index.tsx`, `src/components/v5/sections.tsx` (Arcs takes a controlled filter).

**Interfaces:** `DESTINATIONS: Record<PieceType, { chapter: ChapterId | "contact"; label: string; filter?: Kind }>`; `START_FEN` (after 1.Nf3); `whiteReply(fen): string | null` (legal SAN; prefers mate, then the most valuable capture, then check, then development; deterministic); `applyVisitorMove(fen, from, to): { fen; san; piece } | null`.

- [ ] Failing tests: mapping is exactly the six in spec §12; `START_FEN` is after 1.Nf3 with black to move; `whiteReply` returns a legal move for 50 random-but-seeded positions, takes a hanging queen, returns null when the game is over; `applyVisitorMove` rejects illegal moves and white moves.
- [ ] Implement; tests pass.
- [ ] UI: 3D board (lathe-turned pieces, knight extruded from the ChessPiece outline, clearcoat materials, soft shadows, procedural room lighting, no network assets), pick → targets → move animation → white reply → travel; 2D fallback; legend links; Back-to-board button; sessionStorage game.
- [ ] Smoke: `/` mustContain the six legend labels; chessCheck plays a knight move on the board and expects arrival at `#lab`, then "Back to the board" returns to `#board`.
