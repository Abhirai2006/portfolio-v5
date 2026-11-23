/**
 * Runs one transformation in the WebGL world (DESIGN §4.5): the piece awakens and shatters, the creature
 * emerges and charges along its own 3D "Where are you going?" line while the camera follows. Timing, sound,
 * flash panels, the SFX word and the final scroll to the section are handled in the DOM (ImpactOverlay), so
 * they also work for reduced motion and for the phone videos.
 */
import { useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { Elephant } from "../creatures/Elephant";
import { Garuda } from "../creatures/Garuda";
import { Horse } from "../creatures/Horse";
import { Lion } from "../creatures/Lion";
import { Phoenix } from "../creatures/Phoenix";
import { Soldier } from "../creatures/Soldier";
import type { CreatureProps } from "../creatures/types";
import type { V3 } from "../fx/bolt";
import { PathLine, Shards } from "../fx/effects";
import { ParticleField } from "../fx/particles";
import { pieceHeight } from "../pieces/geometry";
import { boardLayout, squareToXZ } from "../pieces/layout";
import type { HeroId } from "../sequence";
import { POSES, clamp01, ease, lerp, range } from "../shots/poses";
import { world } from "../store";
import { ROUTE_Y, pointOnRoute, routeFor, routeProgress } from "./routes";
import { CINEMATICS, beatStart, reducedSpec } from "./spec";

const CREATURE: Record<HeroId, (p: CreatureProps) => React.ReactNode> = {
  knight: (p) => <Horse {...p} />,
  rook: (p) => <Elephant {...p} />,
  bishop: (p) => <Garuda {...p} />,
  pawn: (p) => <Soldier {...p} />,
  king: (p) => <Lion {...p} />,
  queen: (p) => <Phoenix {...p} />,
};

export function Director() {
  const [cin, setCin] = useState(world.get().cinematic);
  useEffect(() => world.subscribe((s) => setCin((c) => (c === s.cinematic ? c : s.cinematic))), []);
  if (!cin) return null;
  return (
    <CinematicScene
      key={`${cin.id}-${cin.startedAt}`}
      id={cin.id}
      startedAt={cin.startedAt}
      reduced={cin.reduced}
    />
  );
}

function CinematicScene({
  id,
  startedAt,
  reduced,
}: {
  id: HeroId;
  startedAt: number;
  reduced: boolean;
}) {
  const { camera, size, viewport } = useThree();
  const spec = useMemo(
    () => (reduced ? reducedSpec(CINEMATICS[id]) : CINEMATICS[id]),
    [id, reduced],
  );
  const placement = useMemo(() => boardLayout().find((p) => p.hero === id)!, [id]);
  const origin = useMemo<V3>(() => {
    const [x, z] = squareToXZ(placement.square, 1);
    return [x, ROUTE_Y, z];
  }, [placement]);
  const height = useMemo(() => pieceHeight(placement.type) * 1.12, [placement]);
  const path = useMemo(() => routeFor(id, origin), [id, origin]);
  const field = useMemo(() => new ParticleField(6000), []);
  useEffect(() => () => field.dispose(), [field]);
  const [frame, setFrame] = useState({ t: 0, seconds: 0 });
  const tmp = useMemo(
    () => ({
      pos: new THREE.Vector3(),
      ahead: new THREE.Vector3(),
      cam: new THREE.Vector3(),
      look: new THREE.Vector3(),
      boardCam: new THREE.Vector3(...POSES.board.pos),
      boardLook: new THREE.Vector3(...POSES.board.look),
      up: new THREE.Vector3(0, 1, 0),
    }),
    [],
  );

  const shatter = beatStart(spec, "shatter");
  const emerge = beatStart(spec, "emerge");
  const charge = beatStart(spec, "charge");
  const impact = beatStart(spec, "impact");
  const uAt = (t: number) => routeProgress(id, t, charge, impact);

  useFrame((state) => {
    const s = world.get();
    const real = (performance.now() - startedAt) / 1000;
    const dur = spec.durationMs / 1000;
    // Look-dev: approach the frozen time in slow motion (so trails exist), then hold it.
    const seconds = s.frozen
      ? Math.min(s.frozen.t * dur, Math.max(0, s.frozen.t - 0.1) * dur + real * 0.3)
      : real;
    const t = clamp01(seconds / dur);
    field.update(state.clock.elapsedTime, size.height * viewport.dpr * 0.55);
    setFrame((f) => (Math.abs(f.t - t) < 1e-4 ? f : { t, seconds }));
    if (reduced) return;

    // ---- camera: push in on the awakening piece, then each creature's own rig ----
    const u = uAt(t);
    pointOnRoute(path, u, tmp.pos);
    pointOnRoute(path, Math.min(1, u + 0.03), tmp.ahead);
    const fwd = tmp.ahead.clone().sub(tmp.pos);
    if (fwd.lengthSq() < 1e-6) fwd.set(0, 0, 1);
    fwd.normalize();
    const right = new THREE.Vector3().crossVectors(fwd, tmp.up).normalize();
    const o = new THREE.Vector3(...origin);
    const push = ease.inOut(range(t, 0, charge));
    const closeCam = o.clone().add(new THREE.Vector3(1.6, 1.4, 3.6));
    const closeLook = o.clone().add(new THREE.Vector3(0, 0.6, 0));
    let rigCam = closeCam.clone();
    let rigLook = closeLook.clone();
    const k = range(t, charge, 1);
    switch (id) {
      case "knight": // low tracking shot alongside, then a whip-pan at the impact
        rigCam = tmp.pos
          .clone()
          .addScaledVector(right, 6.2)
          .add(new THREE.Vector3(0, 1.15, 0))
          .addScaledVector(fwd, -1.6);
        rigLook = tmp.pos
          .clone()
          .addScaledVector(fwd, 1.4)
          .add(new THREE.Vector3(0, 1.0, 0));
        if (t > impact) rigLook.addScaledVector(right, -ease.inCubic(range(t, impact, 1)) * 8);
        break;
      case "rook": {
        // ground level, a heavy bump on each step
        const step = Math.abs(Math.sin(seconds * 5.5)) * 0.07;
        rigCam = tmp.pos
          .clone()
          .addScaledVector(right, 7.5)
          .add(new THREE.Vector3(0, 0.7 + step, 0))
          .addScaledVector(fwd, 1.8);
        rigLook = tmp.pos.clone().add(new THREE.Vector3(0, 1.6, 0));
        break;
      }
      case "bishop": // top-down, then into the dive
        rigCam = tmp.pos
          .clone()
          .add(new THREE.Vector3(0, lerp(9, 1.4, ease.inOut(k)), 0))
          .addScaledVector(fwd, lerp(-1, -4, k));
        rigLook = tmp.pos.clone().addScaledVector(fwd, 2);
        break;
      case "pawn": {
        // side scroll, then a rising crane shot for the promotion
        const crane = ease.inOut(range(t, 0.68, 1));
        rigCam = tmp.pos.clone().add(new THREE.Vector3(4.6, 1.2 + crane * 3.5, 1.5 + crane * 2));
        rigLook = tmp.pos.clone().add(new THREE.Vector3(0, 0.9 + crane * 2, 0));
        break;
      }
      case "king": {
        // push in to the face, then wide for the shockwave
        const wide = ease.inOut(range(t, 0.5, 0.8));
        rigCam = tmp.pos
          .clone()
          .addScaledVector(fwd, lerp(3.8, 7, wide))
          .add(new THREE.Vector3(0, lerp(1.7, 4.5, wide), 0))
          .addScaledVector(right, lerp(0.5, 2, wide));
        rigLook = tmp.pos.clone().add(new THREE.Vector3(0, 0.9, 0));
        break;
      }
      case "queen": {
        // spiral orbit, then straight up
        const a = seconds * 0.7;
        rigCam = new THREE.Vector3(Math.cos(a) * 11, lerp(5, 9, k), Math.sin(a) * 11);
        rigLook = tmp.pos.clone();
        break;
      }
    }
    const follow = ease.inOut(range(t, charge - 0.06, charge + 0.06));
    tmp.cam.copy(tmp.boardCam).lerp(closeCam, push).lerp(rigCam, follow);
    tmp.look.copy(tmp.boardLook).lerp(closeLook, push).lerp(rigLook, follow);
    const cam = camera as THREE.PerspectiveCamera;
    cam.position.copy(tmp.cam);
    cam.lookAt(tmp.look);
    // portrait screens (phone videos) need a wider lens to keep the creature in frame
    const fov = cam.aspect < 1 ? 64 : 38;
    if (cam.fov !== fov) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
  });

  const { t, seconds } = frame;
  const props: CreatureProps = { t, spec, origin, path, u: uAt(t), field, reduced, seconds };
  return (
    <group>
      <primitive object={field.points} />
      {!reduced && (
        <Shards
          origin={origin}
          height={height}
          t={(t - shatter) / Math.max(0.0001, emerge + 0.3 - shatter)}
          seed={id.length * 13}
        />
      )}
      {!reduced && <PathLine points={path} progress={range(t, emerge, impact) * 1.08} />}
      <Suspense fallback={null}>{!reduced && t >= emerge && CREATURE[id](props)}</Suspense>
    </group>
  );
}
