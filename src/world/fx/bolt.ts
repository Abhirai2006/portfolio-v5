/**
 * Procedural lightning (ARCHITECTURE §5, bishop): midpoint displacement for the main bolt, plus shorter side
 * branches forking off it. Deterministic per seed. Returns polylines; [0] is the main branch.
 */
import { rng } from "./rng";

export type V3 = [number, number, number];

function displace(a: V3, b: V3, depth: number, rough: number, rand: () => number): V3[] {
  let pts: V3[] = [a, b];
  let amp = rough * Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) * 0.25;
  for (let d = 0; d < depth; d++) {
    const next: V3[] = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i - 1];
      const q = pts[i];
      const mid: V3 = [
        (p[0] + q[0]) / 2 + (rand() - 0.5) * 2 * amp,
        (p[1] + q[1]) / 2 + (rand() - 0.5) * 2 * amp * 0.4,
        (p[2] + q[2]) / 2 + (rand() - 0.5) * 2 * amp,
      ];
      next.push(mid, q);
    }
    pts = next;
    amp *= 0.55;
  }
  return pts;
}

export function branchBolt(seed: number, from: V3, to: V3, depth: number): V3[][] {
  const rand = rng(seed);
  const main = displace(from, to, depth, 1, rand);
  const branches: V3[][] = [main];
  const n = Math.max(1, Math.floor(depth / 2) + 1);
  for (let k = 0; k < n; k++) {
    const i = 1 + Math.floor(rand() * (main.length - 3));
    const start = main[i];
    const len =
      Math.hypot(to[0] - from[0], to[1] - from[1], to[2] - from[2]) * (0.15 + rand() * 0.2);
    const end: V3 = [
      start[0] + (rand() - 0.5) * len,
      start[1] - len * (0.4 + rand() * 0.4),
      start[2] + (rand() - 0.5) * len,
    ];
    branches.push(displace(start, end, Math.max(1, depth - 2), 0.8, rand));
  }
  return branches;
}
