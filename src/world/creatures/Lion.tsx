/**
 * King → a lion with a crown of fire (code-built, original). It walks out, stops, roars — a golden shockwave
 * ripples across the board — then charges to About.
 */
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { placeOnRoute } from "../cinematics/routes";
import { beatStart } from "../cinematics/spec";
import type { V3 } from "../fx/bolt";
import { Shockwave } from "../fx/effects";
import { inkToonMaterial, lightMaterial } from "../materials/inkToon";
import { range } from "../shots/poses";
import { world } from "../store";
import { gaitPhase, legLift, legSwing } from "./gait";
import type { CreatureProps } from "./types";

function buildLion(body: THREE.Material, mane: THREE.Material, fire: THREE.Material) {
  const root = new THREE.Group();
  const add = (
    g: THREE.BufferGeometry,
    m: THREE.Material,
    p: [number, number, number],
    parent: THREE.Object3D = root,
  ) => {
    const mesh = new THREE.Mesh(g, m);
    mesh.position.set(...p);
    parent.add(mesh);
    return mesh;
  };
  add(new THREE.SphereGeometry(1, 26, 18).scale(0.45, 0.42, 0.95), body, [0, 1.0, 0]); // body
  add(new THREE.SphereGeometry(0.5, 20, 14).scale(1, 1, 0.9), body, [0, 1.15, 0.65]); // chest
  const head = new THREE.Group();
  head.position.set(0, 1.45, 1.05);
  root.add(head);
  // mane: a flattened ink disc behind the face with long spikes swept back (manga lion, not a ball)
  add(new THREE.SphereGeometry(0.62, 22, 16).scale(1.05, 1.1, 0.5), mane, [0, 0.02, -0.28], head); // mane core
  for (let ring = 0; ring < 3; ring++) {
    const n = [19, 15, 11][ring];
    const r = [0.62, 0.48, 0.34][ring];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + ring * 0.21;
      const spike = add(
        new THREE.ConeGeometry(0.12, [0.8, 0.62, 0.46][ring], 8),
        mane,
        [Math.cos(a) * r, Math.sin(a) * r * 1.05, -0.3 - ring * 0.1],
        head,
      );
      spike.rotation.set(0, 0, a - Math.PI / 2);
      spike.rotateX(-0.95); // sweep back, like wind in the mane
    }
  }
  // a long, proud face: brow, cheeks and a broad muzzle forward of the mane
  add(new THREE.SphereGeometry(0.36, 18, 12).scale(1, 1.1, 1.15), body, [0, 0.02, 0.2], head); // face
  add(new THREE.SphereGeometry(0.2, 14, 10).scale(1.25, 0.85, 1.6), body, [0, -0.12, 0.55], head); // muzzle
  add(new THREE.BoxGeometry(0.42, 0.06, 0.18), mane, [0, 0.2, 0.42], head); // heavy ink brow
  add(new THREE.SphereGeometry(0.07, 8, 6), mane, [0, -0.06, 0.85], head); // nose
  for (const s of [1, -1])
    add(new THREE.SphereGeometry(0.05, 8, 6), mane, [0.14 * s, 0.1, 0.55], head); // eyes
  const jaw = new THREE.Group();
  jaw.position.set(0, -0.24, 0.5);
  head.add(jaw);
  add(new THREE.SphereGeometry(0.15, 12, 8).scale(1, 0.45, 1.2), body, [0, -0.04, 0.1], jaw);
  // crown of fire: five spires of light
  const crown = new THREE.Group();
  crown.position.set(0, 0.72, -0.05);
  head.add(crown);
  for (let i = 0; i < 5; i++) {
    const c = add(
      new THREE.ConeGeometry(0.06, 0.32 + (i === 2 ? 0.14 : 0), 8),
      fire,
      [(i - 2) * 0.13, 0.14, 0],
      crown,
    );
    c.rotation.z = (2 - i) * 0.18;
  }
  const legs: THREE.Group[] = [];
  for (const [x, z] of [
    [0.27, 0.6],
    [-0.27, 0.6],
    [0.27, -0.62],
    [-0.27, -0.62],
  ]) {
    const hip = new THREE.Group();
    hip.position.set(x, 0.95, z);
    add(
      new THREE.CylinderGeometry(0.13, 0.11, 0.9, 12).translate(0, -0.45, 0),
      body,
      [0, 0, 0],
      hip,
    );
    add(new THREE.SphereGeometry(0.14, 10, 8).scale(1, 0.6, 1.3), body, [0, -0.9, 0.05], hip);
    root.add(hip);
    legs.push(hip);
  }
  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 1.1, -0.9),
    new THREE.Vector3(0, 0.9, -1.4),
    new THREE.Vector3(0, 1.2, -1.8),
  ]);
  add(new THREE.TubeGeometry(tailCurve, 12, 0.04, 6, false), body, [0, 0, 0]);
  add(new THREE.SphereGeometry(0.11, 10, 8), mane, [0, 1.2, -1.82]);
  return { root, head, jaw, crown, legs };
}

