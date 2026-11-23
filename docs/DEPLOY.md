# DEPLOY — from this zip to a live site

Hosting: **Cloudflare Workers** (free). Code: **GitHub**, pushed with **GitHub Desktop**.

## 1. Put the code on GitHub (first time)
1. Unzip. You get a folder (e.g. `abhishek-world`).
2. GitHub Desktop → **File → Add local repository** → choose the folder → when asked, **create a repository** →
   commit everything ("Starter: Abhishek's World").
3. **Publish repository** (pick the name; public is fine — no secrets are in the code).

## 2. Connect it to Cloudflare Workers
1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Import a repository** → pick the GitHub repo.
   (If the Worker already exists, open it → **Settings → Build** → connect the repo.)
2. Settings:
   - **Worker name**: must match `vite.config.ts` → `CF_WORKER_NAME` (default `portfoli0`). If your Worker has a
     different name, either rename it or set a **build variable** `CF_WORKER_NAME=<your-worker-name>`.
   - **Build command**: `bun run build`
   - **Deploy command**: `npx wrangler deploy`
   - **Branch**: `main`
3. **Build variables** (Settings → Build → Variables and secrets), public values:
   | Name | Value |
   |---|---|
   | `VITE_SITE_URL` | `https://<your-worker-name>.<your-subdomain>.workers.dev` (no trailing slash) |
   | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` | from `.env` (public keys) |
   | `VITE_ANIME_SUPABASE_URL`, `VITE_ANIME_SUPABASE_PUBLISHABLE_KEY` | from `.env` (public keys) |
   | `CF_WORKER_NAME` | only if your Worker isn't named `portfoli0` |
4. **Runtime variables and secrets** (Settings → Variables and Secrets):
   | Name | Type | Value |
   |---|---|---|
   | `AI_API_KEY` | **Secret** | your Gemini API key (for Ask Abhishek) |
   | `GITHUB_TOKEN` | **Secret** | a fine-grained GitHub token with no permissions (raises the rate limit) |
   | `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` | Text | same as the VITE_ ones |
5. Deploy. Open `https://<your-worker-name>.<your-subdomain>.workers.dev`.

If Ask Abhishek says "AI is not configured", `AI_API_KEY` is in the wrong list (it must be a runtime **Secret**).

## 3. Every update after that
Edit/unzip new files into the same folder → GitHub Desktop → commit → **Push origin** → Cloudflare rebuilds.
If a new zip **removes** files, delete everything in the folder except the hidden `.git` folder first, then unzip,
so deletions are picked up.

## 4. Database (only if you use new Supabase projects)
Supabase → SQL editor → run `supabase/setup.sql` once (reviews, visitor counter, events).
The anime recommendations live in a separate project; see `SECURITY.md`.

## 5. Local development (optional)
Install [Bun](https://bun.sh), then:
```bash
bun install
bun run dev        # http://localhost:8080
bun run test       # unit tests
bun run build      # production build
```

## 6. Later: custom domain
Buy a domain → Cloudflare → Worker → **Settings → Domains & Routes → Add custom domain** → set `VITE_SITE_URL`
and the sitemap line in `public/robots.txt` to the new domain → redeploy → re-submit the sitemap. Keep the
workers.dev address redirecting (a 301 in `src/server.ts`) so rankings carry over.
