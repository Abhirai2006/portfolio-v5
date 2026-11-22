import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Panel, Screentone, SpeedLines, type Wash } from "./primitives";
import { useIsLight } from "@/hooks/use-is-light";
import { pickShot } from "@/lib/shots";
import type { Kind, ProjectEntry } from "@/lib/projects";
import { cn } from "@/lib/utils";

export const KIND_META: Record<Kind, { piece: string; label: string; wash: Wash }> = {
  ml: { piece: "♞", label: "Machine learning", wash: "lab" },
  product: { piece: "♜", label: "Full-stack product", wash: "arcs" },
  algo: { piece: "♝", label: "Algorithms", wash: "stats" },
  practice: { piece: "♟", label: "Practice", wash: "sidequest" },
};

/**
 * A project drawn as a webtoon episode cover. Large covers show a real screenshot of the project
 * (theme-matched) as the cover art; projects without one get a drawn title card.
 * `project.cover`-style hand-drawn art can replace the screenshot later via Panel's `art` slot.
 */
export function EpisodeCover({
  project,
  episode,
  size = "lg",
}: {
  project: ProjectEntry;
  episode: number;
  size?: "lg" | "sm";
}) {
  const light = useIsLight();
  const [failed, setFailed] = useState<string[]>([]);
  const meta = KIND_META[project.kind];
  const shot = project.images?.[0] ? pickShot(project.images[0], light, failed) : null;

  return (
    <Panel
      as="article"
      chapter={meta.wash}
      tone="wash"
      className={cn("group h-full", size === "lg" ? "p-0" : "p-4")}
    >
      <Link
        to="/projects/$slug"
        params={{ slug: project.slug }}
        className="flex h-full flex-col focus-visible:outline-3 focus-visible:outline-[var(--primary)]"
      >
        {size === "lg" && (
          <div className="relative aspect-[16/9] overflow-hidden border-b-2 border-line md:aspect-auto md:h-64 bg-[color-mix(in_oklab,var(--wash-lab)_25%,var(--paper))]">
            {shot ? (
              <img
                src={shot}
                alt={`${project.title} screenshot`}
                loading="lazy"
                onError={() => setFailed((f) => [...f, shot])}
                className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.03]"
              />
            ) : (
              <div className="relative flex h-full items-center justify-center">
                <Screentone density={7} />
                <SpeedLines />
                <span className="relative text-center">
                  <span className="sfx block text-6xl text-[var(--wash-lab)] sm:text-7xl">
                    {project.metrics[0]?.value}
                  </span>
                  <span className="mt-1 block font-mono text-xs font-bold uppercase tracking-widest">
                    {project.metrics[0]?.label}
                  </span>
                </span>
              </div>
            )}
            <span className="absolute left-3 top-3 rounded-full border-2 border-line bg-paper px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-widest">
              {`Ep. ${episode}`}
            </span>
            {project.client && (
              <span className="absolute right-3 top-3 rounded-full border-2 border-line bg-primary px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-widest text-primary-foreground">
                Paid client project
              </span>
            )}
          </div>
        )}
        <div className={cn("flex flex-1 flex-col", size === "lg" && "p-5")}>
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            <span aria-hidden="true" className="text-base text-foreground">
              {meta.piece}
            </span>
            <span>{meta.label}</span>
            {size === "sm" && <span>{`· Ep. ${episode}`}</span>}
          </div>
          <h3
            className={cn(
              "mt-2 font-display font-extrabold leading-tight",
              size === "lg" ? "text-2xl" : "text-lg",
            )}
          >
            {project.title}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">{project.hook}</p>
          {size === "lg" && (
            <dl className="mt-4 grid grid-cols-3 gap-2">
              {project.metrics.map((m) => (
                <div key={m.label} className="rounded-lg border-2 border-line bg-paper p-2">
                  <dt className="sr-only">{m.label}</dt>
                  <dd className="font-display text-lg font-extrabold leading-none">{m.value}</dd>
                  <dd className="mt-1 text-[11px] leading-tight text-muted-foreground">
                    {m.label}
                  </dd>
                </div>
              ))}
            </dl>
          )}
          <span className="mt-auto pt-4 font-mono text-xs font-bold uppercase tracking-widest text-primary">
            Read the episode{" "}
            <span className="inline-block transition group-hover:translate-x-1">→</span>
          </span>
        </div>
      </Link>
    </Panel>
  );
}
