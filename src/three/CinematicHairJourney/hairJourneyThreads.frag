precision highp float;

uniform sampler2D uTexture;
uniform float uQuality;

varying vec2 vUv;
varying float vBandUv;
varying float vUnwoven;
varying float vRandom;
varying float vOpacity;

void main() {
  float shift = vUnwoven * mix(0.00025, 0.001, uQuality) * (0.7 + vRandom * 0.3);
  vec4 source = texture2D(uTexture, vUv);
  vec3 color = vec3(
    texture2D(uTexture, vUv + vec2(shift, 0.0)).r,
    source.g,
    texture2D(uTexture, vUv - vec2(shift, 0.0)).b
  );

  float bandDistance = min(vBandUv, 1.0 - vBandUv) * 2.0;
  float bandEdge = 1.0 - smoothstep(0.0, 0.18, bandDistance);
  color += vec3(0.78, 0.8, 0.84) * bandEdge * vUnwoven * 0.035;
  float ribbonFade = mix(1.0, smoothstep(0.0, 0.12, bandDistance), vUnwoven * 0.5);
  float photoEdge = smoothstep(0.0, 0.018, vUv.x) * smoothstep(0.0, 0.018, 1.0 - vUv.x);
  float alpha = source.a * vOpacity * ribbonFade * photoEdge;

  gl_FragColor = vec4(color, alpha);
  #include <colorspace_fragment>
}
