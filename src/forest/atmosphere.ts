/**
 * Humid air: the exponential fog (aerial perspective) gains a low-lying mist that hugs the ground,
 * as it does in a rainforest after rain, and the 360° photo sky fades into the same mist at the
 * horizon so the photo and the 3D forest share one atmosphere. Used by opening.ts.
 */
import * as THREE from "three";

let patched = false;

/** Height fog for every built-in material: thicker near the ground, thinner up in the canopy. */
export function patchGroundMist(mistHeight = 3, mistDistance = 35, strength = 0.85) {
  if (patched) return;
  patched = true;
  const C = THREE.ShaderChunk;
  C.fog_pars_vertex = `#ifdef USE_FOG
  varying float vFogDepth;
  varying float vFogWorldY;
#endif`;
  C.fog_vertex = `#ifdef USE_FOG
  vFogDepth = - mvPosition.z;
  vec4 fogWP = vec4( transformed, 1.0 );
  #ifdef USE_INSTANCING
    fogWP = instanceMatrix * fogWP;
  #endif
  fogWP = modelMatrix * fogWP;
  vFogWorldY = fogWP.y;
#endif`;
  C.fog_pars_fragment = `#ifdef USE_FOG
  uniform vec3 fogColor;
  varying float vFogDepth;
  varying float vFogWorldY;
  #ifdef FOG_EXP2
    uniform float fogDensity;
  #else
    uniform float fogNear;
    uniform float fogFar;
  #endif
#endif`;
  C.fog_fragment = `#ifdef USE_FOG
  #ifdef FOG_EXP2
    float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
  #else
    float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
  #endif
  float mist = ( 1.0 - exp( - vFogDepth / ${mistDistance.toFixed(1)} ) ) * exp( - max( vFogWorldY, 0.0 ) / ${mistHeight.toFixed(1)} ) * ${strength.toFixed(2)};
  fogFactor = clamp( max( fogFactor, mist ), 0.0, 1.0 );
  gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`;
}

/** A photo sky dome that melts into the mist colour below ~20° of elevation. */
export function skyDome(
  map: THREE.Texture,
  fogColor: THREE.Color,
  rotationY: number,
  intensity: number,
) {
  map.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      tSky: { value: map },
      uFog: { value: fogColor },
      uRot: { value: rotationY },
      uIntensity: { value: intensity },
    },
    vertexShader: `varying vec3 vDir; void main(){ vDir = position;
      vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`,
    fragmentShader: `uniform sampler2D tSky; uniform vec3 uFog; uniform float uRot; uniform float uIntensity; varying vec3 vDir;
      void main(){
        vec3 d = normalize(vDir);
        float c = cos(uRot), s = sin(uRot);
        vec3 r = vec3(c * d.x - s * d.z, d.y, s * d.x + c * d.z);
        vec2 uv = vec2(atan(r.z, r.x) / 6.2831853 + 0.5, asin(clamp(r.y, -1.0, 1.0)) / 3.1415927 + 0.5);
        vec3 sky = texture2D(tSky, uv).rgb * uIntensity;
        float elev = asin(clamp(d.y, -1.0, 1.0));
        float mist = 1.0 - smoothstep(0.12, 0.8, elev);
        gl_FragColor = vec4(mix(sky, uFog, mist * 0.94), 1.0);
      }`,
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(800, 48, 24), mat);
  dome.renderOrder = -10;
  dome.frustumCulled = false;
  return dome;
}
