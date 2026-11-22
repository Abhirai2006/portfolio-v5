// Shared by the server function and the in-browser fallback, so both return the same shape.

export const GH_USER = "Abhirai2006";

export type GhRepo = {
  name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  fork: boolean;
  updated_at: string;
};

export type GhProfile = {
  login: string;
  name: string | null;
  avatar_url: string;
  public_repos: number;
  followers: number;
  bio: string | null;
};

export function shapeGithub(profile: GhProfile, repos: GhRepo[]) {
  const nonFork = repos.filter((r) => !r.fork);
  const top = [...nonFork]
    .sort(
      (a, b) =>
        b.stargazers_count - a.stargazers_count ||
        +new Date(b.updated_at) - +new Date(a.updated_at),
    )
    .slice(0, 6)
    .map((r) => ({
      name: r.name,
      url: r.html_url,
      description: r.description,
      stars: r.stargazers_count,
      language: r.language,
      updated: r.updated_at,
    }));

  const langMap = new Map<string, number>();
  for (const r of nonFork)
    if (r.language) langMap.set(r.language, (langMap.get(r.language) ?? 0) + 1);
  const totalLang = Array.from(langMap.values()).reduce((a, b) => a + b, 0) || 1;
  const languages = Array.from(langMap.entries())
    .map(([name, count]) => ({ name, pct: Math.round((count / totalLang) * 100) }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 6);

  return {
    ok: true as const,
    profile: {
      login: profile.login,
      name: profile.name,
      avatar: profile.avatar_url,
      publicRepos: profile.public_repos,
      followers: profile.followers,
      bio: profile.bio,
    },
    totals: {
      repos: nonFork.length,
      stars: nonFork.reduce((a, r) => a + r.stargazers_count, 0),
      followers: profile.followers,
    },
    top,
    languages,
  };
}

export type GithubData = ReturnType<typeof shapeGithub>;
export type GithubResult = GithubData | { ok: false; error: string };

/** Fetch straight from the browser. Uses the visitor's own rate limit, not the Worker's shared IP. */
export async function fetchGithubFromBrowser(): Promise<GithubData> {
  const get = async <T>(path: string): Promise<T> => {
    const res = await fetch(`https://api.github.com${path}`, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!res.ok) throw new Error(`GitHub ${res.status}`);
    return (await res.json()) as T;
  };
  const [profile, repos] = await Promise.all([
    get<GhProfile>(`/users/${GH_USER}`),
    get<GhRepo[]>(`/users/${GH_USER}/repos?per_page=100&sort=updated`),
  ]);
  return shapeGithub(profile, repos);
}
