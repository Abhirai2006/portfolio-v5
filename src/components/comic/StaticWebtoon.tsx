/**
 * The whole story as server-rendered HTML: what crawlers, screen readers, no-JS and reduced-motion
 * visitors get (a static vertical webtoon). With WebGL on, it stays in the DOM (visually hidden)
 * and the stage draws the same story.
 */
import { Link } from "@tanstack/react-router";
import { BEATS, PATHS, SKILLS, STAT_SHARDS, TITLE } from "@/story/story";
import { parseCaption } from "@/engine/core";
import { getProject, PROJECTS } from "@/lib/projects";
import { PERSON } from "@/lib/facts";
import type { CaptionDef } from "@/story/types";

export function Rich({ text }: { text: string }) {
  return (
    <>
      {parseCaption(text).map((p, i) =>
        p.key ? <strong key={i}>{p.text}</strong> : <span key={i}>{p.text}</span>,
      )}
    </>
  );
}

function CaptionText({ c }: { c: CaptionDef }) {
  if (c.text.startsWith("project:")) {
    const p = getProject(c.text.slice(8));
    if (!p) return null;
    return (
      <p className="wt-project">
        <Link to="/projects/$slug" params={{ slug: p.slug }}>
          <b>{p.title}</b>
        </Link>{" "}
        — {p.hook}
      </p>
    );
  }
  if (c.kind === "title" || c.kind === "big") return null;
  if (c.id === "l-ml")
    return (
      <p className="wt-link">
        <Link to="/projects/$slug" params={{ slug: "customer-churn-intelligence-system" }}>
          Read the churn case study →
        </Link>
      </p>
    );
  return (
    <p className="wt-caption">
      <Rich text={c.text} />
    </p>
  );
}

export function StaticWebtoon() {
  return (
    <article className="webtoon" aria-label="Abhishek's World, the comic">
      <header className="wt-title">
        <p className="wt-vol">Vol. 01</p>
        <h1>
          <span className="wt-display">{TITLE}</span>
          <span className="wt-name">{PERSON.name}</span>
        </h1>
        <p className="wt-sub">
          Aspiring machine learning engineer · {PERSON.city}, India ·{" "}
          <strong>looking for ML internships</strong>
        </p>
        <nav className="wt-skip" aria-label="Skip ahead">
          <a href="#contact">Skip to contact</a> · <a href="#system">Skip to the work</a> ·{" "}
          <Link to="/resume">Résumé</Link>
        </nav>
      </header>

      {BEATS.filter((b) => b.id !== "title").map((b) => (
        <section
          key={b.id}
          id={b.id === "void" ? "system" : b.id === "choose" ? "paths" : b.id}
          className={`wt-beat wt-${b.id}`}
          aria-labelledby={b.heading ? `h-${b.id}` : undefined}
        >
          {b.heading && (
            <h2 id={`h-${b.id}`} className="wt-heading">
              {b.heading}
            </h2>
          )}
          {b.panels
            .filter((p) => p.still)
            .map((p) => {
              const src = p.still!.startsWith("/") ? p.still! : `/art/static/${p.still}.webp`;
              return (
                <figure key={p.id} className="wt-panel">
                  <img
                    src={src}
                    alt={p.alt}
                    loading="lazy"
                    decoding="async"
                    width={1200}
                    height={Math.round(1200 / p.aspect)}
                  />
                </figure>
              );
            })}
          {b.summary && <p className="wt-summary">{b.summary}</p>}
          {b.captions.map((c) => (
            <CaptionText key={c.id} c={c} />
          ))}

          {b.id === "dawn" && (
            <ul className="wt-stats" aria-label="Numbers on the glass shards">
              {STAT_SHARDS.map((s) => (
                <li key={s.label}>
                  <b>{s.value}</b> {s.label}
                </li>
              ))}
            </ul>
          )}
          {b.id === "choose" && (
            <ul className="wt-paths">
              {PATHS.map((p) => (
                <li key={p.id}>
                  <a href={`#path-${p.id}`}>
                    <b>{p.label}</b>
                  </a>{" "}
                  — {p.artefact}: {p.blurb}
                </li>
              ))}
            </ul>
          )}
          {b.id === "void" && (
            <ul className="wt-system" aria-label="Every project">
              {PROJECTS.map((p) => (
                <li key={p.slug}>
                  <Link to="/projects/$slug" params={{ slug: p.slug }}>
                    <b>{p.title}</b>
                  </Link>
                  <span> · {p.tag}</span>
                  <br />
                  {p.hook}
                </li>
              ))}
            </ul>
          )}
          {b.id === "power" && (
            <div className="wt-skills">
              {SKILLS.map((s) => (
                <p key={s.tier}>
                  <b>
                    Tier {s.tier} · {s.label}:
                  </b>{" "}
                  {s.items.join(", ")}
                </p>
              ))}
            </div>
          )}
          {b.id === "ask" && (
            <p className="wt-caption">
              Ask him anything: the chat answers from his résumé and projects only. With JavaScript
              off, write to him instead (contact below).
            </p>
          )}
        </section>
      ))}
    </article>
  );
}
