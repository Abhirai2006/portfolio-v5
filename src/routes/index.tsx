import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Nav } from "@/components/portfolio/Nav";
import { CommandPalette } from "@/components/portfolio/CommandPalette";
import { BackToBoard, MainBoard, type Destination } from "@/components/v5/MainBoard";
import { Finale } from "@/components/v5/Finale";
import {
  Arcs,
  AskPanel,
  Chapter,
  LabChapter,
  LiveActivity,
  Origin,
  SideQuest,
  StatSheet,
} from "@/components/v5/sections";
import { Panel, SpeedLines } from "@/components/art/primitives";
import { CHAPTERS } from "@/lib/chess/lines";
import type { Kind } from "@/lib/projects";
import { CONTACT_EMAIL, mailto } from "@/lib/contact";
import { PERSON } from "@/lib/facts";
import { MAIN_ARCS } from "@/lib/projects";
import { track, observeSections, recordVisit } from "@/lib/analytics";
import portrait from "@/assets/abhishek-portrait.jpg.asset.json";
import ogCover from "@/assets/og-cover.jpg.asset.json";
import { SITE } from "@/lib/site";
import { homeJsonLd } from "@/lib/seo";

const TITLE = "Abhishek Rai A · Aspiring ML Engineer, Mysuru";
const DESCRIPTION =
  "Abhishek Rai A is an aspiring machine learning engineer in Mysuru (B.E. AI & ML, GPA 9.44) looking for ML internships. Try his churn model live in the browser, then read the project episodes.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
      { property: "og:url", content: `${SITE}/` },
      { property: "og:image", content: `${SITE}${ogCover.url}` },
      { name: "twitter:image", content: `${SITE}${ogCover.url}` },
    ],
    links: [{ rel: "canonical", href: `${SITE}/` }],
    scripts: homeJsonLd(SITE, portrait.url).map((block) => ({
      type: "application/ld+json",
      children: JSON.stringify(block),
    })),
  }),
  component: Index,
});

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  // Move keyboard focus with the visitor, so the next Tab continues from the destination.
  el.focus({ preventScroll: true });
}