export function Lion({ t, spec, path, u, field, seconds }: CreatureProps) {
  const holder = useRef<THREE.Group>(null!);
  const rig = useMemo(() => {
    const body = inkToonMaterial({ color: "#f2eee6", rimStrength: 1.6, tone: 5 });
    const mane = inkToonMaterial({
      color: "#1c1c1f",
      rimLeft: "#3d7bff",
      rimRight: "#ffc34d",
      rimStrength: 2.2,
      steps: 4,
      tone: 4,
    });
    const fire = lightMaterial("#ffc34d", 1);
    return { ...buildLion(body, mane, fire), body, mane };
  }, []);
  const tmp = useMemo(() => ({ p: new THREE.Vector3(), v: new THREE.Vector3() }), []);
  const emerge = beatStart(spec, "emerge");
  const charge = beatStart(spec, "charge");
  const roarAt = spec.flashesMs[0] / spec.durationMs;
  const roar = Math.max(
    range(t, roarAt - 0.04, roarAt + 0.02) - range(t, roarAt + 0.12, roarAt + 0.18),
    0,
  );
  const shockOrigin = useRef<V3>([0, 0.1, 0]);

  useFrame(() => {
    const h = holder.current;
    if (!h) return;
    const p = placeOnRoute(h, path, u);
    if (t < roarAt) shockOrigin.current = [p.x, 0.12, p.z];
    const grow = range(t, emerge, charge);
    h.scale.setScalar(0.45 + 0.55 * grow);
    rig.body.uniforms.uGlow.value = 2.4 * (1 - grow) + 0.25;
    const moving = t > charge && !(t > 0.44 && t < 0.58);
    const phases = gaitPhase(seconds * 1.6, 4, t > 0.58 ? "gallop" : "walk");
    rig.legs.forEach((leg, i) => {
      const ph = moving ? phases[i] : 0.5;
      leg.rotation.x = legSwing(ph) * (t > 0.58 ? 0.6 : 0.35);
      leg.position.y = 0.95 + legLift(ph) * 0.15;
    });
    rig.head.rotation.x = -roar * 0.45;
    rig.jaw.rotation.x = roar * 0.55;
    // crown of fire
    rig.crown.getWorldPosition(tmp.p);
    for (let k = 0; k < 3; k++) {
      tmp.v.set(
        (Math.random() - 0.5) * 0.4,
        0.9 + Math.random() * 0.6,
        (Math.random() - 0.5) * 0.4,
      );
      field.emit(tmp.p, tmp.v, k ? "gold" : "ember", 0.6, 0.38);
    }
    // the roar ripples the board
    if (roar > 0.9 && !world.get().ripple)
      world.set({ ripple: { x: p.x, z: p.z, start: performance.now() } });
  });

  return (
    <group>
      <group ref={holder}>
        <primitive object={rig.root} />
      </group>
      <Shockwave origin={shockOrigin.current} t={range(t, roarAt, roarAt + 0.3)} />
      <Shockwave
        origin={shockOrigin.current}
        t={range(t, roarAt + 0.05, roarAt + 0.38)}
        maxRadius={6}
        color="#fff1c4"
      />
    </group>
  );
}
