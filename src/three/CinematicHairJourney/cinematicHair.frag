precision highp float;

uniform float uTime;
uniform float uScrollProgress;
uniform float uCutProgress;
uniform float uColorProgress;
uniform float uTreatmentProgress;
uniform float uStyleProgress;
uniform float uWaveStrength;
uniform float uFinalProgress;
uniform vec3 uKeyColor;
uniform vec3 uRimColor;
uniform vec3 uColor0;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec3 uHighlight0;
uniform vec3 uHighlight1;
uniform vec3 uHighlight2;
uniform vec3 uHighlight3;
uniform float uQuality;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDirection;
varying float vCutMask;
varying float vEdge;

vec3 journeyHairColor(float progress) {
  float stage = clamp(progress, 0.0, 1.0) * 3.0;
  if (stage < 1.0) return mix(uColor0, uColor1, smoothstep(0.0, 1.0, stage));
  if (stage < 2.0) return mix(uColor1, uColor2, smoothstep(1.0, 2.0, stage));
  return mix(uColor2, uColor3, smoothstep(2.0, 3.0, stage));
}

vec3 journeyHairHighlight(float progress) {
  float stage = clamp(progress, 0.0, 1.0) * 3.0;
  if (stage < 1.0) return mix(uHighlight0, uHighlight1, smoothstep(0.0, 1.0, stage));
  if (stage < 2.0) return mix(uHighlight1, uHighlight2, smoothstep(1.0, 2.0, stage));
  return mix(uHighlight2, uHighlight3, smoothstep(2.0, 3.0, stage));
}

void main() {
  if (vCutMask < 0.012) discard;

  vec3 normal = normalize(vNormal);
  vec3 viewDirection = normalize(vViewDirection);
  vec3 keyDirection = normalize(vec3(-0.42, 0.34, 0.84));
  vec3 rimDirection = normalize(vec3(0.74, 0.2, 0.64));
  vec3 halfDirection = normalize(keyDirection + viewDirection);
  float key = max(dot(normal, keyDirection), 0.0);
  float fill = max(dot(normal, normalize(vec3(0.5, -0.4, 0.72))), 0.0);
  float fresnel = pow(1.0 - max(dot(normal, viewDirection), 0.0), 2.7);
  float rim = pow(max(dot(normal, rimDirection), 0.0), 3.0) + fresnel * 0.7;

  float gloss = mix(0.25, 0.9, uTreatmentProgress);
  float specularPower = mix(22.0, 76.0, uTreatmentProgress);
  float specular = pow(max(dot(normal, halfDirection), 0.0), specularPower);
  // Fine longitudinal fibres and one travelling satin lobe keep the surface
  // reading as a lock of hair rather than a flat metallic strip.
  float strand = sin(
    vUv.x * 260.0 + vUv.y * 9.0 + sin(vUv.y * 31.0) * 1.7
  );
  strand = strand * 0.5 + 0.5;
  float strandDetail = mix(0.018, 0.052, uQuality) * strand;
  float highlightCenter = 0.42
    + sin(vUv.y * 7.0 - uTime * 0.16) * (0.035 + uStyleProgress * 0.035);
  float silkLobe = exp(-pow((vUv.x - highlightCenter) * 5.8, 2.0));

  vec3 base = journeyHairColor(uColorProgress);
  vec3 hairHighlight = journeyHairHighlight(uColorProgress);
  vec3 color = base * (0.58 + key * 0.66 + fill * 0.18);
  color += mix(base, hairHighlight, 0.44) * strandDetail;
  color += hairHighlight * silkLobe * (0.025 + uTreatmentProgress * 0.045);
  color += mix(uKeyColor, hairHighlight, 0.42) * specular * (0.12 + gloss * 0.34);
  color += mix(uRimColor, hairHighlight, 0.28) * rim * (0.07 + gloss * 0.13);

  float sweepPosition = mix(-0.18, 1.18, uTreatmentProgress);
  float lightSweep = exp(-pow((vUv.y - sweepPosition) * 10.5, 2.0));
  lightSweep *= smoothstep(0.02, 0.2, uTreatmentProgress);
  color += uKeyColor * lightSweep * (0.055 + gloss * 0.085);

  float cutLine = mix(-0.015, 0.235, uCutProgress);
  float cutEdge = exp(-pow((vUv.y - cutLine) * 95.0, 2.0));
  color += vec3(0.58, 0.51, 0.45) * cutEdge * sin(uCutProgress * 3.14159265) * 0.12;

  float silhouette = 1.0 - smoothstep(0.84, 1.0, vEdge) * 0.34;
  float finalFade = 1.0 - smoothstep(0.06, 0.38, uFinalProgress);
  float alpha = vCutMask * silhouette * finalFade;
  gl_FragColor = vec4(color, alpha);
  #include <colorspace_fragment>
}
