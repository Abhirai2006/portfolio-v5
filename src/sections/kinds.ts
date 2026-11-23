import type { Kind } from "@/lib/projects";

/** Which chess piece marks each kind of work (same pieces as the board's heroes). */
export const KIND_META: Record<Kind, { piece: string; label: string }> = {
  ml: { piece: "♞", label: "Machine learning" },
  product: { piece: "♜", label: "Full-stack product" },
  algo: { piece: "♝", label: "Algorithms" },
  practice: { piece: "♟", label: "Practice" },
};
