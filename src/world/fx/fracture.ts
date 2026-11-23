/**
 * Pre-fractured shells (ASSETS §2): splits a piece's bounding box into `count` shards by repeatedly cutting
 * the largest cell along its longest axis at a random point — a cheap kd "Voronoi-ish" fracture whose cells
 * tile the box exactly. Deterministic per seed.
 */
import type { V3 } from "./bolt";
import { rng } from "./rng";

export type Shard = { center: V3; size: V3 };

export function fracture(seed: number, count: number, size: V3): Shard[] {
  const rand = rng(seed);
  const cells: Shard[] = [{ center: [0, 0, 0], size: [...size] as V3 }];
  const vol = (s: Shard) => s.size[0] * s.size[1] * s.size[2];
  while (cells.length < count) {
    let bi = 0;
    for (let i = 1; i < cells.length; i++) if (vol(cells[i]) > vol(cells[bi])) bi = i;
    const c = cells.splice(bi, 1)[0];
    const axis =
      c.size[0] >= c.size[1] && c.size[0] >= c.size[2] ? 0 : c.size[1] >= c.size[2] ? 1 : 2;
    const f = 0.3 + rand() * 0.4;
    const lo = c.center[axis] - c.size[axis] / 2;
    const a: Shard = { center: [...c.center] as V3, size: [...c.size] as V3 };
    const b: Shard = { center: [...c.center] as V3, size: [...c.size] as V3 };
    a.size[axis] = c.size[axis] * f;
    b.size[axis] = c.size[axis] * (1 - f);
    a.center[axis] = lo + a.size[axis] / 2;
    b.center[axis] = lo + a.size[axis] + b.size[axis] / 2;
    cells.push(a, b);
  }
  return cells;
}
