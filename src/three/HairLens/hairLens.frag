uniform sampler2D uCurrentTexture;
uniform sampler2D uTryTexture;
uniform vec2 uMouse;
uniform vec2 uResolution;
uniform vec2 uImageSize;
uniform float uRadius;
uniform float uQuality;
uniform float uSweep;
varying vec2 vUv;
void main() {
  vec2 uv = containUv(vUv, uImageSize, uResolution);
  if (inFrame(uv) < 0.5) discard;
  float distanceToLens = length((vUv - uMouse) * vec2(uResolution.x / uResolution.y, 1.0));
  float mask = 1.0 - smoothstep(uRadius - 0.008, uRadius + 0.008, distanceToLens);
  float edge = exp(-abs(distanceToLens - uRadius) * 400.0);
  vec2 refracted = uv + vec2(flowNoise(uv), 0.0) * edge * 0.0015 * uQuality;
  vec4 current = texture2D(uCurrentTexture, uv);
  vec4 candidate = texture2D(uTryTexture, refracted);
  vec4 result = mix(current, candidate, mask);
  result.rgb += edge * 0.12;
  float sweep = exp(-pow((vUv.x + vUv.y * 0.16 - uSweep * 1.5 + 0.2) * 15.0, 2.0));
  result.rgb += sweep * 0.075 * step(0.001, uSweep) * (1.0 - step(1.0, uSweep));
  gl_FragColor = result;
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
