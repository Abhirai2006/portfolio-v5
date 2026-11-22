import { describe, expect, test } from "bun:test";
import { Chess } from "chess.js";
import { DESTINATIONS, START_FEN, applyVisitorMove, parseSaved, whiteReply } from "@/lib/chess/play";

describe("the piece decides the destination", () => {
  test("exactly the six agreed destinations", () => {
    expect(DESTINATIONS.n.chapter).toBe("lab");
    expect(DESTINATIONS.r).toMatchObject({ chapter: "arcs", filter: "product" });
    expect(DESTINATIONS.b).toMatchObject({ chapter: "arcs", filter: "algo" });
    expect(DESTINATIONS.p.chapter).toBe("stats");
    expect(DESTINATIONS.k.chapter).toBe("origin");
    expect(DESTINATIONS.q.chapter).toBe("contact");
  });
});

describe("game", () => {
  test("the board starts after Abhishek's 1.Nf3, black to move", () => {
    const g = new Chess();
    g.move("Nf3");
    expect(START_FEN).toBe(g.fen());
    expect(new Chess(START_FEN).turn()).toBe("b");
  });

  test("visitor moves: legal black move is applied and reports the piece", () => {
    const r = applyVisitorMove(START_FEN, "g8", "f6");
    expect(r?.san).toBe("Nf6");
    expect(r?.piece).toBe("n");
    expect(new Chess(r!.fen).turn()).toBe("w");
  });

  test("visitor moves: illegal moves and white pieces are refused", () => {
    expect(applyVisitorMove(START_FEN, "g8", "g5")).toBeNull();
    expect(applyVisitorMove(START_FEN, "e2", "e4")).toBeNull();
    expect(applyVisitorMove(START_FEN, "e5", "e4")).toBeNull();
  });

  test("white always answers with a legal move, deterministically", () => {
    let fen = START_FEN;
    for (let i = 0; i < 25; i++) {
      const g = new Chess(fen);
      if (g.isGameOver()) break;
      // visitor: first legal move in sorted order (stable)
      const m = g.moves({ verbose: true }).sort((a, b) => a.lan.localeCompare(b.lan))[0];
      g.move(m);
      const reply = whiteReply(g.fen());
      if (g.isGameOver()) {
        expect(reply).toBeNull();
        break;
      }
      expect(reply).not.toBeNull();
      expect(whiteReply(g.fen())).toBe(reply);
      expect(() => g.move(reply!)).not.toThrow();
      fen = g.fen();
    }
  });

  test("white takes a hanging queen", () => {
    // Black queen left en prise on f6 to the knight... use a clear position: white knight on e4 can take queen on f6.
    const fen = "rnb1kbnr/pppp1ppp/5q2/4p3/4N3/8/PPPPPPPP/R1BQKBNR w KQkq - 0 3";
    expect(whiteReply(fen)).toBe("Nxf6+");
  });

  test("white delivers mate in one when it exists", () => {
    // Fool's-mate pattern reversed: white to mate with Qh5xf7#.
    const fen = "r1bqkbnr/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4";
    expect(whiteReply(fen)).toBe("Qxf7#");
  });

  test("no reply when the game is over", () => {
    const mated = "rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3";
    expect(whiteReply(mated)).toBeNull();
  });
});

describe("restoring a saved game", () => {
  const good = { fen: START_FEN, last: ["g1", "f3"], moves: ["Nf3"] };
  test("a valid saved game is restored", () => {
    expect(parseSaved(JSON.stringify(good))).toEqual(good);
  });
  test.each([
    ["empty object", "{}"],
    ["fen only", JSON.stringify({ fen: START_FEN })],
    ["moves not strings", JSON.stringify({ ...good, moves: [1, 2] })],
    ["last not two squares", JSON.stringify({ ...good, last: ["g1"] })],
    ["bad fen", JSON.stringify({ ...good, fen: "nonsense" })],
    ["not JSON", "{{{"],
    ["null", "null"],
  ])("%s is rejected", (_, raw) => {
    expect(parseSaved(raw)).toBeNull();
  });
});
