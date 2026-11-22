import { createServerFn } from "@tanstack/react-start";
import {
  GH_USER,
  shapeGithub,
  type GhProfile,
  type GhRepo,
  type GithubResult,
} from "./github-shape";

// Per-isolate cache. Fresh for 10 minutes; after that a failed refresh (403/429 from GitHub's
// unauthenticated limit on shared Cloudflare IPs) keeps serving the last good copy instead of an error.
const cache = new Map<string, { at: number; data: unknown }>();
const TTL = 10 * 60 * 1000;

async function ghFetch<T>(path: string): Promise<T> {
  const key = `gh:${path}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.data as T;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "abhishek-portfolio",
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  try {
    const res = await fetch(`https://api.github.com${path}`, { headers });
    if (!res.ok) throw new Error(`GitHub ${res.status}`);
    const data = (await res.json()) as T;
    cache.set(key, { at: Date.now(), data });
    return data;
  } catch (e) {
    if (hit) return hit.data as T;
    throw e;
  }
}

export const getGithubData = createServerFn({ method: "GET" }).handler(
  async (): Promise<GithubResult> => {
    try {
      const [profile, repos] = await Promise.all([
        ghFetch<GhProfile>(`/users/${GH_USER}`),
        ghFetch<GhRepo[]>(`/users/${GH_USER}/repos?per_page=100&sort=updated`),
      ]);
      return shapeGithub(profile, repos);
    } catch (e) {
      return { ok: false as const, error: (e as Error).message };
    }
  },
);
