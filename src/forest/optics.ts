/**
 * A camera that behaves like a real one (DECISIONS V2): the scene is rendered in linear HDR,
 * then blurred with a thin-lens depth of field (circle of confusion from focal length, f-number
 * and focus distance, the same formula as physics.ts), then tone-mapped (ACES) with a gentle
 * vignette and film grain. Used by ForestStage.ts.
 */
import * as THREE from "three";

const FULLSCREEN = new THREE.PlaneGeometry(2, 2);
const VERT = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

/** Pass 1: colour + signed circle of confusion (pixels) in alpha. Negative = in front of the focus plane. */
const COC_FRAG = /* glsl */ `
#include <packing>
uniform sampler2D tColor; uniform sampler2D tDepth;
uniform float uNear, uFar, uFocus, uFocal, uFNumber, uSensorH, uResY, uMaxCoc;
varying vec2 vUv;
void main(){
  vec3 c = texture2D(tColor, vUv).rgb;
  float z = texture2D(tDepth, vUv).x;
  float d = z >= 1.0 ? 1e5 : -perspectiveDepthToViewZ(z, uNear, uFar);
  float A = uFocal / uFNumber;
  float coc = A * uFocal * (d - uFocus) / (d * max(1e-5, uFocus - uFocal)); // metres on the sensor, signed
  float px = clamp(coc / uSensorH * uResY, -uMaxCoc, uMaxCoc);
  gl_FragColor = vec4(c, px);
}`;

/** Pass 2: gather bokeh (golden-angle disc). Near-field blur may spill over sharp pixels; far blur may not. */
const BLUR_FRAG = /* glsl */ `
uniform sampler2D tCoc; uniform vec2 uTexel; uniform float uMaxCoc;
varying vec2 vUv;
#define TAPS __TAPS__
void main(){
  vec4 center = texture2D(tCoc, vUv);
  float cc = center.a;
  vec3 acc = vec3(0.0); float wsum = 0.0;
  const float GA = 2.39996323;
  for (int i = 0; i < TAPS; i++) {
    float fi = float(i) + 0.5;
    float r = sqrt(fi / float(TAPS)) * uMaxCoc;
    float a = fi * GA;
    vec2 uv = vUv + vec2(cos(a), sin(a)) * r * uTexel;
    vec4 s = texture2D(tCoc, uv);
    // A sample in front of the centre can cover it with its own blur; one behind is limited by the centre's.
    float sc = s.a < cc ? abs(s.a) : min(abs(s.a), abs(cc));
    float w = clamp(sc - r + 1.0, 0.0, 1.0);
    // Bright out-of-focus highlights read as bokeh discs, as through a real lens.
    float lum = dot(s.rgb, vec3(0.2126, 0.7152, 0.0722));
    w *= 1.0 + smoothstep(1.2, 4.0, lum) * smoothstep(2.0, 8.0, sc) * 2.0;
    acc += s.rgb * w; wsum += w;
  }
  vec3 col = wsum > 0.0 ? acc / wsum : center.rgb;
  // Tiny in-focus pixels keep their full detail.
  col = mix(center.rgb, col, smoothstep(0.35, 1.25, abs(cc)) );
  gl_FragColor = vec4(col, 1.0);
}`;

/** Pass 3: exposure, ACES tone map, sRGB, vignette, grain. */
const OUT_FRAG = /* glsl */ `
uniform sampler2D tSrc; uniform float uTime; uniform float uVignette; uniform float uGrain; uniform vec2 uRes;
varying vec2 vUv;
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){
  vec3 c = texture2D(tSrc, vUv).rgb;
  vec2 q = vUv - 0.5; q.x *= uRes.x / uRes.y;
  c *= mix(1.0, smoothstep(1.05, 0.25, length(q)), uVignette);
  gl_FragColor = vec4(c, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  float n = hash(vUv * uRes + fract(uTime * 7.31) * 113.0) - 0.5;
  gl_FragColor.rgb += n * uGrain;
}`;

export type Lens = {
  /** Focus distance, metres. */
  focus: number;
  /** f-number (aperture). */
  fNumber: number;
};

