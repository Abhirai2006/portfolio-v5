/**
 * The Board's DOM layer (DESIGN §4.4, F3): six real links, one per hero piece, labelled
 * `♞ KNIGHT → ML + CHURN LAB` etc. With the live world they float over their 3D pieces (thin HUD leader
 * lines), lift the piece on hover/focus and start the transformation on click/Enter. Without JS they are
 * plain links to the sections. On phones the board is a still image with the same hotspots.
 */
import { useEffect, useRef, useState } from "react";
import { play } from "@/hud/sound";
import { BoardStill } from "@/world/fallback/BoardStill";
import { HERO_IDS, SECTION_FOR, type HeroId } from "@/world/sequence";
import { choosePiece } from "@/world/Stage";
import { world } from "@/world/store";
import { COPY, HERO_LABEL } from "./copy";

/** Leader-line lengths: neighbours sit on different tiers so the labels never overlap (HUD style). */
const LEAD: Record<HeroId, number> = {
  rook: 40,
  knight: 120,
  bishop: 40,
  queen: 120,
  king: 200,
  pawn: 280,
};

export function BoardSection() {
  const [tier, setTier] = useState(world.get().tier);
  const [floating, setFloating] = useState(false);
  const refs = useRef<Partial<Record<HeroId, HTMLAnchorElement>>>({});

  useEffect(() => world.subscribe((s) => setTier(s.tier)), []);

  // follow the 3D pieces
  useEffect(() => {
    if (tier === "video" || tier === null) return;
    let raf = 0;
    const loop = () => {
      const screen = world.get().heroScreen;
      let any = false;
      for (const id of HERO_IDS) {
        const el = refs.current[id];
        const p = screen[id];
        if (!el || !p) continue;
        any ||= p.visible;
        el.style.transform = `translate(${p.x}px, ${p.y}px)`;
        el.dataset.visible = p.visible ? "true" : "false";
      }
      setFloating((f) => (f === any ? f : any));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tier]);

  const choose = (id: HeroId) => (e: React.MouseEvent) => {
    e.preventDefault();
    choosePiece(id);
  };
  const hover = (id: HeroId | null) => () => {
    if (world.get().cinematic) return;
    world.set({ hover: id });
    if (id) play("chime");
  };

  return (
    <section id="board" aria-labelledby="board-h2" className="relative h-[230svh]">
      {/* z-30: sticky creates its own stacking context, so the whole (transparent) layer sits above the canvas */}
      <div className="sticky top-0 z-30 h-[100svh] overflow-hidden">
        <h2 id="board-h2" className="sr-only">
          The board: choose a piece
        </h2>
        {tier === "video" ? (
          <div className="flex h-full flex-col items-center justify-center gap-6 px-[var(--gutter)]">
            <BoardStill onChoose={(id) => choosePiece(id)} />
            <p className="font-brush text-[clamp(1.3rem,5vw,2rem)] text-paper">{COPY.boardCue}</p>
          </div>
        ) : (
          <>
            <ul className={`board-labels ${floating ? "is-floating" : ""}`}>
              {HERO_IDS.map((id) => {
                const l = HERO_LABEL[id];
                return (
                  <li key={id}>
                    <a
                      ref={(el) => {
                        if (el) refs.current[id] = el;
                      }}
                      href={`#${SECTION_FOR[id]}`}
                      onClick={choose(id)}
                      onMouseEnter={hover(id)}
                      onMouseLeave={hover(null)}
                      onFocus={hover(id)}
                      onBlur={hover(null)}
                      className="hero-label"
                      style={{ ["--lead" as string]: `${LEAD[id]}px` }}
                    >
                      <span className="hero-label-box">
                        <span aria-hidden="true">{l.glyph}</span> {l.piece}{" "}
                        <span aria-hidden="true">→</span>
                        <span className="sr-only">leads to</span> {l.dest}
                      </span>
                      <span aria-hidden="true" className="hero-label-leader" />
                    </a>
                  </li>
                );
              })}
            </ul>
            <p className="board-cue word-reveal pointer-events-none absolute bottom-[14vh] left-1/2 w-max max-w-[90vw] -translate-x-1/2 text-center font-brush text-[clamp(1.4rem,2.6vw,2.4rem)] text-paper">
              <span className="sr-only">{COPY.boardCue}</span>
              {COPY.boardCue.split(" ").map((w, i) => (
                <span key={i} aria-hidden="true">
                  <span className="w" style={{ ["--i" as string]: i }}>
                    {w}
                  </span>{" "}
                </span>
              ))}
            </p>
          </>
        )}
      </div>
    </section>
  );
}
