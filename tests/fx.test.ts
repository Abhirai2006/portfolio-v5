import { describe, expect, test } from "bun:test";
import { branchBolt, type V3 } from "../src/world/fx/bolt";
import { fracture } from "../src/world/fx/fracture";

const from: V3 = [0, 10, 0];
const to: V3 = [4, 0, -2];

describe("branchBolt", () => {
  test("the same seed draws the same bolt", () =>
    expect(branchBolt(7, from, to, 5)).toEqual(branchBolt(7, from, to, 5)));
  test("a different seed draws a different bolt", () =>
    expect(branchBolt(8, from, to, 5)).not.toEqual(branchBolt(7, from, to, 5)));
  test("the main branch starts at `from` and ends at `to`", () => {
    const main = branchBolt(3, from, to, 5)[0];
    expect(main[0]).toEqual(from);
    expect(main.at(-1)).toEqual(to);
  });
  test("depth controls the detail of the main branch (2^depth segments)", () =>
    expect(branchBolt(3, from, to, 4)[0]).toHaveLength(17));
  test("side branches start on the main branch", () => {
    const [main, ...side] = branchBolt(11, from, to, 5);
    expect(side.length).toBeGreaterThan(0);
    for (const b of side) expect(main).toContainEqual(b[0]);
  });
});

describe("fracture", () => {
  const shards = fracture(1, 60, [1, 2, 1]);
  test("returns exactly the requested number of shards", () => expect(shards).toHaveLength(60));
  test("shard volumes add up to the box (they tile it)", () => {
    const vol = shards.reduce((a, s) => a + s.size[0] * s.size[1] * s.size[2], 0);
    expect(vol).toBeGreaterThan(2 * 0.99);
    expect(vol).toBeLessThan(2 * 1.01);
  });
  test("every shard sits inside the box", () => {
    for (const s of shards)
      for (let k = 0; k < 3; k++) {
        const half = [0.5, 1, 0.5][k];
        expect(s.center[k] - s.size[k] / 2).toBeGreaterThanOrEqual(-half - 1e-9);
        expect(s.center[k] + s.size[k] / 2).toBeLessThanOrEqual(half + 1e-9);
      }
  });
  test("deterministic per seed", () => expect(fracture(1, 60, [1, 2, 1])).toEqual(shards));
});
