/**
 * Knight → horse (CC0 Quaternius model, ink shader). Red and blue flames stream off the mane, tail and hooves;
 * a trail of embers lingers on the line behind it (DESIGN §4.5).
 */
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { beatStart } from "../cinematics/spec";
import { inkToonMaterial } from "../materials/inkToon";
import { pointOnRoute } from "../cinematics/routes";
import { range } from "../shots/poses";
import type { CreatureProps } from "./types";

const URL = "/models/horse.glb";
const HEIGHT = 1.9;
const MANE = ["Neck2", "Neck3", "Head"];
const TAIL = ["Tail3", "Tail5", "Tail7"];
const HOOVES = ["FrontLowerLeg.L", "FrontLowerLeg.R", "BackLowerLeg.L", "BackLowerLeg.R"];

export function Horse({ t, spec, path, u, field, seconds }: CreatureProps) {
  const gltf = useGLTF(URL, false, false); // no Draco/Meshopt: our models use neither (keeps WASM and CDNs out, CSP intact)
  const holder = useRef<THREE.Group>(null!);
  const rig = useMemo(() => {
    const root = clone(gltf.scene) as THREE.Group;
    const paper = inkToonMaterial({ color: "#f2eee6", rimStrength: 1.7, tone: 4 });
    const ink = inkToonMaterial({ color: "#1e1e21", rimStrength: 1.9, steps: 4, tone: 4 });
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.frustumCulled = false;
      const names = (Array.isArray(m.material) ? m.material : [m.material]).map((x) => x.name);
      const mats = names.map((n) => (/Hair|Hooves|Eye_Black|Muzzle/.test(n) ? ink : paper));
      m.material = mats.length === 1 ? mats[0] : mats;
    });
    const mixer = new THREE.AnimationMixer(root);
    const gallop = mixer.clipAction(gltf.animations.find((a) => a.name.endsWith("|Gallop"))!);
    const idle = mixer.clipAction(
      gltf.animations.find((a) => a.name.endsWith("|Idle_2")) ?? gltf.animations[0],
    );
    gallop.play();
    idle.play();
    // Normalise size and find which way the model faces (head minus tail), so it can be turned to +z.
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    const scale = HEIGHT / Math.max(0.001, box.max.y - box.min.y);
    const bone = (n: string) => root.getObjectByName(n) as THREE.Object3D | undefined;
    const head = bone("Head")!.getWorldPosition(new THREE.Vector3());
    const tail = bone("Tail1")!.getWorldPosition(new THREE.Vector3());
    const facing = Math.atan2(head.x - tail.x, head.z - tail.z);
    const inner = new THREE.Group();
    inner.add(root);
    inner.scale.setScalar(scale);
    inner.position.y = -box.min.y * scale;
    inner.rotation.y = -facing;
    const emitters = {
      mane: MANE.map(bone).filter(Boolean) as THREE.Object3D[],
      tail: TAIL.map(bone).filter(Boolean) as THREE.Object3D[],
      hooves: HOOVES.map(bone).filter(Boolean) as THREE.Object3D[],
    };
    return { inner, mixer, gallop, idle, paper, ink, emitters };
  }, [gltf]);

  const tmp = useMemo(
    () => ({
      p: new THREE.Vector3(),
      a: new THREE.Vector3(),
      v: new THREE.Vector3(),
      back: new THREE.Vector3(),
    }),
    [],
  );
  const emerge = beatStart(spec, "emerge");
  const charge = beatStart(spec, "charge");

  useFrame((_, delta) => {
    const h = holder.current;
    if (!h) return;
    // animation: idle (rearing out of the shards) cross-fades into the gallop at the charge
    const w = range(t, charge - 0.04, charge + 0.04);
    rig.gallop.setEffectiveWeight(w);
    rig.idle.setEffectiveWeight(1 - w);
    rig.mixer.setTime(seconds * 1.25);

    pointOnRoute(path, u, tmp.p);
    pointOnRoute(path, Math.min(1, u + 0.02), tmp.a);
    h.position.copy(tmp.p);
    if (tmp.a.distanceToSquared(tmp.p) > 1e-6) h.lookAt(tmp.a.x, tmp.p.y, tmp.a.z);
    else h.rotation.y = 0;

    // emerging: grows out of the shards in a flare of light
    const grow = range(t, emerge, charge);
    h.scale.setScalar(0.55 + 0.45 * grow);
    rig.paper.uniforms.uGlow.value = 2.6 * (1 - grow) + 0.35;
    rig.ink.uniforms.uGlow.value = 1.5 * (1 - grow) + 0.25;

    // flames: red and blue, streaming backwards off the mane, tail and hooves
    tmp.back.set(0, 0, -1).applyQuaternion(h.quaternion);
    // dense, small, short-lived tongues of fire, streaming backwards (not floating bokeh)
    const n = Math.min(6, Math.max(3, Math.round(delta * 60 * 3)));
    const fire = (o: THREE.Object3D, i: number, size: number, life: number, push: number) => {
      o.getWorldPosition(tmp.p);
      for (let k = 0; k < n; k++) {
        tmp.v.copy(tmp.back).multiplyScalar(push * (0.7 + Math.random() * 0.6));
        tmp.v.y += 0.15 + Math.random() * 0.45;
        tmp.v.x += (Math.random() - 0.5) * 0.35;
        tmp.v.z += (Math.random() - 0.5) * 0.35;
        const jitter = tmp.p
          .clone()
          .add(
            new THREE.Vector3(
              (Math.random() - 0.5) * 0.12,
              (Math.random() - 0.5) * 0.12,
              (Math.random() - 0.5) * 0.12,
            ),
          );
        field.emit(
          jitter,
          tmp.v,
          (i + k) % 2 === 0 ? "redFlame" : "blueFlame",
          life * (0.6 + Math.random() * 0.5),
          size * (0.6 + Math.random() * 0.6),
        );
      }
    };
    if (t > emerge) {
      rig.emitters.mane.forEach((o, i) => fire(o, i, 0.5, 0.42, 3.2));
      rig.emitters.tail.forEach((o, i) => fire(o, i + 1, 0.46, 0.46, 3.4));
      rig.emitters.hooves.forEach((o, i) => {
        fire(o, i, 0.3, 0.3, 1.6);
        // embers that linger on the line behind it
        o.getWorldPosition(tmp.p);
        tmp.p.y = 0.12;
        field.emit(
          tmp.p,
          tmp.v.set((Math.random() - 0.5) * 0.2, 0.15, (Math.random() - 0.5) * 0.2),
          i % 2 ? "ember" : "blueFlame",
          1.6,
          0.22,
        );
      });
    }
  });

  return (
    <group ref={holder}>
      <primitive object={rig.inner} />
    </group>
  );
}
