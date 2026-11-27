/**
 * The whole v3 homepage as plain, server-rendered HTML (AGENT rule 5): crawlers, screen readers
 * and visitors without WebGL read this. When the WebGL forest runs it is visually hidden, not removed.
 * Every fact comes from src/lib/facts.ts or src/lib/projects.ts (CONTENT.md §1).
 */
import { Link } from "@tanstack/react-router";
import { PERSON } from "@/lib/facts";
import { getProject } from "@/lib/projects";

/** The projects that get a forest layer and a creature (DECISIONS V7), in descent order (draft). */
export const LAYER_PROJECTS = [
  "customer-churn-intelligence-system",
  "muse-students-voice",
  "ro-bio",
  "earth-and-ethos",
  "arthra",
  "ittige",
  "wonderland",
] as const;

export function ForestStory() {
  const projects = LAYER_PROJECTS.map((s) => getProject(s)).filter((p) => p != null);
  return (
    <article className="forest-static" aria-labelledby="forest-title">
      <header className="fs-hero">
        <p className="fs-kicker">A walk down through the rainforest</p>
        <h1 id="forest-title" className="fs-title">
          <span className="script-a">Abhishek's</span> <span className="script-b">World</span>
        </h1>
        <p className="fs-sub">
          {PERSON.name} · aspiring machine learning engineer · {PERSON.city} · looking for{" "}
          {PERSON.seeking}
        </p>
      </header>

      <section className="fs-chapter" aria-labelledby="fs-origin">
        <h2 id="fs-origin">Where it starts</h2>
        <p>On the coast of Mangaluru, a boy grew up around keyboards. His father was a typist.</p>
        <p>He loved maths, so he followed it. The road led to {PERSON.city}.</p>
      </section>

      <section className="fs-chapter" aria-labelledby="fs-night">
        <h2 id="fs-night">The night shift</h2>
        <p>10 PM. The city sleeps. He doesn't. He likes music, but not while he works.</p>
        <p>
          {PERSON.degree}, {PERSON.university} ({PERSON.years}). GPA {PERSON.gpa}.
        </p>
      </section>

      <section className="fs-chapter" aria-labelledby="fs-work">
        <h2 id="fs-work">What he has built</h2>
        <ul className="fs-projects">
          {projects.map((p) => (
            <li key={p.slug}>
              <h3>
                <Link to="/projects/$slug" params={{ slug: p.slug }}>
                  {p.title}
                </Link>
              </h3>
              <p>{p.caseStudy.summary}</p>
            </li>
          ))}
        </ul>
        <p>
          <Link to="/resume">Résumé and every other project</Link>
        </p>
      </section>
    </article>
  );
}
