precision highp float;

uniform float uTime;
uniform float uScrollProgress;
uniform float uCutProgress;
uniform float uStyleProgress;
uniform float uWaveStrength;
uniform float uFinalProgress;
uniform vec2 uMouse;
uniform float uQuality;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDirection;
varying float vCutMask;
varying float vEdge;

const float PI = 3.141592653589793;

void main() {
  vUv = uv;
  float across = uv.x * 2.0 - 1.0;
  float along = uv.y;
  float cutLine = mix(-0.015, 0.235, uCutProgress);
  vCutMask = smoothstep(cutLine - 0.012, cutLine + 0.012, along);

  vec3 transformed = position;
  float breathing = sin(uTime * 0.72 + along * 5.1) * 0.018;
  float organic = sin(along * 12.0 + uTime * 0.31) * 0.64
    + sin(along * 25.0 - uTime * 0.18) * 0.18;
  float stylingWave = organic * uWaveStrength * uStyleProgress;
  float initialCurve = sin((along - 0.12) * PI * 1.18) * 0.11;
  float pointerPull = uMouse.x * (0.035 + along * 0.035);
  float pointerWave = sin(along * 8.0 + uMouse.y * 1.8) * abs(uMouse.y) * 0.018;
  transformed.x += initialCurve + breathing + stylingWave + pointerPull + pointerWave;

  float twist = sin(along * 7.2 + uTime * 0.22) * 0.2;
  twist += uStyleProgress * sin(along * 15.0) * 0.36;
  transformed.z += across * sin(twist) * 0.18;
  transformed.x -= across * (1.0 - cos(twist)) * 0.055;
  transformed.z += sin(along * 5.0 - uTime * 0.2) * (0.025 + uStyleProgress * 0.065);

  // The lower tip is clipped in the fragment. This slight recoil makes the
  // moment read as a cut rather than a uniform scale change.
  float cutRecoil = exp(-pow((along - cutLine) * 24.0, 2.0));
  transformed.x += sin(uCutProgress * PI) * cutRecoil * 0.045;
  transformed.y += sin(uCutProgress * PI) * cutRecoil * 0.022;

  float finalOpen = smoothstep(0.0, 0.42, uFinalProgress);
  transformed.x *= 1.0 + finalOpen * 0.34;
  transformed.z *= 1.0 - finalOpen * 0.7;

  vec3 localNormal = normalize(vec3(-sin(twist), -stylingWave * 0.3, cos(twist)));
  vec4 viewPosition = modelViewMatrix * vec4(transformed, 1.0);
  vNormal = normalize(normalMatrix * localNormal);
  vViewDirection = normalize(-viewPosition.xyz);
  vEdge = abs(across);
  gl_Position = projectionMatrix * viewPosition;
}
