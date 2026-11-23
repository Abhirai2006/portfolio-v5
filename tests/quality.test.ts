import { describe, expect, test } from "bun:test";
import { adaptiveDpr, detectTier, type TierInput } from "../src/world/quality";

const desktop: TierInput = {
  webgl2: true,
  cores: 8,
  memoryGb: 8,
  reducedMotion: false,
  saveData: false,
  width: 1440,
  frameMs: 10,
};

describe("detectTier", () => {
  test("no WebGL2 gets the video tier", () =>
    expect(detectTier({ ...desktop, webgl2: false })).toBe("video"));
  test("phone width gets the video tier", () =>
    expect(detectTier({ ...desktop, width: 390 })).toBe("video"));
  test("data saver gets the video tier", () =>
    expect(detectTier({ ...desktop, saveData: true })).toBe("video"));
  test("2 GB of memory gets the video tier", () =>
    expect(detectTier({ ...desktop, memoryGb: 2 })).toBe("video"));
  test("8 cores and a fast frame get ultra", () => expect(detectTier(desktop)).toBe("ultra"));
  test("4 cores and an 18 ms frame get high", () =>
    expect(detectTier({ ...desktop, cores: 4, frameMs: 18 })).toBe("high"));
  test("a frame slower than 40 ms gets the video tier", () =>
    expect(detectTier({ ...desktop, frameMs: 45 })).toBe("video"));
  test("reduced motion alone does not force video", () =>
    expect(detectTier({ ...desktop, cores: 4, frameMs: 18, reducedMotion: true })).toBe("high"));
  test("unknown frame time on a capable desktop is high, not ultra", () =>
    expect(detectTier({ ...desktop, frameMs: undefined })).toBe("high"));
});

describe("adaptiveDpr", () => {
  test("slow frames lower the DPR but never below 0.75", () => {
    const d = adaptiveDpr(30, 1.5);
    expect(d).toBeLessThan(1.5);
    expect(d).toBeGreaterThanOrEqual(0.75);
    expect(adaptiveDpr(90, 0.75)).toBe(0.75);
  });
  test("fast frames raise the DPR but never above 1.5", () => {
    expect(adaptiveDpr(8, 1)).toBeGreaterThan(1);
    expect(adaptiveDpr(8, 1.5)).toBe(1.5);
  });
});
