/**
 * The destination chapters (DESIGN §4.7). Each opens with a full-width splash panel. All words are server HTML;
 * the interactive parts (Churn Lab, Ask, GitHub, Breslau) hydrate on the client.
 * Facts only from src/lib/facts.ts, src/lib/projects.ts, ml/README.md and src/lib/assistant-context.ts.
 */
import { Link } from "@tanstack/react-router";
import { Chess, type Square } from "chess.js";
import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import portrait from "@/assets/abhishek-portrait.jpg.asset.json";
import { MAIL_INTENTS, mailto } from "@/lib/contact";
import { PERSON } from "@/lib/facts";
import { MARSHALL, checkFinaleMove } from "@/lib/chess/marshall";
import { MAIN_ARCS, PROJECTS, SIDE_STORIES, type ProjectEntry } from "@/lib/projects";
import { firstShotUrl } from "@/lib/shots";
import type { HeroId, SectionId } from "@/world/sequence";
import { choosePiece } from "@/world/Stage";
import { InkSort } from "./algorithms/InkSort";
import { COPY, HERO_LABEL, SPLASH } from "./copy";
import { Board as InkBoard } from "./InkBoard";
import { QuickFacts } from "./QuickFacts";

const ChurnLab = lazy(() => import("./lab/ChurnLab"));
// Heavy client islands load when scrolled near, keeping them out of the homepage's first JavaScript.
const AskAbhishek = lazy(() => import("./AskAbhishek").then((m) => ({ default: m.AskAbhishek })));
const GithubLive = lazy(() => import("./GithubLive").then((m) => ({ default: m.GithubLive })));

/* ---------- shared ---------- */

function Splash({ id, hero, kicker }: { id: SectionId; hero?: HeroId; kicker: string }) {
  const s = SPLASH[id]!;
  return (
    <header className="chapter-splash relative mb-14 px-[var(--gutter)] py-[12vh] sm:py-[16vh]">
      <div aria-hidden="true" className="speed-lines absolute inset-0 opacity-70" />
      <div
        aria-hidden="true"
        className="screentone screentone-fade absolute left-0 top-0 h-2/3 w-1/3 opacity-25"
      />
      <div className="relative mx-auto max-w-[1440px]">
        <p className="font-hud text-[11px] text-grey-4">
          {s.plate} · <span className="text-paper">{kicker}</span>
        </p>
        <h2 className="mt-4 font-display text-[clamp(3.6rem,13vw,12rem)] leading-[0.84] text-paper">
          {s.title}
        </h2>
        {s.line && <p className="word-reveal mt-6 max-w-[36rem] text-lg text-grey-4">{s.line}</p>}
        {hero && (
          <button
            type="button"
            onClick={() => choosePiece(hero)}
            className="hud-link mt-8 text-paper"
          >
            <span aria-hidden="true">{HERO_LABEL[hero].glyph}</span> Replay the{" "}
            {HERO_LABEL[hero].piece.toLowerCase()}
          </button>
        )}
      </div>
    </header>
  );
}

function Chapter({
  id,
  children,
  className = "",
}: {
  id: SectionId;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`relative scroll-mt-0 pb-[14vh] ${className}`}>
      {children}
    </section>
  );
}

const Wrap = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`mx-auto max-w-[1440px] px-[var(--gutter)] ${className}`}>{children}</div>
);

