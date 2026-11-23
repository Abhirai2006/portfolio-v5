/**
 * Reusable cinematic effects (ARCHITECTURE §5). Each takes a normalised local time so the Director can scrub
 * them (and look-dev can freeze them).
 */
import { useMemo } from "react";
import * as THREE from "three";
import { inkToonMaterial, lightMaterial } from "../materials/inkToon";
import { branchBolt, type V3 } from "./bolt";
import { fracture } from "./fracture";
import { rng } from "./rng";

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

/** The carved shell bursting into ink shards: kd-fractured box cells flung outward, spinning, falling. */
export function Shards({
  origin,
  height,
  t,
  seed = 1,
  color = "#f2eee6",
}: {
  origin: V3;
  height: number;
  t: number;
  seed?: number;
  color?: string;
}) {
  const data = useMemo(() => {
    const cells = fracture(seed, 46, [0.62, height, 0.62]);
    const rand = rng(seed + 99);
    // jagged shards (flattened octahedra) rather than cubes: they read as a cracked carved shell
    const mesh = new THREE.InstancedMesh(
      new THREE.OctahedronGeometry(0.75, 0).scale(1, 0.55, 0.8),
      inkToonMaterial({ color, rimStrength: 1.4, tone: 4 }),
      cells.length,
    );
    const motion = cells.map((c) => {
      const dir = new THREE.Vector3(c.center[0], c.center[1] * 0.3 + 0.4, c.center[2]).normalize();
      return {
        c,
        vel: dir.multiplyScalar(2.2 + rand() * 3.2).add(new THREE.Vector3(0, 1.5 + rand() * 2, 0)),
        spin: new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(14),
      };
    });
    return { mesh, motion };
  }, [height, seed, color]);
  const m = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const e = useMemo(() => new THREE.Euler(), []);
  const p = useMemo(() => new THREE.Vector3(), []);
  const s = useMemo(() => new THREE.Vector3(), []);
  const age = Math.max(0, t) * 1.6; // seconds-ish
  data.motion.forEach(({ c, vel, spin }, i) => {
    p.set(
      origin[0] + c.center[0] + vel.x * age,
      origin[1] + c.center[1] + height / 2 + vel.y * age - 4.9 * age * age,
      origin[2] + c.center[2] + vel.z * age,
    );
    e.set(spin.x * age, spin.y * age, spin.z * age);
    q.setFromEuler(e);
    const shrink = 1 - clamp01((t - 0.55) / 0.45);
    s.set(c.size[0] * shrink, c.size[1] * shrink, c.size[2] * shrink);
    m.compose(p, q, s);
    data.mesh.setMatrixAt(i, m);
  });
  data.mesh.instanceMatrix.needsUpdate = true;
  data.mesh.visible = t > 0 && t < 1;
  return <primitive object={data.mesh} />;
}

/** The glowing paper-white "Where are you going?" line the creature runs along, drawn up to `progress`. */
export function PathLine({
  points,
  progress,
  radius = 0.035,
  color = "#f2eee6",
}: {
  points: THREE.Vector3[];
  progress: number;
  radius?: number;
  color?: string;
}) {
  const geo = useMemo(() => {
    const path = new THREE.CurvePath<THREE.Vector3>();
    for (let i = 1; i < points.length; i++)
      path.add(new THREE.LineCurve3(points[i - 1], points[i]));
    return new THREE.TubeGeometry(path, Math.max(32, points.length * 24), radius, 6, false);
  }, [points, radius]);
  const mat = useMemo(() => lightMaterial(color, 0.9), [color]);
  const total = geo.index ? geo.index.count : 0;
  geo.setDrawRange(0, Math.floor((total * clamp01(progress)) / 6) * 6);
  return <mesh geometry={geo} material={mat} />;
}

