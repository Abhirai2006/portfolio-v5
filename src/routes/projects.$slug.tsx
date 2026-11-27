import { useState } from "react";
import { firstShotUrl, pickShot, type Shot } from "@/lib/shots";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getProject, PROJECTS, type ProjectEntry } from "@/lib/projects";
import { mailto } from "@/lib/contact";
import { PageNav, Footer } from "@/components/site/Chrome";
import { SITE } from "@/lib/site";

const KIND_LABEL: Record<ProjectEntry["kind"], string> = {
  ml: "ML Engineer",
  product: "Product Builder",
  algo: "Problem Solver",
  practice: "Practice",
};

function ShotGrid({ title, shots }: { title: string; shots: Shot[] }) {
  const [failed, setFailed] = useState<string[]>([]);
  const urls = shots
    .map((shot) => pickShot(shot, false, failed))
    .filter((u): u is string => u !== null);
  if (urls.length === 0) return null;
  return (
    <div className="shots">
      {urls.map((src, i) => (
        <figure key={src} style={i === 0 ? { gridColumn: "1 / -1" } : undefined}>
          <img
            src={src}
            alt={`${title} screenshot ${i + 1}`}
            loading="lazy"
            decoding="async"
            onError={() => setFailed((f) => (f.includes(src) ? f : [...f, src]))}
          />
        </figure>
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
                  {
                    "@type": "ListItem",
                    position: 2,
                    name: "Enter the system",
                    item: `${SITE}/#system`,
                  },
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
  return (
    <div className="page">
      <PageNav />
      <main className="page-wrap">
        <article>
          {/* Live site + GitHub first, before anything else (DESIGN.md §5 beat 10) */}
          <div className="case-actions" aria-label="Project links">
            {p.live && (
              <a className="btn-ink primary" href={p.live} target="_blank" rel="noreferrer">
                {p.client ? "Live demo ↗" : "Live site ↗"}
              </a>
            )}
            {p.repo && (
              <a className="btn-ink" href={p.repo} target="_blank" rel="noreferrer">
                GitHub ↗
              </a>
            )}
            {p.pendingRepo &&
              (p.pendingRepo.isPublic ? (
                <a className="btn-ink" href={p.pendingRepo.url} target="_blank" rel="noreferrer">
                  {p.pendingRepo.label} ↗
                </a>
              ) : (
                <span className="btn-ink" aria-disabled="true">
                  {p.pendingRepo.label}: internship repo going public soon
                </span>
              ))}
            {!p.live && !p.repo && (
              <span className="btn-ink" aria-disabled="true">
                Private project: no public link
              </span>
            )}
            <a className="btn-ink" href="/">
              ← Back to the story
            </a>
          </div>

          <p className="page-kicker">
            {`Ep. ${i + 1}`} · {KIND_LABEL[p.kind]} · {p.tag} · {p.year}
            {p.client && (
              <span className="badge" style={{ marginLeft: 10 }}>
                Paid client project
              </span>
            )}
          </p>
          <h1 className="page-title">{p.title}</h1>
          <p className="page-lede">{cs.summary}</p>
          {p.client && <p>Client: {p.client.name}</p>}

          <dl className="metrics">
            {p.metrics.map((m) => (
              <div key={m.label}>
                <dt className="sr-only">{m.label}</dt>
                <dd style={{ margin: 0 }}>
                  <b>{m.value}</b>
                  <span>{m.label}</span>
                </dd>
              </div>
            ))}
          </dl>

          <ShotGrid title={p.title} shots={p.images ?? []} />

          {p.prequel && (
            <div className="ink-box" style={{ margin: "24px 0" }}>
              <p className="page-kicker">Prequel</p>
              <h2>
                Before {p.title}, there was {p.prequel.title}
              </h2>
              <p>{p.prequel.story}</p>
              <a href={p.prequel.repo} target="_blank" rel="noreferrer">
                {p.prequel.title} on GitHub (
                {p.prequel.repo.replace("https://github.com/Abhirai2006/", "")}) ↗
              </a>
            </div>
          )}

          {p.snippet && (
            <figure style={{ margin: "24px 0" }}>
              <figcaption className="page-kicker">{p.snippet.title}</figcaption>
              <pre className="code-block">{p.snippet.lines.join("\n")}</pre>
            </figure>
          )}

          <div className="prose">
            <h2>The problem</h2>
            <p>{cs.problem}</p>
            <h2>Constraints</h2>
            <ul>
              {cs.constraints.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <h2>What was built</h2>
            <ul>
              {cs.built.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <h2>Trade-offs</h2>
            <div className="grid-2">
              {cs.tradeoffs.map((t) => (
                <div key={t.choice} className="ink-box">
                  <h3>{t.choice}</h3>
                  <p style={{ margin: 0 }}>{t.why}</p>
                </div>
              ))}
            </div>
            <h2>Outcome</h2>
            <ul>
              {cs.outcome.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <h2>Stack</h2>
            <ul className="chips">
              {cs.stack.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>

          <div
            className="ink-box"
            style={{
              marginTop: 40,
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <h2 style={{ margin: 0 }}>Want the long version?</h2>
              <p style={{ margin: 0 }}>Happy to walk through the decisions live.</p>
            </div>
            <a className="btn-ink primary" href={mailto("internship")}>
              Email Abhishek
            </a>
          </div>

          <nav aria-label="More episodes" className="pager">
            {prev ? (
              <Link to="/projects/$slug" params={{ slug: prev.slug }} className="btn-ink">
                ← Ep. {i}: {prev.title}
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link to="/projects/$slug" params={{ slug: next.slug }} className="btn-ink">
                Ep. {i + 2}: {next.title} →
              </Link>
            )}
          </nav>
        </article>
      </main>
      <Footer />
    </div>
  );
}
