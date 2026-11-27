/**
 * Chapter 00, the opening (DECISIONS V4): a wall of real leaves at a frog's eye height → a blue
 * poison-dart frog hops onto a leaf and the lens racks focus onto it → the camera pushes through,
 * the stems bend aside → the giant kapok (Ceiba pentandra) stands in the haze with the title.
 *
 * Everything is real-scale (metres). Assets: Poly Haven (CC0) plants, ground and HDRI; the frog
 * and the kapok from Sketchfab (CC-BY, credited in CREDITS.md).
 */
import * as THREE from "three";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  clamp01,
  hop,
  impulseResponse,
  lerp,
  rng,
  Spring3,
  stepLeaf,
  win,
  type Leaf,
  type Vec3,
} from "./physics";
import { makeBendable, windStrength, windTime, type Bendable } from "./wind";
import type { Lens } from "./optics";
import { patchGroundMist, skyDome } from "./atmosphere";

export type Tier = "high" | "lite";
export type Load = {
  gltf: (url: string) => Promise<GLTF>;
  texture: (url: string, srgb?: boolean) => Promise<THREE.Texture>;
  hdr: (url: string) => Promise<THREE.Texture>;
};

export type FrameInfo = {
  /** Screen position (0..1) of the frog and of the tree, for DOM labels. */
  frog: { x: number; y: number; visible: boolean };
  tree: { x: number; y: number; visible: boolean };
  /** The kapok loads after the opening starts. */
  treeLoaded: boolean;
};

const BASE = "/3d/forest/";
/** Ease in and out with zero acceleration at both ends (smootherstep): a camera move with no jolt. */
const smoothEase = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const UP = new THREE.Vector3(0, 1, 0);

/** Pull each variant out of a Poly Haven collection file, re-centred on its own footprint. */
function variants(g: GLTF): THREE.Object3D[] {
  const root = g.scene;
  root.updateMatrixWorld(true);
  // Copy first: adding a node to its holder removes it from root.children.
  return [...root.children].map((node) => {
    const box = new THREE.Box3().setFromObject(node);
    const c = box.getCenter(new THREE.Vector3());
    const holder = new THREE.Group();
    holder.name = node.name;
    node.position.x -= c.x;
    node.position.z -= c.z;
    node.position.y -= box.min.y;
    holder.add(node);
    holder.userData.height = box.max.y - box.min.y;
    holder.userData.width = Math.max(box.max.x - box.min.x, box.max.z - box.min.z);
    return holder;
  });
}

function prepPlant(o: THREE.Object3D) {
  o.traverse((m) => {
    const mesh = m as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const mat = mesh.material as THREE.MeshStandardMaterial;
    if (mat.map) {
      mat.alphaTest = Math.max(mat.alphaTest, 0.45);
      mat.transparent = false;
      mat.side = THREE.DoubleSide;
      // Thin leaves let light through: a little of the leaf's own colour glows (a cheap stand-in for transmission).
      mat.emissive = new THREE.Color(0x2a4a12);
      mat.emissiveMap = mat.map;
      mat.emissiveIntensity = 0.35;
    }
    mat.envMapIntensity = 0.8;
  });
}

function cloneDeep(o: THREE.Object3D) {
  const c = o.clone(true);
  c.userData = { ...o.userData };
  return c;
}

/** Soft shafts of sunlight between the trees: additive, fade at both ends, flicker as the canopy moves. */
function lightShaft(length: number, width: number) {
  const geo = new THREE.PlaneGeometry(width, length, 1, 1);
  geo.translate(0, -length / 2, 0);
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: { uTime: windTime, uSeed: { value: Math.random() * 10 }, uOpacity: { value: 0.16 } },
    vertexShader: `varying vec2 vUv; varying float vFade; void main(){ vUv = uv;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vFade = smoothstep(0.5, 6.0, -mv.z); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uTime; uniform float uSeed; uniform float uOpacity; varying vec2 vUv; varying float vFade;
      void main(){ float across = exp(-pow((vUv.x - 0.5) * 3.2, 2.0));
        float along = smoothstep(0.0, 0.35, vUv.y) * smoothstep(1.0, 0.75, vUv.y);
        float flick = 0.75 + 0.25 * sin(uTime * 0.7 + uSeed) * sin(uTime * 1.3 + uSeed * 2.0);
        gl_FragColor = vec4(vec3(1.0, 0.93, 0.72) * across * along * flick * uOpacity * vFade, 1.0); }`,
  });
  return new THREE.Mesh(geo, mat);
}

/** A procedural leaf (blade with a midrib) for the falling-leaf physics. */
function leafGeometry() {
  const s = new THREE.Shape();
  s.moveTo(0, -0.5);
  s.bezierCurveTo(0.32, -0.25, 0.3, 0.25, 0, 0.5);
  s.bezierCurveTo(-0.3, 0.25, -0.32, -0.25, 0, -0.5);
  const g = new THREE.ShapeGeometry(s, 8);
  // A slight curl so the leaf catches light like a real one.
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) p.setZ(i, -0.18 * p.getX(i) * p.getX(i) * 4);
  g.computeVertexNormals();
  return g;
}

