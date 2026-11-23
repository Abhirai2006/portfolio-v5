/**
 * Live GitHub, in ink. Data: the server function first (cached, uses GITHUB_TOKEN if set); if the Worker's shared
 * IP is rate-limited, ask GitHub from the browser (the visitor's own quota). Same logic as before, restyled.
 */
import { useQuery } from "@tanstack/react-query";
import { getGithubData } from "@/lib/github.functions";
import { fetchGithubFromBrowser, type GithubResult } from "@/lib/github-shape";
import { PERSON } from "@/lib/facts";
import { ContributionHeatmap } from "./ContributionHeatmap";

export function GithubLive() {
  const { data, isLoading } = useQuery({
    queryKey: ["github"],
    queryFn: async (): Promise<GithubResult> => {
      const server = await getGithubData();
      if (server.ok) return server;
      try {
        return await fetchGithubFromBrowser();
      } catch {
        return server;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading || !data)
    return (
      <div className="panel p-8 text-center font-hud text-[11px] text-grey-4">
        fetching live github data…
      </div>
    );
  if (!data.ok) {
    return (
      <div className="space-y-8">
        <div className="panel p-8 text-center font-hud text-[11px] normal-case tracking-[0.06em] text-grey-4">
          GitHub isn&apos;t answering right now, so repo stats are hidden for a moment.{" "}
          <a href={PERSON.github} target="_blank" rel="noreferrer" className="text-paper underline">
            See everything on GitHub →
          </a>
        </div>
        <ContributionHeatmap />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-4">
        <Stat n={data.totals.repos} label="Public repos" />
        <Stat n={data.totals.stars} label="Stars earned" />
        <Stat n={data.totals.followers} label="Followers" />
      </div>
      <ContributionHeatmap />
      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-3 md:col-span-2">
          <h3 className="font-hud text-[11px] text-grey-4">Top repositories</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {data.top.map((r) => (
              <a
                key={r.name}
                href={r.url}
                target="_blank"
                rel="noreferrer"
                className="map-card group"
              >
                <span className="flex items-center justify-between">
                  <span className="font-sfx text-sm text-paper">{r.name}</span>
                  <span className="font-hud text-[10px] text-grey-4">★ {r.stars}</span>
                </span>
                <span className="mt-1 line-clamp-2 block min-h-[2rem] text-xs text-grey-4">
                  {r.description ?? "No description yet"}
                </span>
                {r.language && (
                  <span className="mt-2 block font-hud text-[10px] text-grey-3">{r.language}</span>
                )}
              </a>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <h3 className="font-hud text-[11px] text-grey-4">Language mix</h3>
          <div className="panel space-y-3 p-4">
            {data.languages.map((l) => (
              <div key={l.name} className="space-y-1">
                <div className="flex justify-between font-hud text-[10px]">
                  <span>{l.name}</span>
                  <span className="text-grey-4">{l.pct}%</span>
                </div>
                <div className="h-2 border border-grey-2">
                  <div className="lab-bar h-full" data-dir="stay" style={{ width: `${l.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          <a
            href={PERSON.github}
            target="_blank"
            rel="noreferrer"
            className="ink-btn w-full justify-center"
          >
            @Abhirai2006 →
          </a>
        </div>
      </div>
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="panel p-5">
      <div className="font-display text-5xl tabular-nums">{n}</div>
      <div className="mt-1 font-hud text-[10px] text-grey-4">{label}</div>
    </div>
  );
}
