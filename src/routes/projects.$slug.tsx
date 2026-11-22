import { useState } from "react";
import { useIsLight } from "@/hooks/use-is-light";
import { firstShotUrl, pickShot, type Shot } from "@/lib/shots";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getProject, PROJECTS, type ProjectEntry } from "@/lib/projects";
import { Nav } from "@/components/portfolio/Nav";
import { mailto } from "@/lib/contact";
import { Panel, SpeedLines } from "@/components/art/primitives";
import { KIND_META } from "@/components/art/EpisodeCover";

import { SITE } from "@/lib/site";

function ShotGrid({ title, shots }: { title: string; shots: Shot[] }) {
  const light = useIsLight();
  const [failed, setFailed] = useState<string[]>([]);
  const urls = shots
    .map((shot) => pickShot(shot, light, failed))
    .filter((u): u is string => u !== null);
  if (urls.length === 0) return null;
  return (
    <div className="mt-14 grid sm:grid-cols-2 gap-4">
      {urls.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={`${title} screenshot ${i + 1}`}
          loading="lazy"
          onError={() => setFailed((f) => (f.includes(src) ? f : [...f, src]))}
          className={`rounded-xl border-2 border-line w-full object-cover shadow-[5px_5px_0_var(--panel-shadow)] ${i === 0 ? "sm:col-span-2" : ""}`}
        />
      ))}
    </div>
  );
}

export const Route = createFileRoute("/projects/$slug")({
  loader: ({ params }) => {
    const project = getProject(params.slug);
    if (!project) throw notFound();
    return { project };
  },
  head: ({ params, loaderData }) => {
    const p = loaderData?.project;
    const title = p ? `${p.title}: Case study · Abhishek Rai A` : "Case study · Abhishek Rai A";
    const desc = p?.caseStudy.summary ?? "Project case study by Abhishek Rai A.";
    const url = `${SITE}/projects/${params.slug}`;
    const first = firstShotUrl(p?.images?.[0]);
    const img = first ? `${SITE}${first}` : undefined;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
        ...(img
          ? [
              { property: "og:image", content: img },
              { name: "twitter:image", content: img },
            ]
          : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: p
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": p.repo ? ["CreativeWork", "SoftwareSourceCode"] : "CreativeWork",
                name: p.title,
                headline: `${p.title}: Case study`,
                description: p.caseStudy.summary,
                url,
                ...(p.repo ? { codeRepository: p.repo } : {}),
                ...(p.live ? { sameAs: [p.live] } : {}),
                keywords: p.caseStudy.stack.join(", "),
                author: { "@type": "Person", name: "Abhishek Rai A", url: `${SITE}/` },
              }),
            },
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
                  { "@type": "ListItem", position: 2, name: "The Arcs", item: `${SITE}/#arcs` },
                  { "@type": "ListItem", position: 3, name: p.title, item: url },
                ],
              }),
            },
          ]
        : [],
    };
  },
  component: CaseStudyPage,
});

