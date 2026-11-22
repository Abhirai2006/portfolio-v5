# Portfolio v5: "The Réti Volume" — design

Status: draft for Abhishek's approval · 2026-11-22
Branch: `v5-redesign` (built on `improve/github-fallback-seo-mobile`, which holds the GitHub-403, share-image, sitemap and mobile-overflow fixes)

## 1. Intent

Abhishek Rai A (B.E. AI & ML, Mysore University, 5th semester, GPA 9.44) wants a portfolio that gets him
**shortlisted for ML engineering internships now**, building toward strong full-time ML roles after he
graduates in 2028. Impressing recruiters is the main job; showing his
personality is the side job. He feels the current site (v4) "looks AI-built": it stacks the effects every
template has right now (glow cards, magnifying dock, marquee, numbered chapters, cursor glow, 3D ring).

v5 must feel hand-made and unmistakably his. Three ideas he chose carry it:

1. **Chess** as the way you move through the site. He plays white and opens **1.Nf3** (Réti, intermediate level).
   His favourite game is **Levitsky vs Marshall, Breslau 1912**, ending in Marshall's queen move **…Qg3!!**.
2. **Manhwa / webtoon** as the visual language. His favourite is *The Beginning After the End* (TBATE):
   full colour, read by scrolling down one long strip.
3. **Live ML**: his real churn model, running in the visitor's browser, as the centrepiece. For an ML role this
   is worth more than any visual effect.

Other facts about him that may be used (all from him or the existing site): from Mangaluru, lives in Mysuru;
Tulu, Kannada, Hindi, English; loves maths most, then physics; draws; night owl; anime (One Piece favourite);
Bluemind Solutions internship (Aug–Sep 2026); DRISHTI CPS (IIT Indore) certification ongoing.

## 2. Goals, non-goals, anti-goals

**Goals**
- The site's ask is **ML internships now** (2026–27). It never states a salary or package figure anywhere:
  not in copy, metadata, structured data, `/llms.txt` or the chat context.
- A recruiter understands who he is, what he's built and how to contact him within **60 seconds**, without playing.
- A curious visitor gets an experience nobody else's portfolio has: his opening, his favourite game, his model.
- An ML interviewer finds real rigour: the real model, parity-tested; honest caveats; the threshold decision.
- Every page is fully readable by search engines and AI answer engines (SEO, GEO, AEO) on the current
  `portfolio.abhirai2006.workers.dev` address.
- All existing pages stay: home, case studies, résumé, reviews, anime shelf, thank-you, chat API, sitemap.

**Non-goals (this version)**
- His own hand-drawn art. Code-drawn art now; leave clear slots so his drawings can replace it later.
- A chess.com / Lichess feed. He has no account yet; leave a clear place to add one later.
- A custom domain (no budget yet). Plan for the move, don't do it.
- New databases or tables. Reuse what Supabase already has.

**Anti-goals (failure even if it "works")**
- Content locked behind the game. Nothing may require playing chess to reach.
- Any character, panel art, logo or font copied from One Piece, TBATE or any other work. Inspired by how a
  webtoon *reads*, never by what it *looks like*.
- Invented numbers. Every metric must trace to a source (section 9). Game prices in the Churn Lab are labelled
  illustrative.
- Implying the churn model is causal.
- Jank on a mid-range Android phone, or a homepage that is slow on Indian mobile data.
- Still looking like a template: if a section could be dropped into anyone's portfolio unchanged, redo it.

## 3. Constraints

- Stack stays: TanStack Start (React 19, TypeScript), Tailwind 4, Vite 8, Bun, Nitro → **Cloudflare Workers**
  (`wrangler` name `portfolio`, `keep_vars: true`). Deploy = push to `main`; Cloudflare runs `bun run build`.
- Abhishek pushes himself via GitHub Desktop. Deliver changed files; do not push to `main`.
- Server rendering must keep every word of content in the HTML (search engines, AI crawlers, no-JS).
- Cloudflare Workers free plan: keep per-request server work light; heavy work (model inference) runs in the browser.
- Security posture from v4 stays: CSP in `src/server.ts`, secrets only as Cloudflare Secrets, RLS on Supabase,
  same-origin + rate limits on `/api/chat`. Any new external host must be added to the CSP deliberately.
