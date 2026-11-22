<div align="center">

# Abhishek Rai A

**Aspiring Machine Learning Engineer**<br>
B.E. in AI & ML, Mysore University · Mysuru, India

[![Live site](https://img.shields.io/badge/live-portfolio.abhirai2006.workers.dev-0ea5e9?style=for-the-badge)](https://portfolio.abhirai2006.workers.dev/)
&nbsp;
![Hosted on Cloudflare Workers](https://img.shields.io/badge/hosted_on-Cloudflare_Workers-f38020?style=for-the-badge)

[**Live site**](https://portfolio.abhirai2006.workers.dev/) ·
[Projects](https://portfolio.abhirai2006.workers.dev/#projects) ·
[Anime shelf](https://portfolio.abhirai2006.workers.dev/anime) ·
[Résumé](https://portfolio.abhirai2006.workers.dev/resume) ·
[Reviews](https://portfolio.abhirai2006.workers.dev/reviews)

<br>

<img src="docs/screenshots/01-hero.png" alt="Home page of the portfolio" width="880">

</div>

<br>

## Contents

[Overview](#overview) · [Highlights](#highlights) · [Preview](#preview) · [Projects](#projects) · [How it fits together](#how-it-fits-together) · [What it runs on](#what-it-runs-on) · [Getting started](#getting-started) · [Database](#database) · [Deploying](#deploying) · [Scripts](#scripts) · [Project structure](#project-structure) · [Security](#security) · [Contact](#contact)

## Overview

This is my personal portfolio. It shows the projects I have built, my résumé and my GitHub activity, and it has a small assistant that answers questions about my background so a recruiter does not have to dig through links. There is also a side page with every anime I have finished, because it is a big part of how I spend my free time.

I wrote the ML and algorithm projects myself. The web side of this site was built with AI tools as a copilot, so I list its stack below as what the code uses, not as skills I am claiming.

## Highlights

v5, "The Réti Volume": a webtoon-style strip in navy and electric blue, navigated by chess.

| | |
| --- | --- |
| **The main board** | A real 3D chess board (three.js, everything generated in code). Abhishek opens 1.Nf3; you play black, and the piece you move decides where the site takes you: knight → ML and the Churn Lab, rook → products, bishop → algorithms, pawn → skills and résumé, king → about, queen → contact. The room goes dark and a spotlight follows the move. "Back to the board" returns, and the game continues. A 2D board takes over without WebGL or with reduced motion. |
| **Churn Lab** | The real LightGBM model from the Bluemind internship, exported to JSON and run in the browser with SHAP explanations. It matches the Python model within 0.000001 on all 1,409 test customers. Score a customer, try to save one, or move the alert threshold. |
| **The Arcs** | Projects as webtoon episodes: main arcs (Churn, MUSE, Arthra with its Tally prequel, Ro-Bio, Earth & Ethos, a paid client project) and side stories. |
| **The finale** | Levitsky vs Marshall, Breslau 1912: find Marshall's ...Qg3!! to open the contact section. |
| **Ask Abhishek** | A chat assistant that only knows his résumé, projects and notes he wrote. |
| **Live GitHub activity** | Cached for 10 minutes; if GitHub rate-limits the server, the last good copy is kept, then the browser asks GitHub directly. |
| **Search and AI engines** | Server-rendered text, per-page titles and descriptions, ProfilePage + Person and per-project structured data, a sitemap built from the project list, `/llms.txt`, and a `robots.txt` that welcomes search and AI crawlers. |

## Preview

<table>
  <tr>
    <td align="center"><img src="docs/screenshots/04-projects.png" alt="Projects on a rotating ring"><br><sub>The Arsenal: projects on a ring you can spin</sub></td>
    <td align="center"><img src="docs/screenshots/09-project-modal.png" alt="A project opened with its screenshots"><br><sub>Click a card to open it</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/screenshots/02-power-levels.png" alt="Skills section"><br><sub>Skills and how well I know them</sub></td>
    <td align="center"><img src="docs/screenshots/03-live-code.png" alt="Live GitHub activity"><br><sub>Live GitHub activity</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/screenshots/06-ask.png" alt="Ask Abhishek chat"><br><sub>Ask Abhishek, the résumé-only assistant</sub></td>
    <td align="center"><img src="docs/screenshots/05-anime.png" alt="Anime shelf entry card"><br><sub>The way into the anime shelf</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/screenshots/07-mobile-hero.png" alt="Phone view" width="260"><br><sub>On a phone</sub></td>
    <td align="center"><img src="docs/screenshots/08-contact.png" alt="Contact section"><br><sub>Contact</sub></td>
  </tr>
</table>

## Projects

Every project has a full case study on the site: the problem, the constraints, what was built, the trade-offs and the outcome.

| Project | What it is | Links |
| --- | --- | --- |
| **Customer Churn Intelligence System** | Capstone of my Bluemind Solutions AI/ML internship. An end-to-end tabular ML system on the IBM Telco churn data with leak-free preprocessing, model comparison and stratified 5-fold cross-validation. ROC-AUC 0.849, 82% churner recall. | [Case study](https://portfolio.abhirai2006.workers.dev/projects/customer-churn-intelligence-system) |
| **MUSE Students Voice** | A USN-verified anonymous grievance platform. Peer-voted complaints escalate automatically into formal PDF letters. | [Live](https://muse-studentsvoice.lovable.app/) · [Case study](https://portfolio.abhirai2006.workers.dev/projects/muse-students-voice) |
| **Arthra** | Personal finance for India: INR stored as integer paise, April to March financial years, shared Expense Spaces and read-only report links. 60 automated tests. | [Live](https://arthrafin-7qakibfj.manus.space) · [Code](https://github.com/Abhirai2006/arthra) · [Case study](https://portfolio.abhirai2006.workers.dev/projects/arthra) |
| **Ittige** | A scroll-driven site for our team's plastic-to-paver business plan in Mysuru, with honest cost numbers. | [Live](https://ittige.vercel.app/) · [Code](https://github.com/Abhirai2006/ittige) · [Case study](https://portfolio.abhirai2006.workers.dev/projects/ittige) |
| **Git & GitHub Viva Prep** | A study site for our Git lab viva: flashcards, a quiz, a debugging drill and a command cheat sheet. | [Live](https://git-github-by-abhirai2006.netlify.app/) · [Code](https://github.com/Abhirai2006/git-and-GitHub) · [Case study](https://portfolio.abhirai2006.workers.dev/projects/git-github-viva-prep) |
| **O(patience)** | An interactive sorting visualizer built to make algorithm behaviour easy to see. | [Live](https://sort-visually-abhirai2006.lovable.app/) · [Case study](https://portfolio.abhirai2006.workers.dev/projects/o-patience) |
| **Binary Search Visualizer** | A plain-JavaScript visualizer that shows the range narrowing step by step. | [Live](https://binarysearch-abhirai.netlify.app/) · [Case study](https://portfolio.abhirai2006.workers.dev/projects/binary-search-visualizer) |
| **C++ Console Mini-Suite** | Tic-Tac-Toe, a mini banking system and Rock-Paper-Scissors, built to practise OOP and input handling. | [Case study](https://portfolio.abhirai2006.workers.dev/projects/cpp-console-suite) |
| **Wonderland** | A birthday website I made as a personal gift. It is private, so the site shows a guest view only. | [Case study](https://portfolio.abhirai2006.workers.dev/projects/wonderland) |

## How it fits together

```mermaid
flowchart TD
    V(["Visitor"]) --> W["Cloudflare Worker<br/>server rendering and security headers"]
    W --> PAGES["Pages: home, anime, resume, reviews, project case studies"]
    W --> API["Server code: chat, anime functions, image proxy"]

    PAGES -->|"reviews, visitor count, page events"| DB1[("Supabase<br/>portfolio database")]
    PAGES -->|"recommendations and votes"| DB2[("Supabase<br/>anime database")]
    PAGES -->|"live activity, cached 10 min"| GH["GitHub API"]

    API -->|"chat replies, mood picks"| AI["Gemini API"]
    API -->|"search and cover art"| KI["Kitsu catalogue"]
    API --> DB2
```

What happens when someone asks the chat a question:

```mermaid
sequenceDiagram
    participant B as Browser
    participant W as Worker
    participant G as Gemini
    B->>W: POST /api/chat
    W->>W: same-origin check
    W->>W: rate limit and input checks
    W->>G: question plus résumé context
    alt Gemini is busy
        W->>G: retry once, then a lighter model
    end
    G-->>W: streamed reply
    W-->>B: typed out on screen
```

## What it runs on

| Part | What the code uses |
| --- | --- |
| App | TanStack Start with React and TypeScript |
| Styling | Tailwind CSS 4 |
| 3D | Three.js |
| Database | Supabase (Postgres with row level security) |
| Chat and mood picks | Gemini API, called from the server |
| Hosting | Cloudflare Workers, built with Bun and Vite |

## Getting started

You need [Bun](https://bun.sh).

```bash
bun install
cp .env.example .env   # then fill it in
bun run dev
```

The dev server runs at http://localhost:8080.

### Environment variables

| Variable | Used for |
| --- | --- |
| `VITE_SITE_URL` | Public site address with no trailing slash. Used for canonical and share tags. |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` | Public Supabase values, built into the page. |
| `VITE_ANIME_SUPABASE_URL`, `VITE_ANIME_SUPABASE_PUBLISHABLE_KEY` | The database that holds the anime recommendations. |
| `AI_API_KEY` | Gemini key for the chat and mood picks. **Secret, server only.** |
| `AI_MODEL`, `AI_FALLBACK_MODEL` | Optional. Default to `gemini-flash-latest` and `gemini-flash-lite-latest`. |
| `AI_BASE_URL` | Optional. Points the chat at an OpenAI-compatible provider instead of Gemini. |
| `GITHUB_TOKEN` | Recommended. Without it the Worker shares GitHub's 60-requests-an-hour limit with everything else on Cloudflare's IPs, so the live activity section falls back to fetching from the visitor's browser. A fine-grained token with no permissions is enough. **Secret.** |

Only public values go in `.env`. Secrets such as `AI_API_KEY` are added in Cloudflare as Secrets and are never committed.

## Database

Reviews, the visitor counter and anonymous page events live in Supabase. To set up your own copy, create a project, open the SQL editor and run `supabase/setup.sql` once. The same steps are split into single files in `supabase/migrations/`.

Visitors can read and add rows. They cannot edit or delete anything. Details are in [SECURITY.md](SECURITY.md).

## Deploying

The site runs on Cloudflare Workers and rebuilds on every push to `main`.

| Setting | Value |
| --- | --- |
| Build command | `bun run build` |
| Deploy command | `npx wrangler deploy` |
| Worker name | `portfolio` (set in `vite.config.ts`, it has to match the dashboard) |

Cloudflare keeps two separate lists of variables:

- **Settings, Build, Variables and secrets** is for build-time values: `VITE_SITE_URL` and the `VITE_SUPABASE_*` ones.
- **Settings, Variables and Secrets** is for what the running site reads: `AI_API_KEY` (add it as a **Secret**), `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`.

If the chat says "AI is not configured yet", the key is in the wrong list.

## Search Console, Bing and AI engines (one-time, by hand)

1. Google Search Console → the `portfolio.abhirai2006.workers.dev` property (the verification tag is already on the site) → Sitemaps → submit `sitemap.xml`.
2. Bing Webmaster Tools → import from Search Console → submit the sitemap. Bing's index feeds ChatGPT search and Copilot.
3. Cloudflare → this Worker → make sure no "Block AI bots" / managed robots.txt setting is on.
4. On GitHub, set each project repo's "Website" field to its episode page (`/projects/<slug>`), and link the portfolio from the profile README and LinkedIn Featured.
5. Keep the same facts in the same words everywhere (site, GitHub bio, LinkedIn headline).
6. When the internship repo goes public, set `pendingRepo.isPublic` to `true` for the churn project in `src/lib/projects.ts`.

## Scripts

| Command | What it does |
| --- | --- |
| `bun run dev` | Starts the dev server. |
| `bun run build` | Builds the Worker and the static files. |
| `bun run lint` and `bun run format` | Checks and formats the code. |
| `bun run test` | Unit tests: chess lines, the Marshall finale, the board's engine, churn model parity with Python, metrics, the save-the-customer game, project data, SEO output. |
| `bun run smoke -- --base http://127.0.0.1:8080` | Opens every page at 4 widths in both themes and without JavaScript: no errors, no sideways scroll, no broken images, required text present, unique titles, valid structured data, the board → Lab → back flow, the finale, and a 2-page résumé print. |
| `node scripts/capture-projects.mjs` | Takes dark and light screenshots of the live project sites into `public/media/live/`. It works out whether a site has two themes, checks brightness so they are never swapped, and hides host badges. Add `--only <name>` for one site. |
| `node scripts/screenshots.mjs <url>` | Retakes the README images in `docs/screenshots/` from a running copy of the site. |
| `node scripts/og-cover.mjs` | Renders the 1200×630 link-preview image into `public/media/og-cover.jpg` from the portrait and the project count. Rerun it when the numbers on it change. |
| `node scripts/fetch-assets.mjs` | Downloads the share image and older project screenshots from my previous site, once. |

Project screenshots are named `<project>-<number>-dark.jpg` and `<project>-<number>-light.jpg`, or `<project>-<number>.jpg` for sites with a single theme. A missing file is skipped, so nothing breaks while they are added.

## Project structure

```
.
├── src/
│   ├── routes/          Pages (home, anime, resume, reviews, case studies) and API routes
│   ├── components/
│   │   ├── portfolio/   Home page sections: hero, project ring, chat, GitHub activity
│   │   ├── anime/       The anime shelf
│   │   ├── motion/      Shared motion helpers
│   │   └── ui/          Base UI components
│   ├── lib/             Project data, server functions, abuse guards, helpers
│   ├── data/            The anime collection
│   ├── server.ts        Response wrapper and security headers
│   └── styles.css       Theme and design tokens (anime.css holds the shelf styles)
├── supabase/            Migrations and a one-file setup script
├── public/              Static files and media, including project screenshots
├── scripts/             Screenshot and media tools
├── docs/screenshots/    Images used in this README
├── SECURITY.md          What is public, what is secret, and how writes are locked down
└── vite.config.ts       Build settings and the Cloudflare Worker config
```

## Security

- Secrets live only in Cloudflare as Secrets. The built files were scanned for keys and none were found.
- Every table has row level security. Visitors can add reviews and recommendations but cannot change or delete anything.
- The chat and anime endpoints check the request origin, validate input and limit how often one visitor can call them.
- The image proxy only fetches raster images from the anime catalogue host and does not follow redirects.
- Every response carries a content security policy and the usual protective headers.

The full list, and what to do if a key leaks, is in [SECURITY.md](SECURITY.md).

## Contact

Looking for internships. Available for interviews.

[Email](mailto:abhirai2006@gmail.com) · [GitHub](https://github.com/Abhirai2006) · [LinkedIn](https://www.linkedin.com/in/abhishek-rai-a-00067238b/) · [Portfolio](https://portfolio.abhirai2006.workers.dev/)

<br>

<div align="center">

Made by Abhishek Rai A in Mysuru, India.

</div>
