import { createFileRoute, Link } from "@tanstack/react-router";
import { mailto, CONTACT_EMAIL } from "@/lib/contact";
import { MAIN_ARCS, SIDE_STORIES } from "@/lib/projects";
import { QUICK_FACTS } from "@/lib/facts";
import { PageNav } from "@/components/site/Chrome";
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
          address: {
            "@type": "PostalAddress",
            addressLocality: "Mysuru",
            addressRegion: "Karnataka",
            addressCountry: "IN",
          },
          alumniOf: {
            "@type": "CollegeOrUniversity",
            name: "Mysore University School of Engineering",
          },
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
    <div className="page resume">
      <PageNav />
      <main className="page-wrap" style={{ maxWidth: 860 }}>
        <header className="ink-box" style={{ marginBottom: 28 }}>
          <p className="page-kicker">Résumé</p>
          <h1 className="page-title" style={{ fontSize: "clamp(40px, 7vw, 72px)" }}>
            Abhishek Rai A
          </h1>
          <p style={{ margin: "0 0 10px" }}>
            Aspiring Machine Learning Engineer · Mysuru, Karnataka, India ·{" "}
            <b>Seeking ML internships</b>
          </p>
          <p
            style={{
              margin: 0,
              display: "flex",
              flexWrap: "wrap",
              gap: "4px 16px",
              fontFamily: "var(--mono)",
              fontSize: 13,
            }}
          >
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            <a href="https://github.com/Abhirai2006" target="_blank" rel="noreferrer">
              github.com/Abhirai2006
            </a>
            <a
              href="https://www.linkedin.com/in/abhishek-rai-a-00067238b/"
              target="_blank"
              rel="noreferrer"
            >
              linkedin.com/in/abhishek-rai-a
            </a>
          </p>
          <div className="case-actions no-print" style={{ margin: "16px 0 0" }}>
            <a href={mailto("internship")} className="btn-ink primary">
              Email about an internship
            </a>
            <a href={PDF} target="_blank" rel="noreferrer" className="btn-ink">
              PDF version ↗
            </a>
            <button type="button" className="btn-ink" onClick={() => window.print()}>
              Print
            </button>
          </div>
        </header>

        <Block title="Profile">
          <p>
            B.E. student in Artificial Intelligence &amp; Machine Learning in the fifth semester
            with a 9.44/10 average GPA. Recently finished a 4-week (~120 hour) Core AI &amp; ML
            internship at Bluemind Solutions, where he shipped a Customer Churn Intelligence System
            with LightGBM and Streamlit.
          </p>
        </Block>

        <Block title="Quick facts">
          <ul>
            {QUICK_FACTS.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </Block>

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
          <p style={{ fontFamily: "var(--mono)", fontSize: 12.5, margin: "-4px 0 12px" }}>
            Semester GPA: 1st 9.400 · 2nd 9.300 · 3rd 9.227 · 4th 9.818 · Average 9.436
          </p>
          <Row
            left="Certification in AI & Data Science"
            right="Ongoing"
            sub="DRISHTI CPS Foundation, IIT Indore · ML fundamentals, workflows, applied AI"
          />
        </Block>

        <Block title="Skills">
          <SkillRow
            label="Proficient"
            items={[
              "Python",
              "NumPy",
              "Pandas",
              "Scikit-learn (Pipelines, ColumnTransformer, CV)",
              "Git",
              "Linear Algebra",
              "Calculus",
            ]}
          />
          <SkillRow
            label="Intermediate"
            items={[
              "XGBoost",
              "LightGBM",
              "Matplotlib / Seaborn",
              "Streamlit",
              "SQL",
              "DSA",
              "Probability & Statistics",
            ]}
          />
          <SkillRow
            label="Learning / Basics"
            items={["PyTorch", "FastAPI", "Discrete Mathematics"]}
          />
          <SkillRow
            label="Web"
            items={["React", "TypeScript", "TanStack Start", "Supabase", "Tailwind CSS"]}
          />
        </Block>

        <Block title="Projects">
          {MAIN_ARCS.map((p) => (
            <div key={p.slug} style={{ marginBottom: 16 }}>
              <p
                style={{
                  margin: 0,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <Link
                  to="/projects/$slug"
                  params={{ slug: p.slug }}
                  style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: 20 }}
                >
                  {p.title}
                  {p.client ? " (paid client project)" : ""}
                </Link>
                <span style={{ fontFamily: "var(--mono)", fontSize: 12 }}>{p.year}</span>
              </p>
              <p style={{ margin: "2px 0" }}>{p.caseStudy.summary}</p>
              <p style={{ margin: 0, fontFamily: "var(--mono)", fontSize: 12 }}>
                {p.metrics.map((m) => `${m.value} ${m.label}`).join(" · ")}
              </p>
            </div>
          ))}
          <h3
            style={{
              fontFamily: "var(--ui)",
              fontSize: 12,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            Also built
          </h3>
          <ul>
            {SIDE_STORIES.map((p) => (
              <li key={p.slug}>
                <Link to="/projects/$slug" params={{ slug: p.slug }}>
                  <b>{p.title}</b>
                </Link>
                : {p.hook}
              </li>
            ))}
          </ul>
        </Block>

        <Block title="Languages">
          <p>Tulu (mother tongue) · Kannada · Hindi · English</p>
        </Block>

        <Block title="How I work">
          <p>
            Night owl, peak hours 10 pm to 6 am. I use AI copilots deliberately for the web layer so
            my own hours go into the algorithms and the maths.
          </p>
        </Block>
      </main>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 26 }}>
      <h2
        className="page-kicker"
        style={{ borderBottom: "2px solid var(--ink)", paddingBottom: 6 }}
      >
        {title}
      </h2>
      <div>{children}</div>
    </section>
  );
}

function Row({ left, right, sub }: { left: string; right: string; sub: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <p
        style={{
          margin: 0,
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <b style={{ fontFamily: "var(--display)", fontSize: 18 }}>{left}</b>
        <span style={{ fontFamily: "var(--mono)", fontSize: 12 }}>{right}</span>
      </p>
      <p style={{ margin: 0 }}>{sub}</p>
    </div>
  );
}

function SkillRow({ label, items }: { label: string; items: string[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 140px) 1fr",
        gap: 8,
        marginBottom: 8,
      }}
    >
      <b
        style={{ fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", paddingTop: 4 }}
      >
        {label}
      </b>
      <ul className="chips" style={{ margin: 0 }}>
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}