function CaseStudyPage() {
  const { project: p } = Route.useLoaderData() as { project: ProjectEntry };
  const cs = p.caseStudy;
  const i = PROJECTS.findIndex((o) => o.slug === p.slug);
  const prev = PROJECTS[i - 1];
  const next = PROJECTS[i + 1];
  const meta = KIND_META[p.kind];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="mx-auto max-w-4xl px-4 pb-24 pt-28 sm:px-6 sm:pt-32">
        <Link
          to="/"
          hash="arcs"
          className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-primary"
        >
          ← Back to the Arcs
        </Link>

        <Panel as="article" chapter={meta.wash} tone="wash" className="mt-6 p-6 sm:p-10">
          <SpeedLines className="opacity-10" />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-widest">
              <span className="rounded-full border-2 border-line bg-paper px-2.5 py-0.5 font-bold">{`Ep. ${i + 1}`}</span>
              <span aria-hidden="true" className="text-base">
                {meta.piece}
              </span>
              <span className="text-muted-foreground">
                {meta.label} · {p.tag} · {p.year}
              </span>
              {p.client && (
                <span className="rounded-full border-2 border-line bg-primary px-2.5 py-0.5 font-bold text-primary-foreground">
                  Paid client project
                </span>
              )}
            </div>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl">
              {p.title}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{cs.summary}</p>
            {p.client && <p className="mt-2 text-sm">Client: {p.client.name}</p>}

            <dl className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {p.metrics.map((m) => (
                <div key={m.label} className="rounded-xl border-2 border-line bg-paper p-4">
                  <dt className="sr-only">{m.label}</dt>
                  <dd className="font-display text-3xl font-extrabold">{m.value}</dd>
                  <dd className="mt-1 text-xs text-muted-foreground">{m.label}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {p.slug === "customer-churn-intelligence-system" && (
                <Link
                  to="/"
                  hash="lab"
                  className="rounded-full border-2 border-line bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-[4px_4px_0_var(--panel-shadow)]"
                >
                  Try the model live →
                </Link>
              )}
              {p.live && (
                <a
                  href={p.live}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border-2 border-line bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-[4px_4px_0_var(--panel-shadow)]"
                >
                  {p.client ? "Live demo →" : "Live site →"}
                </a>
              )}
              {p.repo && (
                <a
                  href={p.repo}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border-2 border-line bg-paper px-5 py-2.5 text-sm font-semibold"
                >
                  View code
                </a>
              )}
              {p.pendingRepo &&
                (p.pendingRepo.isPublic ? (
                  <a
                    href={p.pendingRepo.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border-2 border-line bg-paper px-5 py-2.5 text-sm font-semibold"
                  >
                    {p.pendingRepo.label}
                  </a>
                ) : (
                  <span className="rounded-full border-2 border-dashed border-line px-4 py-2 text-xs text-muted-foreground">
                    {p.pendingRepo.label}: internship repo going public soon
                  </span>
                ))}
            </div>
          </div>
        </Panel>

        <ShotGrid title={p.title} shots={p.images ?? []} />

        {p.prequel && (
          <Panel chapter="origin" tone="wash" className="mt-10 p-6">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Prequel</p>
            <h2 className="mt-2 font-display text-2xl font-extrabold">Before {p.title}, there was {p.prequel.title}</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">{p.prequel.story}</p>
            <a
              href={p.prequel.repo}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block font-mono text-xs font-bold uppercase tracking-widest text-primary hover:underline"
            >
              {p.prequel.title} on GitHub →
            </a>
          </Panel>
        )}

        {p.snippet && (
          <div className="mt-10 overflow-auto rounded-xl border-2 border-line bg-[var(--ink)] p-6 font-mono text-[12px] sm:text-sm">
            <div className="mb-3 text-[10px] uppercase tracking-widest text-[var(--sq-light)]">{p.snippet.title}</div>
            <pre className="whitespace-pre-wrap leading-relaxed text-[var(--wash-lab)]">{p.snippet.lines.join("\n")}</pre>
          </div>
        )}

        <Section title="The problem">
          <p className="leading-relaxed text-muted-foreground">{cs.problem}</p>
        </Section>
        <Section title="Constraints">
          <Bullets items={cs.constraints} />
        </Section>
        <Section title="What was built">
          <Bullets items={cs.built} />
        </Section>
        <Section title="Trade-offs">
          <div className="space-y-4">
            {cs.tradeoffs.map((t) => (
              <Panel key={t.choice} className="p-5">
                <div className="font-display text-lg font-bold">{t.choice}</div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.why}</p>
              </Panel>
            ))}
          </div>
        </Section>
        <Section title="Outcome">
          <Bullets items={cs.outcome} />
        </Section>
        <Section title="Stack">
          <ul className="flex flex-wrap gap-2">
            {cs.stack.map((t) => (
              <li key={t} className="rounded-full border-2 border-line px-3 py-1 font-mono text-[11px] uppercase tracking-widest">
                {t}
              </li>
            ))}
          </ul>
        </Section>

        <Panel chapter="finale" tone="wash" className="mt-16 flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <div className="font-display text-xl font-bold">Want the long version?</div>
            <p className="text-sm text-muted-foreground">Happy to walk through the decisions live.</p>
          </div>
          <a
            href={mailto("internship")}
            className="rounded-full border-2 border-line bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
          >
            Email Abhishek →
          </a>
        </Panel>

        <nav aria-label="More episodes" className="mt-12 grid gap-4 sm:grid-cols-2">
          {prev && (
            <Link to="/projects/$slug" params={{ slug: prev.slug }} className="webtoon-panel block p-4 hover:-translate-y-0.5">
              <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">{`← Ep. ${i}`}</div>
              <div className="mt-1 font-display text-lg font-bold">{prev.title}</div>
            </Link>
          )}
          {next && (
            <Link
              to="/projects/$slug"
              params={{ slug: next.slug }}
              className="webtoon-panel block p-4 text-right hover:-translate-y-0.5 sm:col-start-2"
            >
              <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">{`Ep. ${i + 2} →`}</div>
              <div className="mt-1 font-display text-lg font-bold">{next.title}</div>
            </Link>
          )}
        </nav>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-14">
      <h2 className="font-display text-2xl font-extrabold sm:text-3xl">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((t) => (
        <li key={t} className="flex gap-3 text-muted-foreground leading-relaxed">
          <span aria-hidden="true" className="text-primary">▸</span>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}
