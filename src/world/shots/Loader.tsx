/**
 * Loader — "Ignition" (DESIGN §4.1). Every number here is real: bytes received and the stage come from the
 * tracker (streamed model downloads, script transfer sizes, shader compile, board build). Equations he loves
 * are written in ink as progress passes each seventh; at READY they are pulled into a black hole, a beat of
 * silence, then a white flash (no flash in reduced motion).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { rng } from "../fx/rng";
import { STAGES, formatBytes, type Snapshot, type Tracker } from "../loading";
import { world } from "../store";

/** Equations as SVG runs; `sup` parts are raised (Euler's identity). Set in Inter italic for legibility. */
const EQUATIONS: { parts: { t: string; sup?: boolean }[]; x: number; y: number; r: number }[] = [
  { parts: [{ t: "e" }, { t: "iπ", sup: true }, { t: " + 1 = 0" }], x: 170, y: 190, r: -4 },
  { parts: [{ t: "∇·E = ρ/ε₀" }], x: 1010, y: 160, r: 3 },
  { parts: [{ t: "iħ ∂ψ/∂t = Ĥψ" }], x: 120, y: 700, r: 2 },
  { parts: [{ t: "θ ← θ − η∇L" }], x: 1030, y: 720, r: -3 },
  { parts: [{ t: "softmax(QKᵀ/√d)V" }], x: 540, y: 110, r: 0 },
  { parts: [{ t: "E = mc²" }], x: 610, y: 820, r: 2 },
];

type Phase = "loading" | "collapse" | "flash" | "gone";

