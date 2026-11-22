import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Bubble, Panel, Screentone, SpeedLines, type Wash } from "@/components/art/primitives";
import { EpisodeCover, KIND_META } from "@/components/art/EpisodeCover";
import { GithubLive } from "@/components/portfolio/GithubLive";
import { AskAbhishek } from "@/components/portfolio/AskAbhishek";
import { MAIN_ARCS, SIDE_STORIES, type Kind } from "@/lib/projects";
import { CHAPTER_TITLES, type ChapterId } from "@/lib/chess/lines";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import portrait from "@/assets/abhishek-portrait.jpg.asset.json";
import { QuickFacts } from "./QuickFacts";

/* ---------- chapter frame ---------- */

export function Chapter({
  id,
  n,
  move,
  children,
  className,
}: {
  id: ChapterId;
  n: number;
  move?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      tabIndex={-1}
      aria-labelledby={`${id}-title`}
      className={cn("relative scroll-mt-24 py-16 focus:outline-none sm:py-24", className)}
      style={{
        background: `linear-gradient(180deg, color-mix(in oklab, var(--wash-${id}) 12%, transparent) 0%, transparent 38%)`,
      }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <header className="flex flex-wrap items-center gap-3">
          <span className="rounded-md border-2 border-line bg-paper px-2.5 py-1 font-mono text-xs font-bold uppercase tracking-widest shadow-[3px_3px_0_var(--panel-shadow)]">
            Ch.{n}
            {move && <span className="ml-2 text-muted-foreground">{move}</span>}
          </span>
          <h2
            id={`${id}-title`}
            className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl"
          >
            {CHAPTER_TITLES[id]}
          </h2>
        </header>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}

/* ---------- Ch.1 Origin ---------- */

function OriginPanel({
  title,
  children,
  wash = "origin",
  className,
  art,
}: {
  title: string;
  children: ReactNode;
  wash?: Wash;
  className?: string;
  art?: ReactNode;
}) {
  return (
    <Panel chapter={wash} tone="wash" className={cn("p-5", className)}>
      {art}
      <h3 className="font-display text-xl font-extrabold">{title}</h3>
      <div className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </Panel>
  );
}

export function Origin() {
  return (
    <div className="grid gap-5 md:grid-cols-6">
      <Panel chapter="origin" className="relative overflow-hidden md:col-span-2 md:row-span-2">
        <img
          src={portrait.url}
          alt="Abhishek Rai A"
          className="aspect-[4/5] h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-x-3 bottom-3">
          <Bubble>
            <p className="text-sm font-semibold">"Building cool stuff, one algorithm at a time."</p>
          </Bubble>
        </div>
      </Panel>
      <OriginPanel title="Mangaluru → Mysuru" className="md:col-span-2">
        Born in Mangaluru with Tulu at home, raised in Mysuru. Speaks Tulu, Kannada, Hindi and
        English.
      </OriginPanel>
      <OriginPanel title="Maths first" wash="stats" className="md:col-span-2">
        No dramatic origin story: he loves maths, so he followed it into AI and ML. Linear algebra
        and calculus are his strongest tools.
      </OriginPanel>
      <OriginPanel title="B.E. AI & ML · GPA 9.44" wash="arcs" className="md:col-span-2">
        Mysore University School of Engineering, 2024–2028, 5th semester. Semester GPAs 9.40, 9.30,
        9.23, 9.82.
      </OriginPanel>
      <OriginPanel title="Bluemind Solutions, 2026" wash="lab" className="md:col-span-2">
        A 4-week, ~120-hour Core AI & ML internship (Aug–Sep 2026). His capstone, the churn model,
        runs live in Chapter 3.
      </OriginPanel>
      <OriginPanel title="How he builds" wash="ask" className="md:col-span-3">
        He uses AI copilots on purpose for web scaffolding, so his own hours go into the algorithms
        and the maths. The ML and algorithm work is his; the web layer is built with AI as a
        copilot, and he says so.
      </OriginPanel>
      <div className="md:col-span-3">
        <QuickFacts className="h-full bg-paper" />
      </div>
    </div>
  );
}

/* ---------- Ch.2 The Arcs ---------- */

const FILTERS: { id: Kind | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "ml", label: `${KIND_META.ml.piece} ML` },
  { id: "product", label: `${KIND_META.product.piece} Products` },
  { id: "algo", label: `${KIND_META.algo.piece} Algorithms` },
  { id: "practice", label: `${KIND_META.practice.piece} Practice` },
];

export function Arcs({
  filter,
  onFilter,
}: {
  filter: Kind | "all";
  onFilter: (f: Kind | "all") => void;
}) {
  const setFilter = onFilter;
  const show = (k: Kind) => filter === "all" || filter === k;
  const main = MAIN_ARCS.filter((p) => show(p.kind));
  const side = SIDE_STORIES.filter((p) => show(p.kind));
  return (
    <div>
      <p className="max-w-2xl text-muted-foreground">
        Every project is an episode. Main arcs first: the ML work, then the products with real
        users, a real client and real tests. Each piece marks the kind of work.
      </p>
      <div role="group" aria-label="Filter projects" className="mt-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
            className="rounded-full border-2 border-line px-3 py-1 text-sm font-semibold transition aria-pressed:bg-foreground aria-pressed:text-background"
          >
            {f.label}
          </button>
        ))}
      </div>
      {main.length > 0 && (
        <>
          <h3 className="mt-8 font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Main arcs
          </h3>
          <ul className="mt-3 grid gap-6 md:grid-cols-2">
            {main.map((p) => (
              <li
                key={p.slug}
                className={cn(p.slug === "customer-churn-intelligence-system" && "md:col-span-2")}
              >
                <EpisodeCover project={p} episode={MAIN_ARCS.indexOf(p) + 1} />
              </li>
            ))}
          </ul>
        </>
      )}
      {side.length > 0 && (
        <>
          <h3 className="mt-10 font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Side stories
          </h3>
          <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {side.map((p) => (
              <li key={p.slug}>
                <EpisodeCover
                  project={p}
                  episode={MAIN_ARCS.length + SIDE_STORIES.indexOf(p) + 1}
                  size="sm"
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/* ---------- Ch.3 Churn Lab ---------- */

const ChurnLab = lazy(() => import("@/components/lab/ChurnLab"));

export function LabChapter() {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (e) => {
        if (e.some((x) => x.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "800px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref}>
      <p className="max-w-3xl text-muted-foreground">
        His Bluemind capstone, live. This is the real LightGBM model from the internship, running in
        your browser: score a customer and see why, try to save one with retention offers, or move
        the alert threshold and watch the trade-off. Predictions, not proven causes.
      </p>
      <p className="mt-4 max-w-3xl text-sm text-muted-foreground">
        <b className="text-foreground">How this runs:</b> Abhishek's real LightGBM model (150 trees) is exported to JSON
        and evaluated in TypeScript in your browser, with SHAP explanations computed the same way LightGBM does. Its
        predictions match the Python model within 0.000001 on all 1,409 held-out customers. Test ROC-AUC 0.847
        (cross-validated 0.849); at his alert threshold it catches 82% of churners. Data: IBM's public Telco Customer
        Churn dataset.
      </p>
      <div className="mt-6">
        {near ? (
          <Suspense fallback={<LabPlaceholder />}>
            <ChurnLab />
          </Suspense>
        ) : (
          <LabPlaceholder />
        )}
      </div>
    </div>
  );
}

function LabPlaceholder() {
  return (
    <Panel chapter="lab" tone="wash" className="flex min-h-64 items-center justify-center p-6">
      <Screentone />
      <p className="relative font-mono text-sm text-muted-foreground">loading the Churn Lab…</p>
      <noscript>
        <p className="relative mt-2 text-sm">The live model needs JavaScript; the numbers above are from the same model.</p>
      </noscript>
    </Panel>
  );
}

/* ---------- Ch.4 Stat Sheet ---------- */

const TIERS = [
  {
    tier: "S",
    label: "Proficient",
    items: [
      "Python",
      "NumPy",
      "Pandas",
      "Scikit-learn (Pipelines, ColumnTransformer, CV)",
      "Git",
      "Linear Algebra",
      "Calculus",
    ],
  },
  {
    tier: "A",
    label: "Intermediate",
    items: [
      "XGBoost",
      "LightGBM",
      "Matplotlib / Seaborn",
      "Streamlit",
      "SQL",
      "DSA",
      "Probability & Statistics",
    ],
  },
  { tier: "B", label: "Learning / basics", items: ["PyTorch", "FastAPI", "Discrete Mathematics"] },
];

export function StatSheet() {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-4">
        {TIERS.map((t) => (
          <Panel
            key={t.tier}
            chapter="stats"
            tone="wash"
            className="grid grid-cols-[4.5rem_1fr] items-stretch p-0"
          >
            <div className="flex flex-col items-center justify-center border-r-2 border-line bg-foreground py-4 text-background">
              <span className="font-display text-4xl font-extrabold leading-none">{t.tier}</span>
              <span className="mt-1 font-mono text-[10px] uppercase tracking-widest">tier</span>
            </div>
            <div className="p-4">
              <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                {t.label}
              </div>
              <ul className="mt-2 flex flex-wrap gap-2">
                {t.items.map((i) => (
                  <li
                    key={i}
                    className="rounded-md border-2 border-line bg-paper px-2.5 py-0.5 text-sm"
                  >
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          </Panel>
        ))}
      </div>
      <Bubble from="right" className="self-start">
        <p className="text-sm">
          "I'm not claiming production experience with PyTorch or FastAPI yet. That's the next
          layer, on purpose. For web stuff I use AI as a copilot; my own focus stays on the
          algorithms."
        </p>
      </Bubble>
    </div>
  );
}

/* ---------- Ch.5 Live Activity, Ch.6 Ask ---------- */

export function LiveActivity() {
  return (
    <div>
      <p className="max-w-2xl text-muted-foreground">
        Pulled from GitHub, cached for 10 minutes. Not hardcoded: it's what he actually pushed.
      </p>
      <Panel chapter="activity" tone="wash" className="mt-6 p-4 sm:p-6">
        <GithubLive />
      </Panel>
    </div>
  );
}

export function AskPanel() {
  return (
    <div>
      <p className="max-w-2xl text-muted-foreground">
        In a hurry? Ask the assistant. It only knows his résumé, projects and a few personal notes
        he wrote, so the answers stay grounded.
      </p>
      <Panel chapter="ask" tone="wash" className="mx-auto mt-6 max-w-3xl p-2 sm:p-4">
        <AskAbhishek />
      </Panel>
    </div>
  );
}

/* ---------- Side quest ---------- */

export function SideQuest() {
  return (
    <Link
      to="/anime"
      onClick={() => track("cta_click", "anime_shelf")}
      className="group block focus-visible:outline-3 focus-visible:outline-[var(--primary)]"
    >
      <Panel chapter="sidequest" tone="wash" className="relative p-6 sm:p-10">
        <SpeedLines className="opacity-15" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-widest text-primary">
              Off the clock
            </p>
            <h3 className="mt-3 font-display text-4xl font-extrabold sm:text-5xl">
              Abhi's Anime Shelf
            </h3>
            <p className="mt-4 text-muted-foreground">
              Every anime he has finished, shelved in 3D. Ask the shelf for a pick by mood, or leave
              him a recommendation.
            </p>
          </div>
          <span className="font-mono text-sm font-bold uppercase tracking-widest text-primary">
            Open the shelf{" "}
            <span className="inline-block transition group-hover:translate-x-1">→</span>
          </span>
        </div>
      </Panel>
    </Link>
  );
}
