/**
 * GLSL for the comic (original shaders). Layers sample an ink plate and its colour twin and mix
 * them through the colour-flood mask; the post pass does transitions, the monitor look, impact
 * frames, grain and vignette.
 */

export const NOISE = /* glsl */ `
float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ float v = 0.0; float a = 0.5; for (int i = 0; i < 5; i++){ v += a*noise(p); p *= 2.03; a *= 0.5; } return v; }
`;

export const LAYER_VERT = /* glsl */ `
uniform float uTime; uniform float uIdle; uniform float uSeed;
varying vec2 vUv;
void main(){
  vUv = uv;
  vec3 p = position;
  float t = uTime + uSeed * 10.0;
  if (uIdle > 0.5 && uIdle < 1.5) { p.x += sin(t*0.9) * 0.05 * uv.y; p.y += sin(t*0.7) * 0.015 * uv.y; }       // sway
  else if (uIdle > 1.5 && uIdle < 2.5) { p.y += sin(t*1.4) * 0.035; }                                       // bob
  else if (uIdle > 2.5 && uIdle < 3.5) { p.x += sin(t*0.15) * 0.12; p.y += cos(t*0.11) * 0.05; }             // drift
  else if (uIdle > 4.5) { p.y += sin(t*0.8) * 0.08; }                                                        // rise
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;

export const LAYER_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uInk; uniform sampler2D uCol; uniform float uHasCol;
uniform float uFlood; uniform vec2 uFloodC; uniform vec2 uRes; uniform float uTime;
uniform float uOpacity; uniform float uIdle; uniform float uSeed; uniform float uDim;
varying vec2 vUv;
${NOISE}
void main(){
  vec4 a = texture2D(uInk, vUv);
  vec4 c = uHasCol > 0.5 ? texture2D(uCol, vUv) : a;
  vec2 sp = gl_FragCoord.xy / uRes;
  float asp = uRes.x / uRes.y;
  float d = length((sp - uFloodC) * vec2(asp, 1.0));
  float n = fbm(sp * 5.0 + vec2(uTime * 0.05, 0.0)) * 0.35;
  float r = uFlood * 2.6;
  float m = 1.0 - smoothstep(r - 0.22, r, d + n);
  vec4 col = mix(a, c, m);
  // the travelling edge of the flood glows electric blue
  float edge = smoothstep(r - 0.06, r - 0.01, d + n) * (1.0 - smoothstep(r - 0.01, r + 0.03, d + n));
  col.rgb += vec3(0.38, 0.68, 1.0) * edge * step(0.001, uFlood) * step(uFlood, 0.999) * 1.4 * col.a;
  float flick = uIdle > 3.5 && uIdle < 4.5 ? 0.92 + 0.08 * sin(uTime * 23.0 + uSeed) * sin(uTime * 7.0) : 1.0;
  col.rgb *= flick * (1.0 - uDim);
  gl_FragColor = vec4(col.rgb, col.a * uOpacity);
}`;

/** Ink border + offset shadow for a panel (drawn on a plane a little larger than the panel). */
export const BORDER_FRAG = /* glsl */ `
precision highp float;
uniform vec2 uSize; uniform float uPad; uniform float uWidth; uniform float uOpacity; uniform vec3 uColour;
varying vec2 vUv;
${NOISE}
void main(){
  vec2 p = vUv * (uSize + 2.0 * uPad) - uPad;           // world units inside the panel rect
  float wob = (noise(p * 3.0) - 0.5) * uWidth * 0.6;
  float dx = min(p.x, uSize.x - p.x);
  float dy = min(p.y, uSize.y - p.y);
  float d = min(dx, dy) + wob;
  float inside = step(0.0, min(dx, dy));
  float band = smoothstep(-uWidth * 0.5 - 0.01, -uWidth * 0.5, d) * (1.0 - smoothstep(uWidth * 0.5, uWidth * 0.5 + 0.01, d));
  // hard offset shadow, bottom-right, outside the panel
  vec2 q = p - vec2(0.14, -0.14);
  float sh = step(0.0, q.x) * step(q.x, uSize.x) * step(0.0, q.y) * step(q.y, uSize.y) * (1.0 - inside);
  float a = max(band, sh * 0.9);
  gl_FragColor = vec4(uColour, a * uOpacity);
}`;

