import { describe, expect, test } from "bun:test";
import {
  HERO_IDS,
  SECTION_FOR,
  SECTION_IDS,
  canSkipLoader,
  initialBeat,
} from "../src/world/sequence";

describe("initialBeat", () => {
  test("first visit with no hash starts at the loader", () =>
    expect(initialBeat({ visited: false, hash: "" })).toBe("loader"));
  test("a deep link to a section skips the intro", () =>
    expect(initialBeat({ visited: false, hash: "#contact" })).toBe("section"));
  test("an unknown hash still starts at the loader", () =>
    expect(initialBeat({ visited: false, hash: "#nope" })).toBe("loader"));
  test("hash without # also works", () =>
    expect(initialBeat({ visited: true, hash: "ml" })).toBe("section"));
});

describe("canSkipLoader", () => {
  test("a returning visitor can skip at once", () =>
    expect(canSkipLoader({ visited: true, ready: false })).toBe(true));
  test("a first visit cannot skip before ready", () =>
    expect(canSkipLoader({ visited: false, ready: false })).toBe(false));
  test("anyone can continue when ready", () =>
    expect(canSkipLoader({ visited: false, ready: true })).toBe(true));
});

describe("hero pieces", () => {
  test("six heroes in board order", () =>
    expect([...HERO_IDS]).toEqual(["knight", "rook", "bishop", "pawn", "king", "queen"]));
  test("each hero leads to its section (PRD §3 table)", () =>
    expect(SECTION_FOR).toEqual({
      knight: "ml",
      rook: "products",
      bishop: "algorithms",
      pawn: "skills",
      king: "about",
      queen: "contact",
    }));
  test("every destination is a known section id", () => {
    for (const id of Object.values(SECTION_FOR)) expect(SECTION_IDS).toContain(id);
  });
});
