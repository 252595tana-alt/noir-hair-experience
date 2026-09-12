uniform sampler2D uDepth;
uniform vec2 uPointer;
uniform float uPointerStrength;
varying vec2 vUv;
varying float vDepth;

void main() {
  vUv = uv;
  // Registered, linear-data depth texture: 0 = background, 1 = nearest fringe.
  float depth = texture2D(uDepth, uv).r;
  vDepth = depth;
  vec3 p = position;
  // Broad, smoothed depth regions keep the face almost rigid. Silhouette motion
  // is limited to ~1% of image width on desktop and 45% of that on touch devices.
  float boundary = smoothstep(0.0, 0.09, min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y)));
  float parallax = (depth - 0.38) * 0.047 * boundary * uPointerStrength;
  p.xy += uPointer * vec2(parallax, parallax * 0.65);
  p.z += (depth - 0.38) * 0.08 * uPointerStrength;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
