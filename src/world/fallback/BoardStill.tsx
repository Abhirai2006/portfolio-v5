/**
 * Phones / no WebGL2 (DESIGN §6): a pre-rendered still of the board with real, tappable DOM hotspots.
 * On the image each hero piece gets a numbered ink marker (labels would collide at phone width); the six
 * choices themselves are the full-width buttons listed below (44 px tall touch targets). Positions come from hotspots.json, written by
 * scripts/record-cinematics.mjs when it renders board-still.jpg (fractions of width/height).
 */
import { HERO_IDS, type HeroId } from "../sequence";
import { HERO_LABEL } from "@/sections/copy";
import hotspots from "./hotspots.json";

export function BoardStill({ onChoose }: { onChoose: (id: HeroId) => void }) {
  const spots = hotspots as Record<HeroId, { x: number; y: number }>;
  return (
    <div className="mx-auto w-full max-w-[720px]">
      <div className="relative">
        <img
          src="/media/board-still.jpg"
          alt="A carved ink-and-paper chess board in a dark void, lit blue from the left and orange from the right. Six white pieces stand forward: knight, rook, bishop, pawn, king and queen."
          width={1080}
          height={1080}
          className="block h-auto w-full"
          loading="lazy"
        />
        {/* numbers on the picture are visual keys; the six buttons below are the tap targets */}
        {HERO_IDS.map((id, i) => (
          <span
            key={id}
            aria-hidden="true"
            className="pointer-events-none absolute flex h-7 w-7 -translate-x-1/2 -translate-y-full items-center justify-center rounded-full border-2 border-ink bg-paper font-hud text-[11px] text-ink shadow-[2px_2px_0_var(--blue-fire)]"
            style={{ left: `${spots[id].x * 100}%`, top: `${spots[id].y * 100}%` }}
          >
            {i + 1}
          </span>
        ))}
      </div>
      <ol className="mt-4 grid grid-cols-2 gap-2">
        {HERO_IDS.map((id, i) => {
          const l = HERO_LABEL[id];
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => onChoose(id)}
                className="min-h-11 w-full border border-paper bg-ink px-2 py-2 text-left font-hud text-[10px] text-paper"
              >
                <span className="mr-1 text-grey-3">{i + 1}</span> {l.glyph} {l.piece} → {l.dest}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
