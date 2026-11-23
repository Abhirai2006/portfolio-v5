/**
 * The DOM half of every transformation: synthesised sounds (if on), flash panels (≤3, ≥334 ms apart),
 * screen shake (≤6 px), the manga SFX word stamped at the impact, a caption for screen readers, a Skip
 * control, and the final scroll to the destination. Reduced motion: a calm ink crossfade, nothing else.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { play } from "@/hud/sound";
import { scrollToId, stopScroll } from "../scroll";
import { SECTION_FOR } from "../sequence";
import { world, type CinematicState } from "../store";
import { CINEMATICS, beatStart, reducedSpec, type CinematicSpec } from "./spec";

export function scheduleSounds(spec: CinematicSpec): number[] {
  return spec.sounds.map((s) => window.setTimeout(() => play(s.sfx), s.at * spec.durationMs));
}

function shake() {
  for (const el of document.querySelectorAll<HTMLElement>("main, .world-canvas")) {
    el.classList.remove("shake");
    void el.offsetWidth;
    el.classList.add("shake");
    window.setTimeout(() => el.classList.remove("shake"), 300);
  }
}

export function ImpactOverlay() {
  const [cin, setCin] = useState<CinematicState>(world.get().cinematic);
  const [flash, setFlash] = useState(false);
  const [word, setWord] = useState<string | null>(null);
  const [veil, setVeil] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => world.subscribe((s) => setCin((c) => (c === s.cinematic ? c : s.cinematic))), []);
  // While a transformation plays, the world rises above the page over a black void.
  useEffect(() => {
    document.documentElement.classList.toggle("cinematic-on", Boolean(cin));
  }, [cin]);

  const finish = useCallback((id: keyof typeof SECTION_FOR, immediate: boolean) => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    world.set({ cinematic: null, ripple: null });
    setWord(null);
    setFlash(false);
    stopScroll(false);
    scrollToId(SECTION_FOR[id], immediate);
    window.setTimeout(() => setVeil(false), 350);
    const heading = document.querySelector<HTMLElement>(`#${SECTION_FOR[id]} h2`);
    heading?.setAttribute("tabindex", "-1");
    heading?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!cin) return;
    const base = CINEMATICS[cin.id];
    const spec = cin.reduced ? reducedSpec(base) : base;
    const frozen = world.get().frozen;
    const impactMs = beatStart(spec, "impact") * spec.durationMs;
    if (frozen) {
      // look-dev still: show the SFX word if the frozen time is past the impact
      if (frozen.t >= beatStart(spec, "impact")) setWord(spec.sfxWord);
      return;
    }
    stopScroll(true);
    const T = timers.current;
    if (cin.reduced) {
      T.push(window.setTimeout(() => setVeil(true), 200));
    } else {
      T.push(...scheduleSounds(spec));
      for (const ms of spec.flashesMs) {
        T.push(window.setTimeout(() => setFlash(true), ms));
        T.push(window.setTimeout(() => setFlash(false), ms + 70)); // 2–4 frames
      }
      T.push(
        window.setTimeout(() => {
          setWord(spec.sfxWord);
          if (spec.shakePx) shake();
        }, impactMs),
      );
      T.push(window.setTimeout(() => setVeil(true), spec.durationMs - 220));
    }
    T.push(window.setTimeout(() => finish(cin.id, cin.reduced), spec.durationMs));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish(cin.id, true);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [cin, finish]);

  const spec = cin ? CINEMATICS[cin.id] : null;
  return (
    <>
      {cin && !cin.reduced && (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[39] bg-ink" />
      )}
      <div className="sr-only" aria-live="assertive">
        {spec ? spec.caption : ""}
      </div>
      {flash && (
        <div className="pointer-events-none fixed inset-0 z-[45] bg-white" aria-hidden="true" />
      )}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[44] bg-ink transition-opacity duration-300"
        style={{ opacity: veil ? 1 : 0 }}
      />
      {word && (
        <div
          className="pointer-events-none fixed inset-0 z-[46] flex items-center justify-center"
          aria-hidden="true"
        >
          <span
            className="sfx sfx-stamp text-[clamp(5rem,17vw,16rem)] leading-none"
            style={{ WebkitTextStrokeWidth: 4 }}
          >
            {word}
          </span>
        </div>
      )}
      {cin && (
        <button
          type="button"
          onClick={() => finish(cin.id, true)}
          className="hud-link fixed bottom-[var(--hud-pad)] right-[var(--hud-pad)] z-[47] text-paper"
        >
          Skip ▸ <span className="sr-only">the animation and go to the section</span>
        </button>
      )}
    </>
  );
}
