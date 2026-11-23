# DESIGN — "Abhishek's World"

Read with `docs/PRD.md`. Reference frames are in `docs/references/` (what each one taught us is in §10).
Everything here is **original**: manga *style*, never anyone's characters, panels, logos or fonts.

## 1. Concept in one line

**A black-and-white manga world, lit by blue and orange fire, where chess pieces become legends and carry you
to Abhishek's work.**

## 2. Visual language

### 2.1 Palette
| Token | Value | Use |
|---|---|---|
| `--ink` | `#0B0B0C` | Backgrounds, ink lines, the void |
| `--paper` | `#F2EEE6` | Type, white pieces, paper panels (warm cream, like Neuroform/Birkar) |
| `--grey-1..4` | `#1A1A1C` `#3A3A3E` `#8A8780` `#C9C4BA` | Screentone shading, secondary text |
| `--blue-fire` | `#3D7BFF` (core `#9CC2FF`) | Rim light, knight flames, HUD accents (Motive-style blue light) |
| `--orange-fire` | `#FF6A1A` (core `#FFC38A`) | Opposite rim light, sparks, embers |
| `--red-fire` | `#FF2E2E` | Knight flames (with blue), danger moments |
| `--gold` | `#FFC34D` | King's shockwave and crown only |
| `--glow-white` | `#FFFFFF` + bloom | Elephant glow, phoenix, queen of light |

Rule: the world is **ink and paper**; colour appears only as **light** (fire, glow, lightning, rim light).

### 2.2 Typography (all Google Fonts, licensed for web; final pick confirmed at M0)
| Role | Face | Notes |
|---|---|---|
| Giant display | **Big Shoulders Display** 900 | Condensed, Neuroform/Birkar scale (20–40 vw), used for WELCOME, the name, WHERE ARE YOU GOING? |
| Manga SFX / chapter titles | **Dela Gothic One** | Heavy, Japanese-manga energy, original font (not a series font) |
| Brush accents | **Yuji Boku** (or Yuji Syuku) | Brush-stroke words: "ドン" style SFX are written in Latin: "DOOM", "CRACK", "VRRM" |
| Body | **Inter** 400/600 | Short paragraphs only |
| HUD / data | **JetBrains Mono** 500 | Coordinates, loader readout, captions (Birkar/Neuroform HUD) |

### 2.3 Texture and finish (applied as post-processing; see ARCHITECTURE §4)
- **Ink outlines** on every 3D object (Sobel edge post-pass + inverted-hull for silhouettes).
- **Screentone** halftone dots in shadows (screen-space shader, dot size 3–6 px).
- **Speed lines** (radial and parallel) at moments of motion.
- **Film grain** (subtle, animated) over everything; **chromatic aberration** on fast motion only.
- **Bloom** only on emissive things (fire, glow, lightning). **Depth of field** for focus-pulls.
- **HUD layer** (from Birkar/Neuroform): corner crop marks, live X/Y cursor coordinates, `PLATE 01`-style labels,
  a status line bottom-left (`COMPILING ABHISHEK…`), bytes received bottom-right.

### 2.4 Motion principles
- Scroll drives everything (smooth scroll, scrub-linked timelines). Nothing autoplays except the loader and the
  transformations the visitor triggers.
- Easing: heavy ink feel — `expo.out` for arrivals, `power4.in` for wind-ups, overshoot only for impacts.
- Words arrive **one at a time** (Human.md): each word fades/slides up as you scroll.
- **Type masking** (Neuroform): giant type sits *behind* 3D objects; as objects pass, letters are covered and the
  type goes soft (DOF), then sharp again.
- Impacts get a 2–4 frame **white flash panel**, **screen shake** (max 6 px), and a manga **SFX word**.
- Reduced motion: every sequence has a calm version (crossfades, no shake, no flashes, no particles bursts).

## 3. Global layout
- Full-bleed black canvas, one WebGL scene behind DOM layers (ARCHITECTURE §3).
- Fixed HUD: top-left `ABHISHEK'S WORLD — PLATE nn` · top-right: Sound ◯ · Skip intro · Menu · bottom: status line.
- "Skip intro" always visible during §4.1–4.3 (jumps to the board).
- All sections have real DOM text (crawlable), styled as manga pages; WebGL is decoration and stage.

## 4. Storyboard

