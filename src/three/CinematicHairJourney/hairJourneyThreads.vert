precision highp float;

uniform float uTime;
uniform float uFinalProgress;
uniform vec2 uMouse;
uniform vec2 uFrameScale;
uniform float uQuality;

attribute float aRibbonIndex;
attribute vec4 aRandom;
attribute float aBandUv;

varying vec2 vUv;
varying float vBandUv;
varying float vUnwoven;
varying float vRandom;
varying float vOpacity;

void main() {
  vUv = uv;
  vBandUv = aBandUv;
  vRandom = aRandom.x;

  float progress = clamp(uFinalProgress, 0.0, 1.0);
  float birth = smoothstep(0.015, 0.2, progress);
  float spread = smoothstep(0.05, 0.4, progress);
  float settle = smoothstep(0.48, 0.96, progress);
  float unwoven = sin(smoothstep(0.0, 1.0, progress) * 3.14159265);
  unwoven *= 1.0 - settle * 0.72;
  vUnwoven = unwoven;
  vOpacity = birth;

  vec2 transformed = position.xy;
  vec2 collapsedScale = vec2(0.095, 0.72);
  transformed *= mix(collapsedScale, uFrameScale, spread);

  float outerRibbon = abs(aRibbonIndex * 2.0 - 1.0);
  float edgeMotion = 0.28 + pow(outerRibbon, 1.4) * 0.72;
  float phase = aRandom.x * 14.0 + aRibbonIndex * 10.0;
  float primaryWave = sin(position.x * mix(5.0, 9.0, aRandom.y) + phase + uTime * 0.42);
  float fineWave = sin(position.x * 17.0 - uTime * 0.25 + phase * 0.7);
  transformed.y += (primaryWave * 0.052 + fineWave * 0.014) * unwoven * edgeMotion * uQuality;
  transformed.x += (aRandom.z - 0.5) * 0.1 * unwoven * edgeMotion;
  transformed.y += (aRandom.y - 0.5) * 0.065 * unwoven;
  transformed.x += uMouse.x * 0.018 * unwoven;
  transformed.y += uMouse.y * 0.012 * unwoven * edgeMotion;

  gl_Position = vec4(transformed, 0.0, 1.0);
}
