/**
 * Client-only orchestrator for the homepage world. Server HTML already contains every word; this adds:
 * quality tier, real loading progress, the loader, the lazy WebGL canvas (or the phone fallback), the scroll
 * engine, cinematics, deep links and look-dev freezes (?shot=name&t=0.5, used to render milestone stills).
 */
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { initSound } from "@/hud/sound";
import { ImpactOverlay } from "./cinematics/ImpactOverlay";
import { CinematicVideo } from "./fallback/CinematicVideo";
import { createTracker, trackFetch } from "./loading";
import { detectTier, probeEnvironment, type Tier } from "./quality";
import { initScroll, scrollToId } from "./scroll";
import { HERO_IDS, VISITED_KEY, canSkipLoader, initialBeat, type HeroId } from "./sequence";
import { Loader } from "./shots/Loader";
import { world } from "./store";

const WorldCanvas = lazy(() => import("./Canvas"));

/** Rough total of what the world downloads (models + 3D code), used only to scale the progress bar. */
const BYTES_HINT = 2_400_000;
const MODELS = ["/models/horse.glb", "/models/soldier.glb"];

export const CHOOSE_EVENT = "aw:choose";
export function choosePiece(id: HeroId) {
  window.dispatchEvent(new CustomEvent(CHOOSE_EVENT, { detail: id }));
}

function readLookdev() {
  const q = new URLSearchParams(location.search);
  const shot = q.get("shot");
  return shot ? { shot, t: Math.min(1, Math.max(0, Number(q.get("t") ?? 0.5))) } : null;
}

