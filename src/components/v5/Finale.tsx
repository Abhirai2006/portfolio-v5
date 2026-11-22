import { useState } from "react";
import { Chess, type Square } from "chess.js";
import { Board } from "./Board";
import { Panel, SpeedLines } from "@/components/art/primitives";
import { MARSHALL, checkFinaleMove } from "@/lib/chess/marshall";

/**
 * Breslau, 1912. The visitor plays black, as Marshall did, from the position before 23...Qg3!!.
 * Solving it is a flourish: the contact details below are on the page either way.
 */
export function Finale({ onSolved }: { onSolved: () => void }) {
  const [fen, setFen] = useState<string>(MARSHALL.puzzleFen);
  const [msg, setMsg] = useState<string>("Black to move. Marshall found a queen move that wins on the spot.");
  const [solved, setSolved] = useState(false);
  const [tries, setTries] = useState(0);

  const solve = () => {
    const g = new Chess(MARSHALL.puzzleFen);
    g.move(MARSHALL.solution);
    setFen(g.fen());
    setSolved(true);
    setMsg("23…Qg3!! The queen can be taken three ways, and every capture loses. White resigned.");
    onSolved();
  };

  const onMove = (from: Square, to: Square) => {
    if (solved) return;
    const g = new Chess(MARSHALL.puzzleFen);
    let san = "";
    try {
      san = g.move({ from, to, promotion: "q" }).san;
    } catch {
      setMsg("That move isn't legal here. Try again.");
      return;
    }
    const verdict = checkFinaleMove(san);
    if (verdict === "solved") return solve();
    const n = tries + 1;
    setTries(n);
    setMsg(
      n === 1
        ? `${san} is legal, but not the one. Look for a square your queen can reach that three white pieces attack.`
        : `${san} wins slowly. The queen wants g3, right next to White's king.`,
    );
  };

  return (
    <Panel chapter="finale" tone="wash" className="p-4 sm:p-6">
      {solved && <SpeedLines className="opacity-30" />}
      <div className="grid items-center gap-6 md:grid-cols-[minmax(0,22rem)_1fr]">
        <div className="relative">
          <Board
            fen={fen}
            orientation="b"
            highlight={solved ? ["c3", "g3"] : ["e5", "c5"]}
            onMove={solved ? undefined : onMove}
            label="Levitsky vs Marshall, Breslau 1912, black to move"
          />
          {solved && (
            <span className="sfx sfx-pop absolute -right-2 -top-4 text-5xl text-[var(--wash-finale)]">Qg3!!</span>
          )}
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Flashback</p>
          <h3 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">Breslau, 1912</h3>
          <p className="mt-3 text-muted-foreground">
            Levitsky against Marshall, Abhishek's favourite game. Legend says the crowd showered the board with gold
            coins after Marshall's last move. Play black and find it.
          </p>
          <p className="mt-4 rounded-lg border-2 border-line bg-paper p-3 text-sm" aria-live="polite">
            {msg}
          </p>
          {!solved && (
            <button
              type="button"
              onClick={solve}
              className="mt-3 font-mono text-xs uppercase tracking-widest text-primary underline-offset-4 hover:underline"
            >
              Show me the move
            </button>
          )}
        </div>
      </div>
    </Panel>
  );
}
