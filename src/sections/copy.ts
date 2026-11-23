/** Homepage copy, verbatim from docs/CONTENT.md §3. Facts come from src/lib/facts.ts and src/lib/projects.ts. */
import type { HeroId, SectionId } from "@/world/sequence";

export const COPY = {
  welcome: "WELCOME TO ABHISHEK'S WORLD",
  tagline: ["Aspiring ML engineer", "Mysuru", "looking for ML internships"],
  boardCue: "Choose a piece. It knows the way.",
  map: ["WHERE", "ARE", "YOU", "GOING?"],
  quote: "Building cool stuff, one algorithm at a time.",
  honesty:
    "The ML and algorithm work is his; the web layer is built with AI as a copilot, and he says so.",
} as const;

export const HERO_LABEL: Record<HeroId, { glyph: string; piece: string; dest: string }> = {
  knight: { glyph: "♞", piece: "KNIGHT", dest: "ML + CHURN LAB" },
  rook: { glyph: "♜", piece: "ROOK", dest: "PRODUCTS" },
  bishop: { glyph: "♝", piece: "BISHOP", dest: "ALGORITHMS" },
  pawn: { glyph: "♟", piece: "PAWN", dest: "SKILLS + RÉSUMÉ" },
  king: { glyph: "♚", piece: "KING", dest: "ABOUT" },
  queen: { glyph: "♛", piece: "QUEEN", dest: "CONTACT" },
};

export const SPLASH: Partial<Record<SectionId, { title: string; line?: string; plate: string }>> = {
  ml: {
    title: "THE MODEL RUNS HERE.",
    line: "His Bluemind capstone, live in your browser.",
    plate: "CHAPTER 1 · THE KNIGHT",
  },
  products: {
    title: "FIVE VOLUMES.",
    line: "Products with real users, real tests and one paid client.",
    plate: "CHAPTER 2 · THE ROOK",
  },
  algorithms: { title: "ALGORITHMS, DRAWN.", plate: "CHAPTER 3 · THE BISHOP" },
  skills: { title: "FROM PAWN TO QUEEN.", plate: "CHAPTER 4 · THE PAWN" },
  about: {
    title: "ORIGIN.",
    line: "Mangaluru → Mysuru. Maths first.",
    plate: "CHAPTER 5 · THE KING",
  },
  contact: {
    title: "LET'S TALK.",
    line: "Looking for ML internships.",
    plate: "CHAPTER 6 · THE QUEEN",
  },
};

/** The map's destination cards: the six chapters plus the side rooms (DESIGN §4.6). */
export const DESTINATIONS: {
  id: SectionId | "anime" | "reviews";
  title: string;
  line: string;
  href: string;
  hero?: HeroId;
}[] = [
  {
    id: "ml",
    title: "ML + Churn Lab",
    line: "A real churn model, running live.",
    href: "#ml",
    hero: "knight",
  },
  {
    id: "products",
    title: "Products",
    line: "Five volumes, real users.",
    href: "#products",
    hero: "rook",
  },
  {
    id: "algorithms",
    title: "Algorithms",
    line: "Sorting and searching, drawn in ink.",
    href: "#algorithms",
    hero: "bishop",
  },
  {
    id: "skills",
    title: "Skills + Résumé",
    line: "From pawn to queen.",
    href: "#skills",
    hero: "pawn",
  },
  {
    id: "about",
    title: "About Abhishek",
    line: "Mangaluru to Mysuru, maths first.",
    href: "#about",
    hero: "king",
  },
  {
    id: "contact",
    title: "Contact",
    line: "Looking for ML internships.",
    href: "#contact",
    hero: "queen",
  },
  {
    id: "ask",
    title: "Ask Abhishek",
    line: "Questions, answered in speech bubbles.",
    href: "#ask",
  },
  { id: "github", title: "Live GitHub", line: "Commits as an ink city.", href: "#github" },
  { id: "anime", title: "Anime shelf", line: "The manga library.", href: "/anime" },
  { id: "reviews", title: "Reviews", line: "Letters from readers.", href: "/reviews" },
];
