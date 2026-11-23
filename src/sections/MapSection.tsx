/**
 * "WHERE ARE YOU GOING?" (DESIGN §4.6, Birkar frames 1–4). Stage 1: one paper-white line with chamfered corners
 * snakes down the page, framing WHERE → ARE → YOU → GOING? as you scroll. Stage 2: destination panels sit along
 * the line — the navigation for all six chapters plus Ask, GitHub, Anime and Reviews. The line is measured from
 * the real word boxes on the client (any screen width); the words and links are plain server HTML.
 */
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { buildChamferPath, type Rect } from "@/world/where";
import { COPY, DESTINATIONS, HERO_LABEL } from "./copy";

const WORD_ALIGN = ["md:ml-[30%]", "md:ml-[6%]", "md:ml-[58%]", "md:ml-[14%]"];

function Card({ d, i }: { d: (typeof DESTINATIONS)[number]; i: number }) {
  const glyph = d.hero
    ? HERO_LABEL[d.hero].glyph
    : { ask: "❝", github: "▦", anime: "◐", reviews: "✉" }[d.id as "ask"];
  const inner = (
    <>
      <span aria-hidden="true" className="map-card-art screentone">
        <span className="map-card-glyph">{glyph}</span>
        <span className="speed-lines absolute inset-0 opacity-60" />
      </span>
      <span className="flex items-center justify-between font-hud text-[10px] text-grey-3">
        <span>PANEL {String(i + 1).padStart(2, "0")}</span>
        {d.hero && <span>{HERO_LABEL[d.hero].piece}</span>}
      </span>
      <span className="mt-1 block font-sfx text-[1.15rem] leading-tight text-paper">{d.title}</span>
      <span className="mt-1 block text-[13px] text-grey-4">{d.line}</span>
      <span className="mt-3 block font-hud text-[11px] text-paper">
        ENTER <span aria-hidden="true">→</span>
      </span>
    </>
  );
  return d.href.startsWith("/") ? (
    <Link to={d.href} className="map-card">
      {inner}
    </Link>
  ) : (
    <a href={d.href} className="map-card">
      {inner}
    </a>
  );
}

export function MapSection() {
  const box = useRef<HTMLDivElement>(null);
  const words = useRef<(HTMLSpanElement | null)[]>([]);
  const [d, setD] = useState<string | null>(null);
  const [size, setSize] = useState({ w: 1, h: 1 });

  useEffect(() => {
    const measure = () => {
      const root = box.current;
      if (!root) return;
      const rb = root.getBoundingClientRect();
      const rects: Rect[] = words.current.filter(Boolean).map((el) => {
        const r = el!.getBoundingClientRect();
        // tighten to the glyphs (Big Shoulders has tall ascenders in its box)
        return {
          x: r.left - rb.left,
          y: r.top - rb.top + r.height * 0.1,
          w: r.width,
          h: r.height * 0.8,
        };
      });
      const m = Math.max(10, rb.width * 0.012);
      setSize({ w: rb.width, h: rb.height });
      setD(buildChamferPath(rects, { chamfer: m * 2.2, margin: m }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (box.current) ro.observe(box.current);
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, []);

  // four rows of panels sit between the words
  const rows = [DESTINATIONS.slice(0, 3), DESTINATIONS.slice(3, 6), DESTINATIONS.slice(6, 10)];

  return (
    <section id="map" aria-labelledby="map-h2" className="relative py-[18vh]">
      <div ref={box} className="relative mx-auto max-w-[1440px] px-[var(--gutter)]">
        {d && (
          <svg
            aria-hidden="true"
            className="map-line pointer-events-none absolute inset-0 h-full w-full overflow-visible"
            viewBox={`0 0 ${size.w} ${size.h}`}
            preserveAspectRatio="none"
          >
            <path
              d={d}
              fill="none"
              stroke="#f2eee6"
              strokeWidth="4"
              strokeLinejoin="miter"
              pathLength={1}
            />
          </svg>
        )}
        <h2 id="map-h2" className="sr-only">
          Where are you going?
        </h2>
        {COPY.map.map((w, i) => (
          <div key={w}>
            <p
              aria-hidden="true"
              className={`relative font-display text-[clamp(4.5rem,20vw,19rem)] leading-[0.86] text-paper ${WORD_ALIGN[i]}`}
            >
              <span
                ref={(el) => {
                  words.current[i] = el;
                }}
                className="inline-block"
              >
                {w}
              </span>
            </p>
            {rows[i] && (
              <ul
                className={`relative my-[8vh] grid gap-6 sm:grid-cols-2 lg:grid-cols-3 ${i % 2 ? "lg:mr-[12%]" : "lg:ml-[12%]"}`}
              >
                {rows[i].map((dest, k) => (
                  <li key={dest.id} className={k === 1 ? "lg:translate-y-[6vh]" : ""}>
                    <Card d={dest} i={DESTINATIONS.indexOf(dest)} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