/** Title background: slow, living dry-brush ink waves on charcoal (broad soft strokes). */
export const WAVES_FRAG = /* glsl */ `
precision highp float;
uniform float uTime; uniform float uOpacity; uniform vec2 uAspect;
varying vec2 vUv;
${NOISE}
void main(){
  vec2 p = vUv * uAspect;
  float t = uTime * 0.05;
  vec2 w = vec2(fbm(p * 0.9 + vec2(t, 1.3)), fbm(p * 0.9 + vec2(4.1, -t)));
  float y = p.y * 3.4 + w.x * 1.6 + sin(p.x * 1.1 + t * 3.0) * 0.35;
  float band = abs(fract(y) - 0.5) * 2.0;                     // 0 at the stroke centre
  float stroke = 1.0 - smoothstep(0.35, 0.95, band);
  // bristles run along the stroke (horizontal): vary slowly in x, fast across
  float bristle = noise(vec2(p.x * 1.8 + w.y * 2.0, y * 26.0));
  float dry = smoothstep(0.3, 0.75, bristle + (1.0 - band) * 0.35 - fbm(p * 3.0 + t) * 0.25);
  float ink = stroke * dry;
  vec3 base = vec3(0.098, 0.098, 0.11);
  vec3 col = mix(base, vec3(0.19, 0.19, 0.205), ink * 0.9);
  col += (noise(p * 380.0) - 0.5) * 0.025;
  gl_FragColor = vec4(col, uOpacity);
}`;

/** The white ink cloud that boils up from the bottom of the title panel, with flying drops. */
export const SPLASH_FRAG = /* glsl */ `
precision highp float;
uniform float uTime; uniform float uRise; uniform vec2 uAspect; uniform float uOpacity;
varying vec2 vUv;
${NOISE}
void main(){
  vec2 p = vec2(vUv.x * uAspect.x, vUv.y);
  float t = uTime;
  float base = 0.1 + uRise * 0.08;
  float h = base + (noise(vec2(p.x * 3.0, t * 0.2)) - 0.5) * 0.03;
  // boiling bubbles: round tops that grow, pop and regrow
  for (int i = 0; i < 22; i++) {
    float fi = float(i);
    float cx = (hash(vec2(fi, 1.0)) * 1.2 - 0.1) * uAspect.x + sin(t * 0.13 + fi) * 0.05;
    float life = fract(t * (0.04 + hash(vec2(fi, 3.0)) * 0.05) + hash(vec2(fi, 5.0)));
    float r = (0.04 + hash(vec2(fi, 7.0)) * 0.08) * (0.35 + 0.65 * sin(life * 3.14159)) * (0.85 + uRise * 0.5);
    float dx = (p.x - cx) / max(r, 1e-3);
    float top = base - r * 0.4 + r * sqrt(max(0.0, 1.0 - dx * dx)) * (1.5 + hash(vec2(fi, 9.0)) * 0.6);
    // smooth union with what is already there: puffy cumulus, no walls
    float k = 0.025;
    float hh = clamp(0.5 + 0.5 * (top - h) / k, 0.0, 1.0);
    h = mix(h, top, hh) + k * hh * (1.0 - hh);
  }
  h += (noise(vec2(p.x * 40.0, t * 0.5)) - 0.5) * 0.004;
  float body = smoothstep(h + 0.0025, h - 0.0025, p.y);
  // drops thrown up from the cloud
  float drop = 0.0;
  for (int i = 0; i < 18; i++) {
    float fi = float(i);
    float ph = fract(t * (0.12 + hash(vec2(fi, 11.0)) * 0.1) + hash(vec2(fi, 13.0)));
    vec2 c = vec2(hash(vec2(fi, 15.0)) * uAspect.x, base + 0.05 + sin(ph * 3.14159) * (0.12 + hash(vec2(fi, 17.0)) * 0.2));
    float rad = 0.004 + hash(vec2(fi, 19.0)) * 0.011;
    vec2 d = (p - c) * vec2(1.0, 1.0 + (1.0 - ph) * 0.6);
    drop = max(drop, smoothstep(rad, rad * 0.7, length(d)));
  }
  float a = max(body, drop);
  gl_FragColor = vec4(vec3(0.95, 0.94, 0.91), a * uOpacity);
}`;

