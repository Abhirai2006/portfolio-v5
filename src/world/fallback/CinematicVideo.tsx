/**
 * Phones / no WebGL (DESIGN §6): the same transformation as a pre-rendered, muted, captioned video recorded
 * from the desktop build (scripts/record-cinematics.mjs). Sound effects play only if the visitor turned them on.
 */
import { useEffect, useRef } from "react";
import { scheduleSounds } from "../cinematics/ImpactOverlay";
import { CINEMATICS } from "../cinematics/spec";
import { scrollToId } from "../scroll";
import { SECTION_FOR, type HeroId } from "../sequence";

export function CinematicVideo({ id, onDone }: { id: HeroId; onDone: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  const portrait = typeof window !== "undefined" && innerHeight > innerWidth;
  const base = `/media/cinematics/${id}-${portrait ? "portrait" : "landscape"}`;
  const finish = () => {
    onDone();
    scrollToId(SECTION_FOR[id], true);
  };
  useEffect(() => {
    const timers = scheduleSounds(CINEMATICS[id]);
    ref.current?.play().catch(() => undefined);
    return () => timers.forEach(clearTimeout);
  }, [id]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink">
      <video
        ref={ref}
        className="h-full w-full object-contain"
        muted
        playsInline
        autoPlay
        preload="auto"
        poster={`${base}.jpg`}
        title={CINEMATICS[id].caption}
        onEnded={finish}
        onError={finish}
      >
        <source src={`${base}.webm`} type="video/webm" />
        <source src={`${base}.mp4`} type="video/mp4" />
        <track
          kind="captions"
          src={`/media/cinematics/${id}.vtt`}
          srcLang="en"
          label="English"
          default
        />
      </video>
      <button
        type="button"
        onClick={finish}
        className="hud-link absolute bottom-6 right-6 text-paper"
      >
        Skip ▸
      </button>
    </div>
  );
}
