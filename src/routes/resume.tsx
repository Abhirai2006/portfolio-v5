import { createFileRoute, Link } from "@tanstack/react-router";
import { Nav } from "@/components/portfolio/Nav";
import { mailto, CONTACT_EMAIL } from "@/lib/contact";
import { MAIN_ARCS, SIDE_STORIES } from "@/lib/projects";
import { QuickFacts } from "@/components/v5/QuickFacts";
import ogCover from "@/assets/og-cover.jpg.asset.json";

import { SITE } from "@/lib/site";
const PDF = "https://drive.google.com/file/d/1OaO_nbj7jrrgJY1JGp3CSh798Vh_rf8w/view?usp=sharing";

export const Route = createFileRoute("/resume")({
  head: () => ({
    meta: [
      { title: "Résumé | Abhishek Rai A · Aspiring ML Engineer" },
      {
        name: "description",
        content:
          "Résumé of Abhishek Rai A, an aspiring machine learning engineer looking for ML internships. B.E. in AI & ML at Mysore University (GPA 9.44/10), Bluemind Solutions AI & ML intern, projects, skills and contact details.",
      },
      { property: "og:title", content: "Résumé | Abhishek Rai A · Aspiring ML Engineer" },
      {
        property: "og:description",
        content:
          "Aspiring ML engineer looking for ML internships. B.E. AI & ML, GPA 9.44/10, Bluemind Solutions AI & ML intern, a live churn model and a paid client project.",
      },
      { property: "og:type", content: "profile" },
      { property: "og:url", content: `${SITE}/resume` },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: `${SITE}${ogCover.url}` },
      { name: "twitter:image", content: `${SITE}${ogCover.url}` },
    ],
    links: [{ rel: "canonical", href: `${SITE}/resume` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Person",
          name: "Abhishek Rai A",
          jobTitle: "Aspiring Machine Learning Engineer",
          url: `${SITE}/resume`,
          address: { "@type": "PostalAddress", addressLocality: "Mysuru", addressRegion: "Karnataka", addressCountry: "IN" },
          alumniOf: { "@type": "CollegeOrUniversity", name: "Mysore University School of Engineering" },
          knowsLanguage: ["Tulu", "Kannada", "Hindi", "English"],
          sameAs: [
             SITE,
            "https://github.com/Abhirai2006",
            "https://www.linkedin.com/in/abhishek-rai-a-00067238b/",
          ],
        }),
      },
    ],
  }),
  component: ResumePage,
});

function ResumePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="mx-auto max-w-3xl px-6 pt-32 pb-24 print:max-w-none print:px-0 print:pt-0 print:pb-0 print:text-[11px] print:leading-snug">
        <Link to="/" className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-primary print:hidden">
          ← Back to portfolio
        </Link>

        <header className="mt-8 border-b border-border pb-8 print:mt-0 print:pb-3">
          <h1 className="font-display text-4xl sm:text-5xl font-semibold">Abhishek Rai A</h1>
          <p className="mt-2 text-muted-foreground">
            Aspiring Machine Learning Engineer · Mysuru, Karnataka, India ·{" "}
            <span className="font-semibold text-foreground">Seeking ML internships</span>
          </p>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm font-mono text-muted-foreground">
            <a className="hover:text-primary" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            <a className="hover:text-primary" href="https://github.com/Abhirai2006" target="_blank" rel="noreferrer">github.com/Abhirai2006</a>
            <a className="hover:text-primary" href="https://www.linkedin.com/in/abhishek-rai-a-00067238b/" target="_blank" rel="noreferrer">linkedin.com/in/abhishek-rai-a</a>
          </div>
          <div className="mt-6 flex flex-wrap gap-3 print:hidden">
            <a href={mailto("internship")} className="rounded-full border-2 border-line bg-primary text-primary-foreground px-5 py-2.5 text-sm font-bold hover:opacity-90">
              Hire me →
            </a>
            <a href={PDF} target="_blank" rel="noreferrer" className="rounded-full border border-border px-5 py-2.5 text-sm hover:border-primary hover:text-primary">
              PDF version ↗
            </a>
            <button
              onClick={() => window.print()}
              className="rounded-full border border-border px-5 py-2.5 text-sm hover:border-primary hover:text-primary"
            >
              Print
            </button>
          </div>
        </header>

        <Block title="Profile">
          <p className="text-muted-foreground leading-relaxed">
             B.E. student in Artificial Intelligence &amp; Machine Learning in the fifth semester with a 9.44/10 average GPA.
             Recently finished a 4-week (~120 hour) Core AI &amp; ML internship at Bluemind Solutions, where he
             shipped a Customer Churn Intelligence System with LightGBM and Streamlit.
          </p>
        </Block>

        <div className="mt-8 print:hidden">
          <QuickFacts />
        </div>

        <Block title="Experience">
          <Row
            left="Core AI & ML Intern, Bluemind Solutions Pvt. Ltd."
            right="Aug to Sep 2026"
            sub="4 weeks, ~120 hours · Capstone: Customer Churn Intelligence System (IBM Telco data): leak-free scikit-learn pipeline, Logistic Regression / Random Forest / XGBoost / LightGBM comparison with stratified 5-fold CV, business-cost threshold, SHAP explanations, Streamlit dashboard. LightGBM: 0.849 CV ROC-AUC, 0.847 test ROC-AUC, 82% churner recall."
          />
        </Block>

        <Block title="Education">
          <Row
            left="B.E. in Artificial Intelligence & Machine Learning"
            right="2024 to 2028"
             sub="Mysore University School of Engineering · Average GPA 9.44 / 10 · V Semester"
          />
          <p className="-mt-2 mb-4 font-mono text-xs text-muted-foreground">
            Semester GPA: 1st 9.400 · 2nd 9.300 · 3rd 9.227 · 4th 9.818 · Average 9.436
          </p>
          <Row
            left="Certification in AI & Data Science"
            right="Ongoing"
            sub="DRISHTI CPS Foundation, IIT Indore · ML fundamentals, workflows, applied AI"
          />
        </Block>

        <Block title="Skills">
           <SkillRow label="Proficient" items={["Python", "NumPy", "Pandas", "Scikit-learn (Pipelines, ColumnTransformer, CV)", "Git", "Linear Algebra", "Calculus"]} />
           <SkillRow label="Intermediate" items={["XGBoost", "LightGBM", "Matplotlib / Seaborn", "Streamlit", "SQL", "DSA", "Probability & Statistics"]} />
           <SkillRow label="Learning / Basics" items={["PyTorch", "FastAPI", "Discrete Mathematics"]} />
          <SkillRow label="Web" items={["React", "TypeScript", "TanStack Start", "Supabase", "Tailwind CSS"]} />
        </Block>

        <Block title="Projects">
          <div className="space-y-6 print:space-y-2.5">
            {MAIN_ARCS.map((p) => (
              <div key={p.slug}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <Link
                    to="/projects/$slug"
                    params={{ slug: p.slug }}
                    className="font-display text-lg font-bold hover:text-primary"
                  >
                    {p.title}
                    {p.client ? " (paid client project)" : ""}{" "}
                    <span className="text-xs font-mono text-muted-foreground print:hidden">· episode →</span>
                  </Link>
                  <span className="text-xs font-mono text-muted-foreground">{p.year}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{p.caseStudy.summary}</p>
                <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs font-mono text-muted-foreground">
                  {p.metrics.map((m) => (
                    <li key={m.label}>
                      <span className="text-primary">{m.value}</span> {m.label}
                    </li>
                  ))}
                </ul>
                <div className="mt-1 text-xs font-mono text-muted-foreground print:hidden">{p.caseStudy.stack.join(" · ")}</div>
              </div>
            ))}
            <div>
              <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Also built</h3>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {SIDE_STORIES.map((p) => (
                  <li key={p.slug}>
                    <Link to="/projects/$slug" params={{ slug: p.slug }} className="font-semibold text-foreground hover:text-primary">
                      {p.title}
                    </Link>
                    : {p.hook}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Block>

        <Block title="Languages">
          <p className="text-muted-foreground">Tulu (mother tongue) · Kannada · Hindi · English</p>
        </Block>

        <Block title="How I work">
          <p className="text-muted-foreground leading-relaxed">
            Night owl, ships fast, iterates in public. I use AI copilots deliberately for the web layer so my own hours
            go into the algorithms and the maths. Goal: one small ML system shipped every month.
          </p>
        </Block>
      </main>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10 print:mt-4">
      <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-primary">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function Row({ left, right, sub }: { left: string; right: string; sub: string }) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-display text-lg">{left}</span>
        <span className="text-xs font-mono text-muted-foreground">{right}</span>
      </div>
      <div className="text-sm text-muted-foreground">{sub}</div>
    </div>
  );
}

function SkillRow({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="grid sm:grid-cols-[130px_1fr] gap-2">
      <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground pt-1">{label}</div>
      <div className="flex flex-wrap gap-2">
        {items.map((i) => (
          <span key={i} className="rounded-md bg-secondary border border-border px-2.5 py-0.5 text-sm font-mono">
            {i}
          </span>
        ))}
      </div>
    </div>
  );
}
