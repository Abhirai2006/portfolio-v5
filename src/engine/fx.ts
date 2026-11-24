/**
 * Set pieces built in code: canvas textures (code on the monitor, the terminal, stat shards,
 * project cards) and 3D objects (path artefacts, glass shards, the projects void, sorting bars).
 */
import * as THREE from "three";
import { AWAKEN_CODE, STAT_SHARDS } from "@/story/story";
import { getProject, PROJECTS } from "@/lib/projects";
import { BASIC_VERT, SCREEN_FRAG, SHARD_FRAG } from "./shaders";
import type { PathId } from "@/story/types";
import { voidLayout } from "./voidLayout";
export { voidLayout };

const MONO = '"JetBrains Mono Variable", "JetBrains Mono", ui-monospace, monospace';
const SANS = '"Inter Tight Variable", "Inter Tight", system-ui, sans-serif';
const DISPLAY = '"Bodoni Moda Variable", "Bodoni Moda", Georgia, serif';

function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  draw(g);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/* ------------------------------------------------------------------ the awakening code screen */

const KEYWORDS = /\b(from|import|print|for|in|def|return)\b/g;

export class CodeScreen {
  texture: THREE.CanvasTexture;
  private g: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private shown = -1;
  private colour = 0;
  readonly total = AWAKEN_CODE.join("\n").length;

  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = 1600;
    this.canvas.height = 900;
    this.g = this.canvas.getContext("2d")!;
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.draw(0, 0, 0);
  }

  /** progress 0..1 of the hold; colour 0..1 after the flood; time for the cursor blink. */
  update(progress: number, colour: number, time: number) {
    const pre = AWAKEN_CODE.slice(0, 2).join("\n").length + 2;
    const chars = Math.floor(pre + progress * (this.total - pre));
    const blink = Math.floor(time * 2) % 2;
    const key = chars * 10 + blink + Math.round(colour * 4) * 100000;
    if (key === this.shown && colour === this.colour) return;
    this.shown = key;
    this.colour = colour;
    this.draw(chars, colour, blink);
    this.texture.needsUpdate = true;
  }

  private draw(chars: number, colour: number, blink: number) {
    const g = this.g;
    const W = this.canvas.width;
    const H = this.canvas.height;
    const bg = colour > 0.5 ? "#0B1230" : "#0A0C14";
    g.fillStyle = bg;
    g.fillRect(0, 0, W, H);
    // editor chrome
    g.fillStyle = "#151A2A";
    g.fillRect(0, 0, W, 56);
    for (const [i, c] of ["#FF5F57", "#FEBC2E", "#28C840"].entries()) {
      g.fillStyle = colour > 0.5 ? c : "#3A3F52";
      g.beginPath();
      g.arc(34 + i * 30, 28, 9, 0, Math.PI * 2);
      g.fill();
    }
    g.font = `500 22px ${MONO}`;
    g.fillStyle = "#8A93B2";
    g.fillText("churn_capstone.py", 140, 36);
    g.font = `500 40px ${MONO}`;
    let left = chars;
    let y = 130;
    for (const [i, line] of AWAKEN_CODE.entries()) {
      g.fillStyle = "#4A5270";
      g.fillText(String(i + 1).padStart(2, " "), 40, y);
      const shown = line.slice(0, Math.max(0, left));
      left -= line.length + 1;
      let x = 130;
      const isOut = line.startsWith(">>>");
      // tokenise: keywords blue, strings/numbers accent, rest paper
      const parts = shown.split(/(\s+|[()[\],.:=])/);
      for (const part of parts) {
        if (!part) continue;
        KEYWORDS.lastIndex = 0;
        let fill = "#E8E6E0";
        if (KEYWORDS.test(part)) fill = "#62AEFF";
        else if (/^[0-9.]+$/.test(part)) fill = colour > 0.5 ? "#FFB020" : "#62AEFF";
        else if (/^[A-Z]/.test(part)) fill = colour > 0.5 ? "#7BE0A8" : "#E8E6E0";
        if (isOut) fill = "#62AEFF";
        g.fillStyle = fill;
        g.fillText(part, x, y);
        x += g.measureText(part).width;
      }
      if (left < 0 && left > -line.length - 2 && blink) {
        g.fillStyle = "#62AEFF";
        g.fillRect(x + 4, y - 34, 22, 42);
      }
      y += 76;
      if (left < 0) {
        if (blink && shown.length === line.length && left === -1) {
          g.fillStyle = "#62AEFF";
          g.fillRect(130, y - 34, 22, 42);
        }
        break;
      }
    }
    if (chars === 0 && blink) {
      g.fillStyle = "#62AEFF";
      g.fillRect(130, 130 - 34, 22, 42);
    }
  }
}

