/**
 * Quality tiers (docs/ARCHITECTURE.md §3).
 * - ultra: desktop with a strong GPU (fast probe frame)
 * - high:  desktop that can run the live world
 * - video: phones, no WebGL2, low memory, data saver or a slow probe → pre-rendered cinematics + 2D board
 * Reduced motion does not change the tier; it changes how cinematics play (see cinematics/spec.ts).
 */
export type Tier = "ultra" | "high" | "video";

export type TierInput = {
  webgl2: boolean;
  cores: number;
  memoryGb?: number;
  reducedMotion: boolean;
  saveData: boolean;
  width: number;
  /** Median frame time (ms) of a ~1 s probe render; undefined when not measured yet. */
  frameMs?: number;
};

export const MOBILE_BREAKPOINT = 900;

export function detectTier(i: TierInput): Tier {
  if (!i.webgl2 || i.saveData || i.width < MOBILE_BREAKPOINT) return "video";
  if (i.memoryGb !== undefined && i.memoryGb <= 2) return "video";
  if (i.frameMs !== undefined && i.frameMs > 40) return "video";
  if (i.cores >= 8 && i.frameMs !== undefined && i.frameMs <= 12) return "ultra";
  return "high";
}

const DPR_MIN = 0.75;
const DPR_MAX = 1.5;

/** Nudges the render DPR toward a ~60 fps budget, clamped to 0.75–1.5 (ARCHITECTURE §7). */
export function adaptiveDpr(frameMs: number, current: number): number {
  let next = current;
  if (frameMs > 20) next = current - 0.15;
  else if (frameMs < 13) next = current + 0.1;
  return Math.round(Math.min(DPR_MAX, Math.max(DPR_MIN, next)) * 100) / 100;
}

/** Browser probe for the static inputs; the frame probe is measured by the canvas itself. */
export function probeEnvironment(): Omit<TierInput, "frameMs"> {
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  let webgl2 = false;
  try {
    webgl2 = !!document.createElement("canvas").getContext("webgl2");
  } catch {
    webgl2 = false;
  }
  return {
    webgl2,
    cores: nav.hardwareConcurrency || 4,
    memoryGb: nav.deviceMemory,
    reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    saveData: !!nav.connection?.saveData,
    width: innerWidth,
  };
}
