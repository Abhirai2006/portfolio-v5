import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { PERSONAL_CONTEXT, RESUME_CONTEXT } from "@/lib/assistant-context";
import { PERSON, QUICK_FACTS } from "@/lib/facts";

// His rules: never invent facts or numbers, and no salary or package figure anywhere.
describe("the site is honest", () => {
  const everything = [
    RESUME_CONTEXT,
    PERSONAL_CONTEXT,
    QUICK_FACTS.join(" "),
    JSON.stringify(PERSON),
    readFileSync("src/lib/projects.ts", "utf8"),
    readFileSync("src/components/site/Chrome.tsx", "utf8"),
    readFileSync("src/components/forest/ForestStory.tsx", "utf8"),
  ].join(" ");

  test("no salary or package figure anywhere", () => {
    for (const banned of ["lpa", "ctc", "lakh", "salary", "per annum"])
      expect(everything.toLowerCase()).not.toContain(banned);
  });

  test("the facts the homepage shows are the facts in facts.ts", () => {
    expect(PERSON.gpa).toBe("9.44");
    expect(PERSON.city).toBe("Mysuru");
    expect(PERSON.seeking).toBe("ML internships");
  });

  test("the site never claims he built a PC", () => {
    expect(everything.toLowerCase()).not.toMatch(/built (a|his own) pc|pc build/);
  });

  test("the chat describes this site as it really is", () => {
    expect(RESUME_CONTEXT).toContain("real rainforest");
    expect(RESUME_CONTEXT).not.toContain("manhwa");
  });
});
