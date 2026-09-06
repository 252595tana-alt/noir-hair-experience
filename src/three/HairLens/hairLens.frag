precision highp float;

uniform sampler2D uCurrentTexture;
uniform sampler2D uTryTexture;
uniform vec2 uMouse;
uniform vec2 uResolution;
uniform vec2 uCurrentSize;
uniform vec2 uTrySize;
uniform float uRadius;
uniform float uQuality;
uniform float uProgress;
uniform float uApplying;
uniform vec3 uAccent;
varying vec2 vUv;

float maximumChannel(vec3 value) {
  return max(value.r, max(value.g, value.b));
}

float colorDifferenceAt(vec2 screenUv) {
  vec2 currentUv = containUv(screenUv, uCurrentSize, uResolution);
  vec2 tryUv = containUv(screenUv, uTrySize, uResolution);
  float visible = inFrame(currentUv) * inFrame(tryUv);
  vec3 current = texture2D(uCurrentTexture, currentUv).rgb;
  vec3 candidate = texture2D(uTryTexture, tryUv).rgb;
  return maximumChannel(abs(candidate - current)) * visible;
}

void main() {
  vec2 currentUv = containUv(vUv, uCurrentSize, uResolution);
  vec2 tryUv = containUv(vUv, uTrySize, uResolution);
  float frame = inFrame(currentUv) * inFrame(tryUv);
  if (frame < 0.5) discard;

  vec2 sampleStep = 1.35 / max(uResolution, vec2(1.0));
  float centerDifference = colorDifferenceAt(vUv);
  float nearbyDifference = max(
    max(colorDifferenceAt(vUv + vec2(sampleStep.x, 0.0)), colorDifferenceAt(vUv - vec2(sampleStep.x, 0.0))),
    max(colorDifferenceAt(vUv + vec2(0.0, sampleStep.y)), colorDifferenceAt(vUv - vec2(0.0, sampleStep.y)))
  );
  float expandedDifference = max(centerDifference, nearbyDifference * 0.78);
  float difference = mix(centerDifference, expandedDifference, 0.45 + uQuality * 0.45);
  float hairMask = smoothstep(0.014, 0.095, difference);

  float fiber = flowNoise(vec2(tryUv.y * 1.35, tryUv.x * 0.82));
  float fiberOffset = (fiber - 0.5) * uQuality;
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 lensVector = (vUv - uMouse) * vec2(aspect, 1.0);
  float lensDistance = length(lensVector / vec2(0.78, 1.28));
  float organicLensDistance = lensDistance + fiberOffset * 0.012;
  float lens = 1.0 - smoothstep(uRadius - 0.012, uRadius + 0.012, organicLensDistance);
  float lensEdge = exp(-pow((organicLensDistance - uRadius) * 115.0, 2.0));

  float strandPhase = clamp(vUv.x + fiberOffset * 0.07 + (vUv.y - 0.5) * 0.025, 0.0, 1.0);
  float travel = uProgress * 1.24 - 0.12;
  float applyReveal = smoothstep(strandPhase - 0.075, strandPhase + 0.075, travel);
  float applyFront = exp(-pow((strandPhase - travel) * 23.0, 2.0));
  applyFront *= step(0.001, uProgress) * (1.0 - step(0.999, uProgress));

  float activeEdge = mix(lensEdge, applyFront, uApplying) * hairMask;
  vec2 refraction = vec2(fiberOffset * 0.00115, sin(tryUv.y * 72.0 + fiber * 4.0) * 0.00028);
  refraction *= activeEdge * uQuality;

  vec4 current = texture2D(uCurrentTexture, currentUv);
  vec4 candidate = texture2D(uTryTexture, tryUv + refraction);
  float previewBlend = hairMask * lens;
  float settle = smoothstep(0.84, 1.0, uProgress);
  float applyBlend = max(hairMask * applyReveal, settle);
  float blendAmount = mix(previewBlend, applyBlend, uApplying);
  vec3 color = mix(current.rgb, candidate.rgb, blendAmount);

  vec3 sheen = mix(vec3(0.88, 0.9, 0.93), uAccent, 0.32);
  color += sheen * activeEdge * (0.028 + uQuality * 0.026);

  gl_FragColor = vec4(color, current.a * frame);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
