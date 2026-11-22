import { Chess, type Move, type Square } from "chess.js";
import type { ChapterId } from "./lines";
import type { Kind } from "@/lib/projects";
import type { PieceType } from "@/components/art/ChessPiece";

/** The piece the visitor moves decides where the site goes (spec §12). */
export const DESTINATIONS: Record<
  PieceType,
  { chapter: ChapterId | "contact"; label: string; filter?: Kind }
> = {
  n: { chapter: "lab", label: "ML work + Churn Lab" },
  r: { chapter: "arcs", label: "Products", filter: "product" },
  b: { chapter: "arcs", label: "Algorithms", filter: "algo" },
  p: { chapter: "stats", label: "Skills + Résumé" },
  k: { chapter: "origin", label: "About Abhishek" },
  q: { chapter: "contact", label: "Contact / Hire" },
};

/** Abhishek has already opened 1.Nf3; the visitor plays black. */
export const START_FEN = (() => {
  const g = new Chess();
  g.move("Nf3");
  return g.fen();
})();

/** Apply the visitor's (black) move. Returns null for illegal moves or when it isn't black's turn. */
export function applyVisitorMove(fen: string, from: Square | string, to: Square | string) {
  const g = new Chess(fen);
  if (g.turn() !== "b") return null;
  try {
    const m = g.move({ from, to, promotion: "q" });
    return { fen: g.fen(), san: m.san, piece: m.piece as PieceType, from: m.from, to: m.to };
  } catch {
    return null;
  }
}

const VALUE: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const CENTRE = new Set(["d4", "e4", "d5", "e5", "c4", "f4", "c5", "f5", "c3", "d3", "e3", "f3"]);

function score(g: Chess, m: Move): number {
  const after = new Chess(g.fen());
  after.move(m);
  if (after.isCheckmate()) return 10_000;
  const unsafe = after.isAttacked(m.to as Square, "b") ? VALUE[m.piece] : 0;
  let s = 0;
  if (m.captured) s += 10 * (VALUE[m.captured] - unsafe);
  else s -= 10 * unsafe;
  if (after.inCheck()) s += 4;
  if (m.isKingsideCastle() || m.isQueensideCastle()) s += 6;
  if ((m.piece === "n" || m.piece === "b") && "12".includes(m.from[1])) s += 3; // develop minor pieces
  if (CENTRE.has(m.to)) s += 2;
  if (m.piece === "q" && after.history().length < 12) s -= 3; // don't bring the queen out early
  if (m.piece === "k" && !m.isKingsideCastle() && !m.isQueensideCastle()) s -= 4;
  if (after.isDraw()) s -= 50;
  return s;
}

/** White's answer: mate if possible, else the best safe capture, check or developing move. Deterministic. */
export function whiteReply(fen: string): string | null {
  const g = new Chess(fen);
  if (g.turn() !== "w" || g.isGameOver()) return null;
  const moves = g.moves({ verbose: true }).sort((a, b) => a.lan.localeCompare(b.lan));
  let best = moves[0];
  let bestS = -Infinity;
  for (const m of moves) {
    const s = score(g, m);
    if (s > bestS) {
      bestS = s;
      best = m;
    }
  }
  return best ? best.san : null;
}

export type SavedGame = { fen: string; last: string[]; moves: string[] };

const SQUARE = /^[a-h][1-8]$/;

/** Read a saved game from sessionStorage text; anything malformed or from an older shape returns null. */
export function parseSaved(raw: string | null): SavedGame | null {
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as Partial<SavedGame> | null;
    if (!s || typeof s.fen !== "string") return null;
    if (!Array.isArray(s.moves) || !s.moves.every((m) => typeof m === "string")) return null;
    if (!Array.isArray(s.last) || s.last.length !== 2 || !s.last.every((q) => typeof q === "string" && SQUARE.test(q))) {
      return null;
    }
    new Chess(s.fen); // throws on an invalid position
    return { fen: s.fen, last: s.last, moves: s.moves };
  } catch {
    return null;
  }
}
