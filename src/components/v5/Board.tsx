import { useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { Chess, type Square } from "chess.js";
import {
  ChessPiece,
  PIECE_NAMES,
  type PieceColor,
  type PieceType,
} from "@/components/art/ChessPiece";
import { cn } from "@/lib/utils";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

type Cell = { sq: Square; piece: { type: PieceType; color: PieceColor } | null; dark: boolean };

function cellsFor(fen: string, orientation: "w" | "b"): Cell[] {
  const board = new Chess(fen).board(); // rank 8 first
  const cells: Cell[] = [];
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const p = board[r][f];
      cells.push({
        sq: `${FILES[f]}${8 - r}` as Square,
        piece: p ? { type: p.type as PieceType, color: p.color as PieceColor } : null,
        dark: (r + f) % 2 === 1,
      });
    }
  }
  return orientation === "w" ? cells : cells.reverse();
}

export type BoardProps = {
  fen: string;
  orientation?: "w" | "b";
  /** Squares to tint as the last move, e.g. ["g1", "f3"]. */
  highlight?: string[];
  /** Square whose piece plays the arrival animation, with its offset in squares from where it came. */
  arrive?: { sq: string; dx: number; dy: number };
  /** When set, the side to move can play by clicking or with the keyboard. */
  onMove?: (from: Square, to: Square) => void;
  /** Interactive board that is temporarily not accepting moves (keeps focus on the same button). */
  disabled?: boolean;
  label: string;
  className?: string;
};

/**
 * Chess board drawn in the site's ink style. Non-interactive boards are a labelled picture;
 * interactive boards are a grid of buttons (arrow keys move, Enter or Space picks up and drops).
 */
export function Board({
  fen,
  orientation = "w",
  highlight = [],
  arrive,
  onMove,
  disabled = false,
  label,
  className,
}: BoardProps) {
  const cells = useMemo(() => cellsFor(fen, orientation), [fen, orientation]);
  const turn = useMemo(() => new Chess(fen).turn(), [fen]);
  const [selected, setSelected] = useState<Square | null>(null);
  const [focus, setFocus] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const interactive = Boolean(onMove);

  const targets = useMemo(() => {
    if (!selected) return new Set<string>();
    return new Set(new Chess(fen).moves({ square: selected, verbose: true }).map((m) => m.to));
  }, [fen, selected]);

  const press = (c: Cell) => {
    if (!onMove || disabled) return;
    const own = c.piece?.color === turn;
    if (selected && !own) {
      onMove(selected, c.sq); // the caller decides whether it was legal / right
      setSelected(null);
    } else if (own) {
      setSelected(c.sq === selected ? null : c.sq);
    } else {
      setSelected(null);
    }
  };

  const onKey = (e: KeyboardEvent, i: number) => {
    const delta = (
      { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 8, ArrowUp: -8 } as Record<string, number>
    )[e.key];
    if (delta === undefined) return;
    e.preventDefault();
    const next = Math.min(63, Math.max(0, i + delta));
    setFocus(next);
    refs.current[next]?.focus();
  };

  const name = (c: Cell) =>
    `${c.sq}${c.piece ? `, ${c.piece.color === "w" ? "white" : "black"} ${PIECE_NAMES[c.piece.type]}` : ""}`;

  return (
    <div
      role={interactive ? "group" : "img"}
      aria-label={label}
      className={cn(
        "chess-board grid aspect-square w-full grid-cols-8 grid-rows-8 overflow-hidden",
        className,
      )}
    >
      {cells.map((c, i) => {
        const piece = c.piece && (
          <ChessPiece
            type={c.piece.type}
            color={c.piece.color}
            className={cn("h-[86%] w-[86%]", arrive?.sq === c.sq && "piece-arrive")}
          />
        );
        const cls = cn(
          "relative flex items-center justify-center",
          c.dark ? "bg-[var(--sq-dark)]" : "bg-[var(--sq-light)]",
          highlight.includes(c.sq) && "sq-last",
          selected === c.sq && "sq-selected",
          targets.has(c.sq) && "sq-target",
        );
        const style =
          arrive?.sq === c.sq
            ? ({ "--dx": String(arrive.dx), "--dy": String(arrive.dy) } as CSSProperties)
            : undefined;
        return interactive ? (
          <button
            key={c.sq}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            tabIndex={i === focus ? 0 : -1}
            aria-label={name(c)}
            aria-pressed={selected === c.sq}
            aria-disabled={disabled || undefined}
            onClick={() => press(c)}
            onKeyDown={(e) => onKey(e, i)}
            onFocus={() => setFocus(i)}
            className={cn(
              cls,
              "focus-visible:z-10 focus-visible:outline-3 focus-visible:outline-[var(--primary)]",
            )}
            style={style}
          >
            {piece}
          </button>
        ) : (
          <div key={c.sq} className={cls} style={style} aria-hidden="true">
            {piece}
          </div>
        );
      })}
    </div>
  );
}
