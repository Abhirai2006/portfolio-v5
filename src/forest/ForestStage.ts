/**
 * The rainforest stage (v3): one WebGL renderer, one scene, the thin-lens camera from optics.ts.
 * The React layer (components/forest/ForestExperience.tsx) feeds it the scroll progress from
 * GSAP ScrollTrigger; it eases towards it, runs the physics and renders.
 */
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";
import { Optics } from "./optics";
import { buildOpening, type FrameInfo, type Load, type Tier } from "./opening";

export type StageOptions = {
  tier: Tier;
  onProgress?: (loaded: number) => void;
  onFrame?: (info: FrameInfo, p: number) => void;
};

export class ForestStage {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(34, 1, 0.01, 900);
  private optics: Optics;
  private clock = new THREE.Clock();
  private raf = 0;
  private target = 0;
  private p = 0;
  private update: ((p: number, dt: number, t: number) => import("./optics").Lens) | null = null;
  private info: FrameInfo | null = null;
  private manager = new THREE.LoadingManager();
  private disposed = false;
  ready: Promise<void>;
  private noDof = typeof location !== "undefined" && /dof=off/.test(location.search);

  constructor(
    private canvas: HTMLCanvasElement,
    private opts: StageOptions,
  ) {
    const lite = opts.tier === "lite";
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, lite ? 1 : 1.25));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.optics = new Optics(this.renderer, lite ? 20 : 44, lite ? 14 : 26, lite ? 0 : 4);
    this.manager.onProgress = (_url, loaded, total) =>
      opts.onProgress?.(loaded / Math.max(1, total));

    const gltfLoader = new GLTFLoader(this.manager);
    const texLoader = new THREE.TextureLoader(this.manager);
    const hdrLoader = new HDRLoader(this.manager);
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const load: Load = {
      gltf: (url) => gltfLoader.loadAsync(url),
      texture: async (url, srgb = false) => {
        const t = await texLoader.loadAsync(url);
        if (srgb) t.colorSpace = THREE.SRGBColorSpace;
        return t;
      },
      hdr: async (url) => {
        const t = await hdrLoader.loadAsync(url);
        t.mapping = THREE.EquirectangularReflectionMapping;
        const env = pmrem.fromEquirectangular(t).texture;
        t.dispose();
        return env;
      },
    };

    this.resize();
    window.addEventListener("resize", this.resize);
    const debugView = new URLSearchParams(location.search).get("view");
    this.ready = buildOpening(this.scene, this.camera, load, opts.tier, debugView).then((o) => {
      this.update = o.update;
      this.info = o.info;
      pmrem.dispose();
      // Compile every shader before the first visible frame (no hitch on the first scroll).
      this.renderer.compile(this.scene, this.camera);
    });
  }

  /** Scroll progress through the opening, 0..1. */
  setProgress(p: number) {
    this.target = Math.min(1, Math.max(0, p));
  }

  start() {
    const loop = () => {
      if (this.disposed) return;
      this.raf = requestAnimationFrame(loop);
      this.frame();
    };
    this.clock.start();
    loop();
  }

  /** Render one frame (also used by the screenshot scripts with a fixed progress). */
  frame(dtOverride?: number) {
    const dt = dtOverride ?? Math.min(this.clock.getDelta(), 1 / 15);
    const t = this.clock.elapsedTime;
    // Critically damped approach to the scroll position: smooth, but never far behind.
    this.p += (this.target - this.p) * (1 - Math.exp(-dt * 5));
    if (Math.abs(this.target - this.p) < 1e-4) this.p = this.target;
    if (!this.update) return;
    const lens = this.update(this.p, dt, t);
    if (this.noDof) lens.fNumber = 1e4;
    this.optics.render(this.scene, this.camera, lens, t);
    if (this.info) this.opts.onFrame?.(this.info, this.p);
  }

  /** Jump straight to a progress value (no easing): used when the page loads mid-scroll. */
  snap(p: number) {
    this.target = this.p = Math.min(1, Math.max(0, p));
  }

  private resize = () => {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    const pr = this.renderer.getPixelRatio();
    this.optics.setSize(Math.round(w * pr), Math.round(h * pr));
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  };

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.resize);
    this.optics.dispose();
    this.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.geometry?.dispose();
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m) => m?.dispose());
      }
    });
    this.renderer.dispose();
  }
}
