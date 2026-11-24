/**
 * The pure, tested core of the comic engine (ARCHITECTURE.md §3): no DOM, no three.js.
 * scroll → (beat, local t), the camera spline, transitions, gates, hold progress, the neuron check,
 * path ordering, quality tiers and caption parsing.
 */
import type { BeatDef, CamKey, GateKind, PathId, TransitionKind } from "@/story/types";

export type Laid = BeatDef & {
  index: number;
  /** Scroll start and length, in viewport heights. */
  start: number;
  len: number;
  /** World y of the beat's origin (top). */
  originY: number;
};

/* ------------------------------------------------------------------ path order */

export const DEFAULT_ORDER: PathId[] = ["ml", "product", "problem"];

/** The chosen path first, the other two after it, in their default order. */
export function pathOrder(chosen: PathId | null): PathId[] {
  if (!chosen) return [...DEFAULT_ORDER];
  return [chosen, ...DEFAULT_ORDER.filter((p) => p !== chosen)];
}

/** Lay the beats out in scroll and in world space. Path beats follow `order`. */
export function layoutStory(beats: BeatDef[], order: PathId[] = DEFAULT_ORDER): Laid[] {
  const firstPath = beats.findIndex((b) => b.path);
  let list = beats;
  if (firstPath >= 0) {
    const pathBeats = beats.filter((b) => b.path);
    const ordered = order.flatMap((p) => pathBeats.filter((b) => b.path === p));
    const rest = beats.filter((b) => !b.path);
    list = [...rest.slice(0, firstPath), ...ordered, ...rest.slice(firstPath)];
  }
  let s = 0;
  let y = 0;
  return list.map((b, index) => {
    const laid: Laid = { ...b, index, start: s, len: b.length, originY: y };
    s += b.length;
    y -= b.span;
    return laid;
  });
}

export const totalLength = (laid: Laid[]) =>
  laid.length ? laid[laid.length - 1].start + laid[laid.length - 1].len : 0;

/** Which beat a scroll position (viewport heights) is in, and how far through it (0..1). */
export function beatAt(laid: Laid[], s: number): { index: number; t: number } {
  if (!laid.length) return { index: 0, t: 0 };
  const clamped = Math.max(0, Math.min(s, totalLength(laid)));
  let i = laid.length - 1;
  for (let k = 0; k < laid.length; k++) {
    if (clamped < laid[k].start + laid[k].len) {
      i = k;
      break;
    }
  }
  const b = laid[i];
  return { index: i, t: b.len ? Math.min(1, Math.max(0, (clamped - b.start) / b.len)) : 0 };
}

/* ------------------------------------------------------------------ transitions */

export type TransitionWindow = {
  kind: TransitionKind;
  s0: number;
  s1: number;
  from: number;
  to: number;
};

export function transitionWindows(laid: Laid[]): TransitionWindow[] {
  const out: TransitionWindow[] = [];
  for (const b of laid) {
    if (!b.enter || b.index === 0) continue;
    const half = b.enter.width / 2;
    out.push({
      kind: b.enter.kind,
      s0: b.start - half,
      s1: b.start + half,
      from: b.index - 1,
      to: b.index,
    });
  }
  return out;
}

export function transitionAt(
  windows: TransitionWindow[],
  s: number,
): (TransitionWindow & { p: number }) | null {
  for (const w of windows) if (s > w.s0 && s < w.s1) return { ...w, p: (s - w.s0) / (w.s1 - w.s0) };
  return null;
}

/* ------------------------------------------------------------------ camera */

export type GlobalKey = {
  s: number;
  x: number;
  y: number;
  h: number;
  z?: number;
  rot: number;
  cut: boolean;
};
export type CamState = { x: number; y: number; h: number; z?: number; rot: number };

