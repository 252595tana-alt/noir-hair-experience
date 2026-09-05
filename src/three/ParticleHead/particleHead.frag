uniform float uOpacity;
varying float vAlpha;
varying vec3 vColor;
varying float vEnergy;
void main() {
  float distanceToCenter = length(gl_PointCoord - .5);
  float halo = (1.0 - smoothstep(.12, .5, distanceToCenter)) * .3;
  float core = 1.0 - smoothstep(.025, .16, distanceToCenter);
  float alpha = (halo + core * .8) * vAlpha * uOpacity;
  gl_FragColor = vec4(vColor * (.86 + core * .72 + vEnergy * .42), alpha);
  #include <colorspace_fragment>
}
