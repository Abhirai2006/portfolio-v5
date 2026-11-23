/**
 * Alpha-preserving ink compositor (ARCHITECTURE §4, ruling in the build ledger):
 *   scene → [Sobel on depth = ink outlines] + [threshold → blur = bloom on light only] + chromatic aberration
 * The canvas is transparent and sits above the giant DOM type, so outlines and glow are written with alpha:
 * ink lines and fire stay visible over the type, empty space stays see-through.
 */
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { world } from "../store";

const VERT = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const THRESHOLD = /* glsl */ `
uniform sampler2D tColor; uniform float uThreshold; varying vec2 vUv;
void main(){
  vec4 c = texture2D(tColor, vUv);
  float l = max(c.r, max(c.g, c.b));
  float k = smoothstep(uThreshold, uThreshold + 0.5, l);
  gl_FragColor = vec4(c.rgb * k, 1.0);
}`;

const BLUR = /* glsl */ `
uniform sampler2D tInput; uniform vec2 uDir; varying vec2 vUv;
void main(){
  vec3 s = texture2D(tInput, vUv).rgb * 0.227027;
  s += texture2D(tInput, vUv + uDir * 1.384615).rgb * 0.316216;
  s += texture2D(tInput, vUv - uDir * 1.384615).rgb * 0.316216;
  s += texture2D(tInput, vUv + uDir * 3.230769).rgb * 0.070270;
  s += texture2D(tInput, vUv - uDir * 3.230769).rgb * 0.070270;
  gl_FragColor = vec4(s, 1.0);
}`;

const COMPOSITE = /* glsl */ `
uniform sampler2D tColor; uniform sampler2D tDepth; uniform sampler2D tBloom;
uniform vec2 uTexel; uniform float uNear; uniform float uFar;
uniform float uAberration; uniform float uBloom; uniform float uEdge; uniform vec3 uInk;
varying vec2 vUv;
float lin(vec2 uv){
  float z = texture2D(tDepth, uv).x * 2.0 - 1.0;
  return (2.0 * uNear * uFar) / (uFar + uNear - z * (uFar - uNear));
}
void main(){
  vec2 dir = vUv - 0.5;
  vec2 off = dir * uAberration * 0.014;
  vec4 c = texture2D(tColor, vUv);
  c.r = texture2D(tColor, vUv + off).r;
  c.b = texture2D(tColor, vUv - off).b;

  // Sobel edge detection on linear depth → ink outline (relative, so thickness reads the same near and far).
  vec2 t = uTexel * 1.25;
  float tl = lin(vUv + vec2(-t.x,  t.y)), tc = lin(vUv + vec2(0.0,  t.y)), tr = lin(vUv + vec2( t.x,  t.y));
  float ml = lin(vUv + vec2(-t.x, 0.0)),  mc = lin(vUv),                    mr = lin(vUv + vec2( t.x, 0.0));
  float bl = lin(vUv + vec2(-t.x, -t.y)), bc = lin(vUv + vec2(0.0, -t.y)), br = lin(vUv + vec2( t.x, -t.y));
  float gx = (tr + 2.0 * mr + br) - (tl + 2.0 * ml + bl);
  float gy = (tl + 2.0 * tc + tr) - (bl + 2.0 * bc + br);
  float nearest = min(mc, min(min(ml, mr), min(tc, bc)));
  float edge = smoothstep(0.03, 0.09, length(vec2(gx, gy)) / max(nearest, 0.001)) * uEdge;

  vec3 col = mix(c.rgb, uInk, edge);
  float alpha = max(c.a, edge);

  vec3 bloom = texture2D(tBloom, vUv).rgb * uBloom;
  col += bloom;
  alpha = max(alpha, clamp(max(bloom.r, max(bloom.g, bloom.b)), 0.0, 1.0));

  col = pow(max(col, 0.0), vec3(1.0 / 2.2)); // linear → display
  gl_FragColor = vec4(col, alpha);
}`;

function fsPass(frag: string, uniforms: Record<string, THREE.IUniform>) {
  return new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: frag,
    uniforms,
    depthTest: false,
    depthWrite: false,
  });
}

