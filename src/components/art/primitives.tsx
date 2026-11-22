import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Chapter key used to pick a colour wash (`--wash-<chapter>` in styles.css). */
export type Wash =
  "origin" | "arcs" | "lab" | "stats" | "activity" | "ask" | "sidequest" | "finale";

/**
 * A webtoon panel: ink outline, hard offset shadow, optional colour wash.
 * `art` is the slot for a hand-drawn image: pass a URL and it fills the panel behind the content.
 */
export function Panel({
  children,
  chapter,
  tone = "ink",
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
  const wash = chapter ? `var(--wash-${chapter})` : "var(--primary)";
  return (
    <Tag
      className={cn("webtoon-panel relative overflow-hidden", className)}
      style={{
        ...(tone === "wash"
          ? {
              background: `linear-gradient(160deg, color-mix(in oklab, ${wash} 32%, var(--paper)) 0%, var(--paper) 72%)`,
            }
          : {}),
        ...style,
      }}
    >
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
    <div className={cn("speech-bubble", from === "right" && "speech-bubble--right", className)}>
      {children}
    </div>
  );
}

/** Radial speed lines, the webtoon shorthand for "this moment matters". Decorative. */
export function SpeedLines({
  className,
  count = 48,
  color = "var(--line)",
}: {
  className?: string;
  count?: number;
  color?: string;
}) {
  const lines = Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2;
    // Deterministic jitter so SSR and client render the same SVG.
    const inner = 34 + ((i * 37) % 11);
    const w = 0.35 + ((i * 53) % 7) / 10;
    // Rounded so server and browser trig agree exactly (hydration).
    const r = (v: number) => Math.round(v * 100) / 100;
    return {
      x1: r(50 + Math.cos(a) * inner),
      y1: r(50 + Math.sin(a) * inner),
      x2: r(50 + Math.cos(a) * 75),
      y2: r(50 + Math.sin(a) * 75),
      w,
    };
  });
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={cn("pointer-events-none absolute inset-0 h-full w-full opacity-25", className)}
    >
      {lines.map((l, i) => (
        <line
          key={i}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          stroke={color}
          strokeWidth={l.w}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

/** Halftone dot screen, used as a shading layer inside panels. Decorative. */
export function Screentone({
  className,
  density = 6,
  color = "var(--line)",
}: {
  className?: string;
  density?: number;
  color?: string;
}) {
  const id = `tone-${density}`;
  return (
    <svg
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 h-full w-full opacity-15", className)}
    >
      <defs>
        <pattern id={id} width={density} height={density} patternUnits="userSpaceOnUse">
          <circle cx={density / 2} cy={density / 2} r={density / 4} fill={color} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
