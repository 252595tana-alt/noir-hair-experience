attribute vec3 randomPosition;
attribute vec3 targetPosition;
attribute vec3 hairPosition;
uniform float uProgress;
uniform float uHair;
uniform float uTime;
uniform float uDpr;
uniform vec2 uPointer;
uniform float uAmbient;
varying float vAlpha;
void main() {
  vec3 target = mix(targetPosition, hairPosition, uHair);
  vec3 p = mix(randomPosition, target, uProgress);
  p.x += sin(uTime * 0.3 + p.y * 7.0) * 0.009;
  p.y += sin(uTime * 0.2 + p.x * 11.0) * 0.008;
  vec2 delta = p.xy - (uPointer - 0.5) * 2.0;
  float distanceToPointer = length(delta);
  p.xy += normalize(delta + 0.001) * (1.0 - smoothstep(0.0, 0.2, distanceToPointer)) * 0.018 * uAmbient;
  gl_Position = vec4(p.xy, 0.0, 1.0);
  gl_PointSize = (1.15 + fract(p.z * 17.0)) * uDpr;
  vAlpha = 0.3 + fract(p.z * 7.0) * 0.5;
}