/** All camera keys in scroll space, with holds and hidden cuts around each transition. */
export function cameraKeys(laid: Laid[]): GlobalKey[] {
  const windows = transitionWindows(laid);
  const keys: GlobalKey[] = [];
  const toGlobal = (b: Laid, k: CamKey, cut = false): GlobalKey => ({
    s: b.start + k.t * b.len,
    x: k.x,
    y: b.originY + k.y,
    h: k.h,
    z: k.z,
    rot: k.rot ?? 0,
    cut: cut || !!k.cut,
  });
  for (const b of laid) {
    const w = windows.find((x) => x.to === b.index);
    const ks = b.cam.length ? b.cam : [{ t: 0.5, x: 0, y: -b.span / 2, h: 11 }];
    if (w) {
      // the previous beat ends on its last framing exactly when the transition starts
      const prev = keys[keys.length - 1];
      while (keys.length && keys[keys.length - 1].s >= w.s0) keys.pop();
      if (prev) keys.push({ ...prev, s: w.s0, cut: false });
      const first = toGlobal(b, ks[0]);
      keys.push({ ...first, s: w.s0 + 1e-4, cut: true });
      keys.push({ ...first, s: Math.max(w.s1, first.s), cut: false });
      for (const k of ks.slice(1)) {
        const g = toGlobal(b, k);
        if (g.s > keys[keys.length - 1].s) keys.push(g);
      }
    } else {
      for (const k of ks) {
        const g = toGlobal(b, k);
        if (!keys.length || g.s > keys[keys.length - 1].s) keys.push(g);
      }
    }
  }
  return keys;
}

const smooth = (t: number) => t * t * (3 - 2 * t);

function catmull(p0: number, p1: number, p2: number, p3: number, t: number) {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

/**
 * Camera at scroll s. Between keys the camera eases (it settles on each panel) and its path is a
 * Catmull-Rom spline through the neighbours, so it never jumps, except at hidden cuts.
 */
export function cameraAt(keys: GlobalKey[], s: number): CamState {
  if (!keys.length) return { x: 0, y: 0, h: 10, rot: 0 };
  if (s <= keys[0].s) return pickKey(keys[0]);
  const last = keys[keys.length - 1];
  if (s >= last.s) return pickKey(last);
  let i = 0;
  while (i < keys.length - 2 && s >= keys[i + 1].s) i++;
  const a = keys[i];
  const b = keys[i + 1];
  if (b.cut) return pickKey(a);
  const u = smooth((s - a.s) / Math.max(1e-6, b.s - a.s));
  const p0 = i > 0 && !a.cut ? keys[i - 1] : a;
  const p3 = i + 2 < keys.length && !keys[i + 2].cut ? keys[i + 2] : b;
  const zA = a.z;
  const zB = b.z;
  return {
    x: catmull(p0.x, a.x, b.x, p3.x, u),
    y: catmull(p0.y, a.y, b.y, p3.y, u),
    h: a.h + (b.h - a.h) * u,
    z: zA !== undefined && zB !== undefined ? zA + (zB - zA) * u : undefined,
    rot: a.rot + (b.rot - a.rot) * u,
  };
}
const pickKey = (k: GlobalKey): CamState => ({ x: k.x, y: k.y, h: k.h, z: k.z, rot: k.rot });

/** Camera distance that frames `h` world units of height; narrow screens frame more height. */
export function frameDistance(h: number, aspect: number, fovDeg: number): number {
  const effective = aspect >= 1.2 ? h : Math.max(h, Math.min((h * 1.45) / aspect, h * 1.9));
  return effective / 2 / Math.tan((fovDeg * Math.PI) / 360);
}

/** Narrow screens pull side panels and captions toward the centre. */
export const xSquash = (aspect: number) => Math.min(1, Math.max(0.5, aspect / 1.5));

/* ------------------------------------------------------------------ gates */

export type GateState = "locked" | "active" | "complete" | "skipped";

export function gateEvent(
  state: GateState,
  ev: "reach" | "complete" | "skip" | "leave",
): GateState {
  if (state === "complete" || state === "skipped") return state;
  if (ev === "complete") return state === "active" ? "complete" : state;
  if (ev === "skip") return "skipped";
  if (ev === "reach") return "active";
  if (ev === "leave") return state === "active" ? "locked" : state;
  return state;
}

/** The furthest the visitor may scroll: up to the first gate that is not complete or skipped. */
export function scrollLimit(laid: Laid[], done: ReadonlySet<GateKind>): number {
  for (const b of laid) if (b.gate && !done.has(b.gate.kind)) return b.start + b.gate.at * b.len;
  return totalLength(laid);
}

/* ------------------------------------------------------------------ hold */

export type Hold = { p: number; done: boolean };

/**
 * One step of a hold-to-act ring: fills while held (duration seconds), drains twice as fast when
 * released, never goes below 0, completes (and stays complete) at 1.
 */
export function holdStep(h: Hold, dt: number, holding: boolean, duration: number): Hold {
  if (h.done) return h;
  const p = holding ? h.p + dt / duration : h.p - (dt / duration) * 2;
  if (p >= 1) return { p: 1, done: true };
  return { p: Math.max(0, p), done: false };
}

/* ------------------------------------------------------------------ neurons */

export type P2 = { x: number; y: number };

/**
 * The neurons a drawn stroke passes through, in the order touched, each once.
 * A neuron counts when the stroke comes within `radius` of its centre (segments are sampled, so a
 * fast flick between two points still hits what it crosses).
 */
export function neuronHits(stroke: P2[], neurons: P2[], radius: number): number[] {
  const hit: number[] = [];
  const test = (p: P2) => {
    for (let i = 0; i < neurons.length; i++) {
      if (hit.includes(i)) continue;
      if (Math.hypot(p.x - neurons[i].x, p.y - neurons[i].y) <= radius) hit.push(i);
    }
  };
  for (let k = 0; k < stroke.length; k++) {
    if (k === 0) {
      test(stroke[0]);
      continue;
    }
    const a = stroke[k - 1];
    const b = stroke[k];
    const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / (radius / 2)));
    for (let i = 1; i <= steps; i++)
      test({ x: a.x + ((b.x - a.x) * i) / steps, y: a.y + ((b.y - a.y) * i) / steps });
  }
  return hit;
}

