/**
 * The single WebGL renderer for the whole page (ARCHITECTURE §3). Client-only and lazy: it loads after first
 * paint, sits fixed above the giant type with a transparent background, ignores the pointer and is hidden
 * from assistive tech (every meaning also lives in the DOM).
 */
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useRef } from "react";
import * as THREE from "three";
import { Director } from "./cinematics/Director";
import { InkComposer } from "./fx/InkComposer";
import { adaptiveDpr } from "./quality";
import { BoardShot } from "./shots/BoardShot";
import { world } from "./store";
import type { Tracker } from "./loading";

/** Measures real frame times: reports the median of the first ~60 frames, then keeps nudging the DPR. */
function FrameProbe({ onProbe }: { onProbe: (ms: number) => void }) {
  const samples = useRef<number[]>([]);
  const reported = useRef(false);
  const setDpr = useThree((s) => s.setDpr);
  const dpr = useRef(Math.min(1.5, window.devicePixelRatio || 1));
  const window60 = useRef<number[]>([]);
  useFrame((_, delta) => {
    const ms = delta * 1000;
    if (!reported.current) {
      samples.current.push(ms);
      if (samples.current.length >= 60) {
        const sorted = [...samples.current].sort((a, b) => a - b);
        reported.current = true;
        onProbe(sorted[30]);
      }
      return;
    }
    window60.current.push(ms);
    if (window60.current.length >= 90) {
      const sorted = [...window60.current].sort((a, b) => a - b);
      const next = adaptiveDpr(sorted[45], dpr.current);
      if (next !== dpr.current) {
        dpr.current = next;
        setDpr(next);
      }
      window60.current = [];
    }
  });
  return null;
}

/** Compiles every material once the scene is mounted, so the first cinematic does not hitch. */
function Precompile({ tracker }: { tracker?: Tracker }) {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    tracker?.markStage("COMPILING SHADERS");
    const id = requestAnimationFrame(() => {
      gl.compile(scene, camera);
      tracker?.markStage("BUILDING BOARD");
      requestAnimationFrame(() => {
        tracker?.markStage("READY");
        world.set({ ready: true });
      });
    });
    return () => cancelAnimationFrame(id);
  }, [gl, scene, camera, tracker]);
  return null;
}

export default function WorldCanvas({
  tracker,
  onProbe,
}: {
  tracker?: Tracker;
  onProbe?: (ms: number) => void;
}) {
  return (
    <Canvas
      aria-hidden="true"
      className="world-canvas"
      style={{ position: "fixed", inset: 0, zIndex: 20, pointerEvents: "none" }}
      gl={{
        alpha: true,
        antialias: false,
        premultipliedAlpha: true,
        powerPreference: "high-performance",
        preserveDrawingBuffer: false,
      }}
      dpr={[0.75, 1.5]}
      flat
      camera={{ fov: 32, near: 0.1, far: 120, position: [0, 6.4, 10.6] }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.toneMapping = THREE.NoToneMapping;
        // GPU reset / tab woken from sleep: never leave a blank stage — hand over to the still + videos.
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          world.set({ tier: "video", cinematic: null });
        });
      }}
    >
      <ambientLight intensity={0.45} />
      <directionalLight position={[3, 9, 6]} intensity={1.45} />
      <directionalLight position={[-6, 3, -4]} intensity={0.3} />
      <fog attach="fog" args={["#0b0b0c", 18, 42]} />
      <Suspense fallback={null}>
        <BoardShot />
        <Director />
        <Precompile tracker={tracker} />
      </Suspense>
      <InkComposer />
      {onProbe && <FrameProbe onProbe={onProbe} />}
    </Canvas>
  );
}
