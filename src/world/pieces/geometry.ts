/**
 * Builds each carved piece as one merged BufferGeometry: the lathe body (profiles.ts) plus carved parts —
 * the knight's horse head with mane, the rook's elephant top (chaturanga's elephant), the king's temple crown,
 * the queen's beaded crown and the bishop's bud. Original designs, all in code. Cached per type.
 */
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { PROFILES, type PieceType } from "./profiles";

const cache = new Map<PieceType, THREE.BufferGeometry>();

function lathe(type: PieceType) {
  const pts = PROFILES[type].map(([r, h]) => new THREE.Vector2(r, h));
  return new THREE.LatheGeometry(pts, 48);
}

const flat = (g: THREE.BufferGeometry) => {
  const n = g.index ? g.toNonIndexed() : g;
  // keep only the attributes every part shares
  for (const k of Object.keys(n.attributes))
    if (!["position", "normal", "uv"].includes(k)) n.deleteAttribute(k);
  return n;
};

function horseHead(): THREE.BufferGeometry {
  // Side profile, x = forward (muzzle), y = up. Carved mane notches run down the back of the neck.
  const s = new THREE.Shape();
  s.moveTo(-0.13, 0);
  s.lineTo(-0.15, 0.1);
  s.lineTo(-0.19, 0.12); // mane notch
  s.lineTo(-0.16, 0.19);
  s.lineTo(-0.2, 0.22); // mane notch
  s.lineTo(-0.15, 0.29);
  s.lineTo(-0.18, 0.33); // mane notch
  s.quadraticCurveTo(-0.13, 0.44, -0.05, 0.47);
  s.lineTo(-0.035, 0.55); // ear
  s.lineTo(0.0, 0.46);
  s.quadraticCurveTo(0.12, 0.44, 0.2, 0.32);
  s.lineTo(0.25, 0.23); // muzzle
  s.quadraticCurveTo(0.25, 0.17, 0.19, 0.16);
  s.lineTo(0.14, 0.18); // mouth
  s.quadraticCurveTo(0.07, 0.19, 0.06, 0.12); // jaw
  s.quadraticCurveTo(0.08, 0.05, 0.13, 0.0); // chest
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, {
    depth: 0.15,
    bevelEnabled: true,
    bevelThickness: 0.035,
    bevelSize: 0.025,
    bevelSegments: 3,
    curveSegments: 10,
  });
  g.translate(0, 0, -0.075);
  // eye: a small carved bead on each side
  const eyeL = new THREE.SphereGeometry(0.022, 10, 8).translate(0.06, 0.37, 0.1);
  const eyeR = new THREE.SphereGeometry(0.022, 10, 8).translate(0.06, 0.37, -0.1);
  return mergeGeometries([flat(g), flat(eyeL), flat(eyeR)])!.translate(0, 0.55, 0);
}

function elephantTop(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const y = 0.82;
  parts.push(
    new THREE.SphereGeometry(0.17, 24, 16).scale(1.25, 0.85, 0.95).translate(0, y + 0.16, 0),
  ); // body
  parts.push(new THREE.SphereGeometry(0.11, 20, 14).translate(0.19, y + 0.22, 0)); // head
  const trunk = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.26, y + 0.2, 0),
    new THREE.Vector3(0.32, y + 0.12, 0),
    new THREE.Vector3(0.33, y + 0.03, 0),
    new THREE.Vector3(0.29, y - 0.0, 0),
  ]);
  parts.push(new THREE.TubeGeometry(trunk, 16, 0.028, 8, false));
  for (const z of [0.1, -0.1]) {
    parts.push(
      new THREE.SphereGeometry(0.09, 14, 10).scale(0.25, 1, 1).translate(0.15, y + 0.23, z),
    ); // ears
    parts.push(
      new THREE.ConeGeometry(0.014, 0.09, 8)
        .rotateZ(-Math.PI / 2.4)
        .translate(0.29, y + 0.15, z * 0.45),
    ); // tusks
  }
  for (const [x, z] of [
    [0.11, 0.08],
    [0.11, -0.08],
    [-0.11, 0.08],
    [-0.11, -0.08],
  ])
    parts.push(new THREE.CylinderGeometry(0.045, 0.05, 0.12, 12).translate(x, y + 0.05, z)); // legs
  parts.push(new THREE.BoxGeometry(0.2, 0.07, 0.18).translate(-0.02, y + 0.3, 0)); // howdah (tower top)
  for (const [x, z] of [
    [0.07, 0.065],
    [0.07, -0.065],
    [-0.11, 0.065],
    [-0.11, -0.065],
  ])
    parts.push(new THREE.BoxGeometry(0.035, 0.06, 0.035).translate(x, y + 0.36, z)); // crenels
  return mergeGeometries(parts.map(flat))!;
}

function crown(type: "king" | "queen"): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const ringY = type === "king" ? 1.09 : 1.04;
  const r = type === "king" ? 0.21 : 0.2;
  const n = 8;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    parts.push(
      type === "king"
        ? new THREE.ConeGeometry(0.03, 0.1, 8).translate(x, ringY + 0.05, z) // temple spires
        : new THREE.SphereGeometry(0.032, 10, 8).translate(x, ringY + 0.03, z), // beads
    );
  }
  // lotus-bud finial
  const top = type === "king" ? 1.45 : 1.3;
  parts.push(new THREE.SphereGeometry(0.05, 14, 10).scale(1, 1.3, 1).translate(0, top + 0.04, 0));
  if (type === "king") parts.push(new THREE.ConeGeometry(0.02, 0.1, 8).translate(0, top + 0.14, 0));
  return mergeGeometries(parts.map(flat))!;
}

export function pieceGeometry(type: PieceType): THREE.BufferGeometry {
  const hit = cache.get(type);
  if (hit) return hit;
  const parts = [flat(lathe(type))];
  if (type === "knight") parts.push(flat(horseHead()));
  if (type === "rook") parts.push(flat(elephantTop()));
  if (type === "king" || type === "queen") parts.push(flat(crown(type)));
  if (type === "bishop")
    parts.push(flat(new THREE.SphereGeometry(0.035, 10, 8).translate(0, 1.13, 0)));
  // Parts keep their own smooth normals (recomputing on a non-indexed merge would facet the lathe).
  const g = mergeGeometries(parts)!;
  g.computeBoundingBox();
  cache.set(type, g);
  return g;
}

/** Height of a piece's top, for hero labels and leader lines. */
export function pieceHeight(type: PieceType): number {
  return pieceGeometry(type).boundingBox!.max.y;
}