/* ------------------------------------------------------------------ terminal (C++ suite) */

export function terminalTexture() {
  const p = getProject("cpp-console-suite");
  const lines = p?.snippet?.lines ?? ["$ ./banking"];
  return canvasTex(1600, 900, (g) => {
    g.fillStyle = "#06120C";
    g.fillRect(0, 0, 1600, 900);
    g.fillStyle = "#0E2318";
    g.fillRect(0, 0, 1600, 56);
    g.font = `500 22px ${MONO}`;
    g.fillStyle = "#7BE0A8";
    g.fillText(p?.snippet?.title ?? "terminal", 30, 36);
    g.font = `500 34px ${MONO}`;
    lines.slice(0, 18).forEach((l, i) => {
      g.fillStyle = l.trim().startsWith("$") || l.includes(">") ? "#2BD67B" : "#CFEFDC";
      g.fillText(l.slice(0, 70), 40, 120 + i * 44);
    });
  });
}

/* ------------------------------------------------------------------ glass stat shards */

function shardShape(seed: number) {
  let s = seed;
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const n = 5 + Math.floor(r() * 3);
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + r() * 0.5;
    const rad = 0.75 + r() * 0.45;
    pts.push(new THREE.Vector2(Math.cos(a) * rad * 1.35, Math.sin(a) * rad));
  }
  return new THREE.Shape(pts);
}

export type Shard = { mesh: THREE.Mesh; target: THREE.Vector3; spin: THREE.Vector3; seed: number };

