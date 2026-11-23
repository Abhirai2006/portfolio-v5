import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Chapter key (kept for callers; the ink world has no colour washes — colour only appears as light). */
export type Wash =
  "origin" | "arcs" | "lab" | "stats" | "activity" | "ask" | "sidequest" | "finale";

/** A manga panel: hard ink border on paper-white line, offset shadow, optional art behind the content. */
export function Panel({
  children,
  art,
  artAlt = "",
  className,
  as: Tag = "div",
  style,
}: {
  children?: ReactNode;
  chapter?: Wash;
  tone?: "ink" | "wash";
  art?: string;
  artAlt?: string;
  className?: string;
  as?: "div" | "article" | "section" | "figure" | "li";
  style?: CSSProperties;
}) {
  return (
    <Tag className={cn("panel overflow-hidden", className)} style={style}>
      {art && (
        <img
          src={art}
          alt={artAlt}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div className="relative">{children}</div>
    </Tag>
  );
}

/** Speech bubble with a tail pointing down-left or down-right. */
export function Bubble({
  children,
  from = "left",
  className,
}: {
  children: ReactNode;
  from?: "left" | "right";
  className?: string;
}) {
  return (
    <div className={cn("bubble", from === "right" && "bubble-right", className)}>{children}</div>
  );
}

/** Radial speed lines: "this moment matters". Decorative. */
export function SpeedLines({ className }: { className?: string; count?: number; color?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("speed-lines pointer-events-none absolute inset-0", className)}
    />
  );
}

/** Halftone dot screen, used as a shading layer inside panels. Decorative. */
export function Screentone({
  className,
}: {
  className?: string;
  density?: number;
  color?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn("screentone pointer-events-none absolute inset-0 opacity-15", className)}
    />
  );
}
