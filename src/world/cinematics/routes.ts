/**
 * Each creature's route in board space (white at +z, the camera side): a 3D version of the
 * "Where are you going?" line, with chamfered corners — and each route moves the way its piece moves.
 */
import * as THREE from "three";
import type { V3 } from "../fx/bolt";
import type { HeroId } from "../sequence";
import { clamp01 } from "../shots/poses";
import { chamferPolyline } from "../where";

export const ROUTE_Y = 0.08;

export function routeFor(id: HeroId, o: V3): THREE.Vector3[] {
  const [x, , z] = o;
  const flat = (pts: [number, number][], c: number) =>
    chamferPolyline(pts, c).map(([a, b]) => new THREE.Vector3(a, ROUTE_Y, b));
  switch (id) {
    case "knight": // chamfered L-moves out of the board toward the camera-right
      return flat(
        [
          [x, z],
          [x, z + 2.2],
          [x + 2.4, z + 2.2],
          [x + 2.4, z + 4.4],
          [x + 8, z + 4.4],
          [x + 8, z + 7],
          [x + 16, z + 7],
        ],
        0.7,
      );
    case "rook": // straight ranks and files, heavy
      return flat(
        [
          [x, z],
          [x, z + 2.6],
          [x + 8, z + 2.6],
          [x + 8, z + 9],
          [x + 14, z + 9],
        ],
        0.9,
      );
    case "pawn": // square by square to the last rank (e8)
      return flat(
        [
          [x, z],
          [x, -3.5],
        ],
        0.1,
      );
    case "king":
      return flat(
        [
          [x, z],
          [x, z + 2.4],
          [x + 3, z + 4.6],
          [x + 12, z + 6],
        ],
        0.8,
      );
    case "bishop": // rises, then dives diagonally (the bishop's move) through the storm
      return [
        new THREE.Vector3(x, 0.6, z),
        new THREE.Vector3(x - 1.5, 5.5, z - 3),
        new THREE.Vector3(x + 3, 1.2, z + 2),
        new THREE.Vector3(x + 7, 0.8, z + 6),
        new THREE.Vector3(x + 13, 0.6, z + 10),
      ];
    case "queen": {
      // a spiral orbit around the board, then straight up
      const pts: THREE.Vector3[] = [new THREE.Vector3(x, 0.6, z)];
      for (let i = 0; i <= 40; i++) {
        const a = (i / 40) * Math.PI * 3 + Math.PI / 2;
        const r = 2 + i * 0.08;
        pts.push(new THREE.Vector3(Math.cos(a) * r, 0.8 + i * 0.12, Math.sin(a) * r));
      }
      const last = pts[pts.length - 1];
      pts.push(new THREE.Vector3(last.x, 14, last.z));
      return pts;
    }
  }
}

/**
 * How far along its route each creature is at cinematic time t. Shared by the camera rig and the creature.
 * Pawn: square by square to the last rank, then holds for the promotion. King: stops to roar, then charges.
 */
export function routeProgress(id: HeroId, t: number, charge: number, impact: number): number {
  const end = Math.min(1, impact + 0.08);
  const inOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const span = (a: number, b: number) => clamp01((t - a) / (b - a));
  switch (id) {
    case "pawn": {
      const k = span(charge, 0.66) * 6;
      const whole = Math.floor(k);
      return Math.min(1, (whole + inOut(k - whole)) / 6);
    }
    case "king":
      return span(charge, 0.44) * 0.12 + inOut(span(0.58, end)) * 0.88;
    case "queen":
      return inOut(span(charge, 1));
    default:
      return inOut(span(charge, end));
  }
}

/** Point at arc-length fraction u of a 3D polyline. */
export function pointOnRoute(path: THREE.Vector3[], u: number, out = new THREE.Vector3()) {
  let total = 0;
  for (let i = 1; i < path.length; i++) total += path[i].distanceTo(path[i - 1]);
  let target = clamp01(u) * total;
  for (let i = 1; i < path.length; i++) {
    const len = path[i].distanceTo(path[i - 1]);
    if (target <= len || i === path.length - 1)
      return out.copy(path[i - 1]).lerp(path[i], len > 0 ? Math.min(1, target / len) : 1);
    target -= len;
  }
  return out.copy(path[path.length - 1]);
}

/** Places and turns a holder at fraction u, facing along the route (optionally pitching with it). */
export function placeOnRoute(
  holder: THREE.Object3D,
  path: THREE.Vector3[],
  u: number,
  pitch = false,
) {
  const p = pointOnRoute(path, u);
  const a = pointOnRoute(path, Math.min(1, u + 0.015));
  holder.position.copy(p);
  if (a.distanceToSquared(p) > 1e-8) {
    if (pitch) {
      // fliers bank and dive, but never stand on their tail: pitch is limited to about ±35°
      const flat = Math.hypot(a.x - p.x, a.z - p.z);
      const dy = Math.max(-0.7 * flat, Math.min(0.7 * flat, a.y - p.y));
      holder.lookAt(a.x, p.y + dy, a.z);
    } else holder.lookAt(a.x, p.y, a.z);
  }
  return p;
}
