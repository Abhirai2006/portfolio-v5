/**
 * Pawn → a foot soldier (CC0 Quaternius knight character, ink shader). He marches square by square to the
 * last rank, then a column of light promotes him into a radiant queen-figure: student → engineer.
 */
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { placeOnRoute } from "../cinematics/routes";
import { beatStart } from "../cinematics/spec";
import { LightColumn } from "../fx/effects";
import { inkToonMaterial } from "../materials/inkToon";
import { pieceGeometry } from "../pieces/geometry";
import { ease, range } from "../shots/poses";
import type { CreatureProps } from "./types";

const URL = "/models/soldier.glb";
const HEIGHT = 1.55;

export function Soldier({ t, spec, path, u, field, seconds }: CreatureProps) {
  const gltf = useGLTF(URL, false, false); // no Draco/Meshopt: our models use neither (keeps WASM and CDNs out, CSP intact)
  const holder = useRef<THREE.Group>(null!);
  const queen = useRef<THREE.Mesh>(null!);
  const rig = useMemo(() => {
    const root = clone(gltf.scene) as THREE.Group;
    const paper = inkToonMaterial({ color: "#f2eee6", rimStrength: 1.6, tone: 4 });
    const ink = inkToonMaterial({ color: "#1e1e21", rimStrength: 1.8, steps: 4, tone: 4 });
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.frustumCulled = false;
      const pick = (x: THREE.Material) =>
        /Black|Dark|Hair|Eye|Belt|Boot|Brown|Leather/i.test(x.name) ? ink : paper;
      m.material = Array.isArray(m.material) ? m.material.map(pick) : pick(m.material);
    });
    const mixer = new THREE.AnimationMixer(root);
    const walk = gltf.animations.find((a) => /Walking$/.test(a.name)) ?? gltf.animations[0];
    mixer.clipAction(walk).play();
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    const inner = new THREE.Group();
    inner.add(root);
    const scale = HEIGHT / Math.max(0.001, box.max.y - box.min.y);
    inner.scale.setScalar(scale);
    inner.position.y = -box.min.y * scale;
    return { inner, mixer, paper, ink };
  }, [gltf]);
  const queenMat = useMemo(
    () =>
      inkToonMaterial({
        color: "#ffffff",
        emissive: "#fff1c4",
        emissiveIntensity: 1.6,
        rimLeft: "#ffffff",
        rimRight: "#ffc34d",
        rimStrength: 2.5,
        tone: 0,
      }),
    [],
  );
  const tmp = useMemo(() => ({ p: new THREE.Vector3(), v: new THREE.Vector3() }), []);
  const emerge = beatStart(spec, "emerge");
  const charge = beatStart(spec, "charge");
  const promote = 0.68;

  useFrame(() => {
    const h = holder.current;
    if (!h) return;
    const p = placeOnRoute(h, path, u);
    // the model faces -z in its own space; turn it to walk along the route
    rig.inner.rotation.y = Math.PI;
    rig.mixer.setTime(t > charge && t < 0.66 ? seconds * 1.1 : 0.4);
    const grow = range(t, emerge, charge);
    const dissolve = range(t, promote + 0.02, promote + 0.12);
    h.scale.set(0.5 + 0.5 * grow, (0.5 + 0.5 * grow) * (1 - dissolve * 0.95), 0.5 + 0.5 * grow);
    h.visible = dissolve < 1;
    rig.paper.uniforms.uGlow.value = 2.4 * (1 - grow) + 0.3 + dissolve * 4;
    rig.ink.uniforms.uGlow.value = 1.2 * (1 - grow) + 0.2 + dissolve * 4;
    // the queen of light rises out of the column
    const q = queen.current;
    const rise = ease.outCubic(range(t, promote + 0.06, promote + 0.24));
    q.visible = rise > 0;
    q.position.set(p.x, 0.08 + rise * 0.6, p.z);
    q.scale.setScalar(0.2 + rise * 1.6);
    q.rotation.y = seconds * 0.8;
    queenMat.uniforms.uGlow.value = 1.5;
    if (t > promote) {
      for (let k = 0; k < 3; k++) {
        tmp.p.set(p.x + (Math.random() - 0.5) * 1.2, 0.1, p.z + (Math.random() - 0.5) * 1.2);
        tmp.v.set(0, 2 + Math.random() * 2.5, 0);
        field.emit(tmp.p, tmp.v, k ? "paper" : "gold", 1.1, 0.25);
      }
    }
  });

  const last = path[path.length - 1];
  return (
    <group>
      <group ref={holder}>
        <primitive object={rig.inner} />
      </group>
      <mesh ref={queen} geometry={pieceGeometry("queen")} material={queenMat} visible={false} />
      <LightColumn origin={[last.x, 0, last.z]} t={range(t, promote - 0.02, 1)} />
    </group>
  );
}
