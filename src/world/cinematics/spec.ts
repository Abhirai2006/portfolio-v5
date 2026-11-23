/**
 * The six transformations (PRD §3, DESIGN §4.5). Common grammar:
 * awaken (piece cracks, light leaks) → shatter (shell bursts into ink shards) → emerge (creature steps out)
 * → charge (runs the "Where are you going?" line) → impact (SFX word, flash panel, section opens).
 * Beat times are fractions of durationMs. Flashes are capped at 3 per cinematic and ≥334 ms apart (N2).
 */
import type { Sfx } from "@/hud/sound";
import type { HeroId } from "../sequence";

export type BeatKind = "awaken" | "shatter" | "emerge" | "charge" | "impact";
export type CinematicSpec = {
  id: HeroId;
  creature: "horse" | "elephant" | "garuda" | "soldier" | "lion" | "phoenix";
  durationMs: number;
  sfxWord: string;
  beats: { at: number; kind: BeatKind }[];
  sounds: { sfx: Sfx; at: number }[];
  flashesMs: number[];
  shakePx: number;
  /** Plain-language description: used for the live region, video captions and alt text. */
  caption: string;
};

const beats = (
  shatter: number,
  emerge: number,
  charge: number,
  impact: number,
): CinematicSpec["beats"] => [
  { at: 0, kind: "awaken" },
  { at: shatter, kind: "shatter" },
  { at: emerge, kind: "emerge" },
  { at: charge, kind: "charge" },
  { at: impact, kind: "impact" },
];

export const CINEMATICS: Record<HeroId, CinematicSpec> = {
  knight: {
    id: "knight",
    creature: "horse",
    durationMs: 4600,
    sfxWord: "VRRM",
    beats: beats(0.16, 0.26, 0.36, 0.88),
    sounds: [
      { sfx: "crack", at: 0.16 },
      { sfx: "neigh", at: 0.3 },
      { sfx: "hoof", at: 0.36 },
      { sfx: "flame", at: 0.4 },
      { sfx: "hoof", at: 0.6 },
      { sfx: "neigh", at: 0.88 },
    ],
    flashesMs: [4050],
    shakePx: 5,
    caption:
      "The knight cracks open. A horse wrapped in red and blue flames gallops to the ML lab.",
  },
  rook: {
    id: "rook",
    creature: "elephant",
    durationMs: 5600,
    sfxWord: "CRACK",
    beats: beats(0.14, 0.24, 0.34, 0.86),
    sounds: [
      { sfx: "crack", at: 0.14 },
      { sfx: "trumpet", at: 0.28 },
      { sfx: "footfall", at: 0.4 },
      { sfx: "footfall", at: 0.55 },
      { sfx: "footfall", at: 0.7 },
      { sfx: "crack", at: 0.86 },
    ],
    flashesMs: [4820],
    shakePx: 6,
    caption:
      "The rook becomes a giant glowing elephant. The floor shatters under each step until it crashes into Products.",
  },
  bishop: {
    id: "bishop",
    creature: "garuda",
    durationMs: 4400,
    sfxWord: "KRAK-THOOM",
    beats: beats(0.15, 0.25, 0.38, 0.86),
    sounds: [
      { sfx: "crack", at: 0.15 },
      { sfx: "wing", at: 0.28 },
      { sfx: "thunder", at: 0.4 },
      { sfx: "screech", at: 0.7 },
      { sfx: "thunder", at: 0.86 },
    ],
    flashesMs: [1700, 3780],
    shakePx: 4,
    caption:
      "The bishop becomes Garuda, an eagle that dives diagonally through lightning to Algorithms.",
  },
  pawn: {
    id: "pawn",
    creature: "soldier",
    durationMs: 5200,
    sfxWord: "RISE",
    beats: beats(0.14, 0.22, 0.3, 0.86),
    sounds: [
      { sfx: "crack", at: 0.14 },
      { sfx: "drum", at: 0.3 },
      { sfx: "choir", at: 0.68 },
      { sfx: "rise", at: 0.72 },
    ],
    flashesMs: [3800],
    shakePx: 2,
    caption:
      "The pawn becomes a foot soldier, marches to the last rank and is promoted into a queen of light: student to engineer.",
  },
  king: {
    id: "king",
    creature: "lion",
    durationMs: 4800,
    sfxWord: "ROAR",
    beats: beats(0.15, 0.25, 0.4, 0.85),
    sounds: [
      { sfx: "crack", at: 0.15 },
      { sfx: "roar", at: 0.44 },
      { sfx: "boom", at: 0.47 },
      { sfx: "footfall", at: 0.7 },
    ],
    flashesMs: [2200],
    shakePx: 6,
    caption:
      "The king becomes a lion with a crown of fire. Its roar sends a golden shockwave across the board, toward About.",
  },
  queen: {
    id: "queen",
    creature: "phoenix",
    durationMs: 4600,
    sfxWord: "FWOOSH",
    beats: beats(0.14, 0.24, 0.36, 0.86),
    sounds: [
      { sfx: "crack", at: 0.14 },
      { sfx: "whoosh", at: 0.3 },
      { sfx: "rise", at: 0.5 },
      { sfx: "whoosh", at: 0.86 },
    ],
    flashesMs: [1700, 3950],
    shakePx: 3,
    caption:
      "The queen becomes a phoenix that bursts into rays of light in every direction and re-forms at Contact.",
  },
};

/** Reduced motion: the piece glows, then a short crossfade to the destination. No shards, shake or flash. */
export function reducedSpec(s: CinematicSpec): CinematicSpec {
  return {
    ...s,
    durationMs: 700,
    beats: [
      { at: 0, kind: "awaken" },
      { at: 0.5, kind: "impact" },
    ],
    sounds: [],
    flashesMs: [],
    shakePx: 0,
  };
}

/** Which beat a normalised time t (0–1) falls in, and how far through that beat it is. */
export function beatAt(s: CinematicSpec, t: number): { kind: BeatKind; local: number } {
  const tt = Math.min(1, Math.max(0, t));
  let i = 0;
  while (i + 1 < s.beats.length && s.beats[i + 1].at <= tt) i++;
  const start = s.beats[i].at;
  const end = i + 1 < s.beats.length ? s.beats[i + 1].at : 1;
  return { kind: s.beats[i].kind, local: end > start ? (tt - start) / (end - start) : 1 };
}

/** Normalised start time of a beat. */
export function beatStart(s: CinematicSpec, kind: BeatKind): number {
  return s.beats.find((b) => b.kind === kind)?.at ?? 0;
}
