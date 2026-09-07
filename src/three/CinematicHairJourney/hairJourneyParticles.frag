precision highp float;

varying float vAlpha;
varying float vWarmth;

void main() {
  float distanceFromCenter = length(gl_PointCoord - 0.5);
  float core = 1.0 - smoothstep(0.08, 0.48, distanceFromCenter);
  vec3 cool = vec3(0.56, 0.58, 0.62);
  vec3 warm = vec3(0.71, 0.61, 0.48);
  gl_FragColor = vec4(mix(cool, warm, vWarmth) * (0.55 + core * 0.45), core * vAlpha);
  #include <colorspace_fragment>
}
