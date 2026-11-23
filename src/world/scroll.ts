/**
 * Scroll engine (ARCHITECTURE §1): Lenis smooth scroll feeding GSAP ScrollTrigger. Each scrubbed shot writes
 * its progress (0–1) to the world store (for WebGL) and to a `--p` CSS variable on its section (for DOM type).
 * Reduced motion keeps native scrolling; progress values still update so the page stays coherent.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { world, type WorldState } from "./store";

type ShotKey = keyof WorldState["scroll"];
const SHOTS: { key: ShotKey; selector: string; start: string; end: string }[] = [
  { key: "welcome", selector: "#welcome", start: "top top", end: "bottom bottom" },
  { key: "name", selector: "#name", start: "top top", end: "bottom bottom" },
  { key: "board", selector: "#board", start: "top top", end: "bottom bottom" },
  // the map is a normal page: its line draws while it travels through the viewport
  { key: "map", selector: "#map", start: "top 75%", end: "bottom bottom" },
];

let lenis: Lenis | null = null;

export function initScroll(reduced: boolean): () => void {
  gsap.registerPlugin(ScrollTrigger);
  if (!reduced) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true, autoRaf: false, anchors: true });
    lenis.on("scroll", ScrollTrigger.update);
    if (import.meta.env.DEV) (window as unknown as { __lenis?: Lenis }).__lenis = lenis; // dev-only debugging aid
    const tick = (time: number) => lenis?.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
  }
  const triggers = SHOTS.map(({ key, selector, start, end }) => {
    const el = document.querySelector<HTMLElement>(selector);
    if (!el) return null;
    return ScrollTrigger.create({
      trigger: el,
      start,
      end,
      onUpdate: (self) => {
        world.setScroll(key, self.progress);
        el.style.setProperty("--p", self.progress.toFixed(4));
      },
      onRefresh: (self) => {
        world.setScroll(key, self.progress);
        el.style.setProperty("--p", self.progress.toFixed(4));
      },
    });
  });
  // Anything after the map: the world fades out of the way of the chapters.
  const after = document.querySelector<HTMLElement>("#chapters");
  const afterTrigger = after
    ? ScrollTrigger.create({
        trigger: after,
        start: "top bottom",
        end: "top top",
        onUpdate: (s) => world.setScroll("after", s.progress),
      })
    : null;
  // Reveal blocks of words one at a time as they enter (Human.md); without JS they are simply visible.
  const reveals = gsap.utils.toArray<HTMLElement>(".word-reveal").map((el) =>
    ScrollTrigger.create({
      trigger: el,
      start: "top 85%",
      once: true,
      onEnter: () => el.classList.add("is-in"),
    }),
  );
  ScrollTrigger.refresh();
  return () => {
    triggers.forEach((t) => t?.kill());
    afterTrigger?.kill();
    reveals.forEach((t) => t.kill());
    lenis?.destroy();
    lenis = null;
  };
}

/** Smoothly scrolls to a section (or instantly when reduced motion / no Lenis). */
export function scrollToId(id: string, immediate = false) {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenis && !immediate) lenis.scrollTo(el, { duration: 1.4 });
  else el.scrollIntoView({ behavior: "auto", block: "start" });
  history.replaceState(null, "", `#${id}`);
}

export function stopScroll(stop: boolean) {
  if (!lenis) return;
  if (stop) lenis.stop();
  else lenis.start();
}
