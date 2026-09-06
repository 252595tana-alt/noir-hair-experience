precision highp float;

uniform sampler2D uTexture;
uniform vec2 uTextureSize;
uniform vec2 uResolution;
uniform float uDirection;
uniform float uRole;
uniform float uQuality;
uniform float uFocus;

varying vec2 vUv;
varying float vBandUv;
varying float vDispersion;
varying float vRibbonProgress;
varying float vRandom;

void main() {
  vec2 sourceUv = coverUv(vUv, uTextureSize, uResolution, uFocus);
  float frame = inFrame(sourceUv);
  float shift = vDispersion * mix(0.00035, 0.00145, uQuality) * (0.65 + vRandom * 0.35);
  vec2 chromaAxis = vec2(uDirection, (vRandom - 0.5) * 0.35);

  vec4 center = texture2D(uTexture, sourceUv);
  vec3 shifted = vec3(
    texture2D(uTexture, sourceUv + chromaAxis * shift).r,
    center.g,
    texture2D(uTexture, sourceUv - chromaAxis * shift).b
  );

  vec2 blurStep = vec2(0.0012, 0.00075) * vDispersion * uQuality;
  vec3 softened = (
    center.rgb +
    texture2D(uTexture, sourceUv + blurStep).rgb +
    texture2D(uTexture, sourceUv - blurStep).rgb
  ) / 3.0;
  vec3 color = mix(shifted, softened, vDispersion * 0.18 * uQuality);

  float bandDistance = min(vBandUv, 1.0 - vBandUv) * 2.0;
  float bandEdge = 1.0 - smoothstep(0.0, 0.19, bandDistance);
  float highlight = bandEdge * vDispersion * (0.025 + vRandom * 0.025);
  color += vec3(0.82, 0.85, 0.9) * highlight;

  float ribbonEdgeFade = mix(1.0, mix(0.58, 1.0, smoothstep(0.0, 0.13, bandDistance)), vDispersion);
  float photoEdgeFade = smoothstep(0.0, 0.025, vUv.x) * smoothstep(0.0, 0.025, 1.0 - vUv.x);
  float roleOpacity = uRole < 0.0
    ? 1.0 - smoothstep(0.58, 0.98, vRibbonProgress)
    : smoothstep(0.02, 0.42, vRibbonProgress);
  float opacity = center.a * frame * photoEdgeFade * ribbonEdgeFade * roleOpacity;
  opacity *= 1.0 - vDispersion * (0.13 + vRandom * 0.06);

  gl_FragColor = vec4(color, opacity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
