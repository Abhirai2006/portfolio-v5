import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { Chess, type Square } from "chess.js";
import { DESTINATIONS } from "@/lib/chess/play";
import { PIECE_NAMES, type PieceColor, type PieceType } from "@/components/art/ChessPiece";

/*
 * The main board in 3D. Board coordinates: file a..h → x -3.5..3.5, rank 1..8 → z -3.5..3.5.
 * The camera sits behind rank 8 because the visitor plays black.
 * Everything is generated in code: turned (lathe) pieces, the knight extruded from the site's own
 * 2D knight outline, procedural room lighting. No model files or textures are downloaded.
 */

const COLORS = {
  light: "#dde5f3",
  dark: "#2c4785",
  frame: "#0c1531",
  white: "#f3f6fc",
  black: "#0f1630",
  target: "#5fa8ff",
  select: "#8fd0ff",
  last: "#3d7bff",
};

const sqToXZ = (sq: string): [number, number] => [
  sq.charCodeAt(0) - 97 - 3.5,
  Number(sq[1]) - 1 - 3.5,
];

/* ---------- piece geometry ---------- */

const BASE: [number, number][] = [
  [0, 0],
  [0.34, 0],
  [0.34, 0.05],
  [0.3, 0.09],
  [0.31, 0.12],
  [0.24, 0.15],
];

function lathe(points: [number, number][]) {
  const g = new THREE.LatheGeometry(
    points.map(([x, y]) => new THREE.Vector2(x, y)),
    48,
  );
  g.computeVertexNormals();
  return g;
}

function arc(cy: number, r: number, from: number, to: number, steps = 10): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const a = from + ((to - from) * i) / steps;
    out.push([Math.max(0, Math.cos(a) * r), cy + Math.sin(a) * r]);
  }
  return out;
}

const KNIGHT_PATH =
  "M24 9c7.5 1.2 11.5 7.8 11.5 16.5V38.5h-20c0-4.8 2.6-7.6 5.6-10.2-3.4.4-6.4 1.9-8.6 4.1L9.6 27.6c3.3-4.6 7-8.6 9.8-13.6L17.6 9.5c2.3.4 4.3 1.2 6.4 2.8z";

let cache: Record<PieceType, THREE.BufferGeometry[]> | null = null;

