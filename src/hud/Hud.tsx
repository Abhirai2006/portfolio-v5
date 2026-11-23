/**
 * Fixed HUD (DESIGN §3, Birkar/Neuroform): `ABHISHEK'S WORLD — PLATE nn` · Skip intro · Sound ◯ · Menu,
 * a status line bottom-left, live cursor coordinates bottom-right and crop marks. Skip intro is the first
 * thing in the tab order. Everything here is a real link or button.
 */
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { DESTINATIONS } from "@/sections/copy";
import { isSoundOn, onSoundChange, setSound } from "./sound";

const PLATES: { id: string; plate: string; status: string }[] = [
  { id: "welcome", plate: "01", status: "COMPILING ABHISHEK…" },
  { id: "name", plate: "02", status: "IDENTITY CONFIRMED" },
  { id: "board", plate: "03", status: "CHOOSE A PIECE" },
  { id: "map", plate: "04", status: "PLOTTING ROUTES" },
  { id: "ml", plate: "05", status: "MODEL ONLINE" },
  { id: "products", plate: "06", status: "FIVE VOLUMES LOADED" },
  { id: "algorithms", plate: "07", status: "SORTING…" },
  { id: "skills", plate: "08", status: "PROMOTION IN PROGRESS" },
  { id: "about", plate: "09", status: "ORIGIN STORY" },
  { id: "contact", plate: "10", status: "CHANNEL OPEN" },
  { id: "ask", plate: "11", status: "LISTENING" },
  { id: "github", plate: "12", status: "SYNCING COMMITS" },
  { id: "breslau", plate: "13", status: "BRESLAU, 1912" },
];

export function Hud() {
  const [plate, setPlate] = useState(PLATES[0]);
  const [sound, setSoundState] = useState(false);
  const [menu, setMenu] = useState(false);
  const [pastIntro, setPastIntro] = useState(false);
  const coords = useRef<HTMLSpanElement>(null);
  const menuBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setSoundState(isSoundOn());
    const off = onSoundChange(setSoundState);
    const els = PLATES.map((p) => document.getElementById(p.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const p = PLATES.find((x) => x.id === e.target.id);
          if (p) setPlate(p);
          setPastIntro(
            [
              "map",
              "ml",
              "products",
              "algorithms",
              "skills",
              "about",
              "contact",
              "ask",
              "github",
              "breslau",
            ].includes(e.target.id),
          );
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    const onMove = (e: PointerEvent) => {
      if (coords.current && e.pointerType === "mouse")
        coords.current.textContent = `X ${String(Math.round(e.clientX)).padStart(4, "0")} · Y ${String(Math.round(e.clientY)).padStart(4, "0")}`;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      off();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(false);
        menuBtn.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  return (
    <header className="no-print pointer-events-none fixed inset-0 z-40 p-[var(--hud-pad)] font-hud text-[10px] text-grey-4 sm:text-[11px]">
      <span className="crop crop-tl" />
      <span className="crop crop-tr" />
      <span className="crop crop-bl" />
      <span className="crop crop-br" />
      <div className="flex items-start justify-between gap-4">
        <div className="pointer-events-auto flex flex-col gap-2">
          <a
            href="#board"
            onClick={(e) => {
              e.preventDefault();
              window.dispatchEvent(new Event("aw:skip"));
            }}
            className={`hud-link w-max text-paper transition-opacity ${pastIntro ? "pointer-events-none opacity-0" : ""}`}
            tabIndex={pastIntro ? -1 : 0}
          >
            Skip intro ▸
          </a>
          <Link to="/" className="text-paper" aria-label="Abhishek's World, home">
            ABHISHEK&apos;S WORLD <span className="text-grey-3">— PLATE {plate.plate}</span>
          </Link>
        </div>
        <div className="pointer-events-auto flex items-center gap-4 sm:gap-6">
          <button
            type="button"
            aria-pressed={sound}
            onClick={() => setSound(!sound)}
            className="flex items-center gap-2 uppercase text-paper"
          >
            <span
              aria-hidden="true"
              className={`inline-block h-2.5 w-2.5 rounded-full border border-paper ${sound ? "bg-paper" : ""}`}
            />
            Sound <span className="sr-only">effects</span> {sound ? "on" : "off"}
          </button>
          <button
            ref={menuBtn}
            type="button"
            aria-expanded={menu}
            aria-controls="aw-menu"
            onClick={() => setMenu(!menu)}
            className="uppercase text-paper"
          >
            {menu ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      <nav
        id="aw-menu"
        aria-label="Site"
        hidden={!menu}
        className="pointer-events-auto absolute right-[var(--hud-pad)] top-16 w-[min(92vw,380px)] border-2 border-paper bg-ink p-5 shadow-[6px_6px_0_var(--grey-2)]"
      >
        <p className="mb-3 text-grey-3">WHERE ARE YOU GOING?</p>
        <ul className="grid gap-2 text-[13px] text-paper">
          {DESTINATIONS.map((d) => (
            <li key={d.id}>
              <a
                href={d.href}
                onClick={() => setMenu(false)}
                className="flex justify-between gap-4 border-b border-grey-2 pb-1 hover:text-blue-core"
              >
                <span>{d.title}</span>
                <span aria-hidden="true">→</span>
              </a>
            </li>
          ))}
          <li>
            <Link
              to="/resume"
              onClick={() => setMenu(false)}
              className="flex justify-between gap-4 border-b border-grey-2 pb-1 hover:text-blue-core"
            >
              <span>Résumé</span>
              <span aria-hidden="true">→</span>
            </Link>
          </li>
        </ul>
      </nav>

      <p className="absolute bottom-[var(--hud-pad)] left-[var(--hud-pad)] max-w-[60vw] truncate">
        <span className="text-paper">{plate.status}</span>
      </p>
      <p
        className="absolute bottom-[var(--hud-pad)] right-[var(--hud-pad)] hidden tabular-nums sm:block"
        aria-hidden="true"
      >
        <span ref={coords}>X 0000 · Y 0000</span>
      </p>
    </header>
  );
}
