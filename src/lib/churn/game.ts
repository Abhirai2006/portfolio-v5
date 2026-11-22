import type { Customer, TestRow } from "./types";

/**
 * "Save the customer": spend an illustrative budget on retention offers and watch the model rescore.
 * Prices are made up for the game. The model predicts; it does not prove an offer would cause a customer to stay.
 */
export const BUDGET = 100;

export type MoveId = "contract1y" | "techSupport" | "onlineSecurity" | "discount10";

export type Move = {
  id: MoveId;
  /** Chess-style notation shown on the button. */
  notation: string;
  label: string;
  cost: number;
  applies: (c: Customer) => boolean;
  apply: (c: Customer) => Customer;
};

const hasInternet = (c: Customer) => c.InternetService !== "No";

export const MOVES: Move[] = [
  {
    id: "contract1y",
    notation: "♘ c1y",
    label: "Offer a 1-year contract",
    cost: 60,
    applies: (c) => c.Contract === "Month-to-month",
    apply: (c) => ({ ...c, Contract: "One year" }),
  },
  {
    id: "techSupport",
    notation: "♗ ts",
    label: "Add tech support",
    cost: 25,
    applies: (c) => hasInternet(c) && c.TechSupport === "No",
    apply: (c) => ({ ...c, TechSupport: "Yes" }),
  },
  {
    id: "onlineSecurity",
    notation: "♖ sec",
    label: "Add online security",
    cost: 20,
    applies: (c) => hasInternet(c) && c.OnlineSecurity === "No",
    apply: (c) => ({ ...c, OnlineSecurity: "Yes" }),
  },
  {
    id: "discount10",
    notation: "♙ −10%",
    label: "10% monthly discount",
    cost: 30,
    applies: () => true,
    apply: (c) => ({ ...c, MonthlyCharges: Math.round(c.MonthlyCharges * 0.9 * 100) / 100 }),
  },
];

export type GameState = {
  customer: Customer;
  /** The model's probability for this customer before any offer. */
  startP: number;
  spent: number;
  played: MoveId[];
  error?: string;
};

/** Small deterministic PRNG so a seed always gives the same customer. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick an at-risk test customer (model probability >= threshold) on a month-to-month plan with internet,
 *  so every offer is available. */
export function startGame(rows: TestRow[], threshold: number, seed: number): GameState {
  const pool = rows.filter(
    (r) => r.p >= threshold && r.x.Contract === "Month-to-month" && hasInternet(r.x),
  );
  const pick = pool[Math.floor(mulberry32(seed)() * pool.length)];
  return { customer: { ...pick.x }, startP: pick.p, spent: 0, played: [] };
}

export function play(state: GameState, id: MoveId): GameState {
  const move = MOVES.find((m) => m.id === id);
  const refuse = (error: string): GameState => ({ ...state, error });
  if (!move) return refuse("Unknown move.");
  if (state.played.includes(id)) return refuse("Already offered.");
  if (!move.applies(state.customer)) return refuse("Doesn't apply to this customer.");
  if (state.spent + move.cost > BUDGET) return refuse("Over budget.");
  return {
    ...state,
    customer: move.apply(state.customer),
    spent: state.spent + move.cost,
    played: [...state.played, id],
    error: undefined,
  };
}