export async function buildOpening(
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  load: Load,
  tier: Tier,
  debugView: string | null = null,
) {
  const rand = rng(2026);
  const lite = tier === "lite";
  patchGroundMist(2.6, 30, 0.8);

  // ── Light and air ──────────────────────────────────────────────────────────────
  const [env, bg, frogG, anthG, calG, fernG, pachG, floorD, floorN, floorR, mossG] =
    await Promise.all([
      load.hdr(BASE + "rainforest_trail_1k.hdr"),
      load.texture(
        BASE + (lite ? "rainforest_trail_bg_2k.webp" : "rainforest_trail_bg_4k.webp"),
        true,
      ),
      load.gltf(BASE + "blue_dart_frog.glb"),
      load.gltf(BASE + "anthurium_botany_01.glb"),
      load.gltf(BASE + "calathea_orbifolia_01.glb"),
      load.gltf(BASE + "fern_02.glb"),
      load.gltf(BASE + "pachira_aquatica_01.glb"),
      load.texture(BASE + "floor_leaves_diff.webp", true),
      load.texture(BASE + "floor_leaves_nor.webp"),
      load.texture(BASE + "floor_leaves_rough.webp"),
      load.gltf(BASE + "moss_01.glb"),
    ]);
  const mistColor = new THREE.Color(0x98ab95);
  scene.add(skyDome(bg, mistColor, 1.9, 0.72));
  scene.environment = env;
  scene.environmentIntensity = 0.75;
  scene.environmentRotation.set(0, 1.9, 0);
  // Aerial perspective: distant things take on the colour of the humid air.
  scene.fog = new THREE.FogExp2(mistColor, 0.0042);

  const sunDir = new THREE.Vector3(0.55, 0.75, -0.35).normalize();
  const sun = new THREE.DirectionalLight(0xfff1d6, 3.2);
  sun.position.copy(sunDir).multiplyScalar(12);
  sun.target.position.set(0, 0, -1);
  sun.castShadow = true;
  sun.shadow.mapSize.set(lite ? 1024 : 2048, lite ? 1024 : 2048);
  Object.assign(sun.shadow.camera, {
    left: -2.5,
    right: 2.5,
    top: 2.5,
    bottom: -2.5,
    near: 1,
    far: 30,
  });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  sun.shadow.radius = 4;
  scene.add(sun, sun.target);
  const sky = new THREE.HemisphereLight(0xcfe6ff, 0x2b3a1c, 0.55);
  scene.add(sky);

  // ── Ground: real leaf litter ───────────────────────────────────────────────────
  for (const t of [floorD, floorN, floorR]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(250, 250);
    t.anisotropy = 8;
  }
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(500, 500),
    new THREE.MeshStandardMaterial({
      map: floorD,
      normalMap: floorN,
      roughnessMap: floorR,
      color: 0x8c8574,
    }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // ── Plants ─────────────────────────────────────────────────────────────────────
  const pach = variants(pachG);
  const pool = {
    anth: variants(anthG),
    cal: variants(calG),
    fern: variants(fernG),
    pachLeaves: pach.filter((v) => v.name.includes("leaves")),
    pachBark: pach.filter((v) => v.name.includes("bark")),
  };
  for (const list of Object.values(pool)) list.forEach(prepPlant);
  /** A pachira is two nodes in the file (bark + leaves); put matching ones back together. */
  const pachira = (i: number) => {
    const g = new THREE.Group();
    g.add(cloneDeep(pool.pachBark[i]), cloneDeep(pool.pachLeaves[i]));
    g.userData.height = pool.pachLeaves[i].userData.height;
    return g;
  };

  type Plant = Bendable & { spring: Spring3; base: THREE.Vector3; push: number };
  const plants: Plant[] = [];
  const place = (
    o: THREE.Object3D,
    x: number,
    z: number,
    scale: number,
    yaw: number,
    push = 1,
    sway = 1,
  ) => {
    o.position.set(x, 0, z);
    o.scale.setScalar(scale);
    o.rotation.y = yaw;
    scene.add(o);
    const height = (o.userData.height ?? 0.5) * scale;
    const b = makeBendable(o, o.userData.height ?? 0.5, sway);
    const p: Plant = {
      ...b,
      height,
      spring: new Spring3(32, 4.2),
      base: new THREE.Vector3(x, 0, z),
      push,
    };
    plants.push(p);
    return p;
  };

  // The leaf the frog takes off from, and the one it lands on (DECISIONS V4).
  // Both are Calathea orbifolia: broad, round, stiff leaves about 30 cm across that hold a 4 cm frog.
  const takeoff = place(cloneDeep(pool.cal[1]), -0.36, -0.95, 1.35, 0.4, 1, 0.5);
  const landing = place(cloneDeep(pool.cal[0]), 0.05, -0.6, 1.3, -0.5, 1, 0.5);

  // The foreground wall: either side of a clear path for the camera, so the leaves frame the view,
  // slide past with parallax as the camera moves, and bend away where they brush it.
  place(pachira(2), -0.62, 0.3, 0.9, 0.7);
  place(pachira(3), 0.58, 0.32, 0.62, 2.1);
  place(cloneDeep(pool.anth[0]), -0.52, 0.56, 1.0, 1.2);
  place(cloneDeep(pool.anth[2]), 0.4, 0.5, 1.2, -0.4);
  place(cloneDeep(pool.fern[0]), -0.5, -0.18, 0.9, 0.2);
  place(cloneDeep(pool.cal[2]), 0.48, -0.12, 1.5, 2.4);
  place(cloneDeep(pool.fern[1]), 0.5, -0.95, 1.1, 1.7);
  place(cloneDeep(pool.anth[3]), -0.6, -0.55, 1.4, 0.1);
  place(cloneDeep(pool.anth[1]), 0.62, -1.6, 1.6, 0.9);
  place(cloneDeep(pool.anth[4]), -0.7, -1.4, 2.2, 2.2);

  // Ground cover: hundreds of small plants and moss cushions, instanced (one draw call per mesh).
  {
    const small = [
      ...pool.anth.slice(3),
      ...pool.cal.slice(3),
      ...pool.fern.slice(2),
      ...variants(mossG),
    ];
    small.forEach(prepPlant);
    const count = lite ? 160 : 420;
    const mats: THREE.Matrix4[][] = small.map(() => []);
    const q = new THREE.Quaternion();
    const v = new THREE.Vector3();
    const sc = new THREE.Vector3();
    const far = lite ? 500 : 1400;
    for (let i = 0; i < count + far; i++) {
      const isFar = i >= count;
      // Near: the macro set. Far: the regrowth that fills a light gap, out to the giants.
      const x = isFar ? (rand() * 2 - 1) * (12 + rand() * 80) : (rand() * 2 - 1) * 4.5;
      const z = isFar ? -8 - Math.pow(rand(), 0.8) * 140 : 0.95 - Math.pow(rand(), 1.2) * 9;
      // Not under the frog's two perches.
      if (Math.hypot(x - takeoff.base.x, z - takeoff.base.z) < 0.22) continue;
      if (Math.hypot(x - landing.base.x, z - landing.base.z) < 0.22) continue;
      const k = Math.floor(rand() * small.length);
      const isMoss = small[k].name.includes("moss");
      q.setFromAxisAngle(UP, rand() * Math.PI * 2);
      sc.setScalar(isMoss ? 1.5 + rand() * 3 : isFar ? 2 + rand() * 4 : 0.8 + rand() * 1.1);
      mats[k].push(new THREE.Matrix4().compose(v.set(x, 0, z), q, sc));
    }
    small.forEach((src, k) => {
      if (!mats[k].length) return;
      src.updateMatrixWorld(true);
      src.traverse((m) => {
        const mesh = m as THREE.Mesh;
        if (!mesh.isMesh) return;
        const inst = new THREE.InstancedMesh(mesh.geometry, mesh.material, mats[k].length);
        const local = mesh.matrixWorld;
        mats[k].forEach((mt, i) =>
          inst.setMatrixAt(i, new THREE.Matrix4().multiplyMatrices(mt, local)),
        );
        inst.castShadow = false;
        inst.receiveShadow = true;
        inst.computeBoundingSphere();
        scene.add(inst);
      });
    });
  }

  // A treefall gap (a real feature of rainforests: a fallen giant lets the light in) between the
  // spot where the camera stands up and the kapok, so nothing tall hides the giant.
  const STAND = new THREE.Vector2(0.04, -3.4);
  const GIANT = new THREE.Vector2(3.5, -92);
  const axis = GIANT.clone().sub(STAND).normalize();
  const inGap = (x: number, z: number) => {
    const d = new THREE.Vector2(x, z).sub(STAND);
    const len = d.length();
    if (len < 1.2) return false;
    return d.normalize().dot(axis) > Math.cos(THREE.MathUtils.degToRad(30));
  };

  // The forest beyond: seeded scatter, denser near the path, bigger individuals further away.
  const scatter = lite ? 55 : 120;
  const all = [...pool.anth, ...pool.cal, ...pool.fern];
  for (let i = 0; i < scatter; i++) {
    const z = -1.1 - Math.pow(rand(), 1.4) * 16;
    const spread = 0.5 + Math.abs(z) * 0.75;
    const x = (rand() * 2 - 1) * spread;
    // Keep the camera's path clear, and the view to the giant tree open in the middle distance.
    if (z > -4 && Math.abs(x) < 0.75) continue;
    if (z < -3 && Math.abs(x) < 0.8 + Math.abs(z) * 0.08) continue;
    // Shrubs only, at the sizes they really grow to (no shrub stretched into a tree).
    const shrub = rand() < 0.2;
    const o = shrub
      ? pachira(Math.floor(rand() * 4))
      : cloneDeep(all[Math.floor(rand() * all.length)]);
    const s = shrub ? 0.8 + rand() * 0.7 : 1 + rand() * 1.4 + Math.abs(z) * 0.05;
    place(o, x, z, s, rand() * Math.PI * 2, 0.6);
  }
  // ── The frog ───────────────────────────────────────────────────────────────────
  const frog = new THREE.Group();
  const frogModel = frogG.scene;
  frogModel.traverse((m) => {
    const mesh = m as THREE.Mesh;
    if (mesh.isMesh) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      // Wet, glossy skin.
      mat.roughness = Math.min(mat.roughness ?? 0.5, 0.32);
      mat.envMapIntensity = 1.3;
    }
  });
  {
    const b = new THREE.Box3().setFromObject(frogModel);
    const size = b.getSize(new THREE.Vector3());
    const c = b.getCenter(new THREE.Vector3());
    frogModel.position.set(-c.x, -b.min.y, -c.z);
    // Dendrobates tinctorius "azureus": adults are about 4 cm long. The model faces −X.
    const holder = new THREE.Group();
    holder.add(frogModel);
    holder.scale.setScalar(0.042 / size.x);
    holder.rotation.y = Math.PI; // face +X, then the group's yaw aims the hop
    frog.add(holder);
  }
  scene.add(frog);

  // Find real perches by dropping a ray onto the leaves.
  const ray = new THREE.Raycaster();
  scene.updateMatrixWorld(true);
  type Perch = { point: THREE.Vector3; normal: THREE.Vector3 };
  const down = new THREE.Vector3(0, -1, 0);
  const castAt = (plant: Plant, x: number, z: number) => {
    ray.set(new THREE.Vector3(x, 3, z), down);
    return ray.intersectObject(plant.object, true)[0] ?? null;
  };
  /**
   * A perch a frog would really sit on: a leaf surface that is nearly level and has leaf all
   * around the spot (so the frog is fully supported), as high as possible on the plant.
   */
  const perch = (plant: Plant, offsets: [number, number][]): Perch => {
    let best: (Perch & { score: number }) | null = null;
    for (const [dx, dz] of offsets) {
      const x = plant.base.x + dx;
      const z = plant.base.z + dz;
      const hit = castAt(plant, x, z);
      if (!hit || !hit.face || hit.point.y < 0.12) continue;
      const n = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
      if (n.y < 0) n.negate();
      if (n.y < 0.8) continue; // too steep to sit on
      // Support: the leaf must continue for ~3 cm on every side at about the same height.
      let support = 0;
      for (const [ox, oz] of [
        [0.03, 0],
        [-0.03, 0],
        [0, 0.03],
        [0, -0.03],
        [0.02, 0.02],
        [-0.02, -0.02],
        [0.02, -0.02],
        [-0.02, 0.02],
      ]) {
        const h2 = castAt(plant, x + ox, z + oz);
        if (h2 && Math.abs(h2.point.y - hit.point.y) < 0.012) support++;
      }
      if (support < 7) continue;
      const score = support + n.y * 2 + hit.point.y * 4;
      if (!best || score > best.score) best = { point: hit.point.clone(), normal: n, score };
    }
    return (
      best ?? {
        point: new THREE.Vector3(plant.base.x, plant.height * 0.6, plant.base.z),
        normal: UP.clone(),
      }
    );
  };
  const grid = (r: number): [number, number][] => {
    const out: [number, number][] = [];
    for (let i = -6; i <= 6; i++)
      for (let j = -6; j <= 6; j++) out.push([(i / 6) * r, (j / 6) * r]);
    return out;
  };
  const fromP = perch(takeoff, grid(0.2));
  const toP = perch(landing, grid(0.2));
  const from = fromP.point;
  const to = toP.point;
  // Contact shadows: where the frog's body presses on the leaf, almost no light gets under it.
  const contactTex = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d")!;
    const grd = g.createRadialGradient(32, 32, 2, 32, 32, 32);
    grd.addColorStop(0, "rgba(0,0,0,0.85)");
    grd.addColorStop(0.45, "rgba(0,0,0,0.45)");
    grd.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();
  const contact = (pp: Perch) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(0.05, 0.034),
      new THREE.MeshBasicMaterial({
        map: contactTex,
        transparent: true,
        depthWrite: false,
        opacity: 0,
        fog: false,
      }),
    );
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), pp.normal);
    m.position.copy(pp.point).addScaledVector(pp.normal, 0.0015);
    m.renderOrder = 2;
    scene.add(m);
    return m.material as THREE.MeshBasicMaterial;
  };
  const shadowFrom = contact(fromP);
  const shadowTo = contact(toP);

  const T = 0.34; // seconds in the air: a 4 cm frog's ~0.4 m leap
  const leap = hop(from.toArray() as Vec3, to.toArray() as Vec3, T);
  const heading = Math.atan2(-(to.z - from.z), to.x - from.x);

  // ── Light shafts and dust ──────────────────────────────────────────────────────
  const shafts = new THREE.Group();
  const shaftSpots: [number, number, number, number][] = [
    [-1.6, -4, 7, 0.9],
    [1.2, -7, 9, 1.4],
    [-3.5, -11, 12, 2.2],
    [3.8, -15, 14, 2.6],
    [0.6, -24, 22, 4.5],
    [-6, -30, 26, 5],
  ];
  for (const [x, z, len, w] of shaftSpots) {
    const s = lightShaft(len, w);
    s.position.set(x, len * 0.95, z);
    // Point down along the sun's rays.
    s.quaternion.setFromUnitVectors(UP, sunDir);
    s.rotateY(rand() * Math.PI);
    shafts.add(s);
  }
  scene.add(shafts);

  const moteCount = lite ? 300 : 900;
  const moteGeo = new THREE.BufferGeometry();
  const motePos = new Float32Array(moteCount * 3);
  const moteVel = new Float32Array(moteCount * 3);
  for (let i = 0; i < moteCount; i++) {
    motePos[i * 3] = (rand() * 2 - 1) * 1.2;
    motePos[i * 3 + 1] = 0.05 + rand() * 1.4;
    motePos[i * 3 + 2] = -rand() * 2.4 + 0.3;
  }
  moteGeo.setAttribute("position", new THREE.BufferAttribute(motePos, 3));
  const motes = new THREE.Points(
    moteGeo,
    new THREE.PointsMaterial({
      size: 0.0016,
      color: 0xfff3d0,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    }),
  );
  scene.add(motes);

  // ── Falling leaves (physics.ts: gravity, drag, glide) ──────────────────────────
  const leafCount = lite ? 24 : 60;
  const leafMesh = new THREE.InstancedMesh(
    leafGeometry(),
    new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.7, vertexColors: false }),
    leafCount,
  );
  leafMesh.castShadow = true;
  const leaves: (Leaf & { size: number; rest: number })[] = [];
  const leafColor = new THREE.Color();
  const spawnLeaf = (l: (typeof leaves)[number] | null, initial: boolean) => {
    const leaf = l ?? ({} as (typeof leaves)[number]);
    leaf.p = [(rand() * 2 - 1) * 5, initial ? rand() * 14 : 12 + rand() * 10, -rand() * 14 + 0.5];
    leaf.v = [0, -0.5, 0];
    leaf.phase = rand() * 6.28;
    leaf.freq = 0.6 + rand() * 0.8;
    leaf.glide = 0.25 + rand() * 0.45;
    leaf.heading = rand() * 6.28;
    leaf.vt = 0.7 + rand() * 0.6;
    leaf.spin = (rand() * 2 - 1) * 1.5;
    leaf.size = 0.05 + rand() * 0.09;
    leaf.rest = 0;
    return leaf;
  };
  for (let i = 0; i < leafCount; i++) {
    leaves.push(spawnLeaf(null, true));
    // Greens, yellows and the browns of old leaves.
    leafColor.setHSL(0.08 + rand() * 0.18, 0.45 + rand() * 0.3, 0.22 + rand() * 0.2);
    leafMesh.setColorAt(i, leafColor);
  }
  scene.add(leafMesh);

  // ── The trees: loaded after the first frame so the opening starts fast ─────────
  // A kapok (Ceiba pentandra) is the giant; around the gap stand different species at their real
  // sizes (mango, a gnarled old tree, tall slender jungle trees, palms), with vines and fallen
  // mossy branches. Each tree gets its own size and turn, so no two look alike.
  const tree = new THREE.Group();
  const treeSpot = new THREE.Vector3(3.5, 0, -92);
  tree.position.copy(treeSpot);
  scene.add(tree);

  const prepTree = (o: THREE.Object3D) => {
    o.traverse((m) => {
      const mesh = m as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = false;
      mesh.receiveShadow = true;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (mat.alphaTest > 0 || mat.transparent) {
        // Keep each model's own alpha cutoff: a higher one strips most of the leaves.
        if (mat.transparent) mat.alphaTest = 0.3;
        mat.transparent = false;
        mat.side = THREE.DoubleSide;
      }
      mat.envMapIntensity = 0.8;
    });
    return o;
  };
  /** Stand a model on the ground at the origin, scaled to a height in metres; sway in the wind. */
  /** sink: how deep the roots go below the soil, as a fraction of the height (spread roots must not stand on their tips). */
  const standUp = (src: THREE.Object3D, sway: number, sink = 0.01) => {
    const b = new THREE.Box3().setFromObject(src);
    const c = b.getCenter(new THREE.Vector3());
    src.position.set(-c.x, -b.min.y - sink * (b.max.y - b.min.y), -c.z);
    const unit = new THREE.Group();
    unit.add(src);
    const h = b.max.y - b.min.y;
    makeBendable(unit, h, sway);
    return { unit, h };
  };
  const plantTree = (
    t: { unit: THREE.Object3D; h: number },
    x: number,
    z: number,
    height: number,
    yaw: number,
  ) => {
    const holder = new THREE.Group();
    holder.add(t.unit.clone(true));
    holder.position.set(x, 0, z);
    holder.scale.setScalar(height / t.h);
    holder.rotation.y = yaw;
    scene.add(holder);
    return holder;
  };

  const want = lite
    ? ([
        "kapok_ceiba_lite",
        "fig_tree",
        "mango_tree",
        "palm_tree",
        "ivy_vine",
        "mossy_branch",
      ] as const)
    : ([
        "kapok_ceiba",
        "fig_tree",
        "mahogany_tree",
        "mango_tree",
        "old_tree",
        "jungle_tree",
        "palm_tree",
        "ivy_vine",
        "mossy_branch",
      ] as const);
  const loaded = new Map<string, THREE.Object3D>();
  Promise.allSettled(
    want.map((name) =>
      load.gltf(`${BASE}${name}.glb`).then((g) => {
        loaded.set(name, prepTree(g.scene));
      }),
    ),
  ).then((results) => {
    results.forEach(
      (r) => r.status === "rejected" && console.warn("tree failed to load", r.reason),
    );
    const get = (name: string, sway: number, sink?: number) => {
      const o = loaded.get(name);
      return o ? standUp(o, sway, sink) : null;
    };
    const species = {
      kapok: get(lite ? "kapok_ceiba_lite" : "kapok_ceiba", 0.15, 0.012),
      fig: get("fig_tree", 0.2, 0.02),
      mahogany: get("mahogany_tree", 0.3, 0.015),
      mango: get("mango_tree", 0.35, 0.02),
      // Its roots spread above ground like legs; set them into the soil.
      old: get("old_tree", 0.3, 0.075),
      jungle: get("jungle_tree", 0.25, 0.01),
      palm: get("palm_tree", 0.4, 0.01),
    };

    // The giant, 62 m (kapoks are the emergent giants of the Amazon).
    if (species.kapok) {
      const k = plantTree(species.kapok, 0, 0, 62, 0);
      tree.add(k);
      k.position.set(0, 0, 0);
    }
    // More giants behind it, each a different species (only one kapok, so no two look alike),
    // full crowns, each layer fainter in the humid air.
    type Kind = "fig" | "mahogany" | "jungle";
    const giants: [number, number, number, number, Kind][] = lite
      ? [
          [-60, -170, 40, 2.1, "fig"],
          [70, -200, 44, 4.2, "fig"],
          [-10, -260, 46, 1.0, "fig"],
        ]
      : [
          [-48, -160, 42, 2.1, "mahogany"],
          [62, -190, 46, 4.2, "jungle"],
          [-115, -125, 38, 0.6, "fig"],
          [118, -135, 44, 5.1, "mahogany"],
          [-22, -245, 48, 1.0, "fig"],
          [38, -290, 50, 3.3, "jungle"],
          [-165, -215, 46, 2.7, "mahogany"],
          [170, -250, 42, 0.2, "fig"],
        ];
    for (const [x, z, h, yaw, kind] of giants) {
      const sp = species[kind] ?? species.fig ?? species.jungle;
      if (sp) plantTree(sp, x, z, h, yaw);
    }

    // The trees around the gap: a seeded mix of species, never two in the same spot.
    const mix: {
      sp: (typeof species)[keyof typeof species];
      min: number;
      max: number;
      w: number;
      near: number;
    }[] = [
      // near: how close to the camera a species may stand and still look real (mango leaves are cards).
      { sp: species.fig, min: 12, max: 22, w: 3, near: 14 },
      { sp: species.mahogany, min: 14, max: 26, w: 3, near: 16 },
      { sp: species.mango, min: 7, max: 12, w: 2, near: 25 },
      { sp: species.old, min: 9, max: 15, w: 2, near: 9 },
      { sp: species.jungle, min: 18, max: 30, w: 3, near: 9 },
      { sp: species.palm, min: 12, max: 22, w: 1, near: 9 },
    ].filter((m) => m.sp);
    const wsum = mix.reduce((a, m) => a + m.w, 0);
    const spots: { x: number; z: number; h: number; o: THREE.Object3D; climbable: boolean }[] = [];
    const n = lite ? 22 : 56;
    for (let i = 0, tries = 0; i < n && tries < n * 20; tries++) {
      const ang = rand() * Math.PI * 2;
      const r = 6 + Math.pow(rand(), 0.7) * 70;
      const x = Math.sin(ang) * r * 1.3;
      const z = -38 + Math.cos(ang) * r;
      if (z > -4.5 || inGap(x, z)) continue;
      // Not right beside the camera: a tree seen from a metre away shows its leaf cards.
      if (Math.hypot(x - STAND.x, z - STAND.y) < 9) continue;
      if (spots.some((t) => Math.hypot(t.x - x, t.z - z) < 5)) continue;
      let pick = rand() * wsum;
      const m = mix.find((mm) => (pick -= mm.w) < 0) ?? mix[0];
      if (Math.hypot(x - STAND.x, z - STAND.y) < m.near) continue;
      const h = m.min + rand() * (m.max - m.min);
      const o = plantTree(m.sp!, x, z, h, rand() * Math.PI * 2);
      spots.push({ x, z, h, o, climbable: m.sp !== species.palm });
      i++;
    }

    // Every trunk stands in its own undergrowth: ferns and broad leaves crowd its base, as in a real forest.
    {
      const cover = [
        ...pool.fern.slice(0, 2),
        pool.anth[0],
        pool.anth[2],
        pool.cal[0],
        pool.cal[1],
      ];
      const mats: THREE.Matrix4[][] = cover.map(() => []);
      const q = new THREE.Quaternion();
      const v = new THREE.Vector3();
      const sc = new THREE.Vector3();
      for (const t of spots) {
        const n = 5 + Math.floor(rand() * 4);
        const r0 = 0.6 + t.h * 0.03;
        for (let j = 0; j < n; j++) {
          const a2 = rand() * Math.PI * 2;
          const r = r0 * (0.4 + rand() * 0.9);
          q.setFromAxisAngle(UP, rand() * Math.PI * 2);
          sc.setScalar(2 + rand() * 2.5);
          const k = Math.floor(rand() * cover.length);
          mats[k].push(
            new THREE.Matrix4().compose(
              v.set(t.x + Math.cos(a2) * r, 0, t.z + Math.sin(a2) * r),
              q,
              sc,
            ),
          );
        }
      }
      cover.forEach((src, k) => {
        if (!mats[k].length) return;
        src.updateMatrixWorld(true);
        src.traverse((m) => {
          const mesh = m as THREE.Mesh;
          if (!mesh.isMesh) return;
          const inst = new THREE.InstancedMesh(mesh.geometry, mesh.material, mats[k].length);
          mats[k].forEach((mt, i) =>
            inst.setMatrixAt(i, new THREE.Matrix4().multiplyMatrices(mt, mesh.matrixWorld)),
          );
          inst.receiveShadow = true;
          inst.computeBoundingSphere();
          scene.add(inst);
        });
      });
    }

    // Vines: ivy hanging from the branches of the nearer trees, a few strands each.
    const ivy = loaded.get("ivy_vine");
    if (ivy) {
      const strand = standUp(ivy, 1.2);
      const near = spots
        .filter((t) => t.climbable)
        .sort((a, b) => Math.hypot(a.x, a.z + 3) - Math.hypot(b.x, b.z + 3))
        .slice(0, lite ? 6 : 14);
      for (const t of near) {
        const strands = 2 + Math.floor(rand() * 3);
        for (let j = 0; j < strands; j++) {
          const len = 2 + rand() * 3; // 2–5 m long
          const a2 = rand() * Math.PI * 2;
          const reach = 0.6 + rand() * 1.6;
          const top = t.h * (0.45 + rand() * 0.25);
          const v = plantTree(
            strand,
            t.x + Math.cos(a2) * reach,
            t.z + Math.sin(a2) * reach,
            len,
            a2,
          );
          v.position.y = Math.max(0.2, top - len);
        }
      }
    }

    // Fallen mossy branches on the floor, small near the frog, big logs out in the gap.
    const branch = loaded.get("mossy_branch");
    if (branch) {
      const b = standUp(branch, 0);
      const count = lite ? 14 : 34;
      for (let i = 0; i < count; i++) {
        const isNear = i < count * 0.4;
        const x = isNear ? (rand() * 2 - 1) * 2.2 : (rand() * 2 - 1) * 30;
        const z = isNear ? 0.6 - rand() * 4 : -6 - rand() * 50;
        if (Math.hypot(x - takeoff.base.x, z - takeoff.base.z) < 0.35) continue;
        if (Math.hypot(x - landing.base.x, z - landing.base.z) < 0.35) continue;
        const len = isNear ? 0.4 + rand() * 0.8 : 1.5 + rand() * 4;
        const o = plantTree(b, x, z, (len / 0.62) * b.h, rand() * Math.PI * 2);
        o.rotation.z = (rand() - 0.5) * 0.08;
      }
    }
    info.treeLoaded = true;
  });

  // ── Camera choreography (p = 0..1 across the opening) ──────────────────────────
  const camPos = new THREE.Vector3();
  const camLook = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  const frogPos = new THREE.Vector3();
  const lens: Lens = { focus: 0.42, fNumber: 3.5 };
  const info: FrameInfo = {
    frog: { x: 0, y: 0, visible: false },
    tree: { x: 0, y: 0, visible: false },
    treeLoaded: false,
  };
  const project = (v: THREE.Vector3, out: { x: number; y: number; visible: boolean }) => {
    tmp.copy(v).project(camera);
    out.x = tmp.x * 0.5 + 0.5;
    out.y = 0.5 - tmp.y * 0.5;
    out.visible = tmp.z < 1 && tmp.z > -1 && Math.abs(tmp.x) < 1.1 && Math.abs(tmp.y) < 1.1;
  };

  const K = {
    // Frog's-eye height: a little above the leaves the frog sits on (~0.4 m), so it is never hidden.
    start: new THREE.Vector3(0.0, 0.43, 0.72),
    startLook: new THREE.Vector3(-0.08, 0.36, -0.7),
    near: new THREE.Vector3(0.04, 0.47, -0.16),
    // Straight ahead of the frog close-up, standing height.
    stand: new THREE.Vector3(0.04, 1.55, -3.4),
  };

  // The lens sits just above each perch, so the leaf never hides the frog.
  K.start.y = Math.max(0.43, from.y + 0.05);
  K.startLook.y = from.y;
  // Slightly from above (~18°), the way a macro photographer shoots a frog on a leaf.
  K.near.y = to.y + 0.13;
  /** Where the frog sits after landing, plus a little (what the close-up looks at). */
  const frogEnd = to.clone().add(new THREE.Vector3(0, 0.02, 0));
  const leafFrame = new THREE.Object3D();
  const qA = new THREE.Quaternion();
  const qYaw = new THREE.Quaternion();
  const qB = new THREE.Quaternion();
  const camPushPos = new THREE.Vector3();

  function update(p: number, dt: number, time: number): Lens {
    windTime.value = time;
    windStrength.value = 1;

    // Frog: idle on the take-off leaf, crouch, leap (closed-form parabola), land, settle.
    // Scroll → "physical" time, in slow motion: the leap itself is stretched over ~12% of the scroll.
    // Crouch (p .16–.2), the leap in slow motion (p .2–.3, about 1/30 speed), landing and settle (p .3–.37).
    const hopT =
      p < 0.2
        ? lerp(-0.35, 0, win(p, 0.16, 0.2))
        : p < 0.3
          ? lerp(0, T, (p - 0.2) / 0.1)
          : lerp(T, T + 0.9, Math.min(1, (p - 0.3) / 0.07));
    const pos = leap.at(hopT);
    frogPos.set(pos[0], pos[1], pos[2]);
    const flying = hopT > 0 && hopT < T;
    const v = leap.velocity(hopT);
    const pitch = flying ? Math.atan2(v[1], Math.hypot(v[0], v[2])) * 0.55 : 0;
    // Squash before take-off and on landing (the impulse rings down), stretch in the air.
    const crouch = hopT < 0 ? Math.sin(Math.min(1, (hopT + 0.35) / 0.35) * Math.PI) * 0.12 : 0;
    const land = hopT > T ? impulseResponse(hopT - T, 0.16, 3.2, 0.28) : 0;
    const stretch = flying ? 0.07 : 0;
    const breathe = Math.sin(time * 2 * Math.PI * 1.1) * 0.012;
    const landBend = hopT > T ? -impulseResponse(hopT - T, 0.022, 2.2, 0.16) : 0;
    shadowFrom.opacity = hopT <= 0 ? 0.75 : Math.max(0, 0.75 - hopT * 12);
    shadowTo.opacity = hopT >= T ? 0.75 : Math.max(0, 0.75 - (T - hopT) * 12);
    frog.position.copy(frogPos);
    if (hopT > T) frog.position.y += landBend;
    // On a leaf the frog sits square to its surface; in the air it pitches along its path.
    const surface = hopT <= 0 ? fromP.normal : hopT >= T ? toP.normal : null;
    qYaw.setFromAxisAngle(UP, heading);
    if (surface) frog.quaternion.setFromUnitVectors(UP, surface).multiply(qYaw);
    else frog.quaternion.copy(qYaw);
    frog.rotateZ(pitch);
    frog.scale.set(1 + stretch, 1 - crouch - land * 0.6 + breathe, 1);

    // Camera: macro on the leaves → follow the frog → push through → stand and look up at the giant.
    // 1) The macro approach to the frog (unchanged). 2) After the frog, one straight, steady move
    //    forward towards the giant: a single line, a single ease, a fixed heading; the only turn is a
    //    smooth tilt from looking down at the frog to looking up at the crown. No curves.
    const a = win(p, 0.0, 0.38);
    const go = smoothEase(clamp01((p - 0.5) / 0.4)); // 0.5 → 0.9
    camPos.copy(K.start).lerp(K.near, a);
    camPos.lerp(K.stand, go);
    // Handheld: a breath of movement, as a real camera operator would have.
    camPos.x += Math.sin(time * 0.6) * 0.004;
    camPos.y += Math.sin(time * 0.83 + 1) * 0.003;
    camera.position.copy(camPos);

    // Heading and tilt as two plain angles (so there is never any roll or sideways swing).
    const frogLook = tmp.copy(frogPos).add(new THREE.Vector3(0, 0.02, 0));
    camLook.copy(K.startLook).lerp(frogLook, win(p, 0.08, 0.3));
    // Once the move starts, the frog view is frozen as it was at the close-up (the camera then
    // passes over the frog, and a live "look at the frog" would swing round behind it).
    const refPos = p < 0.48 ? camPos : K.near;
    const refLook = p < 0.48 ? camLook : frogEnd;
    const dx = refLook.x - refPos.x;
    const dz = refLook.z - refPos.z;
    const frogYaw = Math.atan2(-dx, -dz);
    const frogPitch = Math.atan2(refLook.y - refPos.y, Math.hypot(dx, dz));
    const tdx = treeSpot.x - camPos.x;
    const tdz = treeSpot.z - camPos.z;
    const treeYaw = Math.atan2(-tdx, -tdz);
    const treePitch = Math.atan2(30 - camPos.y, Math.hypot(tdx, tdz));
    const turn = smoothEase(clamp01((p - 0.48) / 0.4));
    camera.rotation.set(lerp(frogPitch, treePitch, turn), lerp(frogYaw, treeYaw, turn), 0, "YXZ");
    // A longer lens for the frog, opening gently (with the same ease as the move) for the giant.
    camera.fov = lerp(lerp(34, 27, win(p, 0.22, 0.42)), 44, go);
    camera.updateProjectionMatrix();

    // Focus: foreground leaves → the frog → infinity → the giant. Aperture closes as we stand up.
    const dFrog = camera.position.distanceTo(frogPos);
    const dTree = camera.position.distanceTo(treeSpot) * 0.98;
    lens.focus = lerp(0.42, dFrog, win(p, 0.07, 0.2));
    lens.focus = lerp(lens.focus, dTree, win(p, 0.5, 0.7));
    lens.fNumber = lerp(3.5, 9, win(p, 0.5, 0.9));

    // Stems: pushed aside by the camera (and by the frog landing), springing back afterwards.
    camPushPos.copy(camera.position);
    for (const pl of plants) {
      const target: Vec3 = [0, 0, 0];
      if (pl.push > 0) {
        tmp.set(pl.base.x, Math.min(pl.height * 0.7, camPushPos.y), pl.base.z);
        const d = tmp.distanceTo(camPushPos);
        const R = 0.55 + pl.height * 0.3;
        if (d < R) {
          const away = tmp.sub(camPushPos).setY(0).normalize();
          const k = Math.pow(1 - d / R, 1.3) * 0.85 * pl.push;
          target[0] = away.x * k;
          target[2] = away.z * k;
        }
      }
      const x = pl.spring.step(target, dt);
      // World-space bend → the plant's local space (undo its yaw and scale).
      tmp.set(x[0], 0, x[2]);
      leafFrame.rotation.set(0, -pl.object.rotation.y, 0);
      tmp.applyEuler(leafFrame.rotation).divideScalar(pl.object.scale.x);
      if (pl === landing) tmp.y += landBend / pl.object.scale.x;
      pl.bend.value.copy(tmp);
    }

    // Dust: Brownian drift and a slow settle (Stokes drag on micron-sized particles).
    const pos3 = moteGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < moteCount; i++) {
      const j = i * 3;
      moteVel[j] += (rand() - 0.5) * 0.004 - moteVel[j] * 0.05;
      moteVel[j + 1] += (rand() - 0.5) * 0.004 - moteVel[j + 1] * 0.05 - 0.00002;
      moteVel[j + 2] += (rand() - 0.5) * 0.004 - moteVel[j + 2] * 0.05;
      motePos[j] += moteVel[j] * dt;
      motePos[j + 1] += moteVel[j + 1] * dt;
      motePos[j + 2] += moteVel[j + 2] * dt;
      if (motePos[j + 1] < 0.02) motePos[j + 1] = 1.4;
      if (motePos[j + 1] > 1.5) motePos[j + 1] = 0.05;
    }
    pos3.needsUpdate = true;

    // Falling leaves, with the same gusts the plants feel.
    const gust = Math.sin(time * 0.9) * 0.25 + Math.sin(time * 0.37) * 0.15;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const sc = new THREE.Vector3();
    for (let i = 0; i < leafCount; i++) {
      const l = leaves[i];
      if (l.p[1] > 0.004) {
        stepLeaf(l, dt, [gust, 0, gust * 0.4]);
        if (l.p[1] < 0.004) {
          l.p[1] = 0.004;
          l.rest = 0;
        }
        e.set(Math.cos(l.phase) * 0.9, l.heading + time * l.spin * 0.3, Math.sin(l.phase) * 0.35);
      } else {
        // Lying on the litter for a while, then recycled up into the canopy.
        l.rest += dt;
        e.set(-Math.PI / 2, l.heading, 0);
        if (l.rest > 8) spawnLeaf(l, false);
      }
      q.setFromEuler(e);
      sc.setScalar(l.size);
      m.compose(tmp.set(l.p[0], l.p[1], l.p[2]), q, sc);
      leafMesh.setMatrixAt(i, m);
    }
    leafMesh.instanceMatrix.needsUpdate = true;

    if (debugView === "tree") {
      camera.position.set(treeSpot.x, 28, treeSpot.z + 120);
      camera.lookAt(treeSpot.x, 28, treeSpot.z);
      camera.fov = 40;
      camera.updateProjectionMatrix();
      lens.fNumber = 1e4;
    }
    if (debugView === "top") {
      camera.position.set(0.0, 3.2, 2.2);
      camera.lookAt(0, 0, -1.2);
      camera.fov = 50;
      camera.updateProjectionMatrix();
      lens.fNumber = 1e4;
    }
    project(frogPos, info.frog);
    project(new THREE.Vector3(treeSpot.x, 34, treeSpot.z), info.tree);
    return lens;
  }

  return { update, info, frog };
}