/** Light streaming out of the monitor during the hold (additive). */
export const RAYS_FRAG = /* glsl */ `
precision highp float;
uniform float uTime; uniform float uPower; uniform vec2 uAspect;
varying vec2 vUv;
${NOISE}
void main(){
  vec2 p = (vUv - vec2(0.5, 0.58)) * uAspect;
  float r = length(p);
  float a = atan(p.y, p.x);
  float rays = pow(noise(vec2(a * 9.0, uTime * 0.6)) * 0.7 + noise(vec2(a * 23.0, -uTime)) * 0.3, 2.0);
  float core = exp(-r * (3.2 - uPower * 2.0));
  vec3 col = vec3(0.2, 0.45, 1.0) * core * (0.6 + rays * 1.4) + vec3(0.6, 0.85, 1.0) * exp(-r * 9.0) * 0.6;
  gl_FragColor = vec4(col * uPower * 1.6, 1.0);
}`;

/** Black page with a white ink vortex; uSpin speeds up as the hero rises. */
export const VORTEX_FRAG = /* glsl */ `
precision highp float;
uniform float uTime; uniform float uSpin; uniform vec2 uAspect; uniform float uColour;
varying vec2 vUv;
${NOISE}
void main(){
  vec2 p = (vUv - 0.5) * uAspect;
  p.x *= 1.6;
  float r = length(p);
  float a = atan(p.y, p.x);
  float t = uTime * (0.25 + uSpin * 0.9);
  float swirl = a + r * 2.4 - t;
  float streak = noise(vec2(swirl * 6.0, r * 3.0 - t * 2.0)) * 0.7 + noise(vec2(swirl * 17.0, r * 9.0)) * 0.3;
  float funnel = smoothstep(1.2, 0.15, abs(p.x) / (0.35 + abs(p.y) * 0.5 + 0.2));
  float ink = smoothstep(0.48, 0.62, streak * funnel + funnel * 0.25);
  vec3 white = vec3(0.95, 0.94, 0.91);
  vec3 col = mix(vec3(0.02), white, ink);
  // after the awakening, blue droplets ride the vortex
  float drop = step(0.93, noise(vec2(swirl * 30.0, r * 30.0 - t * 4.0))) * funnel * uColour;
  col = mix(col, vec3(0.38, 0.68, 1.0), drop);
  gl_FragColor = vec4(col, 1.0);
}`;

/** The "enter the system" screen: a glowing grid tunnel. */
export const SYSTEM_FRAG = /* glsl */ `
precision highp float;
uniform float uTime; uniform float uPower; uniform vec2 uAspect;
varying vec2 vUv;
${NOISE}
void main(){
  vec2 p = (vUv - 0.5) * uAspect;
  float z = 0.25 / max(0.02, abs(p.y) + 0.05);
  vec2 g = vec2(p.x * z, z + uTime * (0.6 + uPower * 3.0));
  float grid = max(smoothstep(0.96, 1.0, abs(fract(g.x) - 0.5) * 2.0), smoothstep(0.92, 1.0, abs(fract(g.y) - 0.5) * 2.0));
  float fade = smoothstep(0.0, 0.5, abs(p.y));
  vec3 col = vec3(0.01, 0.02, 0.08) + vec3(0.12, 0.42, 1.0) * grid * fade * 1.3;
  col += vec3(0.4, 0.7, 1.0) * exp(-length(p) * (6.0 - uPower * 4.0)) * (0.5 + uPower);
  gl_FragColor = vec4(col, 1.0);
}`;

