precision highp float;

uniform float uTime;
uniform float uCutProgress;
uniform float uPointSize;
uniform float uDpr;

attribute vec4 aRandom;
varying float vAlpha;
varying float vWarmth;

void main() {
  float burst = sin(clamp(uCutProgress, 0.0, 1.0) * 3.14159265);
  float cutY = mix(-1.7, -0.9, uCutProgress);
  float angle = aRandom.x * 6.2831853;
  float distanceTravelled = pow(uCutProgress, 0.72) * mix(0.08, 0.34, aRandom.y);
  vec3 transformed = vec3(
    (aRandom.z - 0.5) * 0.38,
    cutY,
    (aRandom.w - 0.5) * 0.12
  );
  transformed.x += cos(angle) * distanceTravelled;
  transformed.y += sin(angle) * distanceTravelled * 0.38 - distanceTravelled * 0.1;
  transformed.x += sin(uTime * (0.7 + aRandom.y) + aRandom.w * 9.0) * 0.015 * burst;

  vec4 viewPosition = modelViewMatrix * vec4(transformed, 1.0);
  gl_Position = projectionMatrix * viewPosition;
  gl_PointSize = uPointSize * uDpr * mix(0.65, 1.1, aRandom.z);
  vAlpha = burst * mix(0.2, 0.52, aRandom.y);
  vWarmth = aRandom.w;
}
