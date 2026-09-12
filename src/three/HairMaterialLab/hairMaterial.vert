uniform float uWave;
attribute float aLockUv;
attribute float aSeed;
varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vTangent;
varying float vLockUv;
varying float vSeed;

// Only STYLE changes geometry. Time and pointer NEVER enter this shader.
vec3 hairSurface(float u, float t) {
  float x = (u - 0.5) * 2.0;
  float tip = smoothstep(0.73, 1.0, t);
  float width = 1.0 - tip * 0.22;
  float phase = t * 11.8 - u * 2.2;
  float wave = sin(phase) * (0.08 + 0.20 * sin(t * 2.5)) * uWave;
  float arc = sin(t * 3.14) * 0.09;
  return vec3(
    x * 1.17 * width + wave + arc,
    1.82 - t * (3.52 + 0.30 * (1.0 - x * x)) + tip * aSeed * 0.14,
    0.46 * sqrt(max(0.015, 1.0 - x * x)) + 0.09 * sin(phase + 1.0) * uWave
      + sin(aLockUv * 3.14159) * 0.018 + aSeed * 0.012
  );
}
void main() {
  vUv = uv;
  vLockUv = aLockUv;
  vSeed = aSeed;
  vec3 p = hairSurface(uv.x, uv.y);
  vec3 tangent = normalize(hairSurface(uv.x, uv.y + 0.001) - hairSurface(uv.x, uv.y - 0.001));
  vec3 across = normalize(hairSurface(uv.x + 0.001, uv.y) - hairSurface(uv.x - 0.001, uv.y));
  vec3 n = normalize(cross(tangent, across));
  // Small lock curvature, aligned with the strand direction.
  n = normalize(n + across * cos(aLockUv * 3.14159) * 0.19);
  vec4 viewPosition = modelViewMatrix * vec4(p, 1.0);
  vPosition = viewPosition.xyz;
  vNormal = normalize(normalMatrix * n);
  vTangent = normalize(normalMatrix * tangent);
  gl_Position = projectionMatrix * viewPosition;
}
