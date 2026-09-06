precision highp float;

uniform float uTime;
uniform float uProgress;
uniform float uDirection;
uniform float uRole;
uniform vec2 uMouse;

attribute float aRibbonIndex;
attribute vec4 aRandom;
attribute float aBandUv;

varying vec2 vUv;
varying float vBandUv;
varying float vDispersion;
varying float vRibbonProgress;
varying float vRandom;

const float PI = 3.141592653589793;

float easeInOut(float value) {
  return value * value * (3.0 - 2.0 * value);
}

void main() {
  vUv = uv;
  vBandUv = aBandUv;
  vRandom = aRandom.x;

  float delayOrder = uRole < 0.0 ? aRandom.w : 1.0 - aRandom.w;
  float delay = delayOrder * 0.14;
  float ribbonProgress = clamp((uProgress - delay) / (1.0 - delay), 0.0, 1.0);
  float eased = easeInOut(ribbonProgress);
  float dispersion = sin(ribbonProgress * PI);
  vRibbonProgress = ribbonProgress;
  vDispersion = dispersion;

  vec2 transformed = position.xy;
  float horizontalEdge = pow(abs(position.x), 1.35);
  float outerRibbon = pow(abs(aRibbonIndex * 2.0 - 1.0), 1.15);
  float looseness = (0.2 + horizontalEdge * 0.8) * (0.48 + outerRibbon * 0.52);

  float phase = aRandom.x * 18.0 + aRibbonIndex * 9.0;
  float speed = mix(0.72, 1.38, aRandom.y);
  float primaryWave = sin(position.x * mix(7.0, 12.0, aRandom.z) + uTime * speed + phase);
  float fineWave = sin(position.x * 19.0 - uTime * (0.45 + aRandom.x * 0.5) + phase * 0.57);
  float amplitude = mix(0.018, 0.055, aRandom.z) * looseness * dispersion;
  transformed.y += primaryWave * amplitude + fineWave * amplitude * 0.25;

  float flutter = sin(uTime * (1.1 + aRandom.y) + phase + position.x * 4.0);
  float rotation = (aRandom.y - 0.5) * 0.19 * dispersion * (0.45 + outerRibbon * 0.55);
  transformed.y += position.x * rotation;
  transformed.x += flutter * 0.017 * dispersion * horizontalEdge;

  float travel = uRole < 0.0 ? -eased : 1.0 - eased;
  float speedOffset = mix(0.94, 1.08, aRandom.y);
  transformed.x += travel * uDirection * 2.45 * speedOffset;
  transformed.y += travel * (aRandom.z - 0.5) * 0.14 * dispersion;

  transformed.x += uMouse.x * 0.055 * dispersion * (0.25 + horizontalEdge * 0.75);
  transformed.y += uMouse.y * 0.032 * dispersion * looseness;
  transformed.y += sin(position.x * 5.0 + uMouse.y * 2.0 + phase) * abs(uMouse.y) * 0.012 * dispersion;

  gl_Position = vec4(transformed, 0.0, 1.0);
}
