/**
 * The Board (DESIGN §4.4): a large carved board floating in the void, all 32 pieces, the six white heroes
 * slightly larger with brighter rims. Scroll drives it: it rises from below through the giant name
 * (masking it), drifts while you choose, then lifts away for the map. It also projects the heroes to
 * screen space so the DOM labels (real buttons) can follow them.
 */
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { CINEMATICS, beatStart } from "../cinematics/spec";
import { inkToonMaterial, type InkMaterial } from "../materials/inkToon";
import { pieceGeometry, pieceHeight } from "../pieces/geometry";
import { boardLayout, squareToXZ } from "../pieces/layout";
import { HERO_IDS, type HeroId } from "../sequence";
import { world } from "../store";
import { POSES, clamp01, ease, lerp, range } from "./poses";

const WHITE = "#f2eee6";
const BLACK = "#1c1c1f";
const TILE_TOP = 0.07;

function cinematicProgress(now: number) {
  const s = world.get();
  if (!s.cinematic) return null;
  const spec = CINEMATICS[s.cinematic.id];
  const t = s.frozen
    ? s.frozen.t
    : clamp01((now - s.cinematic.startedAt) / (s.cinematic.reduced ? 700 : spec.durationMs));
  return { id: s.cinematic.id, t, spec };
}

