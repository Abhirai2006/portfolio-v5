import { Chess } from "chess.js";

/**
 * Levitsky vs Marshall, Breslau 1912. Marshall (black) ended it with 23...Qg3!!, offering his queen
 * to three captures; every one loses. Legend says spectators showered the board with gold coins.
 * Move list checked against Wikipedia's final-position diagram (tests/chess.test.ts).
 */
const PGN =
  "1.d4 e6 2.e4 d5 3.Nc3 c5 4.Nf3 Nc6 5.exd5 exd5 6.Be2 Nf6 7.O-O Be7 8.Bg5 O-O 9.dxc5 Be6 " +
  "10.Nd4 Bxc5 11.Nxe6 fxe6 12.Bg4 Qd6 13.Bh3 Rae8 14.Qd2 Bb4 15.Bxf6 Rxf6 16.Rad1 Qc5 " +
  "17.Qe2 Bxc3 18.bxc3 Qxc3 19.Rxd5 Nd4 20.Qh5 Ref8 21.Re5 Rh6 22.Qg5 Rxh3 23.Rc5 Qg3 0-1";

function puzzleFen(): string {
  const game = new Chess();
  game.loadPgn(PGN);
  game.undo();
  return game.fen();
}

export const MARSHALL = {
  pgn: PGN,
  puzzleFen: puzzleFen(),
  solution: "Qg3",
  finalBoard: "5rk1/pp4pp/4p3/2R3Q1/3n4/6qr/P1P2PPP/5RK1",
} as const;

/** Judge the visitor's move in the finale (black to move from the puzzle position). */
export function checkFinaleMove(san: string): "solved" | "legal-wrong" | "illegal" {
  if (!san) return "illegal";
  const game = new Chess(MARSHALL.puzzleFen);
  try {
    const move = game.move(san);
    return move.san.replace(/[+#!?]/g, "") === MARSHALL.solution ? "solved" : "legal-wrong";
  } catch {
    return "illegal";
  }
}
