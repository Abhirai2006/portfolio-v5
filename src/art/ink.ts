/**
 * A tiny ink-drawing toolkit that writes SVG strings. Every illustration on the site is drawn with it
 * (scripts/build-art.ts rasterises the SVGs to WebP layers). Deterministic: the same seed always
 * draws the same line, so builds are reproducible.
 *
 * These are placeholder plates until the ChatGPT panels (docs/ART-PIPELINE.md) arrive; they use the
 * same file names and sizes, so a real panel simply replaces a file.
 */

export type Mode = "ink" | "colour";
export type Pt = [number, number];

export const INK = "#0E0E10";
export const PAPER = "#F2EFE8";
export const PAPER2 = "#E3DDD0";
export const GRAPHITE = "#2B2B30";
export const BLUE = "#1F6BFF";
export const BLUE_GLOW = "#62AEFF";
export const BLUE_DEEP = "#0A2A88";

/** mulberry32: small seeded RNG. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const f = (n: number) => (Math.round(n * 10) / 10).toString();
export const pts = (p: Pt[]) => p.map(([x, y]) => `${f(x)},${f(y)}`).join(" ");

/** Smooth closed/open path through points (Catmull-Rom → cubic Bézier). */
export function smoothPath(p: Pt[], closed = false): string {
  if (p.length < 2) return "";
  const P = closed ? [p[p.length - 1], ...p, p[0], p[1]] : [p[0], ...p, p[p.length - 1]];
  let d = `M${f(P[1][0])},${f(P[1][1])}`;
  for (let i = 1; i < P.length - 2; i++) {
    const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f(c1[0])},${f(c1[1])} ${f(c2[0])},${f(c2[1])} ${f(p2[0])},${f(p2[1])}`;
  }
  return closed ? d + "Z" : d;
}

/**
 * A brush stroke: a filled polygon along a polyline whose width swells in the middle and tapers at
 * both ends, with a little jitter so it reads as a hand-inked line.
 */
export function brush(
  line: Pt[],
  width: number,
  seed = 1,
  opts: { taper?: number; jitter?: number } = {},
) {
  const r = rng(seed);
  const taper = opts.taper ?? 0.35;
  const jitter = opts.jitter ?? 0.12;
  const dense: Pt[] = [];
  for (let i = 0; i < line.length - 1; i++) {
    const [a, b] = [line[i], line[i + 1]];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const n = Math.max(2, Math.ceil(len / 6));
    for (let k = 0; k < n; k++)
      dense.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
  }
  dense.push(line[line.length - 1]);
  const L: Pt[] = [];
  const R: Pt[] = [];
  const N = dense.length;
  let wobble = 0;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const a = dense[Math.max(0, i - 1)];
    const b = dense[Math.min(N - 1, i + 1)];
    let nx = -(b[1] - a[1]);
    let ny = b[0] - a[0];
    const nl = Math.hypot(nx, ny) || 1;
    nx /= nl;
    ny /= nl;
    const ends = Math.min(1, t / taper, (1 - t) / taper);
    wobble = wobble * 0.8 + (r() - 0.5) * jitter * 2;
    const w =
      (width / 2) * Math.max(0.05, Math.sin((Math.PI / 2) * Math.max(0, ends))) * (1 + wobble);
    L.push([dense[i][0] + nx * w, dense[i][1] + ny * w]);
    R.push([dense[i][0] - nx * w, dense[i][1] - ny * w]);
  }
  return `M${L.map(([x, y]) => `${f(x)},${f(y)}`).join("L")}L${R.reverse()
    .map(([x, y]) => `${f(x)},${f(y)}`)
    .join("L")}Z`;
}

/** Many parallel hatch strokes covering a box (clip it with a clipPath to shape it). */
export function hatch(
  box: [number, number, number, number],
  opts: {
    angle?: number;
    gap?: number;
    width?: number;
    seed?: number;
    len?: [number, number];
    colour?: string;
    opacity?: number;
  } = {},
) {
  const [x, y, w, h] = box;
  const r = rng(opts.seed ?? 7);
  const ang = ((opts.angle ?? 35) * Math.PI) / 180;
  const gap = opts.gap ?? 7;
  const sw = opts.width ?? 1.4;
  const [lmin, lmax] = opts.len ?? [0.6, 1];
  const diag = Math.hypot(w, h);
  const cx = x + w / 2;
  const cy = y + h / 2;
  const dx = Math.cos(ang);
  const dy = Math.sin(ang);
  let d = "";
  for (let o = -diag / 2; o < diag / 2; o += gap * (0.8 + r() * 0.4)) {
    const px = cx - dy * o;
    const py = cy + dx * o;
    const half = (diag / 2) * (lmin + r() * (lmax - lmin));
    const shift = (r() - 0.5) * diag * 0.3;
    d += `M${f(px + dx * (-half + shift))},${f(py + dy * (-half + shift))}L${f(px + dx * (half + shift))},${f(py + dy * (half + shift))}`;
  }
  return `<path d="${d}" stroke="${opts.colour ?? INK}" stroke-width="${sw}" stroke-linecap="round" fill="none" opacity="${opts.opacity ?? 1}"/>`;
}

/** Stipple dots; `bias(u,v)` (0..1) thins them out where it is low. */
export function stipple(
  box: [number, number, number, number],
  n: number,
  seed = 3,
  rad: [number, number] = [0.8, 2.2],
  colour = INK,
  bias?: (u: number, v: number) => number,
) {
  const r = rng(seed);
  const [x, y, w, h] = box;
  let s = "";
  let placed = 0;
  let guard = 0;
  while (placed < n && guard++ < n * 8) {
    const px = x + r() * w;
    const py = y + r() * h;
    if (bias && r() > bias((px - x) / w, (py - y) / h)) continue;
    s += `<circle cx="${f(px)}" cy="${f(py)}" r="${f(rad[0] + r() * (rad[1] - rad[0]))}"/>`;
    placed++;
  }
  return `<g fill="${colour}">${s}</g>`;
}

/** Ink splatter: a blob with droplets around it. */
export function splatter(cx: number, cy: number, size: number, seed = 5, colour = INK) {
  const r = rng(seed);
  const blob: Pt[] = [];
  const n = 18;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = size * (0.55 + r() * 0.5) * (r() > 0.85 ? 1.5 : 1);
    blob.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  let drops = "";
  for (let i = 0; i < 14; i++) {
    const a = r() * Math.PI * 2;
    const dist = size * (1.2 + r() * 2.4);
    drops += `<circle cx="${f(cx + Math.cos(a) * dist)}" cy="${f(cy + Math.sin(a) * dist)}" r="${f(size * (0.04 + r() * 0.14))}"/>`;
  }
  return `<g fill="${colour}"><path d="${smoothPath(blob, true)}"/>${drops}</g>`;
}

/** Short wavy brush dashes in rows (sea, wind, speed). Rows get bigger toward the bottom (perspective). */
export function waveLines(
  box: [number, number, number, number],
  rows: number,
  seed = 11,
  opts: {
    amp?: number;
    width?: number;
    colour?: string;
    persp?: boolean;
    segs?: [number, number];
    len?: [number, number];
  } = {},
) {
  const r = rng(seed);
  const [x, y, w, h] = box;
  let out = "";
  const [smin, smax] = opts.segs ?? [3, 6];
  const [lmin, lmax] = opts.len ?? [0.08, 0.3];
  for (let i = 0; i < rows; i++) {
    const yy = y + (h * (i + r() * 0.6)) / rows;
    const persp = opts.persp === false ? 1 : 0.35 + (i / rows) * 1.3;
    const amp = (opts.amp ?? 6) * persp;
    const segs = smin + Math.floor(r() * (smax - smin + 1));
    for (let s = 0; s < segs; s++) {
      const x0 = x + r() * w * 0.95 - w * 0.05;
      const len =
        w * (lmin + r() * (lmax - lmin)) * (opts.persp === false ? 1 : Math.min(1.4, persp));
      const line: Pt[] = [];
      const ph = r() * 6;
      for (let k = 0; k <= 10; k++)
        line.push([x0 + (len * k) / 10, yy + Math.sin(k * 0.8 + ph) * amp * 0.35]);
      out += `<path d="${brush(line, (opts.width ?? 3) * persp, Math.floor(r() * 1e6))}" fill="${opts.colour ?? INK}"/>`;
    }
  }
  return out;
}

/** Rough-edge filter (turbulence displacement): makes vector shapes look inked. */
export function roughFilter(id: string, scale = 3, freq = 0.04, seed = 2) {
  return `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="2" seed="${seed}"/><feDisplacementMap in="SourceGraphic" scale="${scale}" xChannelSelector="R" yChannelSelector="G"/></filter>`;
}

/** Glow for blue light. */
export function glowFilter(id: string, std = 12) {
  return `<filter id="${id}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${std}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
}

