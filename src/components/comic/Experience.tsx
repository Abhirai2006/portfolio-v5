/**
 * The interactive comic (client only). Detects the quality tier; on "static" it renders nothing and
 * the server-rendered webtoon stays. Otherwise: loader → gate → one WebGL stage driven by Lenis
 * scroll, with anchored captions, hold rings, the HUD and sound.
 *
 * Look-dev URL params: ?beat=<id>&t=<0..1> (jump), ?hold=<0..1> (preview a hold), ?clean=1 (no HUD),
 * ?tier=ultra|high|lite|static, ?gate=1 (force the gate).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { BEATS, PATHS } from "@/story/story";
import type { GateKind, PathId, SoundScene } from "@/story/types";
import {
  layoutStory,
  parseCaption,
  pathOrder,
  pickTier,
  scrollLimit,
  totalLength,
  type Laid,
  type Tier,
} from "@/engine/core";
import { voidLayout } from "@/engine/voidLayout";
import { getProject } from "@/lib/projects";
import { getGithubData } from "@/lib/github.functions";
import { fetchGithubFromBrowser, type GithubResult } from "@/lib/github-shape";
import type { Stage as StageT, AnchorSpec } from "@/engine/Stage";
import type { Sound as SoundT } from "@/engine/sound";
import { Emblem } from "./Chrome";
import { ActionBubble, AskChat, Gate, HoldRing, StatusWindow } from "./Interactions";
import { Link } from "@tanstack/react-router";

const store = {
  get(k: string) {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set(k: string, v: string) {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* private mode */
    }
  },
  del(k: string) {
    try {
      localStorage.removeItem(k);
    } catch {
      /* private mode */
    }
  },
};

type Extra = {
  id: string;
  beat: string;
  at: [number, number, number?];
  t: [number, number];
  kind: string;
};

const EXTRA: Extra[] = [
  { id: "x-status", beat: "power", at: [3.6, -5.2], t: [0.04, 0.98], kind: "panel" },
  { id: "x-ask", beat: "ask", at: [0, -6.4], t: [0.04, 0.98], kind: "panel" },
  { id: "x-enter", beat: "enter", at: [0, -5.6, 0.1], t: [0.06, 0.62], kind: "panel" },
  ...PATHS.map((p, i) => ({
    id: `x-art-${p.id}`,
    beat: "choose",
    at: [(i - 1) * 3.3, -11.1, 1.2] as [number, number, number],
    t: [0.06, 0.98] as [number, number],
    kind: "label",
  })),
  ...voidLayout().map((v) => ({
    id: `x-void-${v.slug}`,
    beat: "void",
    at: [v.x, v.y - 1.4, v.z] as [number, number, number],
    t: [0, 1] as [number, number],
    kind: "void",
  })),
];

const GATE_LABEL: Record<GateKind, string> = {
  awaken: "HOLD TO RUN",
  rise: "HOLD TO RISE",
  choose: "HOLD TO TAKE IT",
  enter: "ENTER THE SYSTEM",
};

function detectTier(): Tier {
  const q = new URLSearchParams(location.search);
  let webgl2 = false;
  try {
    webgl2 = !!document.createElement("canvas").getContext("webgl2");
  } catch {
    webgl2 = false;
  }
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  return pickTier({
    webgl2,
    reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    cores: nav.hardwareConcurrency,
    memory: nav.deviceMemory,
    mobile: matchMedia("(pointer: coarse)").matches && innerWidth < 900,
    saveData: nav.connection?.saveData,
    forced: q.get("tier"),
  });
}

export function Experience() {
  const [tier, setTier] = useState<Tier | null>(null);
  useEffect(() => {
    const t = detectTier();
    setTier(t);
    if (t !== "static") {
      document.documentElement.classList.add("stage-on");
      // the hidden webtoon stays for screen readers, but Tab goes to the visible controls
      document
        .querySelectorAll<HTMLElement>(".webtoon a, .webtoon button")
        .forEach((el) => (el.tabIndex = -1));
    } else {
      document.documentElement.classList.remove("stage-on");
      document.documentElement.classList.add("stage-off");
    }
    return () => document.documentElement.classList.remove("stage-on", "stage-off");
  }, []);
  if (!tier || tier === "static") return null;
  return <Comic tier={tier} />;
}

