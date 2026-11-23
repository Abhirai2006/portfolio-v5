# CONTENT — words and facts

## 1. Sources of truth (never invent beyond these)
| What | File |
|---|---|
| Bio facts (name, role, university, GPA, languages, links) | `src/lib/facts.ts` (`PERSON`, `QUICK_FACTS`) |
| Projects: titles, hooks, metrics, case studies, links, screenshots | `src/lib/projects.ts` |
| Churn model numbers (test ROC-AUC 0.847, CV 0.849, 82% recall at threshold 0.485, 579 of 1,409 flagged) | `ml/README.md`, `src/data/churn/*` |
| Personal notes, interests, boundaries (for Ask Abhishek) | `src/lib/assistant-context.ts` |
| Skills tiers | below (§4) |
If a number isn't in these, it doesn't go on the site. **No salary, package or LPA figure, ever.**

## 2. Voice
Short. Confident. A little playful. Third person in captions ("Abhishek builds…"), first person only in quotes.
Max ~25 words per text block on the homepage. Plain words; no buzzwords.

## 3. Copy deck (draft; Abhishek approves at M0/M1)
| Where | Copy |
|---|---|
| Loader status | `LOADING ABHISHEK'S WORLD` → `DOWNLOADING` → `COMPILING SHADERS` → `BUILDING BOARD` → `READY` |
| Welcome | **WELCOME TO ABHISHEK'S WORLD** |
| Name | **ABHISHEK RAI A** · *Aspiring ML engineer · Mysuru · looking for ML internships* |
| Board cue | *Choose a piece. It knows the way.* |
| Hero piece labels | `♞ KNIGHT → ML + CHURN LAB` · `♜ ROOK → PRODUCTS` · `♝ BISHOP → ALGORITHMS` · `♟ PAWN → SKILLS + RÉSUMÉ` · `♚ KING → ABOUT` · `♛ QUEEN → CONTACT` |
| Map | **WHERE ARE YOU GOING?** |
| ML splash | **THE MODEL RUNS HERE.** His Bluemind capstone, live in your browser. |
| Products splash | **FIVE VOLUMES.** Products with real users, real tests and one paid client. |
| Algorithms splash | **ALGORITHMS, DRAWN.** |
| Skills splash | **FROM PAWN TO QUEEN.** |
| About splash | **ORIGIN.** Mangaluru → Mysuru. Maths first. |
| Contact splash | **LET'S TALK.** Looking for ML internships. |
| Quote (existing, his) | "Building cool stuff, one algorithm at a time." |
| Honesty line (keep) | The ML and algorithm work is his; the web layer is built with AI as a copilot, and he says so. |

## 4. Skills tiers (from the current site)
- S (proficient): Python, NumPy, Pandas, Scikit-learn (Pipelines, ColumnTransformer, CV), Git, Linear Algebra, Calculus
- A (intermediate): XGBoost, LightGBM, Matplotlib / Seaborn, Streamlit, SQL, DSA, Probability & Statistics
- B (learning): PyTorch, FastAPI, Discrete Mathematics

## 5. Contact
Internship mail template: `src/lib/contact.ts` (`mailto("internship")`). Links: `PERSON.github`,
`PERSON.linkedin`, `PERSON.instagram`.

## 6. Placeholders to fill
| Placeholder | Where | What |
|---|---|---|
| `<RESUME_PDF_URL>` | `src/routes/resume.tsx` (`PDF` constant) | Keep the current Google Drive link or replace |
| `bluemind-ml-internship-2026` repo visibility | `src/lib/projects.ts` → `pendingRepo.isPublic` | Set `true` when the repo is public |
