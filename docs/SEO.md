# SEO, AEO and GEO

**SEO** = rank in Google/Bing. **AEO** (answer engines) and **GEO** (generative engines) = get ChatGPT, Perplexity,
Gemini, Claude and Copilot to describe Abhishek correctly. All three need the same thing: **clear, consistent,
crawlable facts.** A WebGL-heavy site is invisible to crawlers unless the text is in the server HTML.

## 1. Realistic targets
"Abhishek Rai" alone is owned by established people (a Databricks director, an NUS professor, an economist,
a filmmaker). Win the uncrowded queries:
- "Abhishek Rai A", "Abhishek Rai A Mysuru", "Abhishek Rai A machine learning",
  "Abhishek Rai Mysore University AI ML", and each project name (MUSE Students Voice, Arthra, Ro-Bio,
  Earth & Ethos, O(patience), Ittige…).

## 2. Already built (keep working)
- Server-rendered pages (TanStack Start SSR); `<title>` + description unique per page.
- `ProfilePage` + `Person` JSON-LD on `/` (`src/lib/seo.ts`); `CreativeWork`/`SoftwareSourceCode` +
  `BreadcrumbList` on episodes.
- `/sitemap.xml` generated from `src/lib/projects.ts`; `/llms.txt` for AI engines; `public/robots.txt` allows
  Googlebot, Bingbot, GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, PerplexityBot, Google-Extended.
- Quick facts (`QUICK_FACTS`) in plain sentences: the lines AI engines quote.

## 3. Rules for the new design
1. Every section's words exist in DOM text on the server (check with JS disabled). Canvas is `aria-hidden`.
2. One `<h1>` per page (the name on `/`), headings in order, descriptive link text ("Read the Arthra episode").
3. Images: real `alt`, width/height set, lazy below the fold. Videos: `title`, captions, poster.
4. No content only inside WebGL, only on hover, or only after a cinematic.
5. Keep Core Web Vitals healthy: LCP is the SSR text, not the 3D; 3D loads after first paint.
6. Update `public/robots.txt` sitemap line and `VITE_SITE_URL` if the address changes.

## 4. One-time setup (Abhishek, after the first deploy)
1. **Google Search Console** → add the property for the site URL → verify (HTML tag; put the code in
   `src/routes/__root.tsx` `google-site-verification`) → **Sitemaps** → submit `sitemap.xml`.
2. **Bing Webmaster Tools** → import from Search Console → submit the sitemap (Bing feeds ChatGPT search and
   Copilot).
3. Cloudflare → Worker → make sure no "Block AI bots"/managed robots.txt option is enabled.
4. GitHub: set each project repo's **Website** field to its episode page; add the portfolio link to the profile
   README and bio. LinkedIn: add the site to *Featured* and *Contact info*.
5. Use the **same facts in the same words** everywhere (site, GitHub bio, LinkedIn headline).

## 5. Checks before launch
Lighthouse SEO 100 on `/`, `/resume`, one episode · Rich Results Test passes for `/` · `curl` of `/` contains the
name, role, quick facts and project names · `/llms.txt` and `/sitemap.xml` return 200.