function Index() {
  const [visitorCount, setVisitorCount] = useState<number | null>(null);
  const [solved, setSolved] = useState(false);
  const [arcsFilter, setArcsFilter] = useState<Kind | "all">("all");

  useEffect(() => {
    track("page_view", "home");
    void recordVisit().then(setVisitorCount);
    return observeSections([...CHAPTERS, "contact"]);
  }, []);

  const onTravel = useCallback((d: Destination) => {
    if (d.chapter === "arcs") setArcsFilter(d.filter ?? "all");
    // Let the filter render before scrolling so the page lands on the right cards.
    window.setTimeout(() => scrollToId(d.chapter), 30);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#arcs"
        className="sr-only z-[70] rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to the work
      </a>
      <Nav />

      {/* ---------- Hero + the main board ---------- */}
      <header id="top-hero" className="relative overflow-hidden pt-24 sm:pt-28">
        <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <div className="grid items-end gap-8 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Portfolio · {PERSON.city}, India
              </p>
              <h1 className="mt-4 font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-7xl">
                {PERSON.name}
              </h1>
              <p className="mt-5 max-w-xl text-lg text-muted-foreground">
                <span className="font-semibold text-foreground">Aspiring Machine Learning Engineer</span> · looking for ML
                internships. B.E. AI &amp; ML at Mysore University, GPA {PERSON.gpa}. His internship churn model runs live
                on this page.
              </p>
            </div>
            <div>
              <ul className="flex flex-wrap gap-2 text-sm">
                {["B.E. AI & ML · GPA 9.44", "Bluemind Solutions intern, 2026", `${MAIN_ARCS.length} main arcs · 1 paid client`].map(
                  (c) => (
                    <li key={c} className="rounded-full border-2 border-line bg-paper px-3 py-1">
                      {c}
                    </li>
                  ),
                )}
              </ul>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a
                  href={mailto("internship")}
                  onClick={() => track("cta_click", "hire_hero")}
                  className="rounded-full border-2 border-line bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-[4px_4px_0_var(--panel-shadow)] transition hover:-translate-y-0.5"
                >
                  Hire me for an internship →
                </a>
                <Link
                  to="/resume"
                  onClick={() => track("cta_click", "resume")}
                  className="rounded-full border-2 border-line bg-paper px-5 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5"
                >
                  Résumé
                </Link>
                <a
                  href="#arcs"
                  onClick={() => track("cta_click", "skip_to_work")}
                  className="font-mono text-sm font-bold uppercase tracking-widest text-primary underline-offset-4 hover:underline"
                >
                  Skip to the work →
                </a>
              </div>
              <p className="mt-4 font-mono text-xs text-muted-foreground" aria-live="polite">
                {visitorCount === null ? "" : `${visitorCount.toLocaleString()} visitors so far`}
              </p>
            </div>
          </div>
          <div className="mt-12">
            <MainBoard onTravel={onTravel} />
          </div>
        </div>
      </header>

      <main>
        <Chapter id="origin" n={1} move="♚">
          <Origin />
        </Chapter>
        <Chapter id="arcs" n={2} move="♜ ♝">
          <Arcs filter={arcsFilter} onFilter={setArcsFilter} />
        </Chapter>
        <Chapter id="lab" n={3} move="♞">
          <LabChapter />
        </Chapter>
        <Chapter id="stats" n={4} move="♟">
          <StatSheet />
        </Chapter>
        <Chapter id="activity" n={5}>
          <LiveActivity />
        </Chapter>
        <Chapter id="ask" n={6}>
          <AskPanel />
        </Chapter>
        <Chapter id="sidequest" n={7}>
          <SideQuest />
        </Chapter>
        <Chapter id="finale" n={8}>
          <Finale
            onSolved={() => {
              setSolved(true);
              track("cta_click", "finale_solved");
            }}
          />
          <Contact solved={solved} />
        </Chapter>
      </main>

      <footer className="border-t-2 border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 font-mono text-xs text-muted-foreground sm:px-6">
          <div>
            © {new Date().getFullYear()} · {PERSON.name} · Portfolio v5, "The Réti Volume"
          </div>
          <div>Drawn in code · three.js board · his LightGBM model, in your browser</div>
        </div>
      </footer>

      <BackToBoard />
      <CommandPalette />
    </div>
  );
}

function Contact({ solved }: { solved: boolean }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  return (
    <section id="contact" tabIndex={-1} aria-labelledby="contact-title" className="mt-10 scroll-mt-24 focus:outline-none">
      <Panel chapter="finale" tone="wash" className="relative p-6 sm:p-10">
        {solved && <SpeedLines className="opacity-20" />}
        <div className="relative grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
              {solved ? "You found it." : "Checkmate or not,"}
            </p>
            <h2 id="contact-title" className="mt-2 font-display text-4xl font-extrabold sm:text-5xl">
              Now let's talk.
            </h2>
            <p className="mt-4 max-w-lg text-muted-foreground">
              Looking for ML internships. An algorithm to crack, a model to ship, or the latest anime arc: drop a line.
            </p>
          </div>
          <div className="space-y-3">
            <a
              href={mailto("internship")}
              onClick={() => track("cta_click", "hire_contact")}
              className="block rounded-xl border-2 border-line bg-primary px-5 py-3 text-center font-bold text-primary-foreground shadow-[4px_4px_0_var(--panel-shadow)]"
            >
              Email about an internship →
            </a>
            {revealed ? (
              <div className="flex items-center justify-between gap-2 rounded-xl border-2 border-line bg-paper px-4 py-3 font-mono text-sm">
                <a href={`mailto:${CONTACT_EMAIL}`} className="truncate hover:underline">
                  {CONTACT_EMAIL}
                </a>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(CONTACT_EMAIL);
                      setCopied(true);
                      window.setTimeout(() => setCopied(false), 2000);
                    } catch {
                      /* clipboard unavailable */
                    }
                  }}
                  className="shrink-0 rounded border-2 border-line px-2 py-0.5 text-[11px] uppercase"
                >
                  {copied ? "copied ✓" : "copy"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setRevealed(true)}
                className="w-full rounded-xl border-2 border-line bg-paper px-4 py-3 text-sm font-semibold"
              >
                Reveal email
              </button>
            )}
            <div className="flex flex-wrap gap-2">
              {[
                ["GitHub", PERSON.github],
                ["LinkedIn", PERSON.linkedin],
                ["Instagram", PERSON.instagram],
              ].map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border-2 border-line bg-paper px-4 py-1.5 text-sm font-semibold hover:-translate-y-0.5"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </Panel>
    </section>
  );
}
