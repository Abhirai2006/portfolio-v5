import { describe, expect, test } from "bun:test";
import {
  buildChamferPath,
  chamferPolyline,
  samplePath,
  wherePolyline,
  type Rect,
} from "../src/world/where";

const WORDS: Rect[] = [
  { x: 300, y: 100, w: 700, h: 260 },
  { x: 120, y: 560, w: 420, h: 260 },
  { x: 700, y: 1000, w: 460, h: 260 },
  { x: 200, y: 1450, w: 800, h: 260 },
];

function bbox(path: string) {
  const nums = path.match(/-?\d+(\.\d+)?/g)!.map(Number);
  const xs = nums.filter((_, i) => i % 2 === 0);
  const ys = nums.filter((_, i) => i % 2 === 1);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

describe("buildChamferPath", () => {
  const d = buildChamferPath(WORDS, { chamfer: 24, margin: 20 });
  test("is a plain polyline: starts with M, then only L commands", () => {
    expect(d.startsWith("M")).toBe(true);
    expect(d.slice(1)).not.toMatch(/[A-KN-Za-km-z]/);
  });
  test("its bounding box encloses every word", () => {
    const b = bbox(d);
    for (const w of WORDS) {
      expect(b.minX).toBeLessThanOrEqual(w.x);
      expect(b.maxX).toBeGreaterThanOrEqual(w.x + w.w);
      expect(b.minY).toBeLessThanOrEqual(w.y);
      expect(b.maxY).toBeGreaterThanOrEqual(w.y + w.h);
    }
  });
  test("runs under every word (a horizontal segment below each word's baseline)", () => {
    const pts = wherePolyline(WORDS, { chamfer: 24, margin: 20 });
    for (const w of WORDS) {
      const under = pts.some(
        (p, i) => i > 0 && p[1] === pts[i - 1][1] && Math.abs(p[1] - (w.y + w.h + 20)) < 0.001,
      );
      expect(under).toBe(true);
    }
  });
});

describe("chamferPolyline", () => {
  test("cuts a right-angle corner into two points at 45°", () => {
    const out = chamferPolyline(
      [
        [0, 0],
        [0, 100],
        [100, 100],
      ],
      10,
    );
    expect(out).toEqual([
      [0, 0],
      [0, 90],
      [10, 100],
      [100, 100],
    ]);
  });
  test("never cuts more than half of a short segment", () => {
    const out = chamferPolyline(
      [
        [0, 0],
        [0, 8],
        [100, 8],
      ],
      10,
    );
    expect(out[1]).toEqual([0, 4]);
  });
});

describe("samplePath", () => {
  const square: [number, number][] = [
    [0, 0],
    [100, 0],
    [100, 100],
    [0, 100],
    [0, 0],
  ];
  test("t=0 is the first point and t=1 the last", () => {
    expect(samplePath(square, 0)).toEqual([0, 0]);
    expect(samplePath(square, 1)).toEqual([0, 0]);
  });
  test("t=0.5 is halfway along the length", () =>
    expect(samplePath(square, 0.5)).toEqual([100, 100]));
  test("t is clamped to [0,1]", () => expect(samplePath(square, 2)).toEqual([0, 0]));
});
