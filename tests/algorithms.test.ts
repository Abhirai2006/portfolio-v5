import { describe, expect, test } from "bun:test";
import { insertionSortFrames } from "../src/sections/algorithms/frames";

describe("insertionSortFrames", () => {
  const input = [5, 2, 9, 1, 7, 3];
  const frames = insertionSortFrames(input);
  test("the first frame is the input and the last is sorted", () => {
    expect(frames[0].values).toEqual(input);
    expect(frames.at(-1)!.values).toEqual([1, 2, 3, 5, 7, 9]);
  });
  test("every frame is a permutation of the input", () => {
    for (const f of frames) expect([...f.values].sort((a, b) => a - b)).toEqual([1, 2, 3, 5, 7, 9]);
  });
  test("each step swaps at most one adjacent pair and marks it", () => {
    for (let i = 1; i < frames.length; i++) {
      const diff = frames[i].values
        .map((v, k) => (v !== frames[i - 1].values[k] ? k : -1))
        .filter((k) => k >= 0);
      expect(diff.length === 0 || (diff.length === 2 && diff[1] - diff[0] === 1)).toBe(true);
      if (diff.length) expect(frames[i].active).toEqual(diff);
    }
  });
  test("does not mutate the input", () => expect(input).toEqual([5, 2, 9, 1, 7, 3]));
  test("an already sorted list is one frame", () =>
    expect(insertionSortFrames([1, 2, 3])).toHaveLength(1));
});