export function buildShards(): Shard[] {
  return STAT_SHARDS.map((s, i) => {
    const tex = canvasTex(640, 480, (g) => {
      g.clearRect(0, 0, 640, 480);
      g.fillStyle = "#FFFFFF";
      g.textAlign = "center";
      g.font = `700 150px ${DISPLAY}`;
      g.fillText(s.value, 320, 250);
      g.font = `600 34px ${SANS}`;
      g.fillStyle = "#DDE8FF";
      g.fillText(s.label.toUpperCase(), 320, 320);
    });
    const geo = new THREE.ShapeGeometry(shardShape(i * 977 + 13));
    // map UVs to the shape's bounding box
    geo.computeBoundingBox();
    const bb = geo.boundingBox!;
    const uv = geo.attributes.uv as THREE.BufferAttribute;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let k = 0; k < uv.count; k++)
      uv.setXY(
        k,
        (pos.getX(k) - bb.min.x) / (bb.max.x - bb.min.x),
        (pos.getY(k) - bb.min.y) / (bb.max.y - bb.min.y),
      );
    const mat = new THREE.ShaderMaterial({
      vertexShader: BASIC_VERT,
      fragmentShader: SHARD_FRAG,
      uniforms: { uMap: { value: tex }, uOpacity: { value: 0 }, uTime: { value: 0 } },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    const spots: [number, number][] = [
      [-6.9, -2.2],
      [6.9, -2.4],
      [-7.6, -7.4],
      [7.6, -7.2],
      [-3.4, -10.1],
      [3.6, -10.3],
    ];
    const [tx, ty] = spots[i % spots.length];
    const target = new THREE.Vector3(tx, ty, 1.2 + (i % 2) * 0.8);
    return {
      mesh,
      target,
      spin: new THREE.Vector3(0.3 + (i % 3) * 0.2, 0.5 - (i % 2) * 0.6, 0.2),
      seed: i,
    };
  });
}

/* ------------------------------------------------------------------ glow sprite */

let glowTex: THREE.Texture | null = null;
export function glowSprite(colour: string, size: number) {
  glowTex ??= canvasTex(256, 256, (g) => {
    const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grd.addColorStop(0, "rgba(255,255,255,1)");
    grd.addColorStop(0.25, "rgba(255,255,255,0.45)");
    grd.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 256, 256);
  });
  const m = new THREE.SpriteMaterial({
    map: glowTex,
    color: new THREE.Color(colour),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const s = new THREE.Sprite(m);
  s.scale.set(size, size, 1);
  return s;
}

/* ------------------------------------------------------------------ the three path artefacts */

export type Artefact = {
  id: PathId;
  group: THREE.Group;
  base: THREE.Vector3;
  hover: number;
  glow: THREE.Sprite;
};

export function buildArtefacts(): Artefact[] {
  const make = (id: PathId, colour: string, x: number): Artefact => {
    const group = new THREE.Group();
    const c = new THREE.Color(colour);
    if (id === "ml") {
      const ico = new THREE.IcosahedronGeometry(1, 1);
      group.add(
        new THREE.LineSegments(
          new THREE.EdgesGeometry(ico),
          new THREE.LineBasicMaterial({ color: c }),
        ),
      );
      const pts = new THREE.Points(ico, new THREE.PointsMaterial({ color: 0xffffff, size: 0.12 }));
      group.add(pts);
      const core = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.42, 2),
        new THREE.MeshBasicMaterial({ color: c }),
      );
      group.add(core);
    } else if (id === "product") {
      const box = new THREE.BoxGeometry(1.5, 1.5, 1.5);
      group.add(
        new THREE.LineSegments(
          new THREE.EdgesGeometry(box),
          new THREE.LineBasicMaterial({ color: c }),
        ),
      );
      const inner = new THREE.BoxGeometry(0.8, 0.8, 0.8);
      group.add(
        new THREE.LineSegments(
          new THREE.EdgesGeometry(inner),
          new THREE.LineBasicMaterial({ color: 0xffffff }),
        ),
      );
      const grid = new THREE.GridHelper(1.5, 6, c, c);
      (grid.material as THREE.Material).transparent = true;
      (grid.material as THREE.Material).opacity = 0.5;
      group.add(grid);
    } else {
      for (let i = 0; i < 7; i++) {
        const h = 0.4 + ((i * 3) % 7) * 0.22;
        const bar = new THREE.Mesh(
          new THREE.BoxGeometry(0.2, h, 0.2),
          new THREE.MeshBasicMaterial({ color: i % 2 ? c : new THREE.Color("#BFF5D6") }),
        );
        bar.position.set((i - 3) * 0.28, h / 2 - 0.8, 0);
        bar.userData.h = h;
        group.add(bar);
      }
    }
    const glow = glowSprite(colour, 4.2);
    glow.position.z = -0.5;
    group.add(glow);
    const base = new THREE.Vector3(x, -8.7, 1.2);
    group.position.copy(base);
    group.userData.pathId = id;
    return { id, group, base, hover: 0, glow };
  };
  return [
    make("ml", "#1F6BFF", -3.3),
    make("product", "#FFB020", 0),
    make("problem", "#2BD67B", 3.3),
  ];
}

/* ------------------------------------------------------------------ sorting bars (problem path) */

export function buildSortingBars() {
  const group = new THREE.Group();
  const bars: THREE.Mesh[] = [];
  for (let i = 0; i < 12; i++) {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 1, 0.22),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(i % 3 ? "#2BD67B" : "#BFF5D6") }),
    );
    m.position.x = (i - 5.5) * 0.3;
    bars.push(m);
    group.add(m);
  }
  const values = bars.map((_, i) => ((i * 7) % 12) + 1);
  return {
    group,
    update(time: number) {
      // a bubble sort that runs, settles, and starts over
      const step = Math.floor(time * 6) % 120;
      const v = [...values];
      let s = 0;
      outer: for (let i = 0; i < v.length; i++)
        for (let j = 0; j < v.length - 1 - i; j++) {
          if (s++ >= step) break outer;
          if (v[j] > v[j + 1]) [v[j], v[j + 1]] = [v[j + 1], v[j]];
        }
      bars.forEach((b, i) => {
        const h = v[i] * 0.22;
        b.scale.y += (h - b.scale.y) * 0.25;
        b.position.y = b.scale.y / 2;
      });
    },
  };
}

