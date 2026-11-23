/**
 * Original ink-style chess pieces, drawn for this site (not copied from any piece set).
 * 45×45 viewBox; white pieces are paper with ink outlines, black pieces are ink with paper detail lines.
 */
export type PieceType = "p" | "n" | "b" | "r" | "q" | "k";
export type PieceColor = "w" | "b";

const SHAPES: Record<PieceType, { body: string; detail?: string }> = {
  p: {
    body: "M22.5 9a5 5 0 0 1 3.3 8.8c2.6 1.6 4.2 4.4 4.2 7.2 0 2-1 3.6-2.4 4.6 3.4 1.6 6.4 4.8 6.9 8.9H10.5c.5-4.1 3.5-7.3 6.9-8.9-1.4-1-2.4-2.6-2.4-4.6 0-2.8 1.6-5.6 4.2-7.2A5 5 0 0 1 22.5 9z",
  },
  r: {
    body: "M11 9h5v4h4.2V9h4.6v4H29V9h5v8l-3.5 3v11l3.5 3v4.5H11V34l3.5-3V20L11 17z",
    detail: "M14.5 20h16M14.5 31h16",
  },
  n: {
    body: "M24 9c7.5 1.2 11.5 7.8 11.5 16.5V38.5h-20c0-4.8 2.6-7.6 5.6-10.2-3.4.4-6.4 1.9-8.6 4.1L9.6 27.6c3.3-4.6 7-8.6 9.8-13.6L17.6 9.5c2.3.4 4.3 1.2 6.4 2.8z",
    detail: "M27.5 15.5a1.4 1.4 0 1 1 0 .1M21 22.5c2-.9 4.1-2.4 5.4-4.4",
  },
  b: {
    body: "M22.5 7.5a2.6 2.6 0 0 1 1.6 4.7c4.7 2.5 7.9 7.6 7.9 12.6 0 3-1.3 5.3-3.4 6.8 2.4.9 4.9 2.6 5.4 6.9h-23c.5-4.3 3-6 5.4-6.9-2.1-1.5-3.4-3.8-3.4-6.8 0-5 3.2-10.1 7.9-12.6a2.6 2.6 0 0 1 1.6-4.7z",
    detail: "M25.8 16.5 20 24.5M17 31.5h11",
  },
  q: {
    body: "M8.5 14.5 14 29.5l2.6-12.8 5.9 11.6 5.9-11.6L31 29.5l5.5-15-2.2 21.5c-3.5 1.8-7.4 2.5-11.8 2.5s-8.3-.7-11.8-2.5z",
    detail: "M13 33.5c6 1.6 13 1.6 19 0",
  },
  k: {
    body: "M21 6.5h3v3.2h3v3h-3v3.4c5.4.9 10 4.4 10 9.6 0 3.5-1.7 6.3-3.6 8.4v4.4H12.6v-4.4C10.7 31.9 9 29.1 9 25.7c0-5.2 4.6-8.7 10-9.6v-3.4h-3v-3h3V6.5z",
    detail: "M12.6 34.1c6.3 1.6 13.5 1.6 19.8 0M22.5 16.1v7",
  },
};

export function ChessPiece({
  type,
  color,
  className,
}: {
  type: PieceType;
  color: PieceColor;
  className?: string;
}) {
  const { body, detail } = SHAPES[type];
  const fill = color === "w" ? "var(--piece-white)" : "var(--piece-black)";
  const line = color === "w" ? "var(--piece-black)" : "var(--piece-white)";
  return (
    <svg viewBox="0 0 45 45" className={className} aria-hidden="true">
      <path
        d={body}
        fill={fill}
        stroke="var(--piece-black)"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {detail && (
        <path
          d={detail}
          fill="none"
          stroke={line}
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

export const PIECE_NAMES: Record<PieceType, string> = {
  p: "pawn",
  n: "knight",
  b: "bishop",
  r: "rook",
  q: "queen",
  k: "king",
};
