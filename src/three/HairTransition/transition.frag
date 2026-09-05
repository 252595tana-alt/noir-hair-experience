uniform sampler2D uTexture1;
uniform sampler2D uTexture2;
uniform vec2 uSize1;
uniform vec2 uSize2;
uniform vec2 uResolution;
uniform float uProgress;
uniform float uDirection;
uniform float uQuality;
uniform float uFocus;
varying vec2 vUv;
void main() {
  float hairMask = smoothstep(0.08, 0.38, abs(vUv.x - 0.5));
  float wave = sin(uProgress * 3.14159265) * flowNoise(vUv) * 0.035 * uQuality * hairMask;
  vec2 offset = vec2(wave * uDirection, 0.0);
  vec2 firstUv = coverUv(vUv + offset, uSize1, uResolution, uFocus);
  vec2 nextUv = coverUv(vUv - offset, uSize2, uResolution, uFocus);
  if (uSize1.x > uSize1.y) firstUv = containUv(vUv + offset, uSize1, uResolution);
  if (uSize2.x > uSize2.y) nextUv = containUv(vUv - offset, uSize2, uResolution);
  vec4 first = mix(vec4(0.0024,0.0024,0.0027,1.0), texture2D(uTexture1, firstUv), inFrame(firstUv));
  vec4 next = mix(vec4(0.0024,0.0024,0.0027,1.0), texture2D(uTexture2, nextUv), inFrame(nextUv));
  gl_FragColor = mix(first, next, smoothstep(0.0, 1.0, uProgress));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
