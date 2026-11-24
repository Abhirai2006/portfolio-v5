import { expect, test } from "bun:test";
import { homeJsonLd, llmsTxt } from "@/lib/seo";
import { MAIN_ARCS } from "@/lib/projects";

const SITE = "https://portfolio.abhirai2006.workers.dev";

test("/llms.txt introduces Abhishek and links the key pages", () => {
  const t = llmsTxt(SITE);
  expect(t.startsWith("# Abhishek Rai A")).toBe(true);
  expect(t).toContain(`${SITE}/`);
  expect(t).toContain(`${SITE}/resume`);
  for (const p of MAIN_ARCS) expect(t).toContain(`${SITE}/projects/${p.slug}`);
  expect(t).toContain("looking for ML internships");
});

test("home JSON-LD is a ProfilePage about a Person with GitHub and LinkedIn", () => {
  const blocks = homeJsonLd(SITE, "/media/abhishek-portrait.jpg");
  const page = blocks.find((b) => b["@type"] === "ProfilePage") as Record<string, any>;
  expect(page).toBeDefined();
  expect(page.mainEntity["@type"]).toBe("Person");
  expect(page.mainEntity.sameAs).toContain("https://github.com/Abhirai2006");
  expect(page.mainEntity.sameAs).toContain("https://www.linkedin.com/in/abhishek-rai-a-00067238b/");
  expect(JSON.parse(JSON.stringify(blocks))).toEqual(blocks);
});

test("no salary figure in anything search or AI engines read", () => {
  const all = llmsTxt(SITE) + JSON.stringify(homeJsonLd(SITE, "/x.jpg"));
  for (const banned of ["LPA", "CTC", "per annum", "lakh"]) expect(all).not.toContain(banned);
});
