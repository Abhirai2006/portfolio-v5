/**
 * Bars sorting in ink (DESIGN §4.7 Algorithms): insertion sort, one adjacent swap per beat, the swapped pair
 * lit blue. Starts when it scrolls into view; loops with a new shuffle. Reduced motion shows the sorted state.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { rng } from "@/world/fx/rng";
import { insertionSortFrames } from "./frames";

function shuffled(seed: number, n: number) {
  const r = rng(seed);
  const a = Array.from({ length: n }, (_, i) => i + 1);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function InkSort({ n = 18 }: { n?: number }) {
  const [seed, setSeed] = useState(4);
  const frames = useMemo(() => insertionSortFrames(shuffled(seed, n)), [seed, n]);
  const [i, setI] = useState(0);
  const [on, setOn] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setI(frames.length - 1);
      return;
    }
    const io = new IntersectionObserver((e) => setOn(e[0]?.isIntersecting ?? false), {
      threshold: 0.3,
    });
    io.observe(el);
    return () => io.disconnect();
  }, [frames.length]);

  useEffect(() => {
    if (!on) return;
    const id = window.setInterval(() => {
      setI((k) => {
        if (k + 1 < frames.length) return k + 1;
        window.setTimeout(() => {
          setSeed((s) => s + 1);
          setI(0);
        }, 1400);
        return k;
      });
    }, 110);
    return () => window.clearInterval(id);
  }, [on, frames]);

  const f = frames[Math.min(i, frames.length - 1)];
  const done = i >= frames.length - 1;
  return (
    <div ref={ref} className="panel p-5">
      <div className="flex justify-between font-hud text-[10px] text-grey-4">
        <span>FIG. 1 · INSERTION SORT · {n} BARS</span>
        <span aria-live="off">
          SWAP {String(i).padStart(3, "0")} / {String(frames.length - 1).padStart(3, "0")}
          {done ? " · SORTED" : ""}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${n * 20} 200`}
        className="mt-4 h-[220px] w-full"
        role="img"
        aria-label="Animated diagram: bars of different heights being sorted by insertion sort, one swap at a time."
      >
        <defs>
          <pattern id="sort-tone" width="4" height="4" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.9" fill="#f2eee6" />
          </pattern>
        </defs>
        {f.values.map((v, k) => {
          const h = (v / n) * 180;
          const lit = f.active.includes(k);
          return (
            <g
              key={v}
              style={{ transform: `translateX(${k * 20}px)`, transition: "transform 100ms linear" }}
            >
              <rect
                x="3"
                y={200 - h}
                width="14"
                height={h}
                fill={lit ? "#9cc2ff" : done ? "#f2eee6" : "url(#sort-tone)"}
                stroke="#f2eee6"
                strokeWidth="1.5"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