export function BoardShot() {
  const group = useRef<THREE.Group>(null!);
  const heroMesh = useRef<Partial<Record<HeroId, THREE.Mesh>>>({});
  const { camera, size } = useThree();
  const layout = useMemo(boardLayout, []);
  const tmp = useMemo(
    () => ({
      v: new THREE.Vector3(),
      m: new THREE.Matrix4(),
      look: new THREE.Vector3(...POSES.board.look),
    }),
    [],
  );

  const mats = useMemo(() => {
    const heroes = Object.fromEntries(
      HERO_IDS.map((id) => [id, inkToonMaterial({ color: WHITE, rimStrength: 0.8 })]),
    ) as Record<HeroId, InkMaterial>;
    return {
      white: inkToonMaterial({ color: WHITE, rimStrength: 0.45 }),
      black: inkToonMaterial({ color: BLACK, rimStrength: 0.9, steps: 4, tone: 4 }),
      heroes,
      tiles: inkToonMaterial({ color: "#ffffff", rimStrength: 0.2, tone: 6 }),
      frame: inkToonMaterial({ color: "#151517", rimStrength: 0.45, steps: 4, tone: 4 }),
      trim: inkToonMaterial({ color: "#c9c4ba", rimStrength: 0.5 }),
    };
  }, []);

  const tiles = useMemo(() => {
    const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.97, 0.14, 0.97), mats.tiles, 64);
    const m = new THREE.Matrix4();
    const c = new THREE.Color();
    let i = 0;
    for (let f = 0; f < 8; f++) {
      for (let r = 0; r < 8; r++) {
        const [x, z] = squareToXZ(`${"abcdefgh"[f]}${r + 1}`, 1);
        m.makeTranslation(x, 0, z);
        mesh.setMatrixAt(i, m);
        const light = (f + r) % 2 === 1;
        // paper marble vs polished ink stone, each tile a touch different
        const jitter = ((f * 7 + r * 13) % 5) / 100;
        c.set(light ? "#e9e3d7" : "#202023").offsetHSL(0, 0, light ? -jitter : jitter * 0.6);
        mesh.setColorAt(i, c);
        i++;
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    return mesh;
  }, [mats.tiles]);

  useFrame((state) => {
    const s = world.get();
    const t = state.clock.elapsedTime;
    const g = group.current;
    if (!g) return;
    const cin = cinematicProgress(performance.now());

    // --- scroll choreography -------------------------------------------------------------
    const rise = ease.outCubic(range(s.scroll.name, 0.2, 1));
    const leave = ease.inCubic(range(s.scroll.map, 0, 0.22));
    g.position.y = lerp(-12, 0, rise) + leave * 10;
    g.rotation.x = lerp(0.6, 0, rise) - leave * 0.25;
    const drift = s.reduced ? 0 : Math.sin(t * 0.12) * 0.05 + s.pointer.x * 0.05;
    g.rotation.y = drift;
    g.visible = rise > 0.001 && leave < 0.999;

    // --- the lion's roar ripples the tiles (a travelling, decaying wave) -----------------------
    const rp = s.ripple;
    if (rp || tiles.userData.rippling) {
      const age = rp ? (performance.now() - rp.start) / 1000 : 99;
      tiles.userData.rippling = age < 2.5;
      const m = tmp.m;
      let i = 0;
      for (let f = 0; f < 8; f++) {
        for (let r = 0; r < 8; r++) {
          const [x, z] = squareToXZ(`${"abcdefgh"[f]}${r + 1}`, 1);
          const d = rp ? Math.hypot(x - rp.x, z - rp.z) : 0;
          const y =
            age < 2.5 && rp
              ? Math.sin(d * 1.6 - age * 9) * 0.28 * Math.exp(-age * 1.4) * (d < age * 6 ? 1 : 0)
              : 0;
          m.makeTranslation(x, y, z);
          tiles.setMatrixAt(i++, m);
        }
      }
      tiles.instanceMatrix.needsUpdate = true;
    }

    // --- camera (the Director owns it during a cinematic) ---------------------------------
    if (!cin) {
      const cam = camera as THREE.PerspectiveCamera;
      const b = s.scroll.board;
      // narrower than 16:10 → back off so the whole board stays in frame
      const back = Math.max(1, 1.55 / Math.max(0.4, size.width / size.height));
      cam.position.set(
        POSES.board.pos[0] + s.pointer.x * 0.25,
        tmp.look.y + (POSES.board.pos[1] - b * 0.6 - tmp.look.y) * back,
        tmp.look.z + (POSES.board.pos[2] - b * 1.2 - tmp.look.z) * back,
      );
      cam.lookAt(tmp.look);
      if (cam.fov !== POSES.board.fov) {
        cam.fov = POSES.board.fov;
        cam.updateProjectionMatrix();
      }
    }

    // --- heroes: hover lift + glow; the chosen piece awakens, then is gone after the shatter ---
    for (const id of HERO_IDS) {
      const mesh = heroMesh.current[id];
      if (!mesh) continue;
      const mat = mats.heroes[id];
      const hovered = s.hover === id && !cin;
      let glow = hovered ? 1 : 0.15;
      let lift = hovered ? 0.2 : 0;
      mesh.visible = true;
      mesh.position.x = mesh.userData.x;
      if (cin && cin.id === id) {
        const shatter = beatStart(cin.spec, "shatter");
        const awaken = clamp01(cin.t / Math.max(shatter, 0.001));
        glow = 1 + awaken * 2.5;
        lift = 0.25 * awaken;
        if (!s.reduced) mesh.position.x = mesh.userData.x + Math.sin(t * 90) * 0.015 * awaken; // trembling
        if (cin.t >= shatter && !s.cinematic?.reduced) mesh.visible = false;
        if (s.cinematic?.reduced && cin.t > 0.5) mesh.visible = false;
      }
      mat.uniforms.uGlow.value += (glow - mat.uniforms.uGlow.value) * 0.15;
      mesh.position.y += (TILE_TOP + lift - mesh.position.y) * 0.18;

      // project the top of the piece for the DOM label
      tmp.v.set(mesh.userData.x, TILE_TOP + mesh.userData.h * mesh.scale.y + 0.18, mesh.userData.z);
      g.localToWorld(tmp.v);
      tmp.v.project(camera);
      world.get().heroScreen[id] = {
        x: ((tmp.v.x + 1) / 2) * size.width,
        y: ((1 - tmp.v.y) / 2) * size.height,
        visible: g.visible && !cin && tmp.v.z < 1 && rise > 0.95 && leave < 0.2,
      };
    }
  });

  return (
    <group ref={group}>
      <primitive object={tiles} />
      {/* carved frame: an ink slab with a paper inlay border */}
      <mesh position={[0, -0.24, 0]} material={mats.frame}>
        <boxGeometry args={[9.1, 0.38, 9.1]} />
      </mesh>
      <mesh position={[0, -0.5, 0]} material={mats.frame}>
        <boxGeometry args={[8.5, 0.2, 8.5]} />
      </mesh>
      {[
        [0, 4.27, 8.62, 0.06],
        [0, -4.27, 8.62, 0.06],
        [4.27, 0, 0.06, 8.62],
        [-4.27, 0, 0.06, 8.62],
      ].map(([x, z, w, d], i) => (
        <mesh key={i} position={[x, -0.035, z]} material={mats.trim}>
          <boxGeometry args={[w, 0.03, d]} />
        </mesh>
      ))}
      {layout.map((p) => {
        const [x, z] = squareToXZ(p.square, 1);
        const knightTurn =
          p.type === "knight"
            ? p.color === "w"
              ? -0.55
              : Math.PI + 0.55
            : p.color === "b"
              ? Math.PI
              : 0;
        const scale = p.hero ? 1.12 : 1;
        return (
          <mesh
            key={p.square}
            ref={(m) => {
              if (m && p.hero) heroMesh.current[p.hero] = m;
            }}
            geometry={pieceGeometry(p.type)}
            material={p.hero ? mats.heroes[p.hero] : p.color === "w" ? mats.white : mats.black}
            position={[x, TILE_TOP, z]}
            rotation={[0, knightTurn, 0]}
            scale={scale}
            userData={{ x, z, h: pieceHeight(p.type) }}
          />
        );
      })}
    </group>
  );
}