function Comic({ tier }: { tier: Tier }) {
  const navigate = useNavigate();
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<StageT | null>(null);
  const sound = useRef<SoundT | null>(null);
  const lenis = useRef<import("lenis").default | null>(null);
  const anchorEls = useRef(new Map<string, HTMLElement>());
  const vh = useRef(800);

  const params = useMemo(
    () => new URLSearchParams(typeof location === "undefined" ? "" : location.search),
    [],
  );
  const clean = params.get("clean") === "1";

  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [entered, setEntered] = useState(
    () => params.get("gate") !== "1" && (store.get("aw.entered") === "1" || params.has("beat")),
  );
  const [chosen, setChosen] = useState<PathId | null>(
    () => (store.get("aw.path") as PathId | null) ?? null,
  );
  const [done, setDone] = useState<Set<GateKind>>(() => {
    try {
      return new Set(JSON.parse(store.get("aw.gates") ?? "[]") as GateKind[]);
    } catch {
      return new Set();
    }
  });
  const [laid, setLaid] = useState<Laid[]>(() => layoutStory(BEATS, pathOrder(chosen)));
  const [beat, setBeat] = useState({ id: "title", t: 0 });
  const [scrollVh, setScrollVh] = useState(0);
  const [hover, setHover] = useState<{ path: PathId | null; x: number; y: number }>({
    path: null,
    x: 0,
    y: 0,
  });
  const [picked, setPicked] = useState<PathId | null>(null);
  const [muted, setMuted] = useState(() => store.get("aw.muted") === "1");
  const [menu, setMenu] = useState(false);
  const [github, setGithub] = useState<GithubResult | null>(null);
  const doneRef = useRef(done);
  doneRef.current = done;
  const laidRef = useRef(laid);
  laidRef.current = laid;

  const total = totalLength(laid);
  const limit = scrollLimit(laid, done);
  const gateBeat = laid.find((b) => b.gate && !done.has(b.gate.kind));
  const atGate = !!gateBeat && scrollVh >= limit - 0.03 && beat.id === gateBeat.id;

  /* ---------------------------------------------------------------- boot */
  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    (async () => {
      const [{ Stage, loadArtManifest }, { Sound }, { default: Lenis }] = await Promise.all([
        import("@/engine/Stage"),
        import("@/engine/sound"),
        import("lenis"),
      ]);
      await loadArtManifest();
      if (disposed || !canvas.current) return;
      const st = new Stage(canvas.current, tier, {
        onProgress: (p) => setProgress(p),
        onBeat: (id, t) =>
          setBeat((b) => (b.id === id && Math.abs(b.t - t) < 0.01 ? b : { id, t })),
        onHoverPath: (path, x, y) =>
          setHover((h) =>
            h.path === path && Math.abs(h.x - x) < 1 && Math.abs(h.y - y) < 1 ? h : { path, x, y },
          ),
        onClickProject: (slug) => openProject(slug),
      });
      stage.current = st;
      if (params.has("beat")) (window as unknown as { __aw: unknown }).__aw = { stage: st };
      sound.current = new Sound();
      sound.current.setMuted(store.get("aw.muted") === "1");
      st.setLayout(chosen);
      if (doneRef.current.has("awaken")) st.setFlood(1);
      if (doneRef.current.has("rise")) st.complete("rise");
      if (doneRef.current.has("enter")) st.complete("enter");
      await st.build(3);
      if (disposed) return;
      vh.current = window.innerHeight;
      const ln = new Lenis({ autoRaf: true, lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.9 });
      lenis.current = ln;
      ln.on("scroll", ({ scroll }: { scroll: number }) => {
        const s = scroll / vh.current;
        const L = scrollLimit(laidRef.current, doneRef.current);
        const T = totalLength(laidRef.current);
        if (s > L + 0.004 && s < T) {
          ln.scrollTo(L * vh.current, { immediate: true, force: true });
          return;
        }
        st.setScroll(Math.min(s, T));
        // React only needs coarse scroll (gate reach, progress line): ~1/400 of a viewport
        setScrollVh((old) => (Math.abs(old - s) > 0.0025 ? s : old));
      });
      st.setAnchors(collectAnchors());
      st.start();
      setReady(true);
      let lastW = window.innerWidth;
      const onResize = () => {
        // phone toolbars change the height while scrolling; only re-measure on a real resize
        if (window.innerWidth !== lastW || Math.abs(window.innerHeight - vh.current) > 120)
          vh.current = window.innerHeight;
        lastW = window.innerWidth;
        st.resize();
        ln.resize();
      };
      const onMove = (e: PointerEvent) => st.setPointer(e.clientX, e.clientY);
      const onClick = (e: MouseEvent) => {
        if ((e.target as HTMLElement).closest("a,button,input,form,.hud")) return;
        const hit = st.clickAt(e.clientX, e.clientY);
        if (hit?.path) pickPath(hit.path);
      };
      const wake = () => {
        if (store.get("aw.muted") !== "1" && store.get("aw.entered") === "1")
          sound.current?.start();
      };
      window.addEventListener("pointerdown", wake, { once: true });
      window.addEventListener("keydown", wake, { once: true });
      window.addEventListener("resize", onResize);
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("click", onClick);
      cleanup = () => {
        window.removeEventListener("resize", onResize);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("click", onClick);
        ln.destroy();
        st.dispose();
        sound.current?.dispose();
      };
      // where to start
      const back = sessionStorage.getItem("aw.return");
      const jump = params.get("beat");
      if (jump) {
        const b = laidRef.current.find((x) => x.id === jump);
        if (b) goTo(b.start + Number(params.get("t") ?? 0.5) * b.len, true);
        const hp = params.get("hold");
        if (hp && b?.gate) st.setHold(b.gate.kind, Number(hp));
      } else if (back) {
        sessionStorage.removeItem("aw.return");
        const y = Number(back);
        requestAnimationFrame(() => goTo(y, true));
      } else if (location.hash === "#contact") {
        document.getElementById("contact")?.scrollIntoView();
      }
    })().catch((e) => {
      console.warn("Stage failed, staying on the static webtoon", e);
      document.documentElement.classList.remove("stage-on");
      document.documentElement.classList.add("stage-off");
    });
    return () => {
      disposed = true;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------------------------------------------------------- helpers */
  const collectAnchors = useCallback((): AnchorSpec[] => {
    const list: AnchorSpec[] = [];
    for (const b of BEATS)
      for (const c of b.captions) {
        const el = anchorEls.current.get(c.id);
        if (el)
          list.push({ id: c.id, beat: b.id, at: c.at, t: c.t, kind: c.kind ?? "caption", el });
      }
    for (const x of EXTRA) {
      const el = anchorEls.current.get(x.id);
      if (el) list.push({ ...x, el });
    }
    return list;
  }, []);
  const anchorRef = (id: string) => (el: HTMLElement | null) => {
    if (el) anchorEls.current.set(id, el);
    else anchorEls.current.delete(id);
  };

  /** Scroll to a story position (viewport heights), unlocking every gate before it. */
  const goTo = useCallback((s: number, immediate = false) => {
    const before = laidRef.current
      .filter((b) => b.gate && b.start + b.gate.at * b.len < s - 0.01)
      .map((b) => b.gate!.kind);
    if (before.length) {
      const next = new Set([...doneRef.current, ...before]);
      doneRef.current = next;
      setDone(next);
      store.set("aw.gates", JSON.stringify([...next]));
      if (next.has("awaken")) stage.current?.setFlood(1);
      if (next.has("rise")) stage.current?.complete("rise");
      if (next.has("enter")) stage.current?.complete("enter");
    }
    setEntered(true);
    requestAnimationFrame(() =>
      lenis.current?.scrollTo(
        s * vh.current,
        immediate ? { immediate: true, force: true } : { duration: 1.6, force: true },
      ),
    );
  }, []);

  const finishGate = useCallback((kind: GateKind, autoAdvance = 0.35, duration = 2.2) => {
    const next = new Set([...doneRef.current, kind]);
    doneRef.current = next;
    setDone(next);
    store.set("aw.gates", JSON.stringify([...next]));
    stage.current?.complete(kind);
    sound.current?.holdHum(0);
    const b = laidRef.current.find((x) => x.gate?.kind === kind);
    if (b && autoAdvance > 0) {
      const from = b.start + b.gate!.at * b.len;
      setTimeout(
        () => lenis.current?.scrollTo((from + autoAdvance) * vh.current, { duration, force: true }),
        kind === "awaken" ? 1400 : 200,
      );
    }
  }, []);

  const openProject = useCallback(
    (slug: string) => {
      sessionStorage.setItem("aw.return", String(window.scrollY / vh.current));
      sound.current?.play("whoosh");
      navigate({ to: "/projects/$slug", params: { slug } });
    },
    [navigate],
  );

  const pickPath = useCallback((p: PathId) => {
    setPicked(p);
    sound.current?.play("tick");
  }, []);

  /* ---------------------------------------------------------------- per-beat side effects */
  const lastBeat = useRef("title");
  useEffect(() => {
    if (beat.id === lastBeat.current) return;
    const prev = lastBeat.current;
    lastBeat.current = beat.id;
    const b = laid.find((x) => x.id === beat.id);
    if (!b) return;
    sound.current?.setScene(b.sound as SoundScene);
    if (b.enter?.kind === "shatter") sound.current?.play("shatter");
    else if (b.enter) sound.current?.play(b.enter.kind === "tear" ? "rustle" : "whoosh");
    else if (prev) sound.current?.play("rustle", 0.6);
    if (beat.id === "power" && !github)
      getGithubData()
        .then((r) => (r.ok ? r : fetchGithubFromBrowser().then((d) => d as GithubResult)))
        .then(setGithub)
        .catch(() => setGithub({ ok: false, error: "offline" }));
  }, [beat.id, laid, github]);

  // keep anchors registered after re-renders that add elements (status, chat, labels)
  useEffect(() => {
    stage.current?.setAnchors(collectAnchors());
  }, [ready, github, collectAnchors]);

  /* ---------------------------------------------------------------- render */
  const progressLine = Math.min(1, scrollVh / Math.max(1, total));
  const showHint = ready && entered && !atGate && beat.t < 0.25 && scrollVh < 0.4;
  const chapterBeats = laid.filter((b) => b.heading);

  const anchorsLayer = useMemo(
    () => (
      <div className="anchors" aria-hidden="true">
        {BEATS.flatMap((b) =>
          b.captions.map((c) => {
            if (c.text.startsWith("project:")) {
              const p = getProject(c.text.slice(8));
              if (!p) return null;
              return (
                <div key={c.id} ref={anchorRef(c.id)} className="anchor a-project">
                  <div className="cap cap-project">
                    <p className="cap-tag">{p.tag}</p>
                    <p className="cap-title">{p.title}</p>
                    <p className="cap-hook">{p.hook}</p>
                    <p className="cap-metrics">
                      {p.metrics.map((m) => (
                        <span key={m.label}>
                          <b>{m.value}</b> {m.label}
                        </span>
                      ))}
                    </p>
                    <button
                      type="button"
                      className="cap-cta"
                      tabIndex={-1}
                      onClick={() => openProject(p.slug)}
                    >
                      → case study
                    </button>
                  </div>
                </div>
              );
            }
            return (
              <div
                key={c.id}
                ref={anchorRef(c.id)}
                className={`anchor a-${c.kind ?? "caption"} side-${c.side ?? "l"}`}
                style={c.width ? ({ "--w": `${c.width}px` } as React.CSSProperties) : undefined}
              >
                {c.kind === "title" ? (
                  <p className="cap-titletype">
                    {c.text.split("").map((ch, i) => (
                      <span key={i} style={{ "--i": i } as React.CSSProperties}>
                        {ch === " " ? " " : ch}
                      </span>
                    ))}
                  </p>
                ) : c.kind === "big" ? (
                  <p className="cap-big">{c.text}</p>
                ) : c.id === "l-ml" ? (
                  <button
                    type="button"
                    className="cap-cta solo"
                    tabIndex={-1}
                    onClick={() => openProject("customer-churn-intelligence-system")}
                  >
                    {c.text}
                  </button>
                ) : (
                  <p className={c.kind === "label" ? "cap-label" : "cap"}>
                    {parseCaption(c.text).map((s, i) =>
                      s.key ? <em key={i}>{s.text}</em> : <span key={i}>{s.text}</span>,
                    )}
                  </p>
                )}
              </div>
            );
          }),
        )}
        <div ref={anchorRef("x-status")} className="anchor a-panel side-l">
          <StatusWindow github={github} />
        </div>
        <div ref={anchorRef("x-ask")} className="anchor a-panel side-c">
          <AskChat />
        </div>
        <div ref={anchorRef("x-enter")} className="anchor a-panel side-c">
          {gateBeat?.gate?.kind === "enter" || !done.has("enter") ? (
            <button
              type="button"
              className="enter-btn"
              tabIndex={-1}
              onClick={() => {
                sound.current?.play("burst");
                finishGate("enter", 0.95, 3);
              }}
            >
              ENTER THE SYSTEM
            </button>
          ) : null}
        </div>
        {PATHS.map((p) => (
          <div key={p.id} ref={anchorRef(`x-art-${p.id}`)} className="anchor a-label side-c">
            <button
              type="button"
              className={`path-label ${picked === p.id || chosen === p.id ? "is-on" : ""}`}
              style={{ "--c": p.colour } as React.CSSProperties}
              tabIndex={-1}
              onClick={() => pickPath(p.id)}
            >
              {p.label}
            </button>
          </div>
        ))}
        {voidLayout().map((v) => (
          <div key={v.slug} ref={anchorRef(`x-void-${v.slug}`)} className="anchor a-void side-c">
            <button
              type="button"
              className="void-label"
              tabIndex={-1}
              onClick={() => openProject(v.slug)}
            >
              {v.title}
            </button>
          </div>
        ))}
      </div>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [github, picked, chosen, done],
  );

  return (
    <>
      <div
        className="stage-spacer"
        aria-hidden="true"
        style={{ height: `${(total + 1) * 100}svh` }}
      />
      <canvas ref={canvas} className="stage-canvas" aria-hidden="true" />

      {/* anchored captions and DOM panels (memoised: the stage moves them, React doesn't re-render them per frame) */}
      {anchorsLayer}

      {/* gates in the story */}
      {ready &&
        entered &&
        atGate &&
        gateBeat?.gate &&
        gateBeat.gate.kind !== "enter" &&
        (gateBeat.gate.kind !== "choose" || picked) && (
          <HoldRing
            key={gateBeat.gate.kind}
            className={`story-hold hold-${gateBeat.gate.kind}`}
            label={
              gateBeat.gate.kind === "choose" && picked
                ? `TAKE ${PATHS.find((p) => p.id === picked)!.label.toUpperCase()}`
                : GATE_LABEL[gateBeat.gate.kind]
            }
            duration={gateBeat.gate.kind === "choose" ? 1 : 1.6}
            initial={Number(params.get("hold") ?? 0)}
            autoFocus
            onProgress={(p) => {
              const k = gateBeat.gate!.kind;
              stage.current?.setHold(k, p);
              sound.current?.holdHum(p);
              if (k === "awaken" && Math.random() < p * 0.6 + 0.2) sound.current?.play("type", 0.7);
            }}
            onDone={() => {
              const k = gateBeat.gate!.kind;
              if (k === "awaken") sound.current?.play("impact");
              else sound.current?.play("burst");
              if (k === "choose" && picked) {
                setChosen(picked);
                store.set("aw.path", picked);
                const next = layoutStory(BEATS, pathOrder(picked));
                laidRef.current = next;
                setLaid(next);
                stage.current?.choose(picked);
                stage.current?.setAnchors(collectAnchors());
                finishGate("choose", 0.9, 2.4);
              } else finishGate(k, k === "rise" ? 0.75 : 0.5, k === "rise" ? 2.6 : 2.4);
            }}
            onSkip={() => {
              const k = gateBeat.gate!.kind;
              if (k === "choose") {
                const p = picked ?? "ml";
                setChosen(p);
                store.set("aw.path", p);
                const next = layoutStory(BEATS, pathOrder(p));
                laidRef.current = next;
                setLaid(next);
                stage.current?.choose(p);
              }
              finishGate(k, 0.6, 1.4);
            }}
          />
        )}
      {ready && entered && atGate && gateBeat?.gate?.kind === "choose" && !picked && (
        <div className="choose-help">
          <p>Click one of the three. The other two stay reachable.</p>
          <div className="choose-keys">
            {PATHS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => pickPath(p.id)}
                style={{ "--c": p.colour } as React.CSSProperties}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {ready && entered && atGate && gateBeat?.gate?.kind === "enter" && (
        <button
          type="button"
          className="enter-key"
          onClick={() => {
            sound.current?.play("burst");
            finishGate("enter", 0.95, 3);
          }}
        >
          Enter the system
        </button>
      )}
      <ActionBubble
        text={
          hover.path
            ? PATHS.find((p) => p.id === hover.path)!.label.toUpperCase()
            : "CHOOSE YOUR PATH"
        }
        x={hover.x}
        y={hover.y}
        visible={beat.id === "choose" && !picked && ready && !clean}
      />

      {beat.id === "void" && (
        <button
          type="button"
          className="void-exit"
          onClick={() => goTo((laid.find((b) => b.id === "power")?.start ?? total) + 0.25)}
        >
          EXIT
        </button>
      )}

      {/* HUD */}
      {!clean && (
        <div className="hud" data-ready={ready && entered ? "1" : "0"}>
          <button
            type="button"
            className="hud-brand"
            onClick={() => goTo(0)}
            aria-label="Back to the title"
          >
            <Emblem size={34} />
            <span>ABHISHEK'S WORLD</span>
          </button>
          <a className="hud-skip" href="#contact">
            Skip to contact
          </a>
          <nav className="hud-pill" aria-label="Story">
            <button type="button" onClick={() => setMenu((m) => !m)} aria-expanded={menu}>
              CHAPTERS
            </button>
            <button
              type="button"
              onClick={() => goTo(laid.find((b) => b.id === "void")!.start + 0.08)}
            >
              WORK
            </button>
            <a href="#contact">CONTACT</a>
          </nav>
          {menu && (
            <div className="hud-menu" role="menu">
              {chapterBeats.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenu(false);
                    goTo(b.start + 0.12 * b.len);
                  }}
                >
                  {b.heading}
                </button>
              ))}
              <Link to="/resume" role="menuitem">
                Résumé
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  store.del("aw.gates");
                  store.del("aw.path");
                  store.del("aw.entered");
                  location.href = "/";
                }}
              >
                Replay from the start
              </button>
            </div>
          )}
          <button
            type="button"
            className={`hud-sound ${muted ? "is-muted" : ""}`}
            aria-label={muted ? "Sound off. Turn sound on" : "Sound on. Turn sound off"}
            aria-pressed={!muted}
            onClick={() => {
              const m = !muted;
              setMuted(m);
              store.set("aw.muted", m ? "1" : "0");
              if (!sound.current?.ctx) sound.current?.start();
              sound.current?.setMuted(m);
            }}
          >
            {[0, 1, 2, 3].map((i) => (
              <i key={i} style={{ "--i": i } as React.CSSProperties} />
            ))}
          </button>
          <div className="hud-progress" aria-hidden="true">
            <i style={{ transform: `scaleY(${progressLine})` }} />
          </div>
          <p className={`hud-hint ${showHint ? "is-on" : ""}`} aria-hidden="true">
            SCROLL
          </p>
        </div>
      )}

      {/* loader */}
      <div className={`loader ${ready ? "is-done" : ""}`} aria-hidden={ready} role="status">
        <Emblem size={120} draw progress={Math.max(0.05, progress)} className="loader-emblem" />
        <p className="loader-status">
          {progress < 0.5 ? "INKING THE PAGES" : progress < 1 ? "LOADING CHAPTER 1" : "READY"}
        </p>
        <div className="loader-line">
          <i style={{ transform: `scaleX(${progress})` }} />
        </div>
      </div>

      {ready && !entered && (
        <Gate
          onSfx={(s) => sound.current?.play(s === "connect" ? "connect" : "burst")}
          onEnter={() => {
            store.set("aw.entered", "1");
            if (!muted) sound.current?.start();
            sound.current?.play("burst");
            setEntered(true);
          }}
          onSkip={() => {
            store.set("aw.entered", "1");
            setEntered(true);
          }}
        />
      )}
    </>
  );
}
