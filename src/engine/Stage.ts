/**
 * The WebGL stage: one renderer for the whole comic (ARCHITECTURE.md §3–5).
 * Scroll drives a camera along a spline through layered panels; captions and DOM panels are
 * anchored to 3D points; transitions snapshot the previous beat and reveal the next one through
 * an ink-bleed / tear / burn / shatter / glow mask; the colour flood is a per-pixel mask in every
 * layer material.
 */
import * as THREE from "three";
import { BEATS } from "@/story/story";
import type { GateKind, LayerDef, PanelDef, PathId } from "@/story/types";
import {
  beatAt,
  cameraAt,
  cameraKeys,
  frameDistance,
  layoutStory,
  pathOrder,
  transitionAt,
  transitionWindows,
  windowOpacity,
  xSquash,
  type GlobalKey,
  type Laid,
  type Tier,
  type TransitionWindow,
} from "./core";
import {
  BASIC_VERT,
  BORDER_FRAG,
  LAYER_FRAG,
  LAYER_VERT,
  POST_FRAG,
  POST_VERT,
  RAYS_FRAG,
  SPLASH_FRAG,
  SYSTEM_FRAG,
  VORTEX_FRAG,
  WAVES_FRAG,
} from "./shaders";
import {
  buildArtefacts,
  buildShards,
  buildSortingBars,
  buildVoid,
  CodeScreen,
  terminalTexture,
  type Artefact,
  type Shard,
  type VoidScreen,
} from "./fx";

export const FOV = 35;
const IDLE: Record<string, number> = { sway: 1, bob: 2, drift: 3, flicker: 4, rise: 5 };
const KIND: Record<string, number> = { inkBleed: 1, tear: 2, burn: 3, shatter: 4, glow: 5 };

export type AnchorSpec = {
  id: string;
  beat: string;
  at: [number, number, number?];
  t: [number, number];
  kind: string;
  el: HTMLElement;
};

export type StageEvents = {
  onBeat?: (id: string, t: number) => void;
  onHoverPath?: (id: PathId | null, x: number, y: number) => void;
  onHoverProject?: (slug: string | null) => void;
  onClickProject?: (slug: string) => void;
  onProgress?: (p: number) => void;
};

type LayerMesh = { mesh: THREE.Mesh; def: LayerDef; mat: THREE.ShaderMaterial; panel: PanelDef };
type PanelGroup = { def: PanelDef; group: THREE.Group; layers: LayerMesh[]; border?: THREE.Mesh };
type BeatGroup = { id: string; group: THREE.Group; panels: PanelGroup[] };

const LITE = (tier: Tier) => tier === "lite";