/** Loads a heavy client island only when it comes near the viewport. */
function WhenNear({ children, placeholder }: { children: ReactNode; placeholder: ReactNode }) {
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
      { rootMargin: "900px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref}>{near ? children : placeholder}</div>;
}

/* ---------- Chapter 1 · ML + Churn Lab (knight) ---------- */

const ML_SPEC = [
  "Predictions, not proven causes.",
  "His real LightGBM model (150 trees) is exported to JSON and runs in your browser, with SHAP explanations.",
  "Its predictions match the Python model within 0.000001 on all 1,409 held-out customers.",
  "Test ROC-AUC 0.847 (cross-validated 0.849). At his alert threshold it catches 82% of churners.",
  "Data: IBM's public Telco Customer Churn dataset.",
];

function MLChapter() {
  return (
    <Chapter id="ml">
      <Splash id="ml" hero="knight" kicker="ML + Churn Lab" />
      <Wrap className="grid gap-10 lg:grid-cols-[22rem_1fr]">
        <aside className="panel h-max p-5">
          <p className="font-hud text-[11px] text-grey-4">SPEC SHEET · CHURN LAB</p>
          <ul className="mt-3 space-y-3 text-sm">
            {ML_SPEC.map((l) => (
              <li key={l} className="flex gap-2">
                <span aria-hidden="true" className="text-blue-core">
                  ▸
                </span>
                {l}
              </li>
            ))}
          </ul>
          <Link
            to="/projects/$slug"
            params={{ slug: "customer-churn-intelligence-system" }}
            className="hud-link mt-5 inline-block text-paper"
          >
            Read the Customer Churn Intelligence System episode →
          </Link>
        </aside>
        <WhenNear
          placeholder={
            <div className="panel flex min-h-72 items-center justify-center p-6">
              <p className="font-hud text-[11px] text-grey-4">loading the Churn Lab…</p>
              <noscript>
                <p className="mt-2 text-sm">
                  The live model needs JavaScript; the numbers beside it are from the same model.
                </p>
              </noscript>
            </div>
          }
        >
          <Suspense
            fallback={
              <div className="panel min-h-72 p-6 font-hud text-[11px] text-grey-4">
                loading the Churn Lab…
              </div>
            }
          >
            <ChurnLab />
          </Suspense>
        </WhenNear>
      </Wrap>
    </Chapter>
  );
}

/* ---------- Chapter 2 · Products (rook): five volumes ---------- */

function Volume({ p, n }: { p: ProjectEntry; n: number }) {
  const art = p.images?.[0] ? firstShotUrl(p.images[0]) : undefined;
  return (
    <li className="volume">
      <Link
        to="/projects/$slug"
        params={{ slug: p.slug }}
        className="block focus-visible:outline-none"
      >
        <div className="volume-book border-2 border-paper bg-ink">
          <div className="flex items-center justify-between border-b-2 border-paper px-3 py-2 font-hud text-[10px]">
            <span>VOL. {n}</span>
            <span className="text-grey-4">{p.year}</span>
          </div>
          <div className="halftone relative aspect-[4/3] overflow-hidden border-b-2 border-paper bg-grey-1">
            {art ? (
              <img
                src={art}
                alt={`${p.title}: screenshot`}
                width={800}
                height={600}
                loading="lazy"
                className="h-full w-full object-cover object-top"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span aria-hidden="true" className="font-display text-[7rem] text-paper">
                  0.847
                </span>
              </div>
            )}
          </div>
          <div className="p-4">
            <h3 className="font-sfx text-xl leading-tight text-paper">{p.title}</h3>
            <p className="mt-2 text-sm text-grey-4">{p.hook}</p>
            {p.metrics.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {p.metrics.slice(0, 3).map((m) => (
                  <li
                    key={m.label}
                    className="border border-grey-2 px-2 py-0.5 font-hud text-[10px] normal-case tracking-[0.06em]"
                  >
                    <b className="text-paper">{m.value}</b> {m.label}
                  </li>
                ))}
              </ul>
            )}
            {p.client && (
              <p className="mt-3 font-hud text-[10px] text-orange-core">Paid client project</p>
            )}
            <p className="mt-4 font-hud text-[11px] text-paper">
              Read the {p.title} episode <span aria-hidden="true">→</span>
            </p>
          </div>
        </div>
      </Link>
    </li>
  );
}