export class Optics {
  scene: THREE.WebGLRenderTarget;
  coc: THREE.WebGLRenderTarget;
  blur: THREE.WebGLRenderTarget;
  private cocMat: THREE.ShaderMaterial;
  private blurMat: THREE.ShaderMaterial;
  private outMat: THREE.ShaderMaterial;
  private quad: THREE.Mesh;
  private ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  /** Full-frame sensor height (24 mm): the focal length follows from the camera's field of view. */
  sensorH = 0.024;

  constructor(
    private renderer: THREE.WebGLRenderer,
    taps: number,
    private maxCoc: number,
    samples: number,
  ) {
    const opts = { type: THREE.HalfFloatType, depthBuffer: false } as const;
    this.scene = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      samples,
      depthTexture: new THREE.DepthTexture(1, 1, THREE.FloatType),
    });
    this.coc = new THREE.WebGLRenderTarget(1, 1, opts);
    this.blur = new THREE.WebGLRenderTarget(1, 1, opts);
    const common = { vertexShader: VERT, depthTest: false, depthWrite: false };
    this.cocMat = new THREE.ShaderMaterial({
      ...common,
      fragmentShader: COC_FRAG,
      uniforms: {
        tColor: { value: null },
        tDepth: { value: null },
        uNear: { value: 0.01 },
        uFar: { value: 1000 },
        uFocus: { value: 1 },
        uFocal: { value: 0.035 },
        uFNumber: { value: 2.8 },
        uSensorH: { value: this.sensorH },
        uResY: { value: 1 },
        uMaxCoc: { value: maxCoc },
      },
    });
    this.blurMat = new THREE.ShaderMaterial({
      ...common,
      fragmentShader: BLUR_FRAG.replace("__TAPS__", String(taps)),
      uniforms: {
        tCoc: { value: null },
        uTexel: { value: new THREE.Vector2() },
        uMaxCoc: { value: maxCoc },
      },
    });
    this.outMat = new THREE.ShaderMaterial({
      ...common,
      fragmentShader: OUT_FRAG,
      toneMapped: true,
      uniforms: {
        tSrc: { value: null },
        uTime: { value: 0 },
        uVignette: { value: 0.55 },
        uGrain: { value: 0.018 },
        uRes: { value: new THREE.Vector2(1, 1) },
      },
    });
    this.quad = new THREE.Mesh(FULLSCREEN, this.cocMat);
    this.quad.frustumCulled = false;
  }

  setSize(w: number, h: number) {
    this.scene.setSize(w, h);
    this.coc.setSize(w, h);
    this.blur.setSize(w, h);
    this.blurMat.uniforms.uTexel.value.set(1 / w, 1 / h);
    this.cocMat.uniforms.uResY.value = h;
    this.outMat.uniforms.uRes.value.set(w, h);
    // Blur radius is defined at 900 px of height and scales with the render size.
    const k = h / 900;
    this.cocMat.uniforms.uMaxCoc.value = this.maxCoc * k;
    this.blurMat.uniforms.uMaxCoc.value = this.maxCoc * k;
  }

  render(scene: THREE.Scene, camera: THREE.PerspectiveCamera, lens: Lens, time: number) {
    const r = this.renderer;
    r.setRenderTarget(this.scene);
    r.render(scene, camera);
    const u = this.cocMat.uniforms;
    u.tColor.value = this.scene.texture;
    u.tDepth.value = this.scene.depthTexture;
    u.uNear.value = camera.near;
    u.uFar.value = camera.far;
    u.uFocus.value = Math.max(lens.focus, camera.near * 2);
    u.uFocal.value =
      this.sensorH / 2 / Math.tan(THREE.MathUtils.degToRad(camera.getEffectiveFOV()) / 2);
    u.uFNumber.value = lens.fNumber;
    this.quad.material = this.cocMat;
    r.setRenderTarget(this.coc);
    r.render(this.quad, this.ortho);
    this.blurMat.uniforms.tCoc.value = this.coc.texture;
    this.quad.material = this.blurMat;
    r.setRenderTarget(this.blur);
    r.render(this.quad, this.ortho);
    this.outMat.uniforms.tSrc.value = this.blur.texture;
    this.outMat.uniforms.uTime.value = time;
    this.quad.material = this.outMat;
    r.setRenderTarget(null);
    r.render(this.quad, this.ortho);
  }

  dispose() {
    this.scene.dispose();
    this.coc.dispose();
    this.blur.dispose();
    this.cocMat.dispose();
    this.blurMat.dispose();
    this.outMat.dispose();
  }
}
