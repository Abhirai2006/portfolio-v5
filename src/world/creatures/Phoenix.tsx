/** Queen → phoenix: wings unfold, it bursts into rays of light in every direction, spirals and re-forms. */
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { placeOnRoute } from "../cinematics/routes";
import { beatStart } from "../cinematics/spec";
import type { V3 } from "../fx/bolt";
import { Rays } from "../fx/effects";
import { inkToonMaterial, lightMaterial } from "../materials/inkToon";
import { range } from "../shots/poses";
import { buildBird, flap } from "./bird";
import type { CreatureProps } from "./types";

export function Phoenix({ t, spec, origin, path, u, field, seconds }: CreatureProps) {
  const holder = useRef<THREE.Group>(null!);
  const bird = useMemo(() => {
    const body = inkToonMaterial({
      color: "#ffd9b0",
      emissive: "#ff6a1a",
      emissiveIntensity: 1.4,
      rimLeft: "#ffc34d",
      rimRight: "#ff6a1a",
      rimStrength: 2,
      tone: 0,
    });
    const wing = inkToonMaterial({
      color: "#fff1dc",
      emissive: "#ffc34d",
      emissiveIntensity: 1.1,
      rimLeft: "#ffc34d",
      rimRight: "#ff2e2e",
      rimStrength: 2,
      tone: 0,
      side: THREE.DoubleSide,
    });
    const accent = lightMaterial("#ffffff", 1);
    const b = buildBird({ body, wing, accent });
    b.root.scale.setScalar(1.25);
    return { ...b, body, wing };
  }, []);
  const tips = useMemo(() => {
    const l = new THREE.Object3D();
    const r = new THREE.Object3D();
    l.position.set(1.6, 0, -0.1);
    r.position.set(-1.6, 0, -0.1);
    bird.wingL.add(l);
    bird.wingR.add(r);
    return { l, r, p: new THREE.Vector3(), v: new THREE.Vector3() };
  }, [bird]);

  const emerge = beatStart(spec, "emerge");
  const charge = beatStart(spec, "charge");
  const impact = beatStart(spec, "impact");
  const end = useMemo<V3>(() => {
    const p = path[path.length - 1];
    return [p.x, p.y - 2, p.z];
  }, [path]);

  useFrame(() => {
    const h = holder.current;
    if (!h) return;
    placeOnRoute(h, path, u, true);
    const unfold = range(t, emerge, charge);
    h.scale.setScalar(0.5 + 0.5 * unfold);
    bird.wingL.scale.setScalar(0.05 + 0.95 * unfold);
    bird.wingR.scale.setScalar(0.05 + 0.95 * unfold);
    flap(bird, seconds * 8, 0.65 * unfold, 0);
    // the bird dissolves into its own light at the impact
    h.visible = t < impact + 0.05;
    if (t > emerge) {
      for (const tip of [tips.l, tips.r]) {
        tip.getWorldPosition(tips.p);
        for (let k = 0; k < 2; k++) {
          tips.v.set(
            (Math.random() - 0.5) * 0.4,
            -0.2 + Math.random() * 0.3,
            (Math.random() - 0.5) * 0.4,
          );
          field.emit(tips.p, tips.v, k % 2 ? "gold" : "ember", 0.9, 0.3);
        }
      }
      bird.tail.getWorldPosition(tips.p);
      field.emit(tips.p, tips.v.set(0, -0.3, 0), "redFlame", 0.8, 0.45);
    }
  });

  return (
    <group>
      <group ref={holder}>
        <primitive object={bird.root} />
      </group>
      <Rays
        origin={[origin[0], origin[1] + 0.8, origin[2]]}
        t={range(t, charge - 0.04, charge + 0.18)}
      />
      <Rays origin={end} t={range(t, impact - 0.02, 1)} color="#ffffff" length={10} />
    </group>
  );
}
