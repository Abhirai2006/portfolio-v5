/** Frames for the ink sorting diagram: insertion sort, one adjacent swap per frame (the swapped pair marked). */
export type SortFrame = { values: number[]; active: number[] };

export function insertionSortFrames(input: number[]): SortFrame[] {
  const a = [...input];
  const frames: SortFrame[] = [{ values: [...a], active: [] }];
  for (let i = 1; i < a.length; i++) {
    for (let j = i; j > 0 && a[j - 1] > a[j]; j--) {
      [a[j - 1], a[j]] = [a[j], a[j - 1]];
      frames.push({ values: [...a], active: [j - 1, j] });
    }
  }
  return frames;
}
