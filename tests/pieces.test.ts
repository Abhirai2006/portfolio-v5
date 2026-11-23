import { describe, expect, test } from "bun:test";
import { boardLayout, squareToXZ } from "../src/world/pieces/layout";
import { PIECE_TYPES, PROFILES } from "../src/world/pieces/profiles";

describe("boardLayout", () => {
  const layout = boardLayout();
  test("all 32 pieces, 16 per colour", () => {
    expect(layout).toHaveLength(32);
    expect(layout.filter((p) => p.color === "w")).toHaveLength(16);
    expect(layout.filter((p) => p.color === "b")).toHaveLength(16);
  });
  test("every square is used once", () =>
    expect(new Set(layout.map((p) => p.square)).size).toBe(32));
  test("exactly six white heroes on their starting squares", () => {
    const heroes = Object.fromEntries(
      layout.filter((p) => p.hero).map((p) => [p.hero, `${p.type}@${p.square}`]),
    );
    expect(heroes).toEqual({
      knight: "knight@b1",
      rook: "rook@a1",
      bishop: "bishop@c1",
      pawn: "pawn@e2",
      king: "king@e1",
      queen: "queen@d1",
    });
  });
});

describe("squareToXZ", () => {
  test("a1 and h8 are opposite corners, centred on the origin", () => {
    expect(squareToXZ("a1", 1)).toEqual([-3.5, 3.5]);
    expect(squareToXZ("h8", 1)).toEqual([3.5, -3.5]);
  });
});

describe("PROFILES", () => {
  test("one lathe profile per piece type", () =>
    expect(Object.keys(PROFILES).sort()).toEqual([...PIECE_TYPES].sort()));
  for (const type of PIECE_TYPES) {
    test(`${type}: at least 12 points, radius ≥ 0, heights never go down`, () => {
      const p = PROFILES[type];
      expect(p.length).toBeGreaterThanOrEqual(12);
      for (let i = 0; i < p.length; i++) {
        expect(p[i][0]).toBeGreaterThanOrEqual(0);
        if (i > 0) expect(p[i][1]).toBeGreaterThanOrEqual(p[i - 1][1]);
      }
    });
  }
  test("the king is the tallest piece and the pawn the shortest (knight excluded: its head is a separate mesh)", () => {
    const top = (t: (typeof PIECE_TYPES)[number]) => PROFILES[t].at(-1)![1];
    for (const t of PIECE_TYPES.filter((p) => p !== "knight")) {
      expect(top("king")).toBeGreaterThanOrEqual(top(t));
      expect(top("pawn")).toBeLessThanOrEqual(top(t));
    }
  });
});