export class Stage {
  readonly renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 400);
  private rt: THREE.WebGLRenderTarget;
  private snapRT: THREE.WebGLRenderTarget;
  private post: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private postScene = new THREE.Scene();
  private postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  private laid: Laid[] = [];
  private keys: GlobalKey[] = [];
  private windows: TransitionWindow[] = [];
  private beats = new Map<string, BeatGroup>();
  private layerMats: THREE.ShaderMaterial[] = [];
  private timeMats: THREE.ShaderMaterial[] = [];
  private textures = new Map<string, THREE.Texture>();
  private pending = new Map<string, Promise<THREE.Texture>>();
  private anchors: AnchorSpec[] = [];

  private scroll = 0;
  private aspect = 1;
  private width = 1;
  private height = 1;
  private dpr = 1;
  private pointer = new THREE.Vector2(0, 0);
  private pointerPx = { x: 0, y: 0 };
  private raycaster = new THREE.Raycaster();
  private clock = new THREE.Clock();
  private time = 0;
  private raf = 0;
  private running = false;
  private snapFor = -1;
  private frameTimes: number[] = [];

  // story state
  flood = 0;
  private floodTarget = 0;
  private floodC = new THREE.Vector2(0.5, 0.55);
  private impact = 0;
  private holds: Record<GateKind, number> = { awaken: 0, rise: 0, choose: 0, enter: 0 };
  private riseDone = 0;
  private enterDone = 0;
  private chosen: PathId | null = null;
  private hoverPath: PathId | null = null;
  private hoverSlug: string | null = null;
  private current = { id: "title", t: 0, index: 0 };

  // set pieces
  private code = new CodeScreen();
  private artefacts: Artefact[] = [];
  private shards: Shard[] = [];
  private voidScreens: VoidScreen[] = [];
  private voidGroup: THREE.Group | null = null;
  private sorting: ReturnType<typeof buildSortingBars> | null = null;
  private uniforms = {
    uTime: { value: 0 },
    uFlood: { value: 0 },
    uFloodC: { value: new THREE.Vector2(0.5, 0.55) },
    uRes: { value: new THREE.Vector2(1, 1) },
  };

  constructor(
    private canvas: HTMLCanvasElement,
    readonly tier: Tier,
    private events: StageEvents = {},
  ) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: tier !== "lite",
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.dpr = Math.min(
      window.devicePixelRatio || 1,
      tier === "ultra" ? 1.75 : tier === "high" ? 1.4 : 1,
    );
    this.renderer.setPixelRatio(this.dpr);
    this.rt = new THREE.WebGLRenderTarget(4, 4, { samples: tier === "lite" ? 0 : 4 });
    this.rt.texture.colorSpace = THREE.SRGBColorSpace;
    this.snapRT = new THREE.WebGLRenderTarget(4, 4);
    this.snapRT.texture.colorSpace = THREE.SRGBColorSpace;
    this.post = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        vertexShader: POST_VERT,
        fragmentShader: POST_FRAG,
        uniforms: {
          tScene: { value: this.rt.texture },
          tSnap: { value: this.snapRT.texture },
          uKind: { value: 0 },
          uP: { value: 0 },
          uTime: { value: 0 },
          uRes: { value: new THREE.Vector2(1, 1) },
          uMonitor: { value: 0 },
          uImpact: { value: 0 },
          uGrain: { value: tier === "lite" ? 0.03 : 0.045 },
          uInk: { value: new THREE.Color("#0E0E10") },
          uLite: { value: tier === "lite" ? 1 : 0 },
        },
        depthTest: false,
        depthWrite: false,
      }),
    );
    this.postScene.add(this.post);
    canvas.addEventListener("webglcontextlost", this.onContextLost, false);
    this.setLayout(null);
    this.resize();
  }

  onContextLost = (e: Event) => {
    e.preventDefault();
    this.stop();
    document.documentElement.classList.add("webgl-lost");
  };

  /* ---------------------------------------------------------------- layout */

  get story() {
    return this.laid;
  }

  setLayout(chosen: PathId | null) {
    this.chosen = chosen;
    this.laid = layoutStory(BEATS, pathOrder(chosen));
    this.keys = cameraKeys(this.laid);
    this.windows = transitionWindows(this.laid);
    this.snapFor = -1;
    for (const b of this.laid) {
      const g = this.beats.get(b.id);
      if (g) g.group.position.y = b.originY;
    }
    if (this.voidGroup) {
      const v = this.laid.find((b) => b.id === "void");
      if (v) this.voidGroup.position.y = v.originY;
    }
  }

  setAnchors(a: AnchorSpec[]) {
    this.anchors = a;
  }

  /* ---------------------------------------------------------------- loading */

  private loadTexture(url: string): Promise<THREE.Texture> {
    const hit = this.textures.get(url);
    if (hit) return Promise.resolve(hit);
    const p = this.pending.get(url);
    if (p) return p;
    const pr = fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`${url} ${r.status}`);
        return r.blob();
      })
      .then((b) => createImageBitmap(b, { imageOrientation: "flipY", premultiplyAlpha: "none" }))
      .then((bmp) => {
        const t = new THREE.Texture(bmp as unknown as HTMLImageElement);
        t.flipY = false;
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = this.tier === "lite" ? 1 : 4;
        t.generateMipmaps = true;
        t.minFilter = THREE.LinearMipmapLinearFilter;
        t.needsUpdate = true;
        this.textures.set(url, t);
        return t;
      });
    this.pending.set(url, pr);
    return pr;
  }

  private artUrl(art: string, layer: string, mode: string) {
    return `/art/${art}/${layer}-${mode}${LITE(this.tier) ? "-lite" : ""}.webp`;
  }

  private placeholder = (() => {
    const t = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1);
    t.needsUpdate = true;
    return t;
  })();

  /** Build every beat; resolve once the first beats' art is on the GPU (real progress). */
  async build(firstBeats = 3) {
    const needed: Promise<unknown>[] = [];
    let done = 0;
    let total = 0;
    const track = <T>(p: Promise<T>) => {
      total++;
      return p.then((v) => {
        done++;
        this.events.onProgress?.(done / total);
        return v;
      });
    };
    for (const b of this.laid) {
      const bg: BeatGroup = { id: b.id, group: new THREE.Group(), panels: [] };
      bg.group.position.y = b.originY;
      for (const p of b.panels) {
        const pg = this.buildPanel(
          p,
          b.bg,
          b.index < firstBeats ? track : (x) => x,
          needed,
          b.index < firstBeats,
        );
        bg.panels.push(pg);
        bg.group.add(pg.group);
      }
      this.scene.add(bg.group);
      this.beats.set(b.id, bg);
      this.buildFx(b, bg);
    }
    await Promise.all(needed);
    this.events.onProgress?.(1);
  }

  private buildPanel(
    p: PanelDef,
    pageBg: string,
    track: <T>(x: Promise<T>) => Promise<T>,
    needed: Promise<unknown>[],
    eager: boolean,
  ): PanelGroup {
    const group = new THREE.Group();
    const h = p.w / p.aspect;
    group.position.set(p.x, p.y, p.z ?? 0);
    group.rotation.z = ((p.rot ?? 0) * Math.PI) / 180;
    group.userData = { baseX: p.x, w: p.w, h };
    const layers: LayerMesh[] = [];
    p.layers.forEach((l, i) => {
      const mat = this.layerMaterial(l, p);
      const [rx, ry, rw, rh] = l.rect ?? [0, 0, 1, 1];
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(p.w * rw, h * rh), mat);
      mesh.position.set((rx + rw / 2 - 0.5) * p.w, (0.5 - (ry + rh / 2)) * h, l.z);
      mesh.renderOrder = Math.round((p.z ?? 0) * 100 + l.z * 100 + i);
      mesh.userData.rest = mesh.position.clone();
      group.add(mesh);
      layers.push({ mesh, def: l, mat, panel: p });
      // textures
      if (!l.art.startsWith("$")) {
        const load = (mode: "ink" | "colour", uni: "uInk" | "uCol") => {
          const pr = this.loadTexture(this.artUrl(l.art, l.layer!, mode)).then((t) => {
            mat.uniforms[uni].value = t;
            if (uni === "uCol") mat.uniforms.uHasCol.value = 1;
          });
          if (eager && mode === "ink") needed.push(track(pr));
          else if (eager) needed.push(pr);
          return pr;
        };
        const modes = ART_MODES[l.art] ?? ["ink"];
        if (modes.includes("ink")) load("ink", "uInk");
        if (modes.includes("colour") && !l.inkOnly) {
          if (!modes.includes("ink")) load("colour", "uInk");
          else load("colour", "uCol");
        }
      } else if (l.art.startsWith("$shot:")) {
        this.loadTexture(l.art.slice(6)).then((t) => (mat.uniforms.uInk.value = t));
      }
    });
    let border: THREE.Mesh | undefined;
    if (p.border) {
      const pad = 0.3;
      const bm = new THREE.ShaderMaterial({
        vertexShader: LAYER_VERT,
        fragmentShader: BORDER_FRAG,
        uniforms: {
          uSize: { value: new THREE.Vector2(p.w, h) },
          uPad: { value: pad },
          uWidth: { value: 0.085 },
          uOpacity: { value: 1 },
          uColour: {
            value: new THREE.Color(
              new THREE.Color(pageBg).getHSL({ h: 0, s: 0, l: 0 }).l < 0.35 ? "#F2EFE8" : "#0E0E10",
            ),
          },
          uTime: this.uniforms.uTime,
          uIdle: { value: 0 },
          uSeed: { value: 0 },
        },
        transparent: true,
        depthWrite: false,
      });
      border = new THREE.Mesh(new THREE.PlaneGeometry(p.w + pad * 2, h + pad * 2), bm);
      border.position.z = 0.001;
      border.renderOrder = Math.round((p.z ?? 0) * 100) + 99;
      group.add(border);
    }
    return { def: p, group, layers, border };
  }

  private layerMaterial(l: LayerDef, p: PanelDef): THREE.ShaderMaterial {
    const h = p.w / p.aspect;
    const aspectU = new THREE.Vector2(Math.max(1, p.aspect), Math.max(1, 1 / p.aspect));
    const special: Record<string, string> = {
      $waves: WAVES_FRAG,
      $splash: SPLASH_FRAG,
      $rays: RAYS_FRAG,
      $vortex: VORTEX_FRAG,
      $system: SYSTEM_FRAG,
    };
    const frag = special[l.art];
    if (frag) {
      const mat = new THREE.ShaderMaterial({
        vertexShader: LAYER_VERT,
        fragmentShader: frag,
        uniforms: {
          uTime: this.uniforms.uTime,
          uIdle: { value: 0 },
          uSeed: { value: 0 },
          uOpacity: { value: 1 },
          uAspect: { value: aspectU },
          uRise: { value: 0 },
          uPower: { value: 0 },
          uSpin: { value: 0 },
          uColour: { value: 0 },
        },
        transparent: l.art === "$splash" || !!l.add,
        blending: l.add ? THREE.AdditiveBlending : THREE.NormalBlending,
        depthWrite: false,
      });
      mat.userData.kind = l.art;
      this.timeMats.push(mat);
      return mat;
    }
    let tex: THREE.Texture = this.placeholder;
    if (l.art === "$code") tex = this.code.texture;
    if (l.art === "$terminal") tex = terminalTexture();
    const mat = new THREE.ShaderMaterial({
      vertexShader: LAYER_VERT,
      fragmentShader: LAYER_FRAG,
      uniforms: {
        uInk: { value: tex },
        uCol: { value: tex },
        uHasCol: { value: 0 },
        uFlood: this.uniforms.uFlood,
        uFloodC: this.uniforms.uFloodC,
        uRes: this.uniforms.uRes,
        uTime: this.uniforms.uTime,
        uOpacity: { value: l.opacity ?? 1 },
        uIdle: { value: IDLE[l.idle ?? ""] ?? 0 },
        uSeed: { value: Math.random() },
        uDim: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: l.add ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    mat.userData.h = h;
    this.layerMats.push(mat);
    return mat;
  }

  private buildFx(b: Laid, bg: BeatGroup) {
    if (b.fx === "choose") {
      this.artefacts = buildArtefacts();
      for (const a of this.artefacts) bg.group.add(a.group);
    }
    if (b.fx === "shatter") {
      this.shards = buildShards();
      for (const s of this.shards) bg.group.add(s.mesh);
    }
    if (b.fx === "sorting") {
      this.sorting = buildSortingBars();
      this.sorting.group.position.set(4.6, -7.4, 1.2);
      this.sorting.group.scale.setScalar(1.1);
      bg.group.add(this.sorting.group);
    }
    if (b.fx === "void") {
      const v = buildVoid((url) => {
        const t = this.textures.get(url);
        if (t) return t;
        const tex = new THREE.Texture();
        this.loadTexture(url).then((real) => {
          for (const s of this.voidScreens) {
            const m = s.mesh.material as THREE.ShaderMaterial;
            if (m.uniforms.uMap.value === tex) m.uniforms.uMap.value = real;
          }
        });
        return tex;
      });
      this.voidGroup = v.group;
      this.voidScreens = v.screens;
      v.group.position.y = b.originY;
      this.scene.add(v.group);
    }
  }

  /* ---------------------------------------------------------------- inputs */

  setScroll(vh: number) {
    this.scroll = vh;
  }

  setPointer(clientX: number, clientY: number) {
    this.pointerPx = { x: clientX, y: clientY };
    this.pointer.set((clientX / this.width) * 2 - 1, -(clientY / this.height) * 2 + 1);
  }

  setHold(kind: GateKind, p: number) {
    this.holds[kind] = p;
  }

  /** A gate completed: start its set piece. */
  complete(kind: GateKind) {
    if (kind === "awaken") {
      this.floodTarget = 1;
      this.impact = 1;
      this.holds.awaken = 1;
    }
    if (kind === "rise") this.riseDone = 1;
    if (kind === "enter") this.enterDone = 1;
  }

  /** Jump the flood (returning visitors, look-dev). */
  setFlood(v: number) {
    this.flood = v;
    this.floodTarget = v;
  }

  choose(id: PathId | null) {
    this.setLayout(id);
  }

  clickAt(clientX: number, clientY: number) {
    this.setPointer(clientX, clientY);
    const hit = this.pick();
    if (hit?.slug) this.events.onClickProject?.(hit.slug);
    return hit;
  }

  private pick(): { path?: PathId; slug?: string } | null {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    if (this.current.id === "choose" && this.artefacts.length) {
      const hits = this.raycaster.intersectObjects(
        this.artefacts.map((a) => a.group),
        true,
      );
      for (const h of hits) {
        let o: THREE.Object3D | null = h.object;
        while (o && !o.userData.pathId) o = o.parent;
        if (o) return { path: o.userData.pathId as PathId };
      }
      // generous hit: nearest artefact on screen within 110 px
      let best: { id: PathId; d: number } | null = null;
      for (const a of this.artefacts) {
        const sp = this.toScreen(a.group.getWorldPosition(new THREE.Vector3()));
        const d = Math.hypot(sp.x - this.pointerPx.x, sp.y - this.pointerPx.y);
        if (d < 120 && (!best || d < best.d)) best = { id: a.id, d };
      }
      if (best) return { path: best.id };
    }
    if (this.current.id === "void" && this.voidScreens.length) {
      const hits = this.raycaster.intersectObjects(this.voidScreens.map((s) => s.mesh));
      if (hits[0]) return { slug: hits[0].object.userData.slug as string };
    }
    return null;
  }

  /* ---------------------------------------------------------------- loop */

  start() {
    if (this.running) return;
    this.running = true;
    this.clock.start();
    const loop = () => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(loop);
      this.frame();
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.aspect = this.width / this.height;
    this.renderer.setSize(this.width, this.height, false);
    const pw = Math.round(this.width * this.dpr);
    const ph = Math.round(this.height * this.dpr);
    this.rt.setSize(pw, ph);
    this.snapRT.setSize(pw, ph);
    this.uniforms.uRes.value.set(pw, ph);
    (this.post.material.uniforms.uRes.value as THREE.Vector2).set(pw, ph);
    this.camera.aspect = this.aspect;
    this.camera.updateProjectionMatrix();
    this.applyDepthCompensation();
    this.snapFor = -1;
  }

  /** Scale each layer so the panel composes exactly at its rest framing, however deep the layer is. */
  private applyDepthCompensation() {
    const sq = xSquash(this.aspect);
    for (const b of this.laid) {
      const bg = this.beats.get(b.id);
      if (!bg) continue;
      const restH = b.cam[0]?.h ?? 11;
      const D = frameDistance(restH, this.aspect, FOV);
      for (const pg of bg.panels) {
        pg.group.position.x = pg.def.x * sq;
        for (const l of pg.layers) {
          const z = (pg.def.z ?? 0) + l.def.z;
          const s = (D - z) / D;
          const rest = l.mesh.userData.rest as THREE.Vector3;
          l.mesh.scale.setScalar(s);
          l.mesh.position.set(rest.x * s, rest.y * s, rest.z);
        }
      }
    }
  }

  private cameraFor(s: number) {
    const c = cameraAt(this.keys, s);
    const sq = xSquash(this.aspect);
    const dist = frameDistance(c.h, this.aspect, FOV);
    return { x: c.x * sq, y: c.y, z: c.z ?? dist, rot: (c.rot * Math.PI) / 180 };
  }

  private placeCamera(s: number, live: boolean) {
    const c = this.cameraFor(s);
    let px = 0;
    let py = 0;
    if (live && this.tier !== "lite") {
      px = this.pointer.x * 0.12;
      py = this.pointer.y * 0.08;
    }
    const breathe = live ? Math.sin(this.time * 0.4) * 0.03 : 0;
    this.camera.position.set(c.x + px, c.y + py + breathe, c.z);
    this.camera.rotation.set(0, 0, c.rot + (live ? Math.sin(this.time * 0.23) * 0.002 : 0));
    this.camera.updateMatrixWorld();
  }

  private toScreen(v: THREE.Vector3) {
    const p = v.clone().project(this.camera);
    return { x: (p.x * 0.5 + 0.5) * this.width, y: (-p.y * 0.5 + 0.5) * this.height, z: p.z };
  }

  private frame() {
    const dt = Math.min(0.05, this.clock.getDelta());
    this.time += dt;
    this.uniforms.uTime.value = this.time;
    this.adaptQuality(dt);

    const s = this.scroll;
    const { index, t } = beatAt(this.laid, s);
    const beat = this.laid[index];
    if (beat.id !== this.current.id || Math.abs(t - this.current.t) > 0.001) {
      this.current = { id: beat.id, t, index };
      this.events.onBeat?.(beat.id, t);
    }

    // flood + impact
    this.flood += (this.floodTarget - this.flood) * Math.min(1, dt * 0.9);
    if (this.floodTarget === 1 && this.flood > 0.995) this.flood = 1;
    this.uniforms.uFlood.value = this.flood;
    this.impact = Math.max(0, this.impact - dt * 6);

    const win = transitionAt(this.windows, s);
    this.placeCamera(s, true);
    this.updateBeats(index, win);
    this.updateFx(beat, t, dt);

    // snapshot of the previous beat when a transition window opens
    if (win && this.snapFor !== win.to) {
      this.placeCamera(win.s0 - 1e-3, false);
      this.updateBeats(win.from, null);
      this.renderer.setRenderTarget(this.snapRT);
      this.renderer.setClearColor(this.laid[win.from].bg, 1);
      this.renderer.render(this.scene, this.camera);
      this.snapFor = win.to;
      this.placeCamera(s, true);
      this.updateBeats(index, win);
    }
    if (!win) this.snapFor = -1;

    // page colour
    const next = this.laid[Math.min(this.laid.length - 1, index + 1)];
    const bgc = new THREE.Color(beat.bg);
    if (!next.enter && t > 0.85) bgc.lerp(new THREE.Color(next.bg), (t - 0.85) / 0.15);
    this.renderer.setRenderTarget(this.rt);
    this.renderer.setClearColor(bgc, 1);
    this.renderer.render(this.scene, this.camera);

    // post
    const u = this.post.material.uniforms;
    u.uKind.value = win ? KIND[win.kind] : 0;
    u.uP.value = win ? win.p : 0;
    u.uTime.value = this.time;
    const inVoid = beat.id === "void" ? Math.min(1, t * 8, (1 - t) * 8) : 0;
    u.uMonitor.value = inVoid;
    u.uImpact.value = this.impact > 0.5 ? 1 : 0;
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.postScene, this.postCam);

    this.updateAnchors(index, t, win);
  }

  private updateBeats(index: number, win: (TransitionWindow & { p: number }) | null) {
    const id = this.laid[index].id;
    for (const b of this.laid) {
      const bg = this.beats.get(b.id);
      if (!bg) continue;
      const near = Math.abs(b.index - index) <= 1;
      bg.group.visible = near || (!!win && (b.index === win.from || b.index === win.to));
    }
    if (this.voidGroup) this.voidGroup.visible = id === "void" || id === "enter" || id === "power";
  }

  private updateFx(beat: Laid, t: number, dt: number) {
    for (const m of this.timeMats) {
      const k = m.userData.kind as string;
      if (k === "$splash") m.uniforms.uRise.value = beat.id === "title" ? t : 1;
      if (k === "$rays") m.uniforms.uPower.value = Math.max(this.holds.awaken * 0.9, this.impact);
      if (k === "$vortex") {
        m.uniforms.uSpin.value = this.holds.rise + this.riseDone;
        m.uniforms.uColour.value = this.flood;
      }
      if (k === "$system") m.uniforms.uPower.value = this.holds.enter + this.enterDone;
    }
    // code on the monitor
    this.code.update(this.holds.awaken, this.flood, this.time);
    // flood centre: the monitor screen
    const mon = this.beats.get("awaken");
    if (mon && this.flood < 1) {
      const sp = this.toScreen(
        new THREE.Vector3(0, this.laid.find((b) => b.id === "awaken")!.originY - 5.4, 0),
      );
      this.floodC.set(sp.x / this.width, 1 - sp.y / this.height);
      this.uniforms.uFloodC.value.copy(this.floodC);
    }
    // the hero rises with the hold
    const rise = this.beats.get("rise");
    if (rise) {
      const hero = rise.panels.find((p) => p.def.id === "hero");
      if (hero) {
        const p = Math.min(
          1,
          this.holds.rise * 0.6 + this.riseDone * (beat.id === "rise" ? Math.max(0.6, t) : 1),
        );
        hero.group.position.y = hero.def.y + p * 9;
        hero.group.rotation.z = Math.sin(this.time * 0.8) * 0.02;
      }
    }
    // artefacts
    if (this.artefacts.length) {
      const hit = this.current.id === "choose" ? this.pick() : null;
      const hp = hit?.path ?? null;
      if (hp !== this.hoverPath) {
        this.hoverPath = hp;
      }
      this.events.onHoverPath?.(hp, this.pointerPx.x, this.pointerPx.y);
      for (const a of this.artefacts) {
        const target = a.id === hp || a.id === this.chosen ? 1 : 0;
        a.hover += (target - a.hover) * Math.min(1, dt * 8);
        const taken = this.chosen === a.id ? this.holds.choose : 0;
        a.group.position.set(
          a.base.x * xSquash(this.aspect),
          a.base.y + Math.sin(this.time * 1.2 + a.base.x) * 0.12 + a.hover * 0.5 + taken * 0.6,
          a.base.z + a.hover * 0.6,
        );
        a.group.rotation.y += dt * (0.3 + a.hover * 1.6);
        a.group.rotation.z = Math.sin(this.time * 3) * 0.08 * a.hover;
        a.group.scale.setScalar(
          (1 + a.hover * 0.18 + taken * 0.2) * (this.chosen && this.chosen !== a.id ? 0.8 : 1),
        );
        a.glow.material.opacity = 0.35 + a.hover * 0.5 + taken * 0.4;
      }
    }
    // shards
    if (this.shards.length) {
      const b = this.laid.find((x) => x.id === "dawn")!;
      const local = this.current.id === "dawn" ? t : this.current.index > b.index ? 1 : 0;
      for (const sh of this.shards) {
        const k = Math.min(1, local * 1.6);
        const e = 1 - Math.pow(1 - k, 3);
        const tgt = sh.target;
        const start = new THREE.Vector3(0, -6.5, 0.5);
        const pos = start.lerp(new THREE.Vector3(tgt.x * xSquash(this.aspect), tgt.y, tgt.z), e);
        // the cursor pushes shards away
        const sp = this.toScreen(pos.clone().add(new THREE.Vector3(0, b.originY, 0)));
        const dx = sp.x - this.pointerPx.x;
        const dy = sp.y - this.pointerPx.y;
        const d = Math.hypot(dx, dy);
        if (d < 220) {
          pos.x += (dx / (d || 1)) * (220 - d) * 0.004;
          pos.y -= (dy / (d || 1)) * (220 - d) * 0.004;
        }
        sh.mesh.position.lerp(pos, Math.min(1, dt * 6));
        sh.mesh.rotation.set(
          Math.sin(this.time * sh.spin.x + sh.seed) * 0.4,
          Math.sin(this.time * sh.spin.y + sh.seed) * 0.5,
          Math.sin(this.time * 0.3 + sh.seed) * 0.2,
        );
        sh.mesh.scale.setScalar(0.3 + e * 0.72);
        (sh.mesh.material as THREE.ShaderMaterial).uniforms.uOpacity.value =
          Math.min(1, local * 4) * (1 - Math.max(0, local - 0.9) * 6);
      }
    }
    this.sorting?.update(this.time);
    // void: hover, fog
    if (this.voidScreens.length && this.voidGroup?.visible) {
      const hit = this.current.id === "void" ? this.pick() : null;
      const slug = hit?.slug ?? null;
      if (slug !== this.hoverSlug) {
        this.hoverSlug = slug;
        this.events.onHoverProject?.(slug);
      }
      const camZ = this.camera.position.z;
      for (const s of this.voidScreens) {
        s.hover += ((s.slug === slug ? 1 : 0) - s.hover) * Math.min(1, dt * 8);
        const m = s.mesh.material as THREE.ShaderMaterial;
        const dz = camZ - s.pos.z;
        m.uniforms.uOpacity.value =
          Math.min(1, Math.max(0, (34 - dz) / 14)) * Math.min(1, Math.max(0, (dz + 1) / 3));
        m.uniforms.uHover.value = s.hover;
        m.uniforms.uTime.value = this.time;
        s.mesh.position.set(
          s.pos.x * Math.max(0.62, xSquash(this.aspect)),
          s.pos.y + Math.sin(this.time * 0.6 + s.pos.z) * 0.08,
          s.pos.z,
        );
        s.mesh.scale.setScalar(1 + s.hover * 0.08);
      }
    }
  }

  private updateAnchors(index: number, t: number, win: (TransitionWindow & { p: number }) | null) {
    const sq = xSquash(this.aspect);
    const refD = frameDistance(10, this.aspect, FOV);
    const v = new THREE.Vector3();
    for (const a of this.anchors) {
      const b = this.laid.find((x) => x.id === a.beat);
      let op = 0;
      if (b) {
        if (b.index === index) op = windowOpacity(t, a.t);
        if (win) {
          if (b.index === win.to)
            op = b.index === index ? op * Math.max(0, (win.p - 0.55) / 0.45) : 0;
          if (b.index === win.from) op = 0;
        }
      }
      if (op <= 0.001 || !b) {
        if (a.el.style.visibility !== "hidden") {
          a.el.style.visibility = "hidden";
          a.el.style.opacity = "0";
        }
        continue;
      }
      v.set(a.at[0] * sq, b.originY + a.at[1], a.at[2] ?? 0.6);
      if (b.id === "void") v.set(a.at[0] * Math.max(0.62, sq), b.originY + a.at[1], a.at[2] ?? 0);
      const dist = Math.max(0.5, this.camera.position.z - v.z);
      const p = this.toScreen(v);
      if (p.z > 1) {
        a.el.style.visibility = "hidden";
        continue;
      }
      if (a.kind === "void")
        op *=
          Math.min(1, Math.max(0, (30 - dist) / 12)) * Math.min(1, Math.max(0, (dist - 1.5) / 2));
      if (op <= 0.001) {
        a.el.style.visibility = "hidden";
        continue;
      }
      const raw = refD / dist;
      const scale =
        a.kind === "title"
          ? Math.min(1.05, raw)
          : a.kind === "void"
            ? Math.min(1.4, raw)
            : a.kind === "big"
              ? Math.pow(raw, 0.6)
              : Math.min(1.15, Math.max(0.78, Math.pow(raw, 0.3)));
      a.el.style.visibility = "visible";
      a.el.style.opacity = op.toFixed(3);
      // keep boxes on screen (phones): measure once, clamp the anchor x
      const child = a.el.firstElementChild as HTMLElement | null;
      const w = (child?.offsetWidth ?? 0) * scale;
      let x = p.x;
      if (w && a.kind !== "title" && a.kind !== "void") {
        const side = a.el.classList.contains("side-c")
          ? 0.5
          : a.el.classList.contains("side-r")
            ? 1
            : 0;
        const left = x - w * side;
        if (left < 10) x += 10 - left;
        if (left + w > this.width - 10) x -= left + w - (this.width - 10);
      }
      a.el.style.transform = `translate3d(${x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
    }
  }

  private adaptQuality(dt: number) {
    this.frameTimes.push(dt);
    if (this.frameTimes.length < 90) return;
    const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    this.frameTimes = [];
    if (avg > 0.024 && this.dpr > 0.75) {
      this.dpr = Math.max(0.75, this.dpr - 0.2);
      this.renderer.setPixelRatio(this.dpr);
      this.resize();
    }
  }

  dispose() {
    this.stop();
    this.canvas.removeEventListener("webglcontextlost", this.onContextLost);
    this.renderer.dispose();
    this.rt.dispose();
    this.snapRT.dispose();
    for (const t of this.textures.values()) t.dispose();
  }
}

/** Which modes each art plate has (mirrors src/art/registry.ts without importing the SVG code). */
export const ART_MODES: Record<string, ("ink" | "colour")[]> = {};

/** Fill ART_MODES from the build manifest. */
export async function loadArtManifest() {
  const r = await fetch("/art/manifest.json");
  const m = (await r.json()) as Record<string, { modes: ("ink" | "colour")[] }>;
  for (const [k, v] of Object.entries(m)) ART_MODES[k] = v.modes;
}

export { BASIC_VERT };
