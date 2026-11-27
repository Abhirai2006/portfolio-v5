/**
 * The WebGL rainforest on the homepage (v3). GSAP ScrollTrigger maps the scroll through the
 * opening section to 0..1; ForestStage eases towards it and renders. Captions are real DOM text
 * animated by the same scroll (aria-hidden: ForestStory.tsx holds the same words for readers).
 *
 * Debug / screenshots: ?p=0.42 pins the opening at that progress; ?tier=lite|static forces a tier.
 */
import { useEffect, useRef, useState } from "react";
import { PERSON } from "@/lib/facts";

type Phase = "off" | "loading" | "on";

function pickTier(): "high" | "lite" | "static" {
  const q = new URLSearchParams(location.search).get("tier");
  if (q === "static" || q === "lite" || q === "high") return q;
  try {
    const c = document.createElement("canvas");
    if (!c.getContext("webgl2")) return "static";
  } catch {
    return "static";
  }
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return "static";
  const nav = navigator as Navigator & { deviceMemory?: number };
  const small = matchMedia("(max-width: 820px)").matches || matchMedia("(pointer: coarse)").matches;
  return small || (nav.deviceMemory ?? 8) <= 4 ? "lite" : "high";
}

export function ForestExperience() {
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const frogTag = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("off");
  const [loaded, setLoaded] = useState(0);

  useEffect(() => {
    const tier = pickTier();
    if (tier === "static" || !canvas.current || !section.current) {
      document.documentElement.classList.remove("forest-on");
      return;
    }
    document.documentElement.classList.add("forest-on");
    setPhase("loading");
    let alive = true;
    let cleanup = () => {};

    (async () => {
      const [{ ForestStage }, { gsap }, { ScrollTrigger }, { default: Lenis }] = await Promise.all([
        import("@/forest/ForestStage"),
        import("gsap"),
        import("gsap/ScrollTrigger"),
        import("lenis"),
      ]);
      if (!alive || !canvas.current || !section.current) return;
      gsap.registerPlugin(ScrollTrigger);
      const pinned = new URLSearchParams(location.search).get("p");

      const stage = new ForestStage(canvas.current, {
        tier,
        onProgress: (f) => setLoaded(f),
        onFrame: (info) => {
          const el = frogTag.current;
          if (!el) return;
          el.style.setProperty("--x", `${(info.frog.x * 100).toFixed(2)}%`);
          el.style.setProperty("--y", `${(info.frog.y * 100).toFixed(2)}%`);
        },
      });
      (window as unknown as { __forest: unknown }).__forest = stage;
      await stage.ready;
      if (!alive) return stage.dispose();

      // Smooth scrolling (Lenis) drives ScrollTrigger from GSAP's ticker: one clock for everything.
      const lenis = pinned ? null : new Lenis({ lerp: 0.09, smoothWheel: true });
      const tick = (t: number) => lenis?.raf(t * 1000);
      if (lenis) {
        lenis.on("scroll", ScrollTrigger.update);
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);
      }

      const trigger = ScrollTrigger.create({
        trigger: section.current,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (s) => stage.setProgress(s.progress),
      });

      // Captions on the same scroll. Positions are fractions of the opening (0..1).
      const tl = gsap.timeline({
        defaults: { ease: "power2.out" },
        scrollTrigger: {
          trigger: section.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.8,
        },
      });
      const q = (s: string) => section.current!.querySelectorAll(s);
      tl.set({}, {}, 1)
        .to(q(".op-hint"), { autoAlpha: 0, y: -12, duration: 0.05 }, 0.04)
        .fromTo(q(".op-frog"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05 }, 0.36)
        .to(q(".op-frog"), { autoAlpha: 0, duration: 0.05 }, 0.5)
        .fromTo(
          q(".op-title .script-a"),
          { autoAlpha: 0, y: 30, filter: "blur(10px)" },
          { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.12 },
          0.74,
        )
        .fromTo(
          q(".op-title .script-b"),
          { autoAlpha: 0, y: 30, filter: "blur(10px)" },
          { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.12 },
          0.79,
        )
        .fromTo(
          q(".op-sub"),
          { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, duration: 0.08 },
          0.86,
        );

      (window as unknown as { __forestCaptions: unknown }).__forestCaptions = tl;
      if (pinned) {
        const p = Number(pinned);
        stage.snap(p);
        trigger.disable();
        tl.scrollTrigger?.disable();
        tl.progress(p);
      } else {
        stage.snap(trigger.progress);
      }
      stage.start();
      setPhase("on");

      cleanup = () => {
        trigger.kill();
        tl.scrollTrigger?.kill();
        tl.kill();
        if (lenis) {
          gsap.ticker.remove(tick);
          lenis.destroy();
        }
        stage.dispose();
      };
    })().catch((e) => {
      console.error("forest failed, showing the static page", e);
      document.documentElement.classList.remove("forest-on");
      setPhase("off");
    });

    return () => {
      alive = false;
      cleanup();
      document.documentElement.classList.remove("forest-on");
    };
  }, []);

  return (
    <section ref={section} className="opening" data-phase={phase} aria-hidden="true">
      <div className="op-sticky">
        <canvas ref={canvas} className="op-canvas" />
        <div className={`op-loader ${phase === "on" ? "is-done" : ""}`}>
          <span className="op-loader-word">Entering the forest</span>
          <span className="op-loader-bar">
            <i style={{ transform: `scaleX(${loaded.toFixed(3)})` }} />
          </span>
        </div>
        <p className="op-hint">
          <span>Scroll</span>
          <i />
        </p>
        <div ref={frogTag} className="op-frog">
          <span className="op-frog-line" />
          <span className="op-frog-text">
            <b>Blue poison-dart frog</b>
            <em>Dendrobates tinctorius “azureus”</em>
          </span>
        </div>
        <div className="op-titlewrap">
          <h2 className="op-title">
            <span className="script-a">Abhishek's</span> <span className="script-b">World</span>
          </h2>
          <p className="op-sub">
            {PERSON.name} · aspiring machine learning engineer · {PERSON.city} · looking for{" "}
            {PERSON.seeking}
          </p>
        </div>
      </div>
    </section>
  );
}
