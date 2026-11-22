import { expect, test } from "bun:test";
import { PERSONAL_CONTEXT, RESUME_CONTEXT } from "@/lib/assistant-context";

// Copied from the v4 chat route: the privacy boundaries must not change.
const BOUNDARIES = "BOUNDARIES (do NOT volunteer these)\n- Do not share family details (father's name, relatives) or his phone number unless the visitor explicitly asks for contact info, in which case give only the email abhirai2006@gmail.com.\n- The \"A\" in Abhishek Rai A stands for Adakastala, a village in Kasaragod, Kerala. Mention only if asked about his name.\n- Never speculate beyond what's written here.";

test("résumé context knows the v5 projects and the internship ask", () => {
  for (const s of ["Ro-Bio", "Earth & Ethos", "paid", "Tally", "1.Nf3", "Marshall", "looking for ML internships"]) {
    expect(RESUME_CONTEXT).toContain(s);
  }
});

test("personal context knows TBATE and that maths comes first", () => {
  expect(PERSONAL_CONTEXT).toContain("The Beginning After the End");
  expect(PERSONAL_CONTEXT).toContain("maths");
});

test("no salary or package figure anywhere", () => {
  for (const banned of ["LPA", "CTC", "per annum", "lakh"]) {
    expect(RESUME_CONTEXT + PERSONAL_CONTEXT).not.toContain(banned);
  }
});

test("privacy boundaries are byte-identical to v4", () => {
  expect(PERSONAL_CONTEXT).toContain(BOUNDARIES);
});
