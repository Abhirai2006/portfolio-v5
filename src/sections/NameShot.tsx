/**
 * Name (DESIGN §4.3): ABHISHEK RAI A stamps in ("DOOM"), one line arrives word by word, then the 3D board
 * rises from below in front of the giant name: the letters are covered by the board and go soft (DOF),
 * until only the board remains. The name is the page's only <h1>.
 */
import { PERSON } from "@/lib/facts";
import { COPY } from "./copy";

export function NameShot() {
  return (
    <section id="name" aria-labelledby="name-h1" className="relative h-[260svh]">
      <div className="sticky top-0 flex h-[100svh] flex-col items-center justify-center overflow-hidden px-[var(--gutter)]">
        <div
          aria-hidden="true"
          className="speed-lines name-lines pointer-events-none absolute inset-0"
        />
        <h1
          id="name-h1"
          className="name-type font-display text-center text-[clamp(4.4rem,19vw,22rem)] text-paper"
        >
          <span className="block">Abhishek</span>
          <span className="block">Rai A</span>
        </h1>
        <p
          aria-hidden="true"
          className="name-sfx sfx pointer-events-none absolute left-[8vw] top-[16vh] -rotate-12 text-[clamp(2.6rem,7vw,6.5rem)]"
        >
          DOOM
        </p>
        <p className="name-tagline word-reveal mt-8 max-w-[40rem] text-center font-hud text-[clamp(0.7rem,1.4vw,0.95rem)] text-grey-4">
          {COPY.tagline.map((w, i) => (
            <span key={w}>
              {i > 0 && (
                <span className="w text-grey-3" style={{ ["--i" as string]: i * 2 - 1 }}>
                  {" "}
                  ·{" "}
                </span>
              )}
              <span className="w text-paper" style={{ ["--i" as string]: i * 2 }}>
                {w}
              </span>
            </span>
          ))}
        </p>
        <p className="sr-only">
          {PERSON.name} is an {PERSON.role.toLowerCase()} from {PERSON.city}, {PERSON.region},
          India, {"looking for ML internships"}.
        </p>
      </div>
    </section>
  );
}
