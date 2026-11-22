import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Chess, type Square } from "chess.js";
import { Board } from "./Board";
import { ChessPiece, type PieceType } from "@/components/art/ChessPiece";
import { DESTINATIONS, START_FEN, applyVisitorMove, parseSaved, whiteReply } from "@/lib/chess/play";
import type { Kind } from "@/lib/projects";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const Board3D = lazy(() => import("./Board3D"));

const STORE = "v5-main-board";
const ORDER: PieceType[] = ["n", "r", "b", "p", "k", "q"];

type Saved = { fen: string; last: string[]; moves: string[] };

export type Destination = { chapter: string; filter?: Kind };

/** Game state for the main board, kept for the browser session so coming back continues the game. */
function useBoardGame(onTravel: (d: Destination) => void) {
  const [state, setState] = useState<Saved>({ fen: START_FEN, last: ["g1", "f3"], moves: ["Nf3"] });
  const [busy, setBusy] = useState(false);
  /** Lights out: true from the visitor's move until just before the page travels. */
  const [dramatic, setDramatic] = useState(false);
  const [msg, setMsg] = useState(
    "Abhishek opened 1.Nf3. Your move: the piece you move decides where you go.",
  );
  const timers = useRef<number[]>([]);

  useEffect(() => {
    try {
      const saved = parseSaved(sessionStorage.getItem(STORE));
      if (saved) {
        setState(saved);
        setMsg("Welcome back. Your game is where you left it.");
      } else {
        sessionStorage.removeItem(STORE); // drop anything malformed or from an older version
      }
    } catch {
      /* storage unavailable: fresh game */
    }
    return () => timers.current.forEach((t) => window.clearTimeout(t));
  }, []);

  const save = (s: Saved) => {
    setState(s);
    try {
      sessionStorage.setItem(STORE, JSON.stringify(s));
    } catch {
      /* private mode */
    }
  };

  const move = useCallback(
    (from: Square, to: Square) => {
      if (busy) return;
      const r = applyVisitorMove(state.fen, from, to);
      if (!r) {
        setMsg("That move isn't legal here. Pick a black piece, then one of its glowing squares.");
        return;
      }
      const dest = DESTINATIONS[r.piece];
      setBusy(true);
      // Lights out, unless the visitor asked for reduced motion (a sudden blackout is what they opted out of).
      if (!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) setDramatic(true);
      const afterVisitor = { fen: r.fen, last: [r.from, r.to], moves: [...state.moves, r.san] };
      save(afterVisitor);
      setMsg(
        `${r.san}: your ${r.piece === "n" ? "knight" : r.piece === "p" ? "pawn" : r.piece === "b" ? "bishop" : r.piece === "r" ? "rook" : r.piece === "q" ? "queen" : "king"} heads to ${dest.label}.`,
      );
      track("cta_click", `board_${r.piece}`);
      timers.current.push(
        window.setTimeout(() => {
          const reply = whiteReply(r.fen);
          let next = afterVisitor;
          if (reply) {
            const g = new Chess(r.fen);
            const m = g.move(reply);
            next = { fen: g.fen(), last: [m.from, m.to], moves: [...afterVisitor.moves, m.san] };
            save(next);
          }
          const over = new Chess(next.fen).isGameOver();
          setMsg(
            over
              ? "Game over. Start a new game any time."
              : `Abhishek answered ${reply}. Come back with "Back to the board" and play on.`,
          );
          timers.current.push(
            window.setTimeout(() => setDramatic(false), 900),
            window.setTimeout(() => {
              setBusy(false);
              onTravel({ chapter: dest.chapter, filter: dest.filter });
            }, 1350),
          );
        }, 1100),
      );
    },
    [busy, state, onTravel],
  );

  // Esc brings the lights back early.
  useEffect(() => {
    if (!dramatic) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDramatic(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dramatic]);

  const reset = () => {
    save({ fen: START_FEN, last: ["g1", "f3"], moves: ["Nf3"] });
    setMsg("New game. Abhishek opened 1.Nf3 again. Your move.");
  };

  return { ...state, busy, dramatic, msg, move, reset, over: new Chess(state.fen).isGameOver() };
}

function canUse3D() {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * The main board: a real 3D chess board (2D on the server, without WebGL, or with reduced motion).
 * The legend lists every destination as a plain link, so nobody has to play to get anywhere.
 */
export function MainBoard({ onTravel }: { onTravel: (d: Destination) => void }) {
  const game = useBoardGame(onTravel);
  const [three, setThree] = useState(false);
  const [prefer2D, setPrefer2D] = useState(false);

  useEffect(() => {
    if (!canUse3D()) return;
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number })
      .requestIdleCallback;
    const go = () => setThree(true);
    if (idle) idle(go);
    else window.setTimeout(go, 400);
  }, []);

  const show3D = three && !prefer2D;
  // Keep the board lifted above the dark layer until that layer has finished fading out,
  // otherwise the board is covered for the length of the fade.
  const [lifted, setLifted] = useState(false);
  useEffect(() => {
    if (game.dramatic) {
      setLifted(true);
      return;
    }
    const t = window.setTimeout(() => setLifted(false), 800);
    return () => window.clearTimeout(t);
  }, [game.dramatic]);
  const canPlay = !game.busy && !game.over;

  return (
    <div id="board" tabIndex={-1} className="scroll-mt-24 focus:outline-none">
      {/* Lights out: the whole page goes dark while a piece moves; only the board stays lit. */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none fixed inset-0 z-[60] bg-[radial-gradient(ellipse_at_center,rgba(2,6,18,0.82),rgba(0,0,0,0.96))] transition-opacity duration-700",
          game.dramatic ? "opacity-100" : "opacity-0",
        )}
      />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className={cn("relative", lifted && "z-[61]")}>
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl sm:aspect-[5/4] border-2 border-line bg-[radial-gradient(circle_at_50%_30%,color-mix(in_oklab,var(--primary)_22%,var(--paper)),var(--background)_75%)] shadow-[6px_6px_0_var(--panel-shadow)]">
            {show3D ? (
              <Suspense fallback={<Flat game={game} canPlay={canPlay} />}>
                <Board3D
                  fen={game.fen}
                  last={game.last}
                  canPlay={canPlay}
                  dramatic={game.dramatic}
                  onMove={game.move}
                />
              </Suspense>
            ) : (
              <Flat game={game} canPlay={canPlay} />
            )}
          </div>
          <p
            className="mt-3 rounded-lg border-2 border-line bg-paper p-3 text-sm"
            aria-live="polite"
          >
            {game.msg}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-muted-foreground">
            <span>
              {game.moves.map((m, i) => (i % 2 === 0 ? `${i / 2 + 1}.${m}` : m)).join(" ")}
            </span>
            <button
              type="button"
              onClick={game.reset}
              className="uppercase tracking-widest text-primary hover:underline"
            >
              New game
            </button>
            {three && (
              <button
                type="button"
                onClick={() => setPrefer2D((v) => !v)}
                className="uppercase tracking-widest text-primary hover:underline"
              >
                {prefer2D ? "3D board" : "2D board"}
              </button>
            )}
          </div>
        </div>
        <Legend onTravel={onTravel} />
      </div>
    </div>
  );
}