export const NEURONS_NEEDED = 5;

/* ------------------------------------------------------------------ quality */

export type Tier = "ultra" | "high" | "lite" | "static";

export function pickTier(env: {
  webgl2: boolean;
  reducedMotion: boolean;
  cores?: number;
  memory?: number;
  mobile: boolean;
  saveData?: boolean;
  forced?: string | null;
}): Tier {
  const forced = env.forced as Tier | null | undefined;
  if (forced && ["ultra", "high", "lite", "static"].includes(forced)) return forced;
  if (!env.webgl2 || env.reducedMotion) return "static";
  if (env.mobile || env.saveData || (env.memory !== undefined && env.memory <= 4)) return "lite";
  if ((env.cores ?? 4) >= 8 && (env.memory ?? 8) >= 8) return "ultra";
  return "high";
}

/* ------------------------------------------------------------------ captions */

/** "**10 PM.** The city" → [{text:"10 PM.", key:true}, {text:" The city", key:false}] */
export function parseCaption(text: string): { text: string; key: boolean }[] {
  const out: { text: string; key: boolean }[] = [];
  text.split("**").forEach((p, i) => {
    if (p) out.push({ text: p, key: i % 2 === 1 });
  });
  return out;
}

export const plainCaption = (text: string) => text.replace(/\*\*/g, "");

/** Opacity of something visible during [t0, t1] of a beat, with soft edges. */
export function windowOpacity(t: number, [t0, t1]: [number, number], edge = 0.05): number {
  if (t < t0 - edge || t > t1 + edge) return 0;
  const a = Math.min(1, (t - (t0 - edge)) / edge);
  const b = Math.min(1, (t1 + edge - t) / edge);
  return Math.max(0, Math.min(a, b));
}
