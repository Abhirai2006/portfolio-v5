/**
 * Leg phases for the code-built creatures (elephant, lion; the soldier/horse use their own clips).
 * Leg order for four legs: [front-left, front-right, back-left, back-right].
 * - walk:   four-beat lateral sequence (each leg a quarter cycle apart)
 * - gallop: front pair and back pair land close together, the pairs half a cycle apart
 */
const OFFSETS = {
  walk: [0, 0.5, 0.75, 0.25],
  gallop: [0, 0.1, 0.55, 0.65],
} as const;

const frac = (x: number) => ((x % 1) + 1) % 1;

export function gaitPhase(t: number, legs: number, pattern: "gallop" | "walk"): number[] {
  const offsets = legs === 4 ? OFFSETS[pattern] : Array.from({ length: legs }, (_, i) => i / legs);
  return offsets.map((o) => frac(t + o));
}

/** Lift curve for a leg at phase p: up during the swing (first 40%), planted the rest. */
export function legLift(p: number): number {
  return p < 0.4 ? Math.sin((p / 0.4) * Math.PI) : 0;
}

/** Forward swing of a leg at phase p, in [-1, 1]. */
export function legSwing(p: number): number {
  return p < 0.4 ? -1 + 2 * (p / 0.4) : 1 - 2 * ((p - 0.4) / 0.6);
}