/** Plain textured / tinted planes (void screens, shards). */
export const BASIC_VERT = /* glsl */ `
varying vec2 vUv; varying vec3 vN; varying vec3 vView;
void main(){
  vUv = uv;
  vN = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;

export const SHARD_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uMap; uniform float uOpacity; uniform float uTime;
varying vec2 vUv; varying vec3 vN; varying vec3 vView;
void main(){
  float fres = pow(1.0 - abs(dot(vN, vView)), 2.0);
  vec4 t = texture2D(uMap, vUv);
  vec3 glass = vec3(0.12, 0.3, 0.9) * 0.6 + vec3(0.7, 0.85, 1.0) * fres;
  vec3 col = mix(glass, t.rgb, t.a);
  float edge = smoothstep(0.42, 0.5, max(abs(vUv.x - 0.5), abs(vUv.y - 0.5)));
  col += vec3(0.8, 0.9, 1.0) * edge * 0.5;
  float a = clamp(0.5 + fres * 0.5 + t.a, 0.0, 1.0);
  gl_FragColor = vec4(col, a * uOpacity);
}`;

export const SCREEN_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uMap; uniform float uOpacity; uniform float uHover; uniform float uTime;
varying vec2 vUv; varying vec3 vN; varying vec3 vView;
void main(){
  vec3 c = texture2D(uMap, vUv).rgb;
  float scan = 0.94 + 0.06 * sin(vUv.y * 700.0 + uTime * 4.0);
  vec2 e = min(vUv, 1.0 - vUv);
  float rim = 1.0 - smoothstep(0.0, 0.02, min(e.x, e.y));
  vec3 col = c * scan * (0.82 + uHover * 0.25) + vec3(0.25, 0.55, 1.0) * rim * (0.8 + uHover);
  gl_FragColor = vec4(col, uOpacity);
}`;

/** Full-screen post pass. */
export const POST_VERT = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

export const POST_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tScene; uniform sampler2D tSnap;
uniform float uKind; uniform float uP; uniform float uTime; uniform vec2 uRes;
uniform float uMonitor; uniform float uImpact; uniform float uGrain; uniform vec3 uInk; uniform float uLite;
varying vec2 vUv;
${NOISE}

vec2 barrel(vec2 uv, float k){ vec2 c = uv - 0.5; float r2 = dot(c, c); return 0.5 + c * (1.0 + k * r2); }

float voronoi(vec2 x, out vec2 cell){
  vec2 n = floor(x); vec2 f = fract(x); float md = 8.0; vec2 mc = vec2(0.0);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++){
    vec2 g = vec2(float(i), float(j));
    vec2 o = vec2(hash(n + g), hash(n + g + 17.0));
    vec2 r = g + o - f; float d = dot(r, r);
    if (d < md){ md = d; mc = n + g; }
  }
  cell = mc; return md;
}

void main(){
  vec2 uv = vUv;
  if (uMonitor > 0.001) uv = mix(uv, barrel(uv, 0.22), uMonitor);
  vec3 live = texture2D(tScene, uv).rgb;
  vec3 col = live;
  float p = uP;
  vec2 asp = vec2(uRes.x / uRes.y, 1.0);

  if (uKind > 0.5 && uKind < 1.5) {                       // INK BLEED: streaks rise, then the next scene rises out of the ink
    vec3 snap = texture2D(tSnap, vUv).rgb;
    // thin vertical drips: every column has its own length, edges break up like dry ink
    float colId = floor(vUv.x * uRes.x / 3.0);
    float streak = hash(vec2(colId, 1.0)) * 0.45 + noise(vec2(vUv.x * 16.0, 2.0)) * 0.55;
    float brk = (noise(vec2(colId * 0.7, vUv.y * 90.0)) - 0.5) * 0.12;
    float a = clamp(p * 2.0, 0.0, 1.0);
    float b = clamp(p * 2.0 - 1.0, 0.0, 1.0);
    float inked = step(1.0 - vUv.y + brk, a * 1.6 - streak * 0.6);
    float revealed = step(vUv.y + brk, b * 1.6 - streak * 0.6);
    col = mix(snap, uInk, inked);
    col = mix(col, live, revealed);
  } else if (uKind > 1.5 && uKind < 2.5) {                // PAPER TEAR: the old page rips upward
    vec3 snap = texture2D(tSnap, vUv).rgb;
    float jag = (noise(vec2(vUv.x * 18.0, 1.0)) - 0.5) * 0.09 + (noise(vec2(vUv.x * 90.0, 2.0)) - 0.5) * 0.025;
    float line = mix(-0.15, 1.15, p) + jag;
    float above = step(line, vUv.y);
    float fibre = smoothstep(0.0, 0.012, vUv.y - line) * (1.0 - smoothstep(0.012, 0.028 + noise(vec2(vUv.x * 200.0, 0.0)) * 0.02, vUv.y - line));
    float shadow = smoothstep(0.08, 0.0, line - vUv.y) * (1.0 - above);
    col = mix(live * (1.0 - shadow * 0.45), snap, above);
    col = mix(col, vec3(0.97, 0.96, 0.93), fibre);
  } else if (uKind > 2.5 && uKind < 3.5) {                // BURN: the old page burns away with a glowing edge
    vec3 snap = texture2D(tSnap, vUv).rgb;
    float n = fbm(vUv * asp * 3.0) * 0.8 + (1.0 - vUv.y) * 0.35;
    float th = p * 1.25;
    float burnt = step(n, th);
    float edge = smoothstep(th + 0.06, th, n) * (1.0 - burnt);
    vec3 glow = mix(vec3(1.0, 0.55, 0.1), vec3(0.38, 0.68, 1.0), smoothstep(0.0, 1.0, p));
    col = mix(snap * (1.0 - edge * 0.7), live, burnt) + glow * edge * 2.2;
  } else if (uKind > 3.5 && uKind < 4.5) {                // SHATTER: glass cells crack and fall away
    vec2 cell;
    float d = voronoi(vUv * asp * 6.0, cell);
    float delay = hash(cell) * 0.55;
    float lp = clamp((p - delay) / 0.45, 0.0, 1.0);
    vec2 dir = normalize(cell / (asp * 6.0) - 0.5 + 0.0001);
    vec2 suv = vUv - dir * lp * lp * 0.4 + vec2(0.0, lp * lp * 0.2);
    vec3 snap = texture2D(tSnap, suv).rgb;
    vec2 c2; float d2 = voronoi((vUv) * asp * 6.0 + 0.002, c2);
    float crack = smoothstep(0.004, 0.0, abs(sqrt(d) - sqrt(d2))) ;
    float gone = step(0.98, lp);
    col = mix(snap + vec3(0.5, 0.7, 1.0) * (crack * step(0.001, p) + lp * 0.25), live, gone);
  } else if (uKind > 4.5 && uKind < 5.5) {                // GLOW: blinding light, then the next scene
    vec3 snap = texture2D(tSnap, vUv).rgb;
    vec3 white = vec3(0.86, 0.93, 1.0);
    col = p < 0.5 ? mix(snap, white, smoothstep(0.0, 0.5, p)) : mix(white, live, smoothstep(0.5, 1.0, p));
  }

  if (uMonitor > 0.001) {                                  // inside the monitor
    float scan = 0.92 + 0.08 * sin(vUv.y * uRes.y * 1.2);
    vec2 c = abs(uv - 0.5) * 2.0;
    vec2 q = max(c - 0.86, 0.0);
    float corner = 1.0 - smoothstep(0.1, 0.16, length(q));
    float outside = step(1.0, max(c.x, c.y));
    col *= mix(1.0, scan, uMonitor);
    col += vec3(0.1, 0.16, 0.3) * smoothstep(0.7, 0.0, distance(vUv, vec2(0.2, 0.85))) * 0.25 * uMonitor;
    col = mix(col, vec3(0.0), (1.0 - corner * (1.0 - outside)) * uMonitor);
  }

  if (uImpact > 0.001) col = mix(col, vec3(1.0) - col, uImpact);

  float vig = smoothstep(1.25, 0.35, length((vUv - 0.5) * vec2(1.2, 1.0)));
  col *= mix(0.78, 1.0, vig);
  col += (hash(vUv * uRes + fract(uTime) * 91.0) - 0.5) * uGrain;
  gl_FragColor = vec4(col, 1.0);
}`;
