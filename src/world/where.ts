/**
 * "WHERE ARE YOU GOING?" — one continuous paper-white line with chamfered corners that frames each word in turn
 * and becomes the site map (DESIGN §4.6, Birkar reference frames). The creatures run along the same polyline.
 *
 * Word 0: the line drops down its left side and runs under it. Odd words are framed top → right side → bottom;
 * even words top → left side → bottom, so diagonal connectors zig-zag between them.
 */
export type Rect = { x: number; y: number; w: number; h: number };
export type Pt = [number, number];
export type FrameOpts = { chamfer: number; margin: number };

const r3 = (n: number) => Math.round(n * 1000) / 1000;

export function wherePolyline(words: Rect[], o: FrameOpts): Pt[] {
  const m = o.margin;
  // Runs that meet a diagonal connector overshoot the word by one chamfer, so the 45° cut never eats the frame.
  const e = o.chamfer;
  const corners: Pt[] = [];
  words.forEach((w, i) => {
    const L = w.x - m;
    const R = w.x + w.w + m;
    const T = w.y - m;
    const B = w.y + w.h + m;
    if (i === 0) {
      corners.push([L, Math.max(0, T - 3 * m)], [L, B], [R + e, B]);
    } else if (i % 2 === 1) {
      corners.push([L - e, T], [R, T], [R, B], [L - e, B]);
    } else {
      corners.push([R + e, T], [L, T], [L, B], [R + e, B]);
    }
  });
  return chamferPolyline(corners, o.chamfer);
}

/** Replaces each interior corner with a 45° cut of length `c` (never more than half of either segment). */
export function chamferPolyline(points: Pt[], c: number): Pt[] {
  if (points.length < 3) return points.map(([x, y]) => [r3(x), r3(y)]);
  const out: Pt[] = [[r3(points[0][0]), r3(points[0][1])]];
  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i - 1];
    const [cx, cy] = points[i];
    const [nx, ny] = points[i + 1];
    const d1 = Math.hypot(cx - px, cy - py);
    const d2 = Math.hypot(nx - cx, ny - cy);
    const u1: Pt = [(cx - px) / d1, (cy - py) / d1];
    const u2: Pt = [(nx - cx) / d2, (ny - cy) / d2];
    const straight = Math.abs(u1[0] * u2[1] - u1[1] * u2[0]) < 1e-9;
    if (straight || d1 === 0 || d2 === 0) {
      out.push([r3(cx), r3(cy)]);
      continue;
    }
    const k = Math.min(c, d1 / 2, d2 / 2);
    out.push([r3(cx - u1[0] * k), r3(cy - u1[1] * k)], [r3(cx + u2[0] * k), r3(cy + u2[1] * k)]);
  }
  const last = points[points.length - 1];
  out.push([r3(last[0]), r3(last[1])]);
  return out;
}

export function buildChamferPath(words: Rect[], o: FrameOpts): string {
  const pts = wherePolyline(words, o);
  return pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" ");
}

export function pathLength(points: Pt[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++)
    total += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
  return total;
}

/** Point at fraction t (0–1) of the polyline's arc length. */
export function samplePath(points: Pt[], t: number): Pt {
  const tt = Math.min(1, Math.max(0, t));
  const target = tt * pathLength(points);
  let acc = 0;
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1];
    const [bx, by] = points[i];
    const len = Math.hypot(bx - ax, by - ay);
    if (len > 0 && acc + len >= target) {
      const f = (target - acc) / len;
      return [ax + (bx - ax) * f, ay + (by - ay) * f];
    }
    acc += len;
  }
  return points[points.length - 1];
}