### 4.1 Loader — "Ignition" (0–~4 s, real progress)
- Black. A mono status line types: `LOADING ABHISHEK'S WORLD`.
- Across the screen, hand-drawn-looking chalk/ink strokes write equations he loves, each completing as real assets
  load: Euler's identity `e^{iπ}+1=0`, Maxwell `∇·E=ρ/ε₀`, Schrödinger `iħ∂ψ/∂t=Ĥψ`, gradient descent
  `θ←θ−η∇L`, softmax attention `softmax(QKᵀ/√d)V`, Einstein `E=mc²`.
- Thin orbit lines draw around a centre; dots (planets) ride them; stars fade in.
- HUD bottom-right shows **real** bytes received (`RECEIVED 2.4 MB`); bottom-left steps:
  `DOWNLOADING → COMPILING SHADERS → BUILDING BOARD → READY`.
- At 100%: equations get pulled into the centre, collapse into a **black hole** with an accretion ring (paper-white
  on ink, Birkar-like), a beat of silence, then a white flash.

### 4.2 Welcome
- From the flash: **WELCOME TO ABHISHEK'S WORLD** in giant Big Shoulders, starting **out of focus** and pulling into
  focus (Birkar focus ring with a `FOCUSING 0.84 M` HUD readout).
- Manga panel borders draw around the words; screentone fills the corners.
- Scroll cue: a small brush arrow and `SCROLL`.

### 4.3 Name
- Scroll: WELCOME breaks into ink splashes; **ABHISHEK RAI A** stamps in (impact SFX "DOOM", panel flash).
- Under it, one line, word by word: *Aspiring ML engineer · Mysuru · looking for ML internships*.
- Continue scrolling: the **board rises from below**, passing in front of the giant name. The letters are
  **masked** by the board and blur out (Neuroform), until only the board remains.

### 4.4 The Board
- A large board floating in the void, slight perspective, slow drift. Squares: polished ink stone and paper marble.
- All 32 pieces, **carved Indian chaturanga style** (ornate collars, lotus bases; knight has a horse head with a
  carved mane; rook is an elephant-topped tower; king/queen have temple-crown details). White = porcelain paper,
  black = obsidian ink. Ink outlines + screentone shading.
- Lighting: **blue rim light from the left, orange from the right** (Motive), soft fog.
- Six hero pieces stand forward on their squares with thin HUD leader lines:
  `♞ KNIGHT → ML + CHURN LAB`, `♜ ROOK → PRODUCTS`, … Hover/focus lifts the piece, brightens its rim, plays a
  soft chime (if sound on). Text cue: *Choose a piece. It knows the way.*
- Non-hero pieces are decorative.

### 4.5 Transformations (each 3–6 s; camera follows; ends at the section)
Common grammar: **(1) Awaken** — piece cracks, ink seeps out of the cracks, light leaks · **(2) Shatter** — the
carved shell bursts into ink shards and screentone dust · **(3) Emerge** — the creature (animated 3D model, ink
shader) steps out · **(4) Charge** — it travels along the "Where are you going?" line · **(5) Impact** — it hits
the section frame, SFX word, panel flash, the section opens.

