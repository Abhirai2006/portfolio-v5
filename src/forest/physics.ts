/**
 * The small amount of real physics the forest runs on (HANDOFF-v3 / DECISIONS V2).
 * Pure functions and plain objects only, so they are tested in tests/forest-physics.test.ts.
 * Units are SI: metres, seconds.
 */

export type Vec3 = [number, number, number];

/** Standard gravity, m/s². */
export const G = 9.81;

/**
 * A ballistic hop from `from` to `to` that takes `T` seconds under gravity alone.
 * The launch velocity is solved exactly, so the frog lands where it should, and the path can be
 * scrubbed forwards and backwards by the scroll (it is a closed-form parabola, not a simulation).
 */
export function hop(from: Vec3, to: Vec3, T: number, g = G) {
  const v0: Vec3 = [
    (to[0] - from[0]) / T,
    (to[1] - from[1]) / T + 0.5 * g * T,
    (to[2] - from[2]) / T,
  ];
  const clampT = (t: number) => Math.min(Math.max(t, 0), T);
  const at = (t: number): Vec3 => {
    const s = clampT(t);
    return [from[0] + v0[0] * s, from[1] + v0[1] * s - 0.5 * g * s * s, from[2] + v0[2] * s];
  };
  const velocity = (t: number): Vec3 => [v0[0], v0[1] - g * clampT(t), v0[2]];
  /** Highest point above the launch height. */
  const apex = Math.max(0, (v0[1] * v0[1]) / (2 * g));
  return { v0, at, velocity, apex, T };
}

/**
 * Closed-form response of an under-damped spring (a leaf or stem) to an impulse at t = 0:
 * x(t) = A · e^(−ζωt) · sin(ω√(1−ζ²) · t). Scrub-safe for the same reason as `hop`.
 */
export function impulseResponse(t: number, amplitude: number, freqHz: number, zeta: number) {
  if (t <= 0) return 0;
  const w = 2 * Math.PI * freqHz;
  const wd = w * Math.sqrt(Math.max(1e-6, 1 - zeta * zeta));
  return amplitude * Math.exp(-zeta * w * t) * Math.sin(wd * t);
}

/**
 * A damped spring for stems and leaves pushed aside by the camera or the wind
 * (semi-implicit Euler; dt is clamped to 1/20 s so a background tab can't blow it up).
 */
export class Spring3 {
  x: Vec3 = [0, 0, 0];
  v: Vec3 = [0, 0, 0];
  constructor(
    public stiffness = 40, // k / m, 1/s²
    public damping = 5, // c / m, 1/s
  ) {}
  step(target: Vec3, dt: number, force: Vec3 = [0, 0, 0]) {
    const h = Math.min(dt, 1 / 20);
    for (let i = 0; i < 3; i++) {
      const a = this.stiffness * (target[i] - this.x[i]) - this.damping * this.v[i] + force[i];
      this.v[i] += a * h;
      this.x[i] += this.v[i] * h;
    }
    return this.x;
  }
}

/**
 * A falling leaf: gravity, quadratic air drag towards a low terminal speed, and the side-to-side
 * "falling leaf" glide (it glides one way, stalls, tips and glides back).
 */
export type Leaf = {
  p: Vec3;
  v: Vec3;
  phase: number;
  /** Glide oscillation frequency, Hz (real leaves: roughly 0.5–1.5 Hz). */
  freq: number;
  /** Glide speed amplitude, m/s. */
  glide: number;
  /** Heading of the glide in the ground plane, radians. */
  heading: number;
  /** Terminal fall speed, m/s (real leaves: roughly 0.5–1.5 m/s). */
  vt: number;
  spin: number;
};

export function stepLeaf(leaf: Leaf, dt: number, wind: Vec3 = [0, 0, 0], g = G) {
  const h = Math.min(dt, 1 / 20);
  leaf.phase += 2 * Math.PI * leaf.freq * h;
  // Quadratic drag, with k chosen so the steady fall speed is exactly vt (k·vt² = g).
  const k = g / (leaf.vt * leaf.vt);
  const rx = leaf.v[0] - wind[0];
  const ry = leaf.v[1] - wind[1];
  const rz = leaf.v[2] - wind[2];
  const speed = Math.hypot(rx, ry, rz);
  const glide = leaf.glide * Math.cos(leaf.phase);
  // The glide is a lift force that steers the horizontal velocity; drag opposes motion through the air.
  leaf.v[0] += (-k * speed * rx + (Math.cos(leaf.heading) * glide - rx) * 2) * h;
  leaf.v[1] += (-g - k * speed * ry) * h;
  leaf.v[2] += (-k * speed * rz + (Math.sin(leaf.heading) * glide - rz) * 2) * h;
  for (let i = 0; i < 3; i++) leaf.p[i] += leaf.v[i] * h;
  return leaf;
}

/** Thin-lens circle of confusion (metres on the sensor) for an object at objectDist when focused at focusDist. */
export function circleOfConfusion(
  focalLength: number,
  fNumber: number,
  focusDist: number,
  objectDist: number,
) {
  const A = focalLength / fNumber;
  return (
    (A * focalLength * Math.abs(objectDist - focusDist)) /
    (objectDist * Math.max(1e-6, focusDist - focalLength))
  );
}

/** A seeded random generator (mulberry32), so the forest is the same on every visit. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Scroll-timeline helpers. */
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const smooth = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};
/** 0 before a, 1 after b, smooth in between. */
export const win = (p: number, a: number, b: number) => smooth((p - a) / (b - a));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
