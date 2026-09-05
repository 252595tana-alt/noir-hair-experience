uniform vec3 uColor;
uniform float uOpacity;
varying float vAlpha;
void main() {
  float glow = 1.0 - smoothstep(0.08, 0.5, length(gl_PointCoord - 0.5));
  gl_FragColor = vec4(uColor, glow * vAlpha * uOpacity);
  #include <colorspace_fragment>
}
