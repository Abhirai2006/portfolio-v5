/**
 * A code-built bird rig shared by Garuda (bishop) and the phoenix (queen): original design, forward = +z.
 * Wings are hinged at the shoulders; flap() drives them.
 */
import * as THREE from "three";

export type Bird = {
  root: THREE.Group;
  wingL: THREE.Group;
  wingR: THREE.Group;
  tail: THREE.Mesh;
  head: THREE.Group;
};

function wingGeometry(): THREE.BufferGeometry {
  // x = span (out from the shoulder), y = forward. Feather notches along the trailing edge.
  const s = new THREE.Shape();
  s.moveTo(0, 0.25);
  s.lineTo(0.6, 0.34);
  s.lineTo(1.2, 0.2);
  s.lineTo(1.78, -0.04);
  s.lineTo(1.56, -0.24);
  s.lineTo(1.46, -0.12);
  s.lineTo(1.3, -0.4);
  s.lineTo(1.18, -0.2);
  s.lineTo(1.0, -0.47);
  s.lineTo(0.88, -0.25);
  s.lineTo(0.7, -0.5);
  s.lineTo(0.56, -0.28);
  s.lineTo(0.38, -0.46);
  s.lineTo(0.2, -0.26);
  s.lineTo(0, -0.3);
  s.closePath();
  return new THREE.ExtrudeGeometry(s, { depth: 0.045, bevelEnabled: false }).rotateX(Math.PI / 2);
}

function tailGeometry(): THREE.BufferGeometry {
  const s = new THREE.Shape();
  s.moveTo(-0.12, 0);
  s.lineTo(0.12, 0);
  s.lineTo(0.38, -0.62);
  s.lineTo(0.2, -0.52);
  s.lineTo(0.1, -0.7);
  s.lineTo(0, -0.56);
  s.lineTo(-0.1, -0.7);
  s.lineTo(-0.2, -0.52);
  s.lineTo(-0.38, -0.62);
  s.closePath();
  return new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: false }).rotateX(Math.PI / 2);
}

export function buildBird(m: {
  body: THREE.Material;
  wing: THREE.Material;
  accent: THREE.Material;
}): Bird {
  const root = new THREE.Group();
  root.add(new THREE.Mesh(new THREE.SphereGeometry(0.32, 22, 16).scale(0.78, 0.72, 1.85), m.body));
  const head = new THREE.Group();
  head.position.set(0, 0.2, 0.68);
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.19, 18, 12), m.body));
  const beak = new THREE.Mesh(
    new THREE.ConeGeometry(0.07, 0.3, 10).rotateX(Math.PI / 2 + 0.35),
    m.accent,
  );
  beak.position.set(0, -0.04, 0.26);
  head.add(beak);
  for (let i = -1; i <= 1; i++) {
    const crest = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.22, 8), m.accent); // crest / crown
    crest.position.set(i * 0.07, 0.2, -0.04 - Math.abs(i) * 0.04);
    crest.rotation.set(-0.5, 0, i * 0.35);
    head.add(crest);
  }
  root.add(head);
  const wg = wingGeometry();
  const wingL = new THREE.Group();
  wingL.position.set(0.16, 0.1, 0.12);
  wingL.add(new THREE.Mesh(wg, m.wing));
  const wingR = new THREE.Group();
  wingR.position.set(-0.16, 0.1, 0.12);
  wingR.add(new THREE.Mesh(wg.clone().scale(-1, 1, 1), m.wing));
  root.add(wingL, wingR);
  const tail = new THREE.Mesh(tailGeometry(), m.wing);
  tail.position.set(0, 0.05, -0.55);
  root.add(tail);
  return { root, wingL, wingR, tail, head };
}

/** amount: flap amplitude (radians); tuck: 0 = spread, 1 = swept back for a dive. */
export function flap(b: Bird, phase: number, amount: number, tuck: number) {
  const f = Math.sin(phase) * amount;
  b.wingL.rotation.set(0, -tuck * 1.1, f + tuck * 0.2);
  b.wingR.rotation.set(0, tuck * 1.1, -f - tuck * 0.2);
}
