import { describe, expect, test } from "bun:test";
import { MAIN_ARCS, PROJECTS, SIDE_STORIES, getProject } from "@/lib/projects";
import { PERSON, QUICK_FACTS } from "@/lib/facts";

const slugs = (list: { slug: string }[]) => list.map((p) => p.slug);

describe("arcs", () => {
  test("main arcs in recruiter order", () => {
    expect(slugs(MAIN_ARCS)).toEqual([
      "customer-churn-intelligence-system",
      "muse-students-voice",
      "arthra",
      "ro-bio",
      "earth-and-ethos",
    ]);
  });

  test("side stories", () => {
    expect(slugs(SIDE_STORIES)).toEqual([
      "o-patience",
      "binary-search-visualizer",
      "ittige",
      "git-github-viva-prep",
      "lab-programs",
      "cpp-console-suite",
      "wonderland",
    ]);
  });

  test("PROJECTS is main arcs then side stories, slugs unique, no logbook", () => {
    expect(slugs(PROJECTS)).toEqual([...slugs(MAIN_ARCS), ...slugs(SIDE_STORIES)]);
    expect(new Set(slugs(PROJECTS)).size).toBe(PROJECTS.length);
    expect(slugs(PROJECTS)).not.toContain("logbook");
  });

  test("every project has a kind, arc, hook and three metrics", () => {
    for (const p of PROJECTS) {
      expect(["ml", "product", "algo", "practice"]).toContain(p.kind);
      expect(p.hook.length).toBeGreaterThan(10);
      expect(p.metrics.length).toBe(3);
    }
  });

  test("every link is https", () => {
    for (const p of PROJECTS) {
      for (const u of [p.live, p.repo, p.pendingRepo?.url, p.prequel?.repo]) {
        if (u) expect(u.startsWith("https://")).toBe(true);
      }
    }
  });
});

describe("specific episodes", () => {
  test("churn links its public repo and holds the internship repo behind a flag", () => {
    const p = getProject("customer-churn-intelligence-system")!;
    expect(p.kind).toBe("ml");
    expect(p.repo).toBe("https://github.com/Abhirai2006/telco-churn-intelligence-system");
    expect(p.pendingRepo).toEqual({
      url: "https://github.com/Abhirai2006/bluemind-ml-internship-2026",
      label: "Day-by-day internship work",
      isPublic: false,
    });
  });

  test("Earth & Ethos is a paid client project with its demo link", () => {
    const p = getProject("earth-and-ethos")!;
    expect(p.client?.paid).toBe(true);
    expect(p.live).toBe("https://portfolio.earth-and-ethos.workers.dev/");
  });

  test("Ro-Bio live link", () => {
    expect(getProject("ro-bio")!.live).toBe("https://ro-bio.hub-muse.workers.dev/");
  });

  test("Arthra has Tally as its prequel", () => {
    const p = getProject("arthra")!;
    expect(p.live).toBe("https://arthrafin-7qakibfj.manus.space/");
    expect(p.prequel?.repo).toBe("https://github.com/Abhirai2006/tally-my-cents");
    expect(p.prequel?.title).toBe("Tally");
  });
});

describe("facts", () => {
  test("the person is looking for ML internships", () => {
    expect(PERSON.name).toBe("Abhishek Rai A");
    expect(PERSON.seeking).toBe("ML internships");
    expect(QUICK_FACTS.join(" ")).toContain("looking for ML internships");
  });

  test("no salary or package figure anywhere in project data or facts", () => {
    const all = JSON.stringify(PROJECTS) + JSON.stringify(QUICK_FACTS) + JSON.stringify(PERSON);
    for (const banned of ["LPA", "CTC", "per annum", "lakh"]) expect(all).not.toContain(banned);
  });
});

describe("screenshots", () => {
  test("every screenshot a project points to exists in public/ (first candidate, no load-error fallback needed)", async () => {
    const { existsSync } = await import("node:fs");
    const { shotCandidates } = await import("@/lib/shots");
    for (const p of PROJECTS) {
      for (const shot of p.images ?? []) {
        for (const light of [false, true]) {
          const first = shotCandidates(shot, light)[0];
          const onDisk = first.startsWith("/media/") ? existsSync(`public${first}`) : true;
          expect({ project: p.slug, first, onDisk }).toEqual({
            project: p.slug,
            first,
            onDisk: true,
          });
        }
      }
    }
  });
});
