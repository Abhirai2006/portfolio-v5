/** Camera poses for the scrubbed shots (position, look-at). One board square = 1 unit. */
export const POSES = {
  board: { pos: [0, 8.2, 12.6] as const, look: [0, 0, 0.9] as const, fov: 32 },
  name: { pos: [0, 4.6, 12.5] as const, look: [0, 0.6, 0] as const, fov: 30 },
} as const;

export const ease = {
  outCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  inCubic: (t: number) => t * t * t,
  inOut: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outExpo: (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
};

export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Maps t from [a, b] to [0, 1], clamped. */
export const range = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