export function Stage() {
  const [tier, setTier] = useState<Tier | null>(null);
  const [showLoader, setShowLoader] = useState(false);
  const [video, setVideo] = useState<HeroId | null>(null);
  const tracker = useMemo(() => createTracker(BYTES_HINT), []);
  const [lookdev] = useState(() => (typeof window === "undefined" ? null : readLookdev()));

  // ---- boot: tier, loader, downloads, scroll ----
  useEffect(() => {
    initSound();
    const env = probeEnvironment();
    // Look-dev / video recording only: ?tier=high forces the live world (headless GPUs probe slow).
    const forced = new URLSearchParams(location.search).get("tier");
    const first: Tier =
      forced === "high" || forced === "ultra" || forced === "video" ? forced : detectTier(env);
    // Recording mode (scripts/record-cinematics.mjs): no HUD/overlays, and the store is reachable for hotspots.
    if (new URLSearchParams(location.search).get("clean") === "1") {
      document.documentElement.classList.add("clean");
      (window as unknown as { __aw?: typeof world }).__aw = world;
    }
    world.set({ tier: first, reduced: env.reducedMotion });
    setTier(first);
    document.documentElement.classList.toggle("tier-video", first === "video");
    let visited = false;
    try {
      visited = localStorage.getItem(VISITED_KEY) === "1";
    } catch {
      /* private mode */
    }
    const beat = initialBeat({ visited, hash: location.hash });
    const freezeLoader = lookdev?.shot === "loader";
    setShowLoader(beat === "loader" && (!lookdev || freezeLoader));
    if (beat !== "loader" || (lookdev && !freezeLoader))
      document.documentElement.classList.add("intro-done");

    // Real bytes: every script/model the page pulls from now on is counted as it arrives.
    let observer: PerformanceObserver | null = null;
    try {
      observer = new PerformanceObserver((list) => {
        for (const e of list.getEntries() as PerformanceResourceTiming[]) {
          if (/\.(js|mjs|css|woff2)(\?|$)/.test(e.name))
            tracker.add(e.transferSize || e.encodedBodySize || 0);
        }
      });
      observer.observe({ type: "resource", buffered: false });
    } catch {
      observer = null;
    }
    tracker.markStage("DOWNLOADING");
    if (first === "video") {
      trackFetch("/media/board-still.jpg", tracker)
        .catch(() => undefined)
        .finally(() => {
          tracker.markStage("READY");
          world.set({ ready: true });
        });
    } else {
      Promise.all(MODELS.map((u) => trackFetch(u, tracker).catch(() => undefined)));
    }

    const cleanupScroll = initScroll(env.reducedMotion);
    if (beat === "section") requestAnimationFrame(() => scrollToId(location.hash.slice(1), true));

    const onMove = (e: PointerEvent) => {
      world.get().pointer.x = (e.clientX / innerWidth) * 2 - 1;
      world.get().pointer.y = (e.clientY / innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      observer?.disconnect();
      cleanupScroll();
      window.removeEventListener("pointermove", onMove);
    };
  }, [tracker, lookdev]);

  // ---- choosing a piece: live cinematic, or the recorded video on phones ----
  const start = useCallback((id: HeroId) => {
    if (world.get().cinematic) return;
    if (world.get().tier === "video") {
      setVideo(id);
      return;
    }
    world.set({
      cinematic: { id, t: 0, startedAt: performance.now(), reduced: world.get().reduced },
      hover: null,
    });
  }, []);
  useEffect(() => {
    const onChoose = (e: Event) => start((e as CustomEvent<HeroId>).detail);
    window.addEventListener(CHOOSE_EVENT, onChoose);
    return () => window.removeEventListener(CHOOSE_EVENT, onChoose);
  }, [start]);

  // ---- look-dev freezes: scroll a shot to a point, or freeze a cinematic ----
  useEffect(() => {
    if (!lookdev || lookdev.shot === "loader") return;
    const sectionFor: Record<string, string> = {
      welcome: "welcome",
      name: "name",
      board: "board",
      map: "map",
    };
    const id = sectionFor[lookdev.shot] ?? "board";
    const go = () => {
      const el = document.getElementById(id);
      if (!el) return;
      const top = el.getBoundingClientRect().top + scrollY;
      const travel = Math.max(0, el.offsetHeight - innerHeight);
      const t = (HERO_IDS as readonly string[]).includes(lookdev.shot) ? 0.5 : lookdev.t;
      scrollTo({ top: top + travel * t, behavior: "instant" as ScrollBehavior });
      if ((HERO_IDS as readonly string[]).includes(lookdev.shot)) {
        world.set({ frozen: { shot: lookdev.shot, t: lookdev.t } });
        start(lookdev.shot as HeroId);
      }
    };
    const id1 = setTimeout(go, 400);
    return () => clearTimeout(id1);
  }, [lookdev, start]);

  const dismissLoader = useCallback(() => {
    setShowLoader(false);
    document.documentElement.classList.add("intro-done");
    try {
      localStorage.setItem(VISITED_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const onSkip = () => {
      dismissLoader();
      scrollToId("board");
    };
    window.addEventListener("aw:skip", onSkip);
    return () => window.removeEventListener("aw:skip", onSkip);
  }, [dismissLoader]);

  // Follow tier changes made elsewhere (e.g. the canvas losing its WebGL context).
  useEffect(
    () =>
      world.subscribe((s) => {
        if (s.tier && s.tier !== tier) {
          setTier(s.tier);
          document.documentElement.classList.toggle("tier-video", s.tier === "video");
        }
      }),
    [tier],
  );

  const onProbe = useCallback((frameMs: number) => {
    if (new URLSearchParams(location.search).get("tier")) return;
    const next = detectTier({ ...probeEnvironment(), frameMs });
    if (next !== world.get().tier) {
      world.set({ tier: next });
      setTier(next);
      document.documentElement.classList.toggle("tier-video", next === "video");
    }
  }, []);

  let visited = false;
  if (typeof window !== "undefined") {
    try {
      visited = localStorage.getItem(VISITED_KEY) === "1";
    } catch {
      visited = false;
    }
  }

  return (
    <>
      {tier && tier !== "video" && (
        <Suspense fallback={null}>
          <WorldCanvas tracker={tracker} onProbe={onProbe} />
        </Suspense>
      )}
      {showLoader && (
        <Loader
          tracker={tracker}
          frozen={lookdev?.shot === "loader" ? lookdev.t : null}
          canSkip={(ready) => canSkipLoader({ visited, ready })}
          onDone={dismissLoader}
        />
      )}
      <ImpactOverlay />
      {video && <CinematicVideo id={video} onDone={() => setVideo(null)} />}
    </>
  );
}
