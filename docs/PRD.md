# PRD — "Abhishek's World"

Owner: Abhishek Rai A · Status: approved direction, ready to build · Last updated: 2026-11-22

## 1. Why this exists

Abhishek (B.E. AI & ML, Mysore University, GPA 9.44, Bluemind Solutions AI & ML intern) wants a personal
portfolio that is **outstanding and award-worthy** (Awwwards / FWA / CSS Design Awards level), **out of the box**,
and unmistakably his. It must get him noticed for **ML internships** while showing what he can create.

Visitors are **not here to play chess**. They are here to be impressed by what he can make. The chess board is a
stage, not a game.

The previous attempt (v5) failed because it was feature-heavy, text-heavy and visually ordinary ("outlined boxes").
This time: **short and visual**, cinematic, heavy effects, real craft.

## 2. Audience

| Who | Wants | Gets in the first 10 seconds |
|---|---|---|
| Recruiter / hiring engineer | Who is this, can he build, how to contact | Loader → "Welcome to Abhishek's World" → his name → the board |
| Award jury / designers | Originality, craft, motion, performance | The loader, the type masking, the transformations |
| Search engines and AI answer engines | Facts, structure | Full server-rendered text on every page (see docs/SEO.md) |

## 3. The experience (summary; full storyboard in docs/DESIGN.md)

1. **Loader** — maths, physics, tech and space: equations, orbits and stars assemble while real assets load.
2. **Welcome** — "WELCOME TO ABHISHEK'S WORLD", focus-pull reveal.
3. **Name** — "ABHISHEK RAI A" giant, then the letters mask away as the board rises.
4. **The Board** — a huge 3D chess board in a dark void, both black and white pieces, carved in an Indian
   chaturanga style. Six hero pieces are selectable.
5. **Transformation** — choosing a piece turns it into a real creature that charges to its section:

| Piece | Becomes | Effect | Goes to |
|---|---|---|---|
| ♞ Knight | A horse | Gallops through **red and blue flames**, black background | ML work + Churn Lab |
| ♜ Rook | A giant **elephant** | White with a glow, black background; the **floor shatters** under each step; it crashes into the section | Products |
| ♝ Bishop | **Garuda** (eagle) | Dives diagonally through **lightning** | Algorithms |
| ♟ Pawn | A **foot soldier** | Marches forward and **promotes into a queen of light** (student → engineer) | Skills + Résumé |
| ♚ King | A **lion** with a crown of fire | Roar sends a **golden shockwave** | About Abhishek |
| ♛ Queen | A **phoenix** | Bursts into light rays in every direction | Contact |

6. **"WHERE ARE YOU GOING?"** — a Birkar-style zig-zag line that frames each word and becomes the site map; the
   creatures run along this line.
7. **Destination sections**, each a manga chapter with its own art direction.
8. Kept and redesigned in manga style: Ask Abhishek (chat), Live GitHub activity, Anime shelf, Reviews, Résumé,
   project episodes, the Breslau 1912 chess finale (as an easter egg after Contact).

## 4. Goals and success measures

- G1 **Award-worthy craft**: submit to Awwwards; target Site of the Day. Every section passes the "would a jury
  screenshot this?" test.
- G2 **Recruiter clarity**: name + role + "looking for ML internships" + contact reachable within 2 scroll steps,
  and a "Skip intro" control always visible.
- G3 **Crawlable**: every word of content is in the server HTML; Lighthouse SEO 100; structured data valid.
- G4 **Honest**: every number traces to `src/lib/projects.ts`, `src/lib/facts.ts`, `ml/` or the project READMEs.
  No invented metrics. No salary figure anywhere.
- G5 **Desktop first, phones respected**: desktop (Chrome/Edge/Safari, a mid-range GPU) runs the full live 3D at a
  stable frame rate; phones get the same story with pre-rendered transformation videos.

## 5. Requirements

### Functional
- F1 Loader that reflects **real** loading progress (bytes/assets), never a fake timer; skippable after first visit.
- F2 Welcome + name sequence driven by scroll (smooth scroll), with a "Skip intro" link.
- F3 3D board with all 32 pieces; the six hero pieces are highlighted and labelled on hover/focus
  (piece name → destination).
- F4 Six transformation cinematics (table above), each ending at its section. Each can be replayed. Each has a
  keyboard path (Tab to piece, Enter) and a reduced-motion version (short fade, no flashing).
- F5 "Where are you going?" navigation line linking all destinations.
- F6 Destination sections and sub-pages: About, ML + Churn Lab (live model, existing logic), Products (episodes),
  Algorithms, Skills + Résumé, Contact, Ask Abhishek, GitHub activity, Anime shelf (/anime), Reviews (/reviews),
  Résumé (/resume, printable), project episodes (/projects/$slug), Breslau 1912 easter egg.
- F7 Sound design, **off by default**, one toggle, remembered per visitor.
- F8 Phones/tablets/no-WebGL: same sections, transformations as pre-rendered video, 2D board fallback.

### Non-functional
- N1 Performance budgets (docs/ARCHITECTURE.md §7).
- N2 Accessibility: keyboard, focus order, `prefers-reduced-motion`, no flashing above 3 per second, alt text,
  captions for any spoken audio.
- N3 Security: unchanged v4 posture (CSP, secrets only as Cloudflare Secrets, RLS, rate limits).
- N4 Licensing: every 3D model, sound and font is licensed for use and credited in `CREDITS.md`.
- N5 IP: no characters, art, logos or fonts from any existing manga/anime. Original manga **style** only.

## 6. Out of scope
- Real chess play against the visitor (removed on purpose).
- Hand-drawn art (everything is code-drawn or licensed 3D with custom shaders).
- A custom domain (stays on `*.workers.dev` for now; see docs/DEPLOY.md for the later move).

## 7. Milestones (each ends with screenshots shown to Abhishek for approval)

| # | Milestone | Done when |
|---|---|---|
| M0 | Look-dev | Still frames of: loader, welcome, name, board, one creature (knight), "Where are you going?" — approved |
| M1 | Shell + scroll engine | Loader → welcome → name → board scroll sequence runs, skip intro works, SSR text complete |
| M2 | Board | 32 carved pieces, lighting, hover labels, keyboard focus |
| M3 | Knight + Rook | Both cinematics end-to-end, desktop + video fallback |
| M4 | Bishop, Pawn, King, Queen | All six complete |
| M5 | Sections | All destination sections + sub-pages restyled |
| M6 | Sound, polish, perf | Budgets met, sound toggle, reduced motion |
| M7 | SEO/AEO/GEO + launch | docs/SEO.md checklist complete, deploy, submit |
