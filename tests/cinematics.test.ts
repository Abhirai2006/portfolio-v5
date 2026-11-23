import { describe, expect, test } from "bun:test";
import { CINEMATICS, beatAt, reducedSpec, type BeatKind } from "../src/world/cinematics/spec";
import { HERO_IDS } from "../src/world/sequence";

const ORDER: BeatKind[] = ["awaken", "shatter", "emerge", "charge", "impact"];

describe("CINEMATICS", () => {
  test("one cinematic per hero piece", () =>
    expect(Object.keys(CINEMATICS).sort()).toEqual([...HERO_IDS].sort()));
  for (const id of HERO_IDS) {
    const s = CINEMATICS[id];
    test(`${id}: lasts 3–6 seconds (DESIGN §4.5)`, () => {
      expect(s.durationMs).toBeGreaterThanOrEqual(3000);
      expect(s.durationMs).toBeLessThanOrEqual(6000);
    });
    test(`${id}: beats run awaken → shatter → emerge → charge → impact`, () => {
      expect(s.beats.map((b) => b.kind)).toEqual(ORDER);
      for (let i = 1; i < s.beats.length; i++)
        expect(s.beats[i].at).toBeGreaterThan(s.beats[i - 1].at);
      expect(s.beats[0].at).toBe(0);
      expect(s.beats.at(-1)!.at).toBeLessThan(1);
    });
    test(`${id}: at most 3 flashes, never closer than 334 ms (no flashing above 3 per second)`, () => {
      expect(s.flashesMs.length).toBeLessThanOrEqual(3);
      for (let i = 1; i < s.flashesMs.length; i++)
        expect(s.flashesMs[i] - s.flashesMs[i - 1]).toBeGreaterThanOrEqual(334);
    });
    test(`${id}: reduced-motion version is a short crossfade with no flash and no shake`, () => {
      const r = reducedSpec(s);
      expect(r.durationMs).toBeLessThanOrEqual(800);
      expect(r.flashesMs).toEqual([]);
      expect(r.shakePx).toBe(0);
      expect(r.beats.map((b) => b.kind)).toEqual(["awaken", "impact"]);
    });
  }
  test("shake never exceeds 6 px (DESIGN §2.4)", () => {
    for (const id of HERO_IDS) expect(CINEMATICS[id].shakePx).toBeLessThanOrEqual(6);
  });
  test("SFX words", () =>
    expect(Object.fromEntries(HERO_IDS.map((id) => [id, CINEMATICS[id].sfxWord]))).toEqual({
      knight: "VRRM",
      rook: "CRACK",
      bishop: "KRAK-THOOM",
      pawn: "RISE",
      king: "ROAR",
      queen: "FWOOSH",
    }));
});

describe("beatAt", () => {
  const s = CINEMATICS.knight;
  test("start of the cinematic is the awaken beat with local progress 0", () =>
    expect(beatAt(s, 0)).toEqual({ kind: "awaken", local: 0 }));
  test("the end is the impact beat with local progress 1", () =>
    expect(beatAt(s, 1)).toEqual({ kind: "impact", local: 1 }));
  test("halfway through the charge beat reports ~0.5 local progress", () => {
    const charge = s.beats.find((b) => b.kind === "charge")!.at;
    const impact = s.beats.find((b) => b.kind === "impact")!.at;
    const b = beatAt(s, (charge + impact) / 2);
    expect(b.kind).toBe("charge");
    expect(b.local).toBeCloseTo(0.5, 5);
  });
});