/** Branching lightning that flickers on and off around `t` (bishop). */
export function Lightning({
  seed,
  from,
  to,
  t,
  color = "#9cc2ff",
}: {
  seed: number;
  from: V3;
  to: V3;
  t: number;
  color?: string;
}) {
  const geos = useMemo(
    () =>
      branchBolt(seed, from, to, 6).map((pts, i) => {
        const curve = new THREE.CurvePath<THREE.Vector3>();
        for (let k = 1; k < pts.length; k++)
          curve.add(
            new THREE.LineCurve3(new THREE.Vector3(...pts[k - 1]), new THREE.Vector3(...pts[k])),
          );
        return new THREE.TubeGeometry(curve, pts.length * 2, i === 0 ? 0.05 : 0.022, 5, false);
      }),
    [seed, from, to],
  );
  const mat = useMemo(() => lightMaterial(color, 1), [color]);
  // a strike: bright, a gap, a re-strike, then gone (never more than 3 bright pulses per second)
  const on = (t > 0 && t < 0.12) || (t > 0.42 && t < 0.5);
  return (
    <group visible={on}>
      {geos.map((g, i) => (
        <mesh key={i} geometry={g} material={mat} />
      ))}
    </group>
  );
}

/** Expanding ring of light on the floor (king's golden shockwave). */
export function Shockwave({
  origin,
  t,
  color = "#ffc34d",
  maxRadius = 9,
}: {
  origin: V3;
  t: number;
  color?: string;
  maxRadius?: number;
}) {
  const mat = useMemo(() => lightMaterial(color, 1), [color]);
  const geo = useMemo(() => new THREE.RingGeometry(0.9, 1, 96, 1).rotateX(-Math.PI / 2), []);
  const r = 0.2 + clamp01(t) * maxRadius;
  mat.opacity = (1 - clamp01(t)) * 0.95;
  return (
    <group position={origin} visible={t > 0 && t < 1}>
      <mesh geometry={geo} material={mat} scale={[r, 1, r]} />
      <mesh geometry={geo} material={mat} scale={[r * 0.82, 1, r * 0.82]} position={[0, 0.02, 0]} />
    </group>
  );
}

/** Rays of light bursting in every direction (queen moves anywhere). */
export function Rays({
  origin,
  t,
  count = 28,
  color = "#ffc38a",
  length = 7,
}: {
  origin: V3;
  t: number;
  count?: number;
  color?: string;
  length?: number;
}) {
  const dirs = useMemo(() => {
    const r = rng(5);
    return Array.from({ length: count }, () =>
      new THREE.Vector3(r() - 0.5, r() * 0.9 - 0.2, r() - 0.5).normalize(),
    );
  }, [count]);
  const mat = useMemo(() => lightMaterial(color, 1), [color]);
  const geo = useMemo(
    () => new THREE.CylinderGeometry(0.012, 0.05, 1, 6, 1, true).translate(0, 0.5, 0),
    [],
  );
  const k = clamp01(t);
  mat.opacity = Math.sin(k * Math.PI);
  const up = new THREE.Vector3(0, 1, 0);
  return (
    <group position={origin} visible={t > 0 && t < 1}>
      {dirs.map((d, i) => {
        const q = new THREE.Quaternion().setFromUnitVectors(up, d);
        return (
          <mesh
            key={i}
            geometry={geo}
            material={mat}
            quaternion={q}
            scale={[1 + k * 2, length * (0.2 + k), 1 + k * 2]}
          />
        );
      })}
    </group>
  );
}

/** A column of light (pawn's promotion). */
export function LightColumn({
  origin,
  t,
  color = "#ffffff",
}: {
  origin: V3;
  t: number;
  color?: string;
}) {
  const outer = useMemo(() => lightMaterial(color, 0.35), [color]);
  const core = useMemo(() => lightMaterial(color, 0.9), [color]);
  const k = Math.sin(clamp01(t) * Math.PI);
  outer.opacity = 0.35 * k;
  core.opacity = 0.9 * k;
  return (
    <group position={origin} visible={t > 0 && t < 1}>
      <mesh material={outer} position={[0, 6, 0]} scale={[0.5 + k * 0.8, 1, 0.5 + k * 0.8]}>
        <cylinderGeometry args={[1, 1, 12, 32, 1, true]} />
      </mesh>
      <mesh material={core} position={[0, 6, 0]} scale={[0.12 + k * 0.2, 1, 0.12 + k * 0.2]}>
        <cylinderGeometry args={[1, 1, 12, 16, 1, true]} />
      </mesh>
    </group>
  );
}