export function Loader({
  tracker,
  frozen,
  canSkip,
  onDone,
}: {
  tracker: Tracker;
  frozen: number | null;
  canSkip: (ready: boolean) => boolean;
  onDone: () => void;
}) {
  const [snap, setSnap] = useState<Snapshot>(tracker.snapshot());
  const [phase, setPhase] = useState<Phase>("loading");
  const stars = useMemo(() => {
    const r = rng(2026);
    return Array.from({ length: 140 }, () => ({
      x: r() * 1440,
      y: r() * 900,
      s: r() * 1.4 + 0.3,
      d: r(),
    }));
  }, []);

  useEffect(() => {
    let raf = 0;
    return tracker.subscribe((s) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setSnap(s));
    });
  }, [tracker]);

  const shown: Snapshot =
    frozen !== null
      ? {
          bytes: Math.round(frozen * 2_400_000 * 0.9),
          fraction: frozen,
          stage:
            frozen < 0.8 ? "DOWNLOADING" : frozen < 0.9 ? "COMPILING SHADERS" : "BUILDING BOARD",
        }
      : snap;
  const ready = shown.stage === "READY";

  // READY → collapse → flash → done. Runs once: `phase` must NOT be a dependency, or the phase change would
  // re-run the effect and its cleanup would cancel the timers (the loader would hang at 100%).
  const outro = useRef(false);
  useEffect(() => {
    if (!ready || frozen !== null || outro.current) return;
    outro.current = true;
    if (world.get().reduced) {
      onDone();
      return;
    }
    setPhase("collapse");
    window.setTimeout(() => setPhase("flash"), 1500); // collapse + a beat of silence
    window.setTimeout(() => {
      setPhase("gone");
      onDone();
    }, 1500 + 260);
  }, [ready, frozen, onDone]);

  // Safety net: if READY never arrives (a stalled download or shader compile), offer Skip after 8 s.
  const [stalled, setStalled] = useState(false);
  useEffect(() => {
    if (frozen !== null) return;
    const id = window.setTimeout(() => setStalled(true), 8000);
    return () => window.clearTimeout(id);
  }, [frozen]);

  const pct = Math.round(shown.fraction * 100);
  const stageIndex = STAGES.indexOf(shown.stage);
  const collapsing = phase === "collapse" || phase === "flash";

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-ink text-paper"
      role="status"
      aria-live="polite"
      aria-label={`Loading Abhishek's World: ${pct}%`}
    >
      <svg
        viewBox="0 0 1440 900"
        // portrait phones: show the whole drawing (letterboxed in ink) instead of cropping the equations away
        preserveAspectRatio={
          typeof window !== "undefined" && innerWidth < innerHeight
            ? "xMidYMid meet"
            : "xMidYMid slice"
        }
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="aw-disc" cx="50%" cy="50%" r="50%">
            <stop offset="55%" stopColor="#0b0b0c" />
            <stop offset="72%" stopColor="#f2eee6" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#f2eee6" stopOpacity="0" />
          </radialGradient>
          <filter id="aw-soft">
            <feGaussianBlur stdDeviation="6" />
          </filter>
          {EQUATIONS.map((e, i) => {
            const reveal = Math.min(1, Math.max(0, (shown.fraction - i / 7) * 7));
            return (
              <clipPath key={i} id={`aw-eq-${i}`}>
                <rect x={e.x - 10} y={e.y - 60} width={reveal * 420} height={90} />
              </clipPath>
            );
          })}
        </defs>
        {stars.map((s, i) => (
          <circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={s.s}
            fill="#f2eee6"
            opacity={shown.fraction > s.d ? 0.25 + s.d * 0.5 : 0}
            style={{ transition: "opacity 600ms" }}
          />
        ))}
        <g
          style={{
            transformOrigin: "720px 450px",
            transform: collapsing ? "scale(0.02) rotate(160deg)" : "none",
            opacity: collapsing ? 0 : 1,
            transition: "transform 1100ms cubic-bezier(0.7,0,0.84,0), opacity 1100ms ease-in",
          }}
        >
          {[220, 300, 390].map((rx, i) => (
            <g
              key={rx}
              className="aw-orbit"
              style={{ transformOrigin: "720px 450px", animationDuration: `${14 + i * 9}s` }}
            >
              <ellipse
                cx="720"
                cy="450"
                rx={rx}
                ry={rx * 0.34}
                fill="none"
                stroke="#f2eee6"
                strokeOpacity="0.45"
                strokeWidth="1"
                pathLength={1}
                strokeDasharray="1"
                strokeDashoffset={1 - Math.min(1, shown.fraction * 1.6 - i * 0.15)}
                transform={`rotate(${-18 + i * 22} 720 450)`}
              />
              <circle
                cx={720 + rx}
                cy="450"
                r={4 - i}
                fill="#f2eee6"
                transform={`rotate(${-18 + i * 22} 720 450)`}
              />
            </g>
          ))}
          {EQUATIONS.map((e, i) => (
            <text
              key={i}
              x={e.x}
              y={e.y}
              clipPath={`url(#aw-eq-${i})`}
              transform={`rotate(${e.r} ${e.x} ${e.y})`}
              fill="#f2eee6"
              stroke="#f2eee6"
              strokeWidth="0.6"
              style={{
                fontSize: 44,
                fontFamily: "Inter, sans-serif",
                fontStyle: "italic",
                letterSpacing: "0.02em",
              }}
            >
              {e.parts.map((p, k) =>
                p.sup ? (
                  <tspan key={k} dy="-18" style={{ fontSize: 28 }}>
                    {p.t}
                  </tspan>
                ) : (
                  <tspan key={k} dy={k > 0 && e.parts[k - 1].sup ? 18 : 0}>
                    {p.t}
                  </tspan>
                ),
              )}
            </text>
          ))}
        </g>
        {/* the black hole that swallows them */}
        <g style={{ opacity: collapsing ? 1 : 0, transition: "opacity 700ms 500ms" }}>
          <ellipse
            cx="720"
            cy="450"
            rx="210"
            ry="46"
            fill="none"
            stroke="#f2eee6"
            strokeWidth="10"
            filter="url(#aw-soft)"
            opacity="0.8"
          />
          <circle cx="720" cy="450" r="120" fill="url(#aw-disc)" />
          <circle cx="720" cy="450" r="84" fill="#0b0b0c" />
          <path
            d="M520 450 C 600 380, 840 380, 920 450"
            stroke="#f2eee6"
            strokeWidth="5"
            fill="none"
            filter="url(#aw-soft)"
          />
        </g>
      </svg>

      {/* HUD */}
      <div className="pointer-events-none absolute inset-0 p-[var(--hud-pad)] font-hud text-[11px] text-grey-4">
        <span className="crop crop-tl" />
        <span className="crop crop-tr" />
        <span className="crop crop-bl" />
        <span className="crop crop-br" />
        <p className="aw-typing text-paper">LOADING ABHISHEK&apos;S WORLD</p>
        <ol className="aw-stages absolute bottom-[var(--hud-pad)] left-[var(--hud-pad)] flex flex-wrap gap-x-3 gap-y-1">
          {STAGES.map((s, i) => (
            <li
              key={s}
              className={
                i === stageIndex
                  ? "text-paper"
                  : i < stageIndex
                    ? "text-grey-3 line-through"
                    : "text-grey-2"
              }
            >
              {i > 0 && <span className="mr-3 text-grey-2">→</span>}
              {s}
            </li>
          ))}
        </ol>
        <p className="absolute bottom-[var(--hud-pad)] right-[var(--hud-pad)]">
          RECEIVED <span className="text-paper">{formatBytes(shown.bytes)}</span>
        </p>
        <p className="absolute right-[var(--hud-pad)] top-[var(--hud-pad)] tabular-nums">
          <span className="text-paper">{String(pct).padStart(3, "0")}</span> %
        </p>
      </div>

      {(canSkip(ready) || stalled) && phase === "loading" && (
        <button
          type="button"
          onClick={onDone}
          className="hud-link absolute bottom-16 left-1/2 -translate-x-1/2 text-paper"
        >
          Skip ▸
        </button>
      )}
      {phase === "flash" && (
        <div className="pointer-events-none absolute inset-0 bg-white" aria-hidden="true" />
      )}
    </div>
  );
}