- Dark and light themes (existing toggle), `prefers-reduced-motion`, keyboard use, phone-first (360–430 px wide).

## 4. Approaches considered

| | Approach | Trade-off |
|---|---|---|
| **A (chosen)** | Rebuild everything visitors see inside the current app; keep the engine (routing, server functions, chat API, Supabase, Cloudflare setup). | Keeps the working deploy and SSR; must actively delete v4's template leftovers so the result isn't a reskin. |
| B | New repo from scratch | Cleanest, but chat, Supabase, reviews, anime shelf and deploy all rebuilt first; much slower for no recruiter-visible gain. |
| C | Restyle existing sections one by one | Fastest, but keeps the "AI-built" bones he wants gone. |

Abhishek picked **A**.

Within A, the churn model runs as the **real LightGBM trees exported to JSON and evaluated in TypeScript**,
with TreeSHAP for explanations. Rejected: ONNX Runtime Web (several MB of WebAssembly), hosting the Streamlit
app (sleeps, slow cold start, foreign look, iframe + CSP changes).

## 5. Experience

### 5.1 Homepage as one vertical strip

```
 ┌──────────────────────────────┐
 │ BOARD  ♘ 1.Nf3  (auto-played) │  name, role, 3 facts, [Résumé] [Hire me]
 │ "Your move." [d5][Nf6][c5][g6]│  "Skip to the work →" always visible
 ├──────────────────────────────┤
 │ CH.1 ORIGIN    (panels)       │  Mangaluru → Mysuru · maths → AI/ML
 ├──────────────────────────────┤
 │ CH.2 THE ARCS                 │  main arcs + side stories (5.3)
 ├──────────────────────────────┤
 │ CH.3 CHURN LAB  (live ML)     │  5.4
 ├──────────────────────────────┤
 │ CH.4 STAT SHEET (skills)      │  current S/A/B tiers, restyled
 ├──────────────────────────────┤
 │ CH.5 LIVE ACTIVITY            │  GitHub (fallbacks kept); slot for chess games later
 ├──────────────────────────────┤
 │ CH.6 ASK ABHISHEK (chat)      │  existing chat, restyled
 ├──────────────────────────────┤
 │ SIDE QUEST → /anime           │
 ├──────────────────────────────┤
 │ FINALE  Breslau 1912 · …Qg3!! │  visitor plays the queen move → contact opens
 └──────────────────────────────┘
```

### 5.2 Chess (hybrid entrance, then navigation)

