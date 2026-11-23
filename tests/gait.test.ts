import { describe, expect, test } from "bun:test";
import { gaitPhase } from "../src/world/creatures/gait";

const frac = (x: number) => ((x % 1) + 1) % 1;

describe("gaitPhase", () => {
  test("returns one phase per leg, each in [0,1)", () => {
    for (const t of [0, 0.37, 5.9]) {
      const p = gaitPhase(t, 4, "walk");
      expect(p).toHaveLength(4);
      for (const v of p) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(1);
      }
    }
  });
  test("a walk is a four-beat gait: legs a quarter cycle apart", () => {
    const offsets = gaitPhase(0, 4, "walk")
      .map(frac)
      .sort((a, b) => a - b);
    for (let i = 1; i < 4; i++) expect(offsets[i] - offsets[i - 1]).toBeCloseTo(0.25, 6);
  });
  test("in a gallop the front pair lands closer together than in a walk", () => {
    const g = gaitPhase(0, 4, "gallop");
    const w = gaitPhase(0, 4, "walk");
    const gap = (p: number[]) => Math.min(frac(p[1] - p[0]), frac(p[0] - p[1]));
    expect(gap(g)).toBeLessThan(gap(w));
  });
  test("phase advances with time", () => expect(gaitPhase(0.1, 2, "walk")[0]).toBeCloseTo(0.1, 6));
});