/* ------------------------------------------------------------------ the projects void */

export type VoidScreen = { slug: string; mesh: THREE.Mesh; pos: THREE.Vector3; hover: number };

function projectCard(slug: string) {
  const p = getProject(slug)!;
  return canvasTex(1024, 640, (g) => {
    const grd = g.createLinearGradient(0, 0, 1024, 640);
    grd.addColorStop(0, "#0A1A5C");
    grd.addColorStop(1, "#03081F");
    g.fillStyle = grd;
    g.fillRect(0, 0, 1024, 640);
    g.strokeStyle = "rgba(98,174,255,0.25)";
    for (let x = 0; x < 1024; x += 48) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, 640);
      g.stroke();
    }
    g.fillStyle = "#62AEFF";
    g.font = `600 26px ${SANS}`;
    g.fillText(p.tag.toUpperCase().slice(0, 52), 56, 96);
    g.fillStyle = "#FFFFFF";
    g.font = `700 84px ${DISPLAY}`;
    g.fillText(p.title.slice(0, 22), 56, 230);
    g.font = `500 32px ${SANS}`;
    g.fillStyle = "#C9D6F5";
    const words = p.hook.split(" ");
    let line = "";
    let y = 320;
    for (const w of words) {
      if (g.measureText(line + w).width > 900) {
        g.fillText(line, 56, y);
        line = "";
        y += 44;
        if (y > 520) break;
      }
      line += w + " ";
    }
    if (y <= 520) g.fillText(line, 56, y);
    g.fillStyle = "#FFB020";
    g.font = `700 64px ${DISPLAY}`;
    g.fillText(p.metrics[0]?.value ?? "", 56, 600);
  });
}

export function buildVoid(loadShot: (url: string) => THREE.Texture | null) {
  const group = new THREE.Group();
  const screens: VoidScreen[] = [];
  for (const L of voidLayout()) {
    const p = getProject(L.slug)!;
    const img = p.images?.[0];
    const url =
      typeof img === "string"
        ? img
        : img
          ? (img.dark ?? img.any ?? img.light ?? img.fallback)
          : undefined;
    const tex = (url && loadShot(url)) || projectCard(L.slug);
    const mat = new THREE.ShaderMaterial({
      vertexShader: BASIC_VERT,
      fragmentShader: SCREEN_FRAG,
      uniforms: {
        uMap: { value: tex },
        uOpacity: { value: 1 },
        uHover: { value: 0 },
        uTime: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.1), mat);
    const pos = new THREE.Vector3(L.x, L.y, L.z);
    mesh.position.copy(pos);
    mesh.rotation.y = -Math.sign(L.x) * 0.38;
    mesh.userData.slug = L.slug;
    group.add(mesh);
    screens.push({ slug: L.slug, mesh, pos, hover: 0 });
  }
  // floor grid + ceiling grid
  const gridMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `precision highp float; varying vec3 vW; uniform float uTime;
      void main(){ vec2 g = abs(fract(vW.xz * 0.5) - 0.5); float l = 1.0 - smoothstep(0.0, 0.03, min(g.x, g.y));
      gl_FragColor = vec4(vec3(0.12, 0.42, 1.0) * l, l * 0.55); }`,
    transparent: true,
    depthWrite: false,
  });
  for (const y of [-10.2, -3.8]) {
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 120), gridMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, y, -40);
    group.add(floor);
  }
  // drifting code particles
  const n = 900;
  const geo = new THREE.BufferGeometry();
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    arr[i * 3] = (Math.random() - 0.5) * 24;
    arr[i * 3 + 1] = -7 + (Math.random() - 0.5) * 9;
    arr[i * 3 + 2] = 10 - Math.random() * 90;
  }
  geo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
  const dots = new THREE.Points(
    geo,
    new THREE.PointsMaterial({ color: 0x62aeff, size: 0.06, transparent: true, opacity: 0.8 }),
  );
  group.add(dots);
  return { group, screens, gridMat, dots };
}
