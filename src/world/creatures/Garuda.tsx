/** Bishop → Garuda: rises, then dives diagonally through lightning, feather streaks off the wingtips. */
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { placeOnRoute, pointOnRoute } from "../cinematics/routes";
import { beatStart } from "../cinematics/spec";
import { Lightning } from "../fx/effects";
import type { V3 } from "../fx/bolt";
import { inkToonMaterial, lightMaterial } from "../materials/inkToon";
import { range } from "../shots/poses";
import { buildBird, flap } from "./bird";
import type { CreatureProps } from "./types";

export function Garuda({ t, spec, path, u, field, seconds }: CreatureProps) {
  const holder = useRef<THREE.Group>(null!);
  const bird = useMemo(() => {
    const body = inkToonMaterial({ color: "#1e1e21", rimStrength: 2, steps: 4, tone: 4 });
    const wing = inkToonMaterial({
      color: "#f2eee6",
      rimStrength: 1.6,
      tone: 5,
      side: THREE.DoubleSide,
    });
    const accent = lightMaterial("#ffc38a", 1);
    const b = buildBird({ body, wing, accent });
    b.root.scale.setScalar(1.35);
    return { ...b, body, wing };
  }, []);
  const tips = useMemo(
    () => ({
      l: new THREE.Object3D(),
      r: new THREE.Object3D(),
      p: new THREE.Vector3(),
      v: new THREE.Vector3(),
    }),
    [],
  );
  useMemo(() => {
    tips.l.position.set(1.7, 0, -0.05);
    tips.r.position.set(-1.7, 0, -0.05);
    bird.wingL.add(tips.l);
    bird.wingR.add(tips.r);
  }, [bird, tips]);

  const emerge = beatStart(spec, "emerge");
  const charge = beatStart(spec, "charge");
  // bolts straddle the dive, timed with the two flash panels
  const bolts = useMemo(() => {
    const a = pointOnRoute(path, 0.45);
    const b = pointOnRoute(path, 0.8);
    return [
      {
        seed: 3,
        from: [a.x - 2, 11, a.z - 1] as V3,
        to: [a.x + 0.6, 0, a.z + 0.4] as V3,
        at: spec.flashesMs[0] / spec.durationMs,
      },
      {
        seed: 9,
        from: [b.x + 2.5, 11, b.z - 2] as V3,
        to: [b.x - 0.5, 0, b.z + 0.5] as V3,
        at: spec.flashesMs[1] / spec.durationMs,
      },
      {
        seed: 17,
        from: [a.x + 4, 10, a.z - 4] as V3,
        to: [a.x + 3, 0, a.z - 1] as V3,
        at: spec.flashesMs[0] / spec.durationMs + 0.02,
      },
    ];
  }, [path, spec]);

  useFrame(() => {
    const h = holder.current;
    if (!h) return;
    placeOnRoute(h, path, u, true);
    const ahead = pointOnRoute(path, Math.min(1, u + 0.02));
    const diving = ahead.y < h.position.y - 0.01 ? 1 : 0;
    const grow = range(t, emerge, charge);
    h.scale.setScalar(0.4 + 0.6 * grow);
    bird.wing.uniforms.uGlow.value = 2.4 * (1 - grow) + 0.3;
    flap(bird, seconds * (diving ? 4 : 11), diving ? 0.15 : 0.75, diving ? 0.85 : 0);
    if (t > charge) {
      for (const tip of [tips.l, tips.r]) {
        tip.getWorldPosition(tips.p);
        tips.v.set((Math.random() - 0.5) * 0.3, 0.1, (Math.random() - 0.5) * 0.3);
        field.emit(tips.p, tips.v, "paper", 0.5, 0.18);
        field.emit(tips.p, tips.v, "blueFlame", 0.35, 0.14);
      }
    }
  });

  return (
    <group>
      <group ref={holder}>
        <primitive object={bird.root} />
      </group>
      {bolts.map((b) => (
        <Lightning
          key={b.seed}
          seed={b.seed}
          from={b.from}
          to={b.to}
          t={range(t, b.at - 0.02, b.at + 0.28)}
        />
      ))}
    </group>
  );
}