- **Who plays what:** Abhishek is white, the visitor is black, all the way through.
- **Entrance:** on load the board animates **1.Nf3** (honours reduced motion: shown already played). Text:
  "Abhishek opens 1.Nf3. Your move." The visitor picks one of four natural replies (e.g. 1…d5, 1…Nf6, 1…c5,
  1…g6; builder's choice of exact set). Each reply jumps to a different chapter, and the board shows it played.
- **Never a gate:** the hero text, both CTAs and a "Skip to the work →" link are visible beside the board from
  the first paint; scrolling just scrolls. Esc dismisses any chess overlay.
- **Navigation after the entrance:** a small board stays docked (corner on desktop, bottom sheet on phone)
  and replaces v4's floating dock. Each chapter is a position in a short scripted game that continues the
  visitor's chosen reply in Réti style; scrolling into a chapter plays its move, tapping a move jumps there.
  The game text is a real, legal line (builder writes the 4 short lines; verify legality with a chess library).
- **Finale:** a flashback panel, "Breslau, 1912", sets up the real final position of Levitsky–Marshall. The
  visitor (black, as Marshall was) is invited to find the move. Hints after a wrong try; **…Qg3** reveals
  the contact section ("You found it. Now let's talk."). Contact details are also visible without solving.
  Builder must verify the game score and final position against a chess database before encoding it.
- **Pieces and board** are drawn in code in the site's ink style (no copied piece sets). Fully keyboard
  playable; every move has a text label; screen readers get the move list as text.

### 5.3 The Arcs (replaces the 3D ring)

Projects are episodes in a series. Each has a code-drawn **episode cover** (title, one-line hook, three
real numbers, a chess-piece type badge). Badges double as filters:
♞ ML · ♜ full-stack/product · ♝ algorithms · ♟ practice.

| Order | Episode | Type | Live | Code | Notes |
|---|---|---|---|---|---|
| Main 1 | Customer Churn Intelligence | ♞ | Churn Lab (on site) | telco-churn-intelligence-system | Link internship repo behind a flag (5.6) |
| Main 2 | MUSE Students Voice | ♜ | muse-studentsvoice.lovable.app | MUSE-Students-Voice | existing content |
| Main 3 | Arthra (with Tally prequel) | ♜ | arthrafin-7qakibfj.manus.space | arthra, tally-my-cents | "Tally came first, then Arthra" growth story; Tally has no live link |
| Main 4 | Ro-Bio | ♜ | ro-bio.hub-muse.workers.dev | Ro-Bio | **new**: student club site, 3D robot arm, robot-sumo game, walking mascot, 3D merch studio |
| Main 5 | Earth & Ethos | ♜ | portfolio.earth-and-ethos.workers.dev | earth-and-ethos | **new**: **paid client project**, architecture studio of Ar. Santhosh K S (client approved being named). Demo link; client's own domain not connected yet |
| Side | O(patience) | ♝ | existing | sorting-visualizer | |
| Side | Binary Search Visualizer | ♝ | existing | Binary_Search | |
| Side | Ittige | ♜ | existing | Ittige | |
| Side | Git & GitHub Viva Prep | ♜ | existing | git-and-GitHub | |
| Side | Lab programs (OS, DAA, graphs) | ♟ | — | IV-semester-lab-programs | **new**, small |
| Side | C++ Console Mini-Suite | ♟ | — | Console-mini-projects | |
| Side | Wonderland | ♜ | guest link | — (private) | keep existing privacy rules |

Excluded on purpose: **logbook** (Abhishek said no), forks, Portfolio-v2/v3, daily-code, older lab repos.

Opening an episode goes to `/projects/$slug`, restyled as a vertical episode: cover panel → problem → what
was built → trade-offs → outcome → screenshots → links. Existing case-study text in `src/lib/projects.ts` is
kept and extended; new episodes get the same structure.

### 5.4 Churn Lab (A + B + C)

One section with three tabs, all driven by the same in-browser model.

- **A · Score a customer:** controls for the 19 input columns (sensible grouping, defaults from a real median
  customer), live churn probability, at-risk/not at-risk against his chosen threshold, top SHAP reasons as a
  signed bar list.
- **B · Save the customer:** an at-risk customer drawn from the test set; a budget and a few retention
  "moves" (e.g. offer 1-year contract, add tech support, add online security, small discount) with
  **illustrative** costs; the model rescores after each move; the moves are presented as chess-like moves.
  A permanent note: "These are the model's predictions, not proven causes. A real retention team would
  A/B test an offer before rolling it out."
- **C · Pick the threshold:** a threshold slider over the **real held-out test-set predictions**: recall,
  precision, confusion counts, alerts per 100 customers, and monthly value using the README's assumptions,
  with the 35% retention-success figure visibly labelled as an assumption. A marker shows his chosen threshold.
- **Proof of honesty:** a short "How this runs" note: real LightGBM trees exported to JSON, evaluated in
  TypeScript, predictions checked against Python to within 1e-6 on the full test set.

### 5.5 Other pages and features (all kept, restyled into the same language)

- **Résumé** (`/resume`): stays print-friendly; add new projects; keep PDF link.
- **Reviews** (`/reviews`), **thank-you**, **anime shelf** (`/anime`): restyle chrome to match; anime shelf keeps its own 3D.
- **Ask Abhishek**: same API; update `RESUME_CONTEXT` / `PERSONAL_CONTEXT` in `src/routes/api/chat.ts` with Ro-Bio,
  Earth & Ethos (paid client), Tally→Arthra, chess (1.Nf3, Marshall 1912), TBATE, maths/physics. Keep boundaries.
- **Live activity**: keep the GitHub fallbacks built in the last change; leave a stub for a future chess account.
- **Command palette** (⌘K): keep, add chapters and episodes.
- **Visitor counter, analytics events**: keep.

### 5.6 Internship repo flag

`bluemind-ml-internship-2026` is private until the end of November 2026. A single boolean in project data
controls it: off → "Repo going public soon" text; on → real link. Abhishek flips it himself.

## 6. Visual system

- Original webtoon style: ink outlines, panel gutters, speech bubbles, speed lines, screentone dots, and a
  colour wash per chapter; full colour; works in dark and light.
- Art is SVG/CSS drawn in code. Every illustration lives in one place (`src/components/art/` or similar) with
  a documented slot so a hand-drawn image can replace it later.
- Remove v4 template signatures from the homepage: floating dock, marquee, magic-card glow, cursor glow,
  "Chapter 0X" headers, 3D hero scene, 3D project ring.
- Typography and palette are the builder's call, constrained by: readable body text, one display face with
  character, no fan-made copies of series fonts (drop `one-piece-font.ttf` from the main pages; the anime
  page may keep it if its licence allows, otherwise drop it too).

## 7. SEO, GEO and AEO on `*.workers.dev`

**Realistic target queries** (from searches run during design): plain "Abhishek Rai" is owned by established
people (a Databricks senior director, an NUS professor, an Ashoka economist, a filmmaker; `abhishekrai.com`
and `raiabhishek.com` are taken), so don't chase it. Win the uncrowded ones: "Abhishek Rai A", "Abhishek Rai A
Mysuru", "Abhishek Rai A machine learning", "Abhishek Rai Mysore University AI ML", and the project names.

**On-site**
- Every page: unique title and description, canonical, share image (done in the last change), headings in order.
- Structured data: `ProfilePage` + `Person` on home (`sameAs`: GitHub, LinkedIn, Instagram; chess later);
  `CreativeWork`/`SoftwareSourceCode` per episode with `author`; `BreadcrumbList` on episodes.
- A plain-text **"Quick facts"** block on home and résumé that answers "Who is Abhishek Rai A?" in short
  factual sentences (AEO/GEO engines quote these).
- `/llms.txt` summarising who he is and linking the key pages.
- `robots.txt` allows search and AI crawlers. **Abhishek must check** Cloudflare's "Block AI bots" /
  managed robots.txt setting is off for this Worker, or AI engines can't read the site.
- Performance: no 3D on the homepage, lazy-load the Churn Lab, images sized and lazy, fast first paint on 4G.

**Off-site (Abhishek, with a checklist the builder writes into the README)**
- Google Search Console: submit `/sitemap.xml` (verification tag already in place). Bing Webmaster Tools too
  (Bing's index feeds ChatGPT search and Copilot).
- Point each repo's "Website" field at its episode page; link the portfolio from his GitHub profile README and LinkedIn Featured.
- Same facts, same wording, everywhere (site, GitHub bio, LinkedIn headline).

**Later, with a domain:** set `VITE_SITE_URL`, 301-redirect every `workers.dev` path to the same path on the
new domain from the Worker, re-submit the sitemap. The workers.dev rankings carry over through the redirects.

## 8. Decided by Abhishek (as decided)

- Approach A; chess hybrid (C); Churn Lab A+B+C; keep every existing page, modify freely; replace the 3D ring.
- He plays white, 1.Nf3; ending is Levitsky–Marshall 1912 …Qg3!!.
- Recruiters first, personality second; ask for ML internships now; no salary figure anywhere.
- Code-drawn art for now; his drawings later.
- Include Ro-Bio, Earth & Ethos (paid, client approved), Tally (as Arthra's prequel). Exclude logbook.
- Internship repo added behind a flag until it's public.
- Stay on workers.dev for now. Launch everything together, as soon as possible.

## 9. Sources of truth for facts and numbers

`src/lib/projects.ts`, `src/routes/api/chat.ts` (contexts), each project's GitHub README, the churn repo's
notebooks and model files, the live sites, and this design. **If a number isn't in one of these, don't show it.**
New episodes without published numbers use descriptive facts instead of metrics until Abhishek supplies them.

## 10. Left to the builder

Exact palette, fonts, panel layouts and motion; the four reply lines in the chess game; chess library choice;
how to export and test the model (Python environment, versions pinned from the churn repo's requirements);
which v4 components and dependencies to delete; copy-writing within the facts in section 9; file layout.

## 11. Reviewer questions, resolved

A builder read this design cold and asked six questions. Resolutions:

1. **Model source and publishing.** The trained pipeline (`app/churn_model.pkl`) and threshold
   (`app/model_meta.pkl`) are already public in `Abhirai2006/telco-churn-intelligence-system`; the data is IBM's
   public Telco dataset. Exporting that same public model to JSON publishes nothing new. The private
   internship repo is not needed. *(Design call.)*
2. **Numbers.** The README already publishes the test-set figures: test ROC-AUC 0.847, 82% churner recall at
   the threshold in `model_meta.pkl`, ~$42.7k monthly revenue at risk, ~$15k/month (~$179k/year) recoverable
   at an assumed 35% success rate; 0.849 is the **cross-validated** ROC-AUC and must stay labelled as CV.
   The lab must reproduce these from the exported model. If it can't, that's an export bug: stop and report
   to Abhishek rather than changing any published number. *(Design call.)*
3. **What the site asks for:** internships now; no salary anywhere. *(Abhishek.)* Use the "Internship"
   template in `src/lib/contact.ts` for the main "Hire me" button.
4. **Deadline:** none fixed ("I have time; launch everything together, as soon as possible"). Plan for the full
   scope. *(Abhishek.)*
5. **Delivery:** v5 deletes files and changes `bun.lock`, which a changed-files zip can't carry. Deliver a zip
   of the whole repo (no `.git`) with instructions: in the local clone, delete everything except `.git`, extract
   the zip in its place, then commit in GitHub Desktop (deletions then show up correctly). *(Design call; Abhishek
   may ask for a branch/PR instead.)*
6. **Earth & Ethos permission:** Abhishek was asked about the studio's name, screenshots and demo link
   together and said the client is okay with it. The code link is included because Abhishek already
   made that repo public himself. *(Design call; flagged for Abhishek to confirm.)*

## 12. Amendment (2026-11-22, from Abhishek during the build)

1. **Palette:** keep v4's navy and electric blue with white and black. Every webtoon wash, outline and board square
   is a blue tint; red stays only for "at risk" in the Churn Lab.
2. **The chess board is the main board**, a realistic 3D section at the top of the homepage (replaces §5.2's
   docked side board and scripted reply lines):
   - Abhishek (white) has opened 1.Nf3; the visitor plays black. **The piece the visitor moves decides where the
     site goes:** ♞ knight → ML work and the Churn Lab · ♜ rook → products (Arcs, filtered) · ♝ bishop → algorithms
     (Arcs, filtered) · ♟ pawn → skills and résumé · ♚ king → origin · ♛ queen → contact.
   - After each visitor move, white answers (a simple engine), then the page travels to the destination.
   - A floating "♞ Back to the board" button returns to the board; the game continues where it was (kept for the
     browser session). Game over offers a fresh game.
   - Hovering or focusing a piece shows its destination; a legend beside the board lists all six as plain links, so
     every destination is reachable without playing, without JS and by keyboard.
   - three.js loads after first paint. No-WebGL, reduced-motion and no-JS visitors get the 2D board with the same
     rules. Page scroll is never captured: no zoom-on-scroll, and no rotate on touch screens.
   - The Breslau 1912 finale (§5.2) stays as it is.