function Flat({ game, canPlay }: { game: ReturnType<typeof useBoardGame>; canPlay: boolean }) {
  return (
    <div className="flex h-full items-center justify-center p-3 sm:p-6">
      <Board
        fen={game.fen}
        orientation="b"
        highlight={game.last}
        onMove={game.move}
        disabled={!canPlay}
        label="Main board: you play black. The piece you move decides where the site takes you."
        className="max-w-full"
      />
    </div>
  );
}

function Legend({ onTravel }: { onTravel: (d: Destination) => void }) {
  return (
    <aside
      aria-labelledby="legend-title"
      className="rounded-2xl border-2 border-line bg-paper p-4 shadow-[6px_6px_0_var(--panel-shadow)]"
    >
      <h2
        id="legend-title"
        className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground"
      >
        Move a piece, go somewhere
      </h2>
      <ul className="mt-3 space-y-1.5">
        {ORDER.map((t) => {
          const d = DESTINATIONS[t];
          const href = `#${d.chapter}`;
          return (
            <li key={t}>
              <a
                href={href}
                onClick={(e) => {
                  e.preventDefault();
                  onTravel({ chapter: d.chapter, filter: d.filter });
                }}
                className="group flex items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-[color-mix(in_oklab,var(--primary)_14%,transparent)]"
              >
                <ChessPiece type={t} color="w" className="h-7 w-7 shrink-0" />
                <span className="text-sm">
                  <span className="font-semibold capitalize">
                    {
                      (
                        {
                          n: "knight",
                          r: "rook",
                          b: "bishop",
                          p: "pawn",
                          k: "king",
                          q: "queen",
                        } as const
                      )[t]
                    }
                  </span>
                  <span className="text-muted-foreground"> → {d.label}</span>
                </span>
              </a>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">
        You play black. Abhishek answers every move, and the game waits for you when you come back.
      </p>
    </aside>
  );
}

/** Floating button that returns to the main board once it's out of view. */
export function BackToBoard() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = document.getElementById("board");
    if (!el) return;
    const io = new IntersectionObserver((e) => setShow(!e.some((x) => x.isIntersecting)), {
      threshold: 0.05,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <button
      type="button"
      onClick={() => {
        const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        document
          .getElementById("board")
          ?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      }}
      className={cn(
        "fixed bottom-3 left-3 z-40 flex items-center gap-2 rounded-full border-2 border-line bg-paper px-4 py-2 text-sm font-bold shadow-[4px_4px_0_var(--panel-shadow)] transition",
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
      )}
      aria-hidden={!show}
      tabIndex={show ? 0 : -1}
    >
      <span aria-hidden="true">♞</span> Back to the board
    </button>
  );
}
