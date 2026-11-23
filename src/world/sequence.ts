/** The intro's beats, the six hero pieces and where each one leads (PRD §3, DESIGN §4). */
export type Beat = "loader" | "welcome" | "name" | "board" | "cinematic" | "map" | "section";

export const SECTION_IDS = [
  "about",
  "ml",
  "products",
  "algorithms",
  "skills",
  "contact",
  "ask",
  "github",
  "breslau",
] as const;
export type SectionId = (typeof SECTION_IDS)[number];

export const HERO_IDS = ["knight", "rook", "bishop", "pawn", "king", "queen"] as const;
export type HeroId = (typeof HERO_IDS)[number];

export const SECTION_FOR: Record<HeroId, SectionId> = {
  knight: "ml",
  rook: "products",
  bishop: "algorithms",
  pawn: "skills",
  king: "about",
  queen: "contact",
};

const isSection = (s: string): s is SectionId => (SECTION_IDS as readonly string[]).includes(s);

/** A deep link to a section lands there directly; everyone else starts at the loader. */
export function initialBeat(o: { visited: boolean; hash: string }): Beat {
  const id = o.hash.replace(/^#/, "");
  return isSection(id) ? "section" : "loader";
}

/** Returning visitors may skip the loader at once (PRD F1); first-timers once the world is ready. */
export function canSkipLoader(o: { visited: boolean; ready: boolean }): boolean {
  return o.visited || o.ready;
}

export const VISITED_KEY = "aw:visited";
