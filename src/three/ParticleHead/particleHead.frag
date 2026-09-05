uniform float uOpacity;
varying float vAlpha;
varying vec3 vColor;
void main() {
  float glow = 1.0 - smoothstep(0.15, 0.5, length(gl_PointCoord - 0.5));
  gl_FragColor = vec4(vColor, glow * vAlpha * uOpacity);
  #include <colorspace_fragment>
}
