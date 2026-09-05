attribute vec3 randomPosition;
attribute vec3 targetPosition;
attribute vec3 sampleColor;
uniform float uProgress;
uniform float uTime;
uniform float uDpr;
uniform float uPointSize;
uniform vec4 uImageRect;
varying float vAlpha;
varying vec3 vColor;
void main() {
  vec2 targetUV = uImageRect.xy + targetPosition.xy * uImageRect.zw;
  vec2 target = vec2(targetUV.x * 2.0 - 1.0, 1.0 - targetUV.y * 2.0);
  float progress = smoothstep(0.0, 1.0, clamp((uProgress - randomPosition.z * 0.12) / 0.88, 0.0, 1.0));
  vec2 p = mix(randomPosition.xy, target, progress);
  float drift = sin(progress * 3.14159) * (1.0 - progress);
  p += vec2(sin(uTime * 1.4 + target.y * 7.0), cos(uTime + target.x * 6.0)) * drift * .18;
  gl_Position = vec4(p, 0.0, 1.0);
  gl_PointSize = uPointSize * uDpr * (0.7 + randomPosition.z * .6);
  vAlpha = .65 + targetPosition.z * .35;
  vColor = mix(vec3(.38, .56, .85), sampleColor * 1.4 + vec3(.05), progress * .82);
}