| Piece | Creature | Signature effect | Camera | Sound (off by default) |
|---|---|---|---|---|
| ♞ Knight | Horse | **Red and blue flames** stream off mane, tail and hooves; flame trail lingers on the line; black void | Low tracking shot alongside, then whip-pan to the ML section | Hoofbeats, flame roar, neigh on impact |
| ♜ Rook | Giant **elephant**, white with glow | Each step **shatters the floor** (fracture plates fall into the void, dust); it rams the Products section frame, which cracks | Ground-level, heavy shake per step | Deep footfalls, stone cracking, trumpet |
| ♝ Bishop | **Garuda** eagle | Diagonal dive (bishop's move) through **lightning bolts**; feather-ink streaks | Top-down to dive POV | Thunder, wing beats, screech |
| ♟ Pawn | **Foot soldier** | Marches square by square to the last rank, then **promotes**: a column of light turns him into a radiant queen-figure (student → engineer) | Side scroll, then rising crane shot | Drum steps, choir swell |
| ♚ King | **Lion** with a crown of fire | Roar emits a **golden shockwave** ring that ripples the board and the type | Push-in to the face, then wide | Roar, low boom |
| ♛ Queen | **Phoenix** | Wings unfold; it bursts into **light rays in all directions** (queen moves anywhere), re-forms at Contact | Spiral orbit, then straight up | Whoosh, rising tone |

Reduced motion: piece glows, crossfade to the destination, no shards/shake/flash.
Phones/no-WebGL: the same cinematic as a pre-rendered video (ARCHITECTURE §6).

### 4.6 "WHERE ARE YOU GOING?" (site map — Birkar reference frames 1–4)
- One continuous paper-white line with chamfered corners snakes down the page, framing each word in turn:
  **WHERE** → **ARE** → **YOU** → **GOING?** (giant Big Shoulders), drawn as you scroll.
- Stage 2 ("a plane"): destination cards appear scattered along the line as manga panels (thumbnail art,
  title, one line, `ENTER →`). This is the navigation for all six destinations plus Ask, GitHub, Anime, Reviews.
- The creatures run **along this same line** in §4.5.

### 4.7 Destination sections (manga chapters; each opens with a full-width splash panel)
- **About (King)** — Origin as a 4–6 panel manga page: Mangaluru → Mysuru, maths first, B.E. AI & ML (GPA 9.44),
  Bluemind internship. Portrait rendered in an ink/halftone treatment (from `public/media/abhishek-portrait.jpg`).
- **ML + Churn Lab (Knight)** — splash: "THE MODEL RUNS HERE". The Churn Lab (existing logic in `src/lib/churn/*`)
  restyled as a manga control room: probability gauge as an ink dial, SHAP reasons as speed-line bars.
- **Products (Rook)** — the five main projects as **manga volume covers** (tilted 3D books, ink cover art from
  screenshots via halftone shader); click opens `/projects/$slug` styled as a chapter.
- **Algorithms (Bishop)** — sorting/binary-search side stories as animated ink diagrams (bars sorting in ink).
- **Skills + Résumé (Pawn)** — the pawn-to-queen promotion as a skill progression (B → A → S tiers), link to
  `/resume`.
- **Contact (Queen)** — phoenix feather frame, big "LET'S TALK", internship mail button, GitHub/LinkedIn/Instagram.
- **Ask Abhishek** — chat as manga speech bubbles; his replies in brush-lettered bubbles.
- **Live GitHub** — contributions as an **ink isometric city** of cubes (inspired by Xian's data story), repos as
  captions.
- **Breslau 1912** — easter egg after Contact (existing logic in `src/lib/chess/marshall.ts`).

## 5. Sub-pages (same language)
`/projects/$slug` (chapter layout), `/resume` (clean, printable, 2 A4 pages), `/anime` (shelf restyled as a
manga library), `/reviews` (reader letters page), `/thank-you`.

## 6. Mobile (< 900 px or no WebGL2)
Same order and text. Loader is 2D (SVG equations + orbits). Board is a high-quality still render with tappable
hotspots. Transformations play as muted, captioned **video** (sound only if toggled on). No section is removed.

## 7. Accessibility
Keyboard path through intro (Skip intro first in tab order), board (Tab through six hero pieces, Enter), sections.
Visible focus rings in `--blue-fire`. Reduced-motion versions everywhere. Text contrast ≥ 4.5:1 (paper on ink is
~17:1).

## 8. What must never happen (anti-goals)
- Looking like a template or a "dark mode portfolio with cards".
- Long paragraphs on the homepage (max ~25 words per text block).
- Fake loading bars, autoplaying sound, invented numbers, copied art or code, blocking content behind a game.

## 9. Look-dev gate (M0)
Before building M1, produce still frames (1440×900) of: loader, welcome, name, board, knight mid-gallop,
"Where are you going?". Send them to Abhishek; build only after approval.

## 10. References and what we take from each
| Site | Take |
|---|---|
| neuroformtech.com (`neuroform-*.jpg`) — **the favourite** | Giant condensed cream type on black; 3D objects passing in front of type that blurs; film grain; RGB split; HUD crop marks and coordinates |
| birkar.me (`birkar-*.jpg`) | Loader readouts (`DOWNLOADING/RECEIVED`), focus-pull intro, black hole, **"WHERE ARE YOU GOING?"** chamfered line framing each word, cards along the line |
| motiveone.com (`motive-frames.jpg`) | Cinematic dark scenes, **blue/orange** light, glowing lines tracing paths, scroll-driven flow |
| human-md.ai (`human-frames.jpg`) | Word-by-word scroll text, playful characters, confident colour blocks |
| xianzhaoduan.com/undergrad-vis (`xian-frames.jpg`) | A story told in acts, data as 3D cubes, calm editorial captions |
| bizar.ro | Creative-technologist ambition (WebGPU; could not be captured here) |