export function InkComposer({
  bloom = 1.1,
  aberration = 0.25,
}: {
  bloom?: number;
  aberration?: number;
}) {
  const { gl, size, viewport } = useThree();

  const res = useMemo(() => {
    const sceneRT = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
    sceneRT.depthTexture = new THREE.DepthTexture(1, 1);
    const half = { type: THREE.HalfFloatType, depthBuffer: false };
    const a = new THREE.WebGLRenderTarget(1, 1, half);
    const b = new THREE.WebGLRenderTarget(1, 1, half);
    // Bloom only on light (fire, glow, lightning: emissive/additive values above 1), never on lit paper.
    const threshold = fsPass(THRESHOLD, { tColor: { value: null }, uThreshold: { value: 1.25 } });
    const blur = fsPass(BLUR, { tInput: { value: null }, uDir: { value: new THREE.Vector2() } });
    const composite = fsPass(COMPOSITE, {
      tColor: { value: null },
      tDepth: { value: null },
      tBloom: { value: null },
      uTexel: { value: new THREE.Vector2() },
      uNear: { value: 0.1 },
      uFar: { value: 100 },
      uAberration: { value: aberration },
      uBloom: { value: bloom },
      uEdge: { value: 1 },
      uInk: { value: new THREE.Color("#0b0b0c").convertSRGBToLinear() },
    });
    composite.transparent = true;
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), composite);
    quad.frustumCulled = false;
    const quadScene = new THREE.Scene();
    quadScene.add(quad);
    const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    return { sceneRT, a, b, threshold, blur, composite, quad, quadScene, quadCam };
  }, []);

  useEffect(() => {
    const dpr = viewport.dpr;
    const w = Math.max(1, Math.floor(size.width * dpr));
    const h = Math.max(1, Math.floor(size.height * dpr));
    res.sceneRT.setSize(w, h);
    res.a.setSize(Math.max(1, w >> 2), Math.max(1, h >> 2));
    res.b.setSize(Math.max(1, w >> 2), Math.max(1, h >> 2));
    res.composite.uniforms.uTexel.value.set(1 / w, 1 / h);
  }, [size, viewport.dpr, res]);

  useEffect(
    () => () => {
      res.sceneRT.dispose();
      res.a.dispose();
      res.b.dispose();
    },
    [res],
  );

  useFrame((state) => {
    const { scene, camera } = state;
    const cam = camera as THREE.PerspectiveCamera;
    gl.setClearColor(0x000000, 0);

    gl.setRenderTarget(res.sceneRT);
    gl.clear();
    gl.render(scene, camera);

    // Bloom at quarter resolution: threshold, then two separable blur passes.
    const qw = res.a.width;
    const qh = res.a.height;
    res.quad.material = res.threshold;
    res.threshold.uniforms.tColor.value = res.sceneRT.texture;
    gl.setRenderTarget(res.a);
    gl.render(res.quadScene, res.quadCam);
    res.quad.material = res.blur;
    for (const spread of [1, 2]) {
      res.blur.uniforms.tInput.value = res.a.texture;
      res.blur.uniforms.uDir.value.set(spread / qw, 0);
      gl.setRenderTarget(res.b);
      gl.render(res.quadScene, res.quadCam);
      res.blur.uniforms.tInput.value = res.b.texture;
      res.blur.uniforms.uDir.value.set(0, spread / qh);
      gl.setRenderTarget(res.a);
      gl.render(res.quadScene, res.quadCam);
    }

    const s = world.get();
    const u = res.composite.uniforms;
    u.tColor.value = res.sceneRT.texture;
    u.tDepth.value = res.sceneRT.depthTexture;
    u.tBloom.value = res.a.texture;
    u.uNear.value = cam.near;
    u.uFar.value = cam.far;
    u.uAberration.value = s.reduced ? 0 : s.cinematic ? aberration * 1.8 : aberration;
    res.quad.material = res.composite;
    gl.setRenderTarget(null);
    gl.clear();
    gl.render(res.quadScene, res.quadCam);
  }, 1);

  return null;
}
