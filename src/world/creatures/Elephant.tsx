/**
 * Rook → a giant white elephant with a glow (code-built, original). Each step shatters the floor: fracture
 * plates break off under the foot and fall into the void, with paper dust.
 */
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { placeOnRoute } from "../cinematics/routes";
import { beatStart } from "../cinematics/spec";
import { inkToonMaterial } from "../materials/inkToon";
import { rng } from "../fx/rng";
import { range } from "../shots/poses";
import { gaitPhase, legLift, legSwing } from "./gait";
import type { CreatureProps } from "./types";

const PLATES = 140;

function buildElephant(mat: THREE.Material, dark: THREE.Material) {
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
  add(new THREE.SphereGeometry(1, 28, 20).scale(0.82, 0.78, 1.3), mat, [0, 1.75, 0]); // body
  add(new THREE.SphereGeometry(0.58, 24, 16), mat, [0, 2.15, 1.25]); // head
  add(new THREE.SphereGeometry(0.3, 16, 12).scale(1, 0.9, 1), mat, [0, 2.6, 1.0]); // brow
  const ears: THREE.Group[] = [];
  for (const s of [1, -1]) {
    const ear = new THREE.Group();
    ear.position.set(0.5 * s, 2.2, 1.05);
    add(
      new THREE.SphereGeometry(0.62, 18, 12).scale(0.12, 1, 0.85),
      mat,
      [0.06 * s, -0.1, -0.2],
      ear,
    );
    root.add(ear);
    ears.push(ear);
    const tusk = add(new THREE.ConeGeometry(0.07, 0.75, 10), mat, [0.24 * s, 1.75, 1.72]);
    tusk.rotation.set(1.9, 0, -0.25 * s);
    add(new THREE.SphereGeometry(0.06, 8, 6), dark, [0.24 * s, 2.3, 1.72]); // eyes
  }
  // trunk: a chain of segments that sways
  const trunk: THREE.Group[] = [];
  let parent: THREE.Object3D = root;
  let pos: [number, number, number] = [0, 1.95, 1.72];
  for (let i = 0; i < 7; i++) {
    const seg = new THREE.Group();
    seg.position.set(...pos);
    parent.add(seg);
    add(
      new THREE.CylinderGeometry(0.17 - i * 0.017, 0.19 - i * 0.017, 0.3, 14).translate(
        0,
        -0.15,
        0,
      ),
      mat,
      [0, 0, 0],
      seg,
    );
    trunk.push(seg);
    parent = seg;
    pos = [0, -0.28, 0];
  }
  const legs: THREE.Group[] = [];
  for (const [x, z] of [
    [0.5, 0.75],
    [-0.5, 0.75],
    [0.5, -0.75],
    [-0.5, -0.75],
  ]) {
    const hip = new THREE.Group();
    hip.position.set(x, 1.35, z);
    add(new THREE.CylinderGeometry(0.26, 0.3, 1.3, 16).translate(0, -0.65, 0), mat, [0, 0, 0], hip);
    add(new THREE.CylinderGeometry(0.33, 0.33, 0.1, 16), dark, [0, -1.3, 0], hip); // toenail band
    root.add(hip);
    legs.push(hip);
  }
  const tail = add(
    new THREE.CylinderGeometry(0.03, 0.05, 0.7, 8).translate(0, -0.35, 0),
    mat,
    [0, 1.95, -1.25],
  );
  tail.rotation.x = -0.3;
  return { root, ears, trunk, legs };
}

