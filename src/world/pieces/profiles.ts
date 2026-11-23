/**
 * Lathe profiles for the carved chaturanga-style pieces (DESIGN §4.4, ASSETS §2): original designs, made in code.
 * Each profile is a list of [radius, height] points from the base centre upward (units: one board square = 1).
 * Common traits: a stepped lotus base, ornate collars (ring flares) and temple-crown tops for king and queen.
 * The knight's horse head and the rook's elephant top are added as separate meshes in Piece.tsx.
 */
export const PIECE_TYPES = ["pawn", "rook", "knight", "bishop", "queen", "king"] as const;
export type PieceType = (typeof PIECE_TYPES)[number];
export type Profile = [number, number][];

/** Stepped lotus base: alternating flares read as petals once the ink outline is applied. */
function lotusBase(r: number): Profile {
  return [
    [0, 0],
    [r, 0],
    [r, 0.035],
    [r * 0.93, 0.05],
    [r * 0.99, 0.075],
    [r * 0.86, 0.1],
    [r * 0.92, 0.125],
    [r * 0.74, 0.16],
    [r * 0.62, 0.19],
  ];
}

/** An ornate collar: a pinched neck, a flared ring and a bead. */
function collar(r: number, y: number): Profile {
  return [
    [r * 0.75, y],
    [r * 1.25, y + 0.02],
    [r * 1.3, y + 0.04],
    [r * 0.95, y + 0.06],
    [r * 1.1, y + 0.075],
    [r * 0.8, y + 0.09],
  ];
}

export const PROFILES: Record<PieceType, Profile> = {
  pawn: [
    ...lotusBase(0.3),
    [0.15, 0.3],
    [0.12, 0.4],
    ...collar(0.12, 0.42),
    [0.15, 0.55],
    [0.17, 0.6],
    [0.16, 0.66],
    [0.11, 0.71],
    [0.04, 0.745],
    [0, 0.75],
  ],
  rook: [
    ...lotusBase(0.36),
    [0.25, 0.3],
    [0.22, 0.5],
    ...collar(0.2, 0.55),
    [0.26, 0.68],
    [0.28, 0.72],
    [0.28, 0.8],
    [0.2, 0.8],
    [0, 0.82],
  ],
  knight: [
    ...lotusBase(0.36),
    [0.22, 0.3],
    [0.19, 0.42],
    ...collar(0.17, 0.44),
    [0.16, 0.56],
    [0.05, 0.58],
    [0, 0.58],
  ],
  bishop: [
    ...lotusBase(0.34),
    [0.17, 0.32],
    [0.13, 0.52],
    ...collar(0.13, 0.55),
    [0.15, 0.7],
    [0.17, 0.78],
    [0.15, 0.86],
    [0.1, 0.94],
    [0.05, 1.0],
    [0.03, 1.02],
    [0.05, 1.04],
    [0.02, 1.08],
    [0, 1.1],
  ],
  queen: [
    ...lotusBase(0.38),
    [0.2, 0.34],
    [0.15, 0.62],
    ...collar(0.14, 0.66),
    [0.16, 0.85],
    [0.24, 0.98],
    [0.26, 1.03],
    [0.2, 1.06],
    [0.14, 1.12],
    [0.1, 1.17],
    [0.06, 1.2],
    [0.08, 1.23],
    [0.03, 1.28],
    [0, 1.3],
  ],
  king: [
    ...lotusBase(0.4),
    [0.21, 0.35],
    [0.16, 0.66],
    ...collar(0.15, 0.7),
    [0.17, 0.9],
    [0.25, 1.03],
    [0.27, 1.08],
    [0.21, 1.1],
    [0.16, 1.18],
    [0.12, 1.24],
    [0.07, 1.28],
    [0.05, 1.31],
    [0.04, 1.36],
    [0.02, 1.41],
    [0, 1.45],
  ],
};