function ProductsChapter() {
  return (
    <Chapter id="products">
      <Splash id="products" hero="rook" kicker="Products" />
      <Wrap>
        <ul className="grid gap-x-10 gap-y-14 sm:grid-cols-2 xl:grid-cols-3">
          {MAIN_ARCS.map((p, i) => (
            <Volume key={p.slug} p={p} n={i + 1} />
          ))}
        </ul>
        <h3 className="mt-20 font-hud text-[11px] text-grey-4">SIDE STORIES</h3>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SIDE_STORIES.map((p) => (
            <li key={p.slug}>
              <Link to="/projects/$slug" params={{ slug: p.slug }} className="map-card">
                <span className="block font-sfx text-base text-paper">{p.title}</span>
                <span className="mt-1 block text-[13px] text-grey-4">{p.hook}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Wrap>
    </Chapter>
  );
}

/* ---------- Chapter 3 · Algorithms (bishop) ---------- */

function AlgorithmsChapter() {
  const algos = PROJECTS.filter((p) => p.kind === "algo");
  return (
    <Chapter id="algorithms">
      <Splash id="algorithms" hero="bishop" kicker="Algorithms" />
      <Wrap className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
        <InkSort />
        <ul className="grid content-start gap-5">
          {algos.map((p) => (
            <li key={p.slug}>
              <Link to="/projects/$slug" params={{ slug: p.slug }} className="map-card">
                <span className="font-hud text-[10px] text-grey-3">SIDE STORY · {p.year}</span>
                <span className="mt-1 block font-sfx text-xl text-paper">{p.title}</span>
                <span className="mt-1 block text-sm text-grey-4">{p.hook}</span>
                <span className="mt-3 block font-hud text-[11px] text-paper">
                  Read the {p.title} episode <span aria-hidden="true">→</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Wrap>
    </Chapter>
  );
}

/* ---------- Chapter 4 · Skills + Résumé (pawn → queen) ---------- */

const TIERS = [
  {
    tier: "B",
    piece: "♟",
    label: "Learning",
    items: ["PyTorch", "FastAPI", "Discrete Mathematics"],
  },
  {
    tier: "A",
    piece: "♞",
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
  {
    tier: "S",
    piece: "♛",
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
];

function SkillsChapter() {
  return (
    <Chapter id="skills">
      <Splash id="skills" hero="pawn" kicker="Skills + Résumé" />
      <Wrap className="grid gap-10 lg:grid-cols-[1fr_22rem]">
        <ol className="space-y-5">
          {TIERS.map((t, i) => (
            <li
              key={t.tier}
              className="panel grid grid-cols-[5.5rem_1fr] p-0"
              style={{ marginLeft: `${i * 6}%` }}
            >
              <div className="flex flex-col items-center justify-center border-r-2 border-paper bg-paper py-4 text-ink">
                <span aria-hidden="true" className="text-3xl leading-none">
                  {t.piece}
                </span>
                <span className="font-display text-5xl leading-none">{t.tier}</span>
                <span className="font-hud text-[9px]">tier</span>
              </div>
              <div className="p-4">
                <p className="font-hud text-[11px] text-grey-4">{t.label}</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {t.items.map((s) => (
                    <li key={s} className="border border-grey-2 px-2.5 py-0.5 text-sm">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
        <div className="space-y-8">
          <p className="bubble bubble-right text-sm">
            &ldquo;I&apos;m not claiming production experience with PyTorch or FastAPI yet.
            That&apos;s the next layer, on purpose.&rdquo;
          </p>
          <Link to="/resume" className="ink-btn">
            Read the résumé <span aria-hidden="true">→</span>
          </Link>
        </div>
      </Wrap>
    </Chapter>
  );
}

/* ---------- Chapter 5 · About (king): ORIGIN as a manga page ---------- */

const ORIGIN = [
  {
    title: "Mangaluru → Mysuru",
    body: "Born in Mangalore with Tulu at home, raised in Mysuru. Speaks Tulu, Kannada, Hindi and English.",
  },
  {
    title: "Maths first",
    body: "No dramatic origin story: he loves maths, so he followed it into AI and ML. Then physics.",
  },
  {
    title: `B.E. AI & ML · GPA ${PERSON.gpa}`,
    body: `${PERSON.university}, ${PERSON.years}. Semester GPAs 9.40, 9.30, 9.23, 9.82.`,
  },
  {
    title: "Bluemind Solutions, 2026",
    body: "A 4-week, ~120-hour Core AI & ML internship. His capstone churn model runs live in Chapter 1.",
  },
  { title: "How he builds", body: COPY.honesty },
];

function AboutChapter() {
  return (
    <Chapter id="about">
      <Splash id="about" hero="king" kicker="About Abhishek" />
      <Wrap className="grid gap-5 md:grid-cols-6">
        <figure className="panel relative overflow-hidden md:col-span-2 md:row-span-2">
          <div className="halftone h-full">
            <img
              src={portrait.url}
              alt="Portrait of Abhishek Rai A"
              width={800}
              height={1000}
              loading="lazy"
              className="aspect-[4/5] h-full w-full object-cover"
            />
          </div>
          <figcaption className="absolute inset-x-4 bottom-4">
            <p className="bubble text-sm font-semibold">&ldquo;{COPY.quote}&rdquo;</p>
          </figcaption>
        </figure>
        {ORIGIN.map((o, i) => (
          <article
            key={o.title}
            className={`panel p-5 ${i === 4 ? "md:col-span-4" : "md:col-span-2"}`}
          >
            <p className="font-hud text-[10px] text-grey-3">PANEL {i + 2}</p>
            <h3 className="mt-2 font-sfx text-xl text-paper">{o.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-grey-4">{o.body}</p>
          </article>
        ))}
        <div className="md:col-span-6">
          <QuickFacts />
        </div>
      </Wrap>
    </Chapter>
  );
}

/* ---------- Ask + GitHub ---------- */

function AskChapter() {
  return (
    <section id="ask" className="pb-[14vh]">
      <Wrap>
        <p className="font-hud text-[11px] text-grey-4">SIDE PANEL · ASK</p>
        <h2 className="mt-3 font-display text-[clamp(3rem,9vw,7rem)] text-paper">Ask Abhishek</h2>
        <p className="mt-4 max-w-xl text-grey-4">
          In a hurry? Ask. It only knows his résumé, projects and a few notes he wrote.
        </p>
        <div className="mx-auto mt-10 max-w-3xl">
          <WhenNear
            placeholder={
              <div className="panel h-[520px] p-6 font-hud text-[11px] text-grey-4">
                opening the conversation…
              </div>
            }
          >
            <Suspense
              fallback={
                <div className="panel h-[520px] p-6 font-hud text-[11px] text-grey-4">
                  opening the conversation…
                </div>
              }
            >
              <AskAbhishek />
            </Suspense>
          </WhenNear>
        </div>
      </Wrap>
    </section>
  );
}

function GithubChapter() {
  return (
    <section id="github" className="pb-[14vh]">
      <Wrap>
        <p className="font-hud text-[11px] text-grey-4">SIDE PANEL · LIVE</p>
        <h2 className="mt-3 font-display text-[clamp(3rem,9vw,7rem)] text-paper">Live GitHub</h2>
        <p className="mt-4 max-w-xl text-grey-4">
          Pulled from GitHub, cached for 10 minutes. What he actually pushed.
        </p>
        <div className="mt-10">
          <WhenNear
            placeholder={
              <div className="panel p-8 font-hud text-[11px] text-grey-4">
                the city loads as you get close…
              </div>
            }
          >
            <Suspense
              fallback={
                <div className="panel p-8 font-hud text-[11px] text-grey-4">
                  fetching live github data…
                </div>
              }
            >
              <GithubLive />
            </Suspense>
          </WhenNear>
        </div>
      </Wrap>
    </section>
  );
}

/* ---------- Chapter 6 · Contact (queen) ---------- */

function Feathers() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 400 400"
      className="pointer-events-none absolute -right-16 -top-10 h-[420px] w-[420px] opacity-80"
    >
      {Array.from({ length: 9 }, (_, i) => {
        const a = -70 + i * 17;
        return (
          <g key={i} transform={`rotate(${a} 200 380)`}>
            <path
              d="M200 380 C 190 280, 196 170, 200 60 C 204 170, 210 280, 200 380 Z"
              fill="none"
              stroke="#ffc38a"
              strokeWidth="1.5"
            />
            {Array.from({ length: 10 }, (_, k) => (
              <path
                key={k}
                d={`M200 ${90 + k * 26} l ${-18 + k} ${-14} M200 ${90 + k * 26} l ${18 - k} ${-14}`}
                stroke="#ff6a1a"
                strokeWidth="1"
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

function ContactChapter() {
  return (
    <Chapter id="contact" className="overflow-hidden">
      <Splash id="contact" hero="queen" kicker="Contact / Hire" />
      <Wrap className="relative">
        <Feathers />
        <div className="relative grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <a href={mailto("internship")} className="ink-btn text-base">
              Email about an internship <span aria-hidden="true">→</span>
            </a>
            <ul className="mt-6 flex flex-wrap gap-3">
              {MAIL_INTENTS.filter((m) => m.intent !== "internship").map((m) => (
                <li key={m.intent}>
                  <a href={m.href} className="hud-link text-grey-4 hover:text-paper">
                    {m.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <ul className="space-y-3 font-hud text-[12px]">
            {[
              { label: "GitHub", href: PERSON.github },
              { label: "LinkedIn", href: PERSON.linkedin },
              { label: "Instagram", href: PERSON.instagram },
            ].map((l) => (
              <li key={l.label}>
                <a
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex justify-between border-b-2 border-grey-2 pb-2 text-paper hover:border-blue-fire"
                >
                  <span>{l.label}</span>
                  <span aria-hidden="true">↗</span>
                </a>
              </li>
            ))}
            <li className="pt-2 text-grey-4">
              {PERSON.city}, {PERSON.region}, India · {PERSON.languages.join(" · ")}
            </li>
          </ul>
        </div>
      </Wrap>
    </Chapter>
  );
}

/* ---------- Easter egg · Breslau 1912 ---------- */

function BreslauChapter() {
  const [fen, setFen] = useState<string>(MARSHALL.puzzleFen);
  const [msg, setMsg] = useState<string>(
    "Black to move. Marshall found a queen move that wins on the spot.",
  );
  const [solved, setSolved] = useState(false);
  const [tries, setTries] = useState(0);

  const solve = () => {
    const g = new Chess(MARSHALL.puzzleFen);
    g.move(MARSHALL.solution);
    setFen(g.fen());
    setSolved(true);
    setMsg("23…Qg3!! The queen can be taken three ways, and every capture loses. White resigned.");
  };
  const onMove = (from: Square, to: Square) => {
    if (solved) return;
    const g = new Chess(MARSHALL.puzzleFen);
    let san = "";
    try {
      san = g.move({ from, to, promotion: "q" }).san;
    } catch {
      setMsg("That move isn't legal here. Try again.");
      return;
    }
    const verdict = checkFinaleMove(san);
    if (verdict === "solved") return solve();
    const n = tries + 1;
    setTries(n);
    setMsg(
      n === 1
        ? `${san} is legal, but not the one. Look for a square your queen can reach that three white pieces attack.`
        : `${san} wins slowly. The queen wants g3, right next to White's king.`,
    );
  };

  return (
    <section id="breslau" className="pb-[16vh]">
      <Wrap className="grid items-center gap-10 md:grid-cols-[minmax(0,26rem)_1fr]">
        <div className="relative">
          <InkBoard
            fen={fen}
            orientation="b"
            highlight={solved ? ["c3", "g3"] : ["e5", "c5"]}
            onMove={solved ? undefined : onMove}
            label="Levitsky vs Marshall, Breslau 1912, black to move"
          />
          {solved && (
            <span className="sfx sfx-stamp absolute -right-2 -top-6 text-6xl text-gold">Qg3!!</span>
          )}
        </div>
        <div>
          <p className="font-hud text-[11px] text-grey-4">FLASHBACK · AFTER THE LAST PAGE</p>
          <h2 className="mt-3 font-display text-[clamp(3rem,9vw,7rem)] text-paper">
            Breslau, 1912
          </h2>
          <p className="mt-4 max-w-lg text-grey-4">
            Levitsky against Marshall, his favourite game. Legend says the crowd showered the board
            with gold coins. Play black and find it.
          </p>
          <p className="mt-5 border-2 border-grey-2 bg-grey-1 p-3 text-sm" aria-live="polite">
            {msg}
          </p>
          {!solved && (
            <button type="button" onClick={solve} className="hud-link mt-4 text-paper">
              Show me the move
            </button>
          )}
        </div>
      </Wrap>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t-2 border-paper px-[var(--gutter)] py-14">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-end justify-between gap-8">
        <div>
          <p className="font-brush text-2xl text-paper">&ldquo;{COPY.quote}&rdquo;</p>
          <p className="mt-3 max-w-xl text-sm text-grey-4">{COPY.honesty}</p>
        </div>
        <nav aria-label="More pages" className="flex flex-wrap gap-5 font-hud text-[11px]">
          <Link to="/resume" className="hud-link">
            Résumé
          </Link>
          <Link to="/anime" className="hud-link">
            Anime shelf
          </Link>
          <Link to="/reviews" className="hud-link">
            Reviews
          </Link>
          <a href="#welcome" className="hud-link">
            Back to the top
          </a>
        </nav>
      </div>
      <p className="mx-auto mt-10 max-w-[1440px] font-hud text-[10px] text-grey-3">
        MADE IN MYSURU · ABHISHEK&apos;S WORLD
      </p>
    </footer>
  );
}

export function Chapters() {
  return (
    <div id="chapters" className="relative z-[25] bg-ink">
      <MLChapter />
      <ProductsChapter />
      <AlgorithmsChapter />
      <SkillsChapter />
      <AboutChapter />
      <AskChapter />
      <GithubChapter />
      <ContactChapter />
      <BreslauChapter />
      <Footer />
    </div>
  );
}