export function Elephant({ t, spec, path, u, field, seconds }: CreatureProps) {
  const holder = useRef<THREE.Group>(null!);
  const rig = useMemo(() => {
    const mat = inkToonMaterial({
      color: "#ffffff",
      rimLeft: "#ffffff",
      rimRight: "#ffffff",
      rimStrength: 2.2,
      emissive: "#3a3a3e",
      tone: 5,
    });
    const dark = inkToonMaterial({ color: "#1e1e21", rimStrength: 1 });
    return { ...buildElephant(mat, dark), mat };
  }, []);
  const plates = useMemo(() => {
    const mesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 0.1, 1),
      inkToonMaterial({ color: "#26262a", rimStrength: 1.6, steps: 4, tone: 4 }),
      PLATES,
    );
    mesh.frustumCulled = false;
    const rand = rng(42);
    const state = Array.from({ length: PLATES }, () => ({
      born: -1,
      p: new THREE.Vector3(),
      v: new THREE.Vector3(),
      spin: new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(6),
      size: 0.25 + rand() * 0.4,
    }));
    return { mesh, state, head: 0, rand };
  }, []);
  const tmp = useMemo(
    () => ({
      m: new THREE.Matrix4(),
      q: new THREE.Quaternion(),
      e: new THREE.Euler(),
      s: new THREE.Vector3(),
      p: new THREE.Vector3(),
      prev: [0, 0, 0, 0],
    }),
    [],
  );
  const emerge = beatStart(spec, "emerge");
  const charge = beatStart(spec, "charge");

  useFrame(() => {
    const h = holder.current;
    if (!h) return;
    placeOnRoute(h, path, u);
    const grow = range(t, emerge, charge);
    h.scale.setScalar(0.35 + 0.65 * grow);
    rig.mat.uniforms.uGlow.value = 1.2 + 1.6 * (1 - grow);
    const walking = t > charge;
    const phases = gaitPhase(seconds * 0.95, 4, "walk");
    rig.legs.forEach((leg, i) => {
      const p = walking ? phases[i] : 0.5;
      leg.rotation.x = legSwing(p) * 0.32;
      leg.position.y = 1.35 + legLift(p) * 0.28;
      // footfall: the swing just ended → the floor breaks under this foot
      if (walking && tmp.prev[i] < 0.4 && p >= 0.4) {
        leg.getWorldPosition(tmp.p);
        tmp.p.y = 0.05;
        for (let k = 0; k < 9; k++) {
          const st = plates.state[plates.head];
          plates.head = (plates.head + 1) % PLATES;
          st.born = seconds;
          st.p.set(tmp.p.x + (plates.rand() - 0.5) * 1.4, 0, tmp.p.z + (plates.rand() - 0.5) * 1.4);
          st.v.set((st.p.x - tmp.p.x) * 1.5, 0.6 + plates.rand() * 1.2, (st.p.z - tmp.p.z) * 1.5);
          field.emit(
            st.p,
            new THREE.Vector3(
              (plates.rand() - 0.5) * 2,
              0.8 + plates.rand(),
              (plates.rand() - 0.5) * 2,
            ),
            "paper",
            1,
            0.3,
          );
        }
      }
      tmp.prev[i] = p;
    });
    rig.trunk.forEach(
      (seg, i) =>
        (seg.rotation.x =
          0.12 +
          Math.sin(seconds * 2.4 - i * 0.6) * 0.12 * (i + 1) * 0.35 +
          (t > 0.24 && t < 0.34 ? -0.35 : 0)),
    );
    rig.ears.forEach(
      (ear, i) => (ear.rotation.y = (i ? -1 : 1) * (0.2 + Math.sin(seconds * 3) * 0.15)),
    );

    plates.state.forEach((st, i) => {
      const age = seconds - st.born;
      if (st.born < 0 || age > 2.2) {
        tmp.s.set(0, 0, 0);
        tmp.m.compose(tmp.p.set(0, -50, 0), tmp.q.identity(), tmp.s);
      } else {
        tmp.p.set(
          st.p.x + st.v.x * age,
          st.p.y + st.v.y * age - 6 * age * age,
          st.p.z + st.v.z * age,
        );
        tmp.e.set(st.spin.x * age, st.spin.y * age, st.spin.z * age);
        tmp.q.setFromEuler(tmp.e);
        tmp.s.setScalar(st.size * (1 - Math.max(0, age - 1.4) / 0.8));
        tmp.m.compose(tmp.p, tmp.q, tmp.s);
      }
      plates.mesh.setMatrixAt(i, tmp.m);
    });
    plates.mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <group ref={holder}>
        <primitive object={rig.root} />
      </group>
      <primitive object={plates.mesh} />
    </group>
  );
}