function geometries(): Record<PieceType, THREE.BufferGeometry[]> {
  if (cache) return cache;
  const pawn = lathe([
    ...BASE,
    [0.17, 0.2],
    [0.12, 0.36],
    [0.18, 0.39],
    [0.18, 0.41],
    [0.1, 0.43],
    ...arc(0.53, 0.13, -1.1, Math.PI / 2),
  ]);
  const rook = lathe([
    ...BASE,
    [0.22, 0.2],
    [0.2, 0.48],
    [0.27, 0.52],
    [0.27, 0.66],
    [0.2, 0.66],
    [0.2, 0.6],
    [0, 0.6],
  ]);
  const bishop = lathe([
    ...BASE,
    [0.16, 0.22],
    [0.11, 0.46],
    [0.18, 0.49],
    [0.18, 0.51],
    [0.12, 0.53],
    ...arc(0.66, 0.15, -1.0, 1.25),
    [0.05, 0.84],
    ...arc(0.88, 0.045, -Math.PI / 2, Math.PI / 2, 6),
  ]);
  const queen = lathe([
    ...BASE,
    [0.18, 0.22],
    [0.12, 0.55],
    [0.2, 0.58],
    [0.2, 0.6],
    [0.15, 0.63],
    [0.25, 0.84],
    [0.17, 0.88],
    [0.1, 0.9],
    ...arc(0.95, 0.06, -Math.PI / 2, Math.PI / 2, 6),
  ]);
  const king = lathe([
    ...BASE,
    [0.19, 0.22],
    [0.13, 0.6],
    [0.21, 0.63],
    [0.21, 0.65],
    [0.16, 0.68],
    [0.23, 0.86],
    [0.15, 0.91],
    [0, 0.92],
  ]);
  const crossV = new THREE.BoxGeometry(0.06, 0.2, 0.06).translate(0, 1.0, 0);
  const crossH = new THREE.BoxGeometry(0.17, 0.06, 0.06).translate(0, 1.02, 0);

  const knightBase = lathe([...BASE, [0.22, 0.2], [0.2, 0.24], [0, 0.24]]);
  const shapes = new SVGLoader()
    .parse(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><path d="${KNIGHT_PATH}"/></svg>`,
    )
    .paths.flatMap((p) => p.toShapes());
  const head = new THREE.ExtrudeGeometry(shapes, {
    depth: 6,
    bevelEnabled: true,
    bevelThickness: 1.4,
    bevelSize: 1,
    bevelSegments: 3,
    curveSegments: 16,
  });
  head.center();
  // SVG y points down: turn it upright with a rotation (a negative scale would turn the mesh inside out).
  head.scale(0.026, 0.026, 0.026);
  head.rotateZ(Math.PI);
  head.computeBoundingBox();
  const lift = 0.22 - head.boundingBox!.min.y;
  head.translate(0, lift, 0);
  // The profile stays in the XY plane so the knight's silhouette faces the camera.

  cache = {
    p: [pawn],
    r: [rook],
    b: [bishop],
    q: [queen],
    k: [king, crossV, crossH],
    n: [knightBase, head],
  };
  return cache;
}

/* ---------- scene pieces ---------- */

function useEnvironment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    return () => {
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
}

type PieceProps = {
  sq: string;
  type: PieceType;
  color: PieceColor;
  from?: string;
  selected: boolean;
  hovered: boolean;
  onPick: (sq: string) => void;
  onHover: (sq: string | null) => void;
  materials: Record<PieceColor, THREE.Material>;
};

function Piece({
  sq,
  type,
  color,
  from,
  selected,
  hovered,
  onPick,
  onHover,
  materials,
}: PieceProps) {
  const ref = useRef<THREE.Group>(null);
  const [tx, tz] = sqToXZ(sq);
  const start = from ? sqToXZ(from) : [tx, tz];
  const t = useRef(from ? 0 : 1);
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    t.current = Math.min(1, t.current + dt * 1.8);
    const e = 1 - Math.pow(1 - t.current, 3);
    g.position.x = start[0] + (tx - start[0]) * e;
    g.position.z = start[1] + (tz - start[1]) * e;
    const hop = Math.sin(Math.PI * e) * (from ? 0.6 : 0);
    const target = (selected ? 0.25 : hovered ? 0.08 : 0) + hop;
    g.position.y += (target - g.position.y) * Math.min(1, dt * 12);
  });
  const geos = geometries()[type];
  // Knights turn slightly toward the opponent but keep their profile readable from the camera.
  const rotY = type === "n" ? (color === "w" ? -0.35 : Math.PI + 0.35) : 0;
  return (
    <group
      ref={ref}
      position={[start[0], 0, start[1]]}
      rotation={[0, rotY, 0]}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onPick(sq);
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onHover(sq);
      }}
      onPointerOut={() => onHover(null)}
    >
      {geos.map((g, i) => (
        <mesh key={i} geometry={g} material={materials[color]} castShadow receiveShadow />
      ))}
    </group>
  );
}

function BoardMesh({ last }: { last: string[] }) {
  const squares = useMemo(() => {
    const out: { key: string; x: number; z: number; dark: boolean }[] = [];
    for (let f = 0; f < 8; f++)
      for (let r = 0; r < 8; r++)
        out.push({ key: `${f}${r}`, x: f - 3.5, z: r - 3.5, dark: (f + r) % 2 === 0 });
    return out;
  }, []);
  const lastSet = new Set(last.map(sqToXZ).map(([x, z]) => `${x},${z}`));
  return (
    <group>
      <mesh position={[0, -0.16, 0]} receiveShadow castShadow>
        <boxGeometry args={[9.1, 0.3, 9.1]} />
        <meshPhysicalMaterial color={COLORS.frame} roughness={0.35} clearcoat={0.8} />
      </mesh>
      {squares.map((s) => (
        <mesh key={s.key} position={[s.x, 0, s.z]} receiveShadow>
          <boxGeometry args={[1, 0.04, 1]} />
          <meshPhysicalMaterial
            color={lastSet.has(`${s.x},${s.z}`) ? COLORS.last : s.dark ? COLORS.dark : COLORS.light}
            roughness={0.28}
            clearcoat={1}
            clearcoatRoughness={0.15}
          />
        </mesh>
      ))}
    </group>
  );
}

function Targets({ squares, onDrop }: { squares: string[]; onDrop: (sq: string) => void }) {
  return (
    <>
      {squares.map((sq) => {
        const [x, z] = sqToXZ(sq);
        return (
          <mesh
            key={sq}
            position={[x, 0.04, z]}
            onClick={(e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation();
              onDrop(sq);
            }}
          >
            <cylinderGeometry args={[0.42, 0.42, 0.02, 32]} />
            <meshBasicMaterial color={COLORS.target} transparent opacity={0.55} />
          </mesh>
        );
      })}
    </>
  );
}

/**
 * Room lighting. When `dramatic` is on (a piece is moving) the room goes dark: ambient, key light and
 * reflections fade out while a spotlight drops onto the square the piece lands on.
 */
function Lights({ dramatic, focus }: { dramatic: boolean; focus?: string }) {
  const { scene } = useThree();
  const hemi = useRef<THREE.HemisphereLight>(null);
  const key = useRef<THREE.DirectionalLight>(null);
  const spot = useRef<THREE.SpotLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  useEffect(() => {
    scene.add(target);
    return () => {
      scene.remove(target);
    };
  }, [scene, target]);
  useFrame((_, dt) => {
    const k = Math.min(1, dt * 4);
    const lerp = (v: number, to: number) => v + (to - v) * k;
    if (hemi.current) hemi.current.intensity = lerp(hemi.current.intensity, dramatic ? 0.02 : 0.35);
    if (key.current) key.current.intensity = lerp(key.current.intensity, dramatic ? 0.08 : 2.2);
    scene.environmentIntensity = lerp(scene.environmentIntensity ?? 1, dramatic ? 0.05 : 1);
    if (spot.current) {
      spot.current.intensity = lerp(spot.current.intensity, dramatic ? 90 : 0);
      if (focus) {
        const [x, z] = sqToXZ(focus);
        spot.current.position.x = lerp(spot.current.position.x, x * 0.6);
        spot.current.position.z = lerp(spot.current.position.z, z * 0.6 + 1);
        target.position.x = lerp(target.position.x, x);
        target.position.z = lerp(target.position.z, z);
      }
    }
  });
  return (
    <>
      <hemisphereLight ref={hemi} args={["#cfe0ff", "#0b1430", 0.35]} />
      <directionalLight
        ref={key}
        position={[4, 9, 6]}
        intensity={2.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-bias={-0.0004}
      />
      <spotLight
        ref={spot}
        position={[0, 7, 1]}
        target={target}
        intensity={0}
        angle={0.28}
        penumbra={0.65}
        decay={1.6}
        distance={16}
        color="#d6e6ff"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
      />
    </>
  );
}

function Scene({
  fen,
  last,
  canPlay,
  dramatic,
  onMove,
}: {
  fen: string;
  last: string[];
  canPlay: boolean;
  dramatic: boolean;
  onMove: (from: Square, to: Square) => void;
}) {
  useEnvironment();
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  // Render on demand: keep drawing only for a short while after something changes (moves, lights, hover).
  const invalidate = useThree((st) => st.invalidate);
  const busyUntil = useRef(0);
  useEffect(() => {
    busyUntil.current = performance.now() + 2200;
    invalidate();
  }, [fen, last, dramatic, selected, hovered, invalidate]);
  useFrame(() => {
    if (performance.now() < busyUntil.current) invalidate();
  });
  const game = useMemo(() => new Chess(fen), [fen]);
  const turn = game.turn();
  const materials = useMemo(
    () => ({
      w: new THREE.MeshPhysicalMaterial({
        color: COLORS.white,
        roughness: 0.22,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
      }),
      b: new THREE.MeshPhysicalMaterial({
        color: COLORS.black,
        roughness: 0.3,
        metalness: 0.15,
        clearcoat: 1,
        clearcoatRoughness: 0.12,
      }),
    }),
    [],
  );
  useEffect(() => setSelected(null), [fen]);

  const pieces = useMemo(() => {
    const out: { sq: string; type: PieceType; color: PieceColor }[] = [];
    game
      .board()
      .forEach((row) =>
        row.forEach(
          (p) =>
            p &&
            out.push({ sq: p.square, type: p.type as PieceType, color: p.color as PieceColor }),
        ),
      );
    return out;
  }, [game]);

  const targets = useMemo(
    () =>
      selected ? game.moves({ square: selected as Square, verbose: true }).map((m) => m.to) : [],
    [game, selected],
  );

  const pick = (sq: string) => {
    if (!canPlay) return;
    const p = game.get(sq as Square);
    if (p && p.color === turn && turn === "b") setSelected(sq === selected ? null : sq);
    else if (selected) {
      onMove(selected as Square, sq as Square);
      setSelected(null);
    }
  };

  const hoverPiece = pieces.find((p) => p.sq === (hovered ?? selected));
  const labelFor = hoverPiece && hoverPiece.color === "b" ? DESTINATIONS[hoverPiece.type] : null;
  const [hx, hz] = hoverPiece ? sqToXZ(hoverPiece.sq) : [0, 0];

  return (
    <>
      <Lights dramatic={dramatic} focus={last[1]} />
      <BoardMesh last={last} />
      {pieces.map((p) => (
        <Piece
          key={`${p.sq}-${p.color}${p.type}`}
          {...p}
          from={last[1] === p.sq ? last[0] : undefined}
          selected={selected === p.sq}
          hovered={hovered === p.sq}
          onPick={pick}
          onHover={setHovered}
          materials={materials}
        />
      ))}
      <Targets squares={targets} onDrop={(sq) => pick(sq)} />
      {labelFor && hoverPiece && (
        <Html position={[hx, 1.5, hz]} center style={{ pointerEvents: "none" }}>
          <div className="whitespace-nowrap rounded-full border-2 border-line bg-paper px-3 py-1 text-xs font-semibold text-foreground shadow-[3px_3px_0_var(--panel-shadow)]">
            {PIECE_NAMES[hoverPiece.type]} → {labelFor.label}
          </div>
        </Html>
      )}
    </>
  );
}

export default function Board3D(props: {
  fen: string;
  last: string[];
  canPlay: boolean;
  dramatic: boolean;
  onMove: (from: Square, to: Square) => void;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const finePointer = typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver((e) => setVisible(e.some((x) => x.isIntersecting)));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={wrap} className="h-full w-full" style={{ touchAction: "pan-y" }}>
      <Canvas
        shadows={finePointer}
        dpr={finePointer ? [1, 1.75] : [1, 1.25]}
        frameloop={visible ? "demand" : "never"}
        camera={{ position: [0, 11, 9.6], fov: 40 }}
        gl={{ antialias: true }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
        }}
      >
        <Scene {...props} />
        {/* Only on mouse/trackpad: OrbitControls sets touch-action:none, which would stop phones scrolling the page. */}
        {finePointer && (
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            minPolarAngle={0.45}
            maxPolarAngle={1.15}
            minAzimuthAngle={-0.7}
            maxAzimuthAngle={0.7}
          />
        )}
      </Canvas>
    </div>
  );
}
