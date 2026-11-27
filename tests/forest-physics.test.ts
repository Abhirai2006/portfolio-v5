import { describe, expect, test } from "bun:test";
import {
  G,
  hop,
  impulseResponse,
  Spring3,
  stepLeaf,
  circleOfConfusion,
  rng,
  type Leaf,
} from "@/forest/physics";

describe("forest physics obeys the real laws (DECISIONS V2)", () => {
  test("a hop starts and lands exactly where it should", () => {
    const h = hop([0, 0.3, 0], [0.25, 0.32, -0.1], 0.28);
    const s = h.at(0);
    const e = h.at(h.T);
    expect(s[0]).toBeCloseTo(0, 9);
    expect(s[1]).toBeCloseTo(0.3, 9);
    expect(e[0]).toBeCloseTo(0.25, 9);
    expect(e[1]).toBeCloseTo(0.32, 9);
    expect(e[2]).toBeCloseTo(-0.1, 9);
  });

  test("the hop is a gravity parabola: constant downward acceleration of g", () => {
    const h = hop([0, 0, 0], [0.3, 0, 0], 0.3);
    const dt = 1e-3;
    const a = (h.velocity(0.15 + dt)[1] - h.velocity(0.15)[1]) / dt;
    expect(a).toBeCloseTo(-G, 6);
    // Horizontal speed never changes in flight (no horizontal force).
    expect(h.velocity(0)[0]).toBeCloseTo(h.velocity(0.3)[0], 12);
    // Apex matches v²/2g.
    expect(h.apex).toBeCloseTo((h.v0[1] * h.v0[1]) / (2 * G), 12);
  });

  test("an impulse on a leaf rings down and settles", () => {
    expect(impulseResponse(0, 1, 3, 0.2)).toBe(0);
    const early = Math.abs(impulseResponse(0.08, 1, 3, 0.2));
    const late = Math.max(
      ...Array.from({ length: 50 }, (_, i) => Math.abs(impulseResponse(3 + i * 0.01, 1, 3, 0.2))),
    );
    expect(early).toBeGreaterThan(0.1);
    expect(late).toBeLessThan(0.001);
  });

  test("a spring pushed aside returns to rest and stays stable at low frame rates", () => {
    const s = new Spring3(40, 6);
    s.x = [0.2, 0, 0];
    for (let i = 0; i < 400; i++) s.step([0, 0, 0], 1 / 15);
    expect(Math.abs(s.x[0])).toBeLessThan(1e-4);
  });

  test("a falling leaf reaches its terminal speed and glides side to side", () => {
    const leaf: Leaf = {
      p: [0, 10, 0],
      v: [0, 0, 0],
      phase: 0,
      freq: 0.9,
      glide: 0.4,
      heading: 0,
      vt: 0.9,
      spin: 0,
    };
    const xs: number[] = [];
    for (let i = 0; i < 600; i++) {
      stepLeaf(leaf, 1 / 60);
      xs.push(leaf.p[0]);
    }
    expect(leaf.v[1]).toBeLessThan(-0.6);
    expect(leaf.v[1]).toBeGreaterThan(-1.3);
    // It swings both ways rather than drifting off.
    const tail = xs.slice(60);
    expect(Math.max(...tail) - Math.min(...tail)).toBeGreaterThan(0.02);
  });

  test("depth of field: things away from the focus plane blur more", () => {
    const f = 0.05;
    expect(circleOfConfusion(f, 2.8, 1, 1)).toBe(0);
    expect(circleOfConfusion(f, 2.8, 1, 10)).toBeGreaterThan(circleOfConfusion(f, 2.8, 1, 2));
    expect(circleOfConfusion(f, 1.4, 1, 3)).toBeGreaterThan(circleOfConfusion(f, 8, 1, 3));
  });

  test("the forest layout is seeded and repeatable", () => {
    const a = rng(7);
    const b = rng(7);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});

describe("the v3 forest homepage is honest (CONTENT.md §1)", () => {
  test("every forest-layer project exists in projects.ts", async () => {
    const { LAYER_PROJECTS } = await import("@/components/forest/ForestStory");
    const { getProject } = await import("@/lib/projects");
    for (const slug of LAYER_PROJECTS) expect(getProject(slug)).toBeDefined();
  });

  test("the forest text has no numbers of its own beyond the sourced ones", async () => {
    const fs = await import("node:fs");
    for (const file of [
      "src/components/forest/ForestStory.tsx",
      "src/components/forest/ForestExperience.tsx",
    ]) {
      // Visible text = what sits between JSX tags (expressions in {…} come from facts.ts / projects.ts).
      const src = fs.readFileSync(file, "utf8");
      const text = [...src.matchAll(/>([^<>{}]+)</g)].map((m) => m[1]).join(" ");
      const numbers = text.match(/\d+(?:[.,]\d+)?/g) ?? [];
      // Only "10 PM" (assistant-context: night owl, ~10 pm) is written out by hand; the rest come from facts.ts.
      expect(numbers.filter((n) => n !== "10")).toEqual([]);
    }
  });

  test("no salary or package figure anywhere in the forest", async () => {
    const fs = await import("node:fs");
    for (const file of fs
      .readdirSync("src/forest")
      .map((f) => `src/forest/${f}`)
      .concat([
        "src/components/forest/ForestStory.tsx",
        "src/components/forest/ForestExperience.tsx",
      ])) {
      expect(fs.readFileSync(file, "utf8")).not.toMatch(/salary|LPA|lakh|package of|CTC/i);
    }
  });
});