export function blurFilter(id: string, std = 20) {
  return `<filter id="${id}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${std}"/></filter>`;
}

/** Screentone dot pattern. */
export function tonePattern(id: string, gap = 7, r = 1.6, colour = INK, angle = 45) {
  return `<pattern id="${id}" width="${gap}" height="${gap}" patternUnits="userSpaceOnUse" patternTransform="rotate(${angle})"><circle cx="${gap / 2}" cy="${gap / 2}" r="${r}" fill="${colour}"/></pattern>`;
}

/** Diagonal line tone. */
export function linePattern(id: string, gap = 6, w = 1.2, colour = INK, angle = 45) {
  return `<pattern id="${id}" width="${gap}" height="${gap}" patternUnits="userSpaceOnUse" patternTransform="rotate(${angle})"><rect width="${w}" height="${gap}" fill="${colour}"/></pattern>`;
}

export function svg(w: number, h: number, defs: string, body: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${defs}</defs>${body}</svg>`;
}

/** Pick a value by mode. */
export const pick = <T>(mode: Mode, ink: T, colour: T) => (mode === "ink" ? ink : colour);

/** Radial burst of speed lines toward a centre. */
export function speedLines(
  cx: number,
  cy: number,
  r0: number,
  r1: number,
  n: number,
  seed = 9,
  colour = INK,
  width = 3,
) {
  const r = rng(seed);
  let out = "";
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2;
    const a0 = r0 * (0.8 + r() * 0.5);
    const a1 = r1 * (0.7 + r() * 0.4);
    out += `<path d="${brush(
      [
        [cx + Math.cos(a) * a0, cy + Math.sin(a) * a0],
        [cx + Math.cos(a) * a1, cy + Math.sin(a) * a1],
      ],
      width * (0.5 + r()),
      Math.floor(r() * 1e6),
      { taper: 0.5 },
    )}" fill="${colour}"/>`;
  }
  return out;
}

/** Sparkles / stars. */
export function stars(
  box: [number, number, number, number],
  n: number,
  seed = 4,
  colour = PAPER,
  big = 0.08,
) {
  const r = rng(seed);
  const [x, y, w, h] = box;
  let out = "";
  for (let i = 0; i < n; i++) {
    const px = x + r() * w;
    const py = y + r() * h * (0.3 + 0.7 * r());
    if (r() < big) {
      const s = 4 + r() * 7;
      out += `<path d="M${f(px)},${f(py - s)}Q${f(px)},${f(py)} ${f(px + s)},${f(py)}Q${f(px)},${f(py)} ${f(px)},${f(py + s)}Q${f(px)},${f(py)} ${f(px - s)},${f(py)}Q${f(px)},${f(py)} ${f(px)},${f(py - s)}Z" fill="${colour}"/>`;
    } else
      out += `<circle cx="${f(px)}" cy="${f(py)}" r="${f(0.6 + r() * 1.8)}" fill="${colour}"/>`;
  }
  return out;
}
