import { describe, expect, test } from "bun:test";
import { Chess } from "chess.js";
import { CHAPTERS } from "@/lib/chess/lines";
import { MARSHALL, checkFinaleMove } from "@/lib/chess/marshall";

test("homepage chapters in order", () => {
  expect([...CHAPTERS]).toEqual([
    "origin",
    "arcs",
    "lab",
    "stats",
    "activity",
    "ask",
    "sidequest",
    "finale",
  ]);
});

describe("Levitsky vs Marshall, Breslau 1912", () => {
  test("the PGN replays to the board in Wikipedia's final diagram", () => {
    const game = new Chess();
    game.loadPgn(MARSHALL.pgn);
    expect(game.fen().split(" ")[0]).toBe("5rk1/pp4pp/4p3/2R3Q1/3n4/6qr/P1P2PPP/5RK1");
    expect(MARSHALL.finalBoard).toBe("5rk1/pp4pp/4p3/2R3Q1/3n4/6qr/P1P2PPP/5RK1");
  });

  test("the puzzle is the position before 23...Qg3, black to move", () => {
    const game = new Chess(MARSHALL.puzzleFen);
    expect(game.turn()).toBe("b");
    game.move(MARSHALL.solution);
    expect(game.fen().split(" ")[0]).toBe(MARSHALL.finalBoard);
  });

  test("finale move checker", () => {
    expect(checkFinaleMove("Qg3")).toBe("solved");
    expect(checkFinaleMove("Qb4")).toBe("legal-wrong");
    expect(checkFinaleMove("Ke7")).toBe("illegal");
    expect(checkFinaleMove("")).toBe("illegal");
  });
});
