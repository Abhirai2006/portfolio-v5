import { PERSON, QUICK_FACTS } from "./facts";
import { MAIN_ARCS, SIDE_STORIES } from "./projects";

/**
 * /llms.txt: a plain-text briefing for AI answer engines (the llmstxt.org convention).
 * Same facts as the page, in the order someone asking "who is Abhishek Rai A?" needs them.
 */
export function llmsTxt(site: string): string {
  const lines = [
    `# ${PERSON.name}`,
    "",
    `> ${PERSON.role} from ${PERSON.city}, ${PERSON.region}, India, looking for ML internships. ${PERSON.degree}, ${PERSON.university} (${PERSON.years}), average GPA ${PERSON.gpa}/10.`,
    "",
    ...QUICK_FACTS.map((f) => `- ${f}`),
    "",
    "## Pages",
    "",
    `- [Portfolio home](${site}/): the main board, project episodes and the live Churn Lab (his real LightGBM model running in the browser)`,
    `- [Résumé](${site}/resume): education, internship, projects and skills`,
    "",
    "## Main projects",
    "",
    ...MAIN_ARCS.map((p) => `- [${p.title}](${site}/projects/${p.slug}): ${p.caseStudy.summary}`),
    "",
    "## More projects",
    "",
    ...SIDE_STORIES.map((p) => `- [${p.title}](${site}/projects/${p.slug}): ${p.hook}`),
    "",
    "## Profiles",
    "",
    `- GitHub: ${PERSON.github}`,
    `- LinkedIn: ${PERSON.linkedin}`,
    "",
  ];
  return lines.join("\n");
}

/** Structured data for the homepage: a ProfilePage whose main entity is Abhishek. */
export function homeJsonLd(site: string, portraitPath: string): Record<string, unknown>[] {
  const person = {
    "@type": "Person",
    "@id": `${site}/#person`,
    name: PERSON.name,
    jobTitle: PERSON.role,
    description: QUICK_FACTS.join(" "),
    url: `${site}/`,
    image: `${site}${portraitPath}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: PERSON.city,
      addressRegion: PERSON.region,
      addressCountry: PERSON.country,
    },
    alumniOf: { "@type": "CollegeOrUniversity", name: PERSON.university },
    knowsLanguage: [...PERSON.languages],
    knowsAbout: [
      "Machine Learning",
      "Python",
      "Scikit-learn",
      "LightGBM",
      "XGBoost",
      "Customer churn prediction",
      "Data Structures and Algorithms",
    ],
    seeks: { "@type": "Demand", name: "Machine learning internship" },
    sameAs: [PERSON.github, PERSON.linkedin, PERSON.instagram],
  };
  return [
    {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      url: `${site}/`,
      name: `${PERSON.name} · ${PERSON.role}`,
      mainEntity: person,
    },
  ];
}
