import type { HeroId } from "../sequence";
import type { PieceType } from "./profiles";

export type Placement = { type: PieceType; color: "w" | "b"; square: string; hero?: HeroId };

const BACK_RANK: PieceType[] = [
  "rook",
  "knight",
  "bishop",
  "queen",
  "king",
  "bishop",
  "knight",
  "rook",
];
const FILES = "abcdefgh";

/** The six white hero pieces stand on their starting squares (DESIGN §4.4); the rest are decoration. */
const HEROES: Record<string, HeroId> = {
  b1: "knight",
  a1: "rook",
  c1: "bishop",
  e2: "pawn",
  e1: "king",
  d1: "queen",
};

export function boardLayout(): Placement[] {
  const out: Placement[] = [];
  for (const color of ["w", "b"] as const) {
    const back = color === "w" ? 1 : 8;
    const pawns = color === "w" ? 2 : 7;
    for (let f = 0; f < 8; f++) {
      for (const [rank, type] of [
        [back, BACK_RANK[f]],
        [pawns, "pawn"],
      ] as const) {
        const square = `${FILES[f]}${rank}`;
        const hero = color === "w" ? HEROES[square] : undefined;
        out.push(hero ? { type, color, square, hero } : { type, color, square });
      }
    }
  }
  return out;
}

/** Board-space centre of a square; the board is centred on the origin, white at +z (towards the camera). */
export function squareToXZ(square: string, size: number): [number, number] {
  const f = FILES.indexOf(square[0]);
  const r = Number(square[1]) - 1;
  return [(f - 3.5) * size, (3.5 - r) * size];
}
