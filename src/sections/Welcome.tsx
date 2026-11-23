/**
 * Welcome (DESIGN §4.2): WELCOME TO ABHISHEK'S WORLD in giant type, out of focus, pulling into focus after
 * the loader's flash (Birkar focus ring + FOCUSING readout). Panel borders draw around it, screentone in the
 * corners. Scrolling on breaks the words into ink splashes. Without JS it is simply sharp and readable.
 */
import { useEffect, useRef } from "react";
import { COPY } from "./copy";

export function Welcome() {
  const readout = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const html = document.documentElement;
    let raf = 0;
    const run = () => {
      const t0 = performance.now();
      const tick = (now: number) => {
        const k = Math.min(1, (now - t0) / 1600);
        const eased = 1 - Math.pow(1 - k, 3);
        if (readout.current) readout.current.textContent = (0.2 + eased * 0.64).toFixed(2);
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    if (html.classList.contains("intro-done")) run();
    const mo = new MutationObserver(() => {
      if (html.classList.contains("intro-done")) {
        mo.disconnect();
        run();
      }
    });
    mo.observe(html, { attributes: true, attributeFilter: ["class"] });
    return () => {
      mo.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section id="welcome" aria-label="Welcome" className="relative h-[190svh]">
      <div className="sticky top-0 flex h-[100svh] items-center justify-center overflow-hidden px-[var(--gutter)]">
        {/* manga panel border that draws itself + screentone corners */}
        <svg
          aria-hidden="true"
          className="welcome-panel pointer-events-none absolute inset-[13vh_4vw_9vh]"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path
            d="M3 0 H100 V97 L97 100 H0 V3 Z"
            fill="none"
            stroke="#f2eee6"
            strokeWidth="0.25"
            vectorEffect="non-scaling-stroke"
            pathLength={1}
          />
        </svg>
        <div
          aria-hidden="true"
          className="screentone screentone-fade absolute left-[4vw] top-[13vh] h-[22vh] w-[22vw] opacity-40"
        />
        <div
          aria-hidden="true"
          className="screentone screentone-fade absolute bottom-[9vh] right-[4vw] h-[22vh] w-[22vw] rotate-180 opacity-40"
        />
        <p className="welcome-type font-display text-center text-[clamp(3.6rem,15vw,16.5rem)] text-paper">
          <span className="block">Welcome</span>
          <span className="block">to Abhishek&apos;s</span>
          <span className="block">World</span>
          <span className="sr-only">{COPY.welcome}</span>
        </p>
        {/* ink splashes that burst as you scroll away */}
        <svg
          aria-hidden="true"
          className="welcome-splash pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
        >
          {[
            [300, 260, 1],
            [1120, 300, 0.8],
            [720, 640, 1.2],
            [220, 720, 0.7],
            [1260, 760, 0.9],
          ].map(([x, y, s], i) => (
            <path
              key={i}
              transform={`translate(${x} ${y}) scale(${s})`}
              fill="#0b0b0c"
              d="M0-90C30-70 70-95 80-50 95-20 140 0 95 30 70 55 90 110 40 95 0 85-30 130-60 90-90 60-140 50-110 10-130-30-90-40-70-80-40-110 -20-100 0-90Z"
            />
          ))}
        </svg>
        <div
          aria-hidden="true"
          className="absolute right-[var(--hud-pad)] top-[22vh] hidden font-hud text-[11px] text-grey-4 sm:block"
        >
          FOCUSING{" "}
          <span ref={readout} className="text-paper">
            0.84
          </span>{" "}
          M
          <div className="mt-2 flex items-end gap-[5px]">
            {Array.from({ length: 22 }, (_, i) => (
              <span
                key={i}
                className="block w-px bg-grey-3"
                style={{ height: i % 5 === 0 ? 12 : 6 }}
              />
            ))}
          </div>
        </div>
        <div
          aria-hidden="true"
          className="absolute bottom-[12vh] left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 font-hud text-[11px] text-grey-4"
        >
          <svg width="22" height="46" viewBox="0 0 22 46" className="welcome-cue">
            <path
              d="M11 2 C 9 16, 13 26, 11 40 M3 32 L11 42 L19 32"
              fill="none"
              stroke="#f2eee6"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
          SCROLL
        </div>
      </div>
    </section>
  );
}
