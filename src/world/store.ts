/**
 * One tiny mutable store shared by the DOM (scroll timelines, HUD, hero labels) and the WebGL world.
 * The canvas reads it every frame without React re-renders; React components subscribe for coarse changes.
 */
import type { HeroId } from "./sequence";
import type { Tier } from "./quality";

export type CinematicState = { id: HeroId; t: number; startedAt: number; reduced: boolean } | null;

export type WorldState = {
  tier: Tier | null;
  reduced: boolean;
  ready: boolean;
  /** Scroll progress (0–1) of each scrubbed shot. */
  scroll: { welcome: number; name: number; board: number; map: number; after: number };
  /** Hero piece under the pointer / keyboard focus. */
  hover: HeroId | null;
  cinematic: CinematicState;
  /** Look-dev: freeze a named shot at a time (from ?shot=name&t=0.5). */
  frozen: { shot: string; t: number } | null;
  /** Screen-space positions of the hero pieces, written by the canvas, read by the DOM labels. */
  heroScreen: Partial<Record<HeroId, { x: number; y: number; visible: boolean }>>;
  /** Pointer in normalised device coordinates, for subtle parallax. */
  pointer: { x: number; y: number };
  /** The lion's roar: a ripple travelling across the board tiles from (x, z). */
  ripple: { x: number; z: number; start: number } | null;
};

const state: WorldState = {
  tier: null,
  reduced: false,
  ready: false,
  scroll: { welcome: 0, name: 0, board: 0, map: 0, after: 0 },
  hover: null,
  cinematic: null,
  frozen: null,
  heroScreen: {},
  pointer: { x: 0, y: 0 },
  ripple: null,
};

type Listener = (s: WorldState) => void;
const listeners = new Set<Listener>();

export const world = {
  get: () => state,
  set(patch: Partial<WorldState>) {
    Object.assign(state, patch);
    listeners.forEach((l) => l(state));
  },
  /** Fast path for per-frame scroll writes: no listeners fired. */
  setScroll(key: keyof WorldState["scroll"], v: number) {
    state.scroll[key] = v;
  },
  subscribe(l: Listener) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};
