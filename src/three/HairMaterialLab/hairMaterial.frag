uniform vec3 uColor;
uniform float uRoughness;
uniform float uSpecular;
uniform float uHighlight;
uniform float uSweep;
uniform vec2 uLight;
varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vTangent;
varying float vLockUv;
varying float vSeed;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float proceduralNoise(vec2 p) {
  float value = 0.0, amplitude = 0.5;
  // Compile-time budget: 1 octave on phones, 3 on desktop.
  for (int i = 0; i < NOISE_OCTAVES; i++) {
    value += noise(p) * amplitude;
    p = p * 2.07 + vec2(13.1, 7.7);
    amplitude *= 0.5;
  }
  return value;
}
float strandHighlight(vec3 tangent, vec3 halfVector, float shift, float power) {
  vec3 shifted = normalize(tangent + vNormal * shift);
  float along = dot(shifted, halfVector);
  return pow(sqrt(max(0.0, 1.0 - along * along)), power);
}
void main() {
  float subtleNoise = proceduralNoise(vec2(vUv.x * 110.0, vUv.y * 15.0));
  // Fine silk grain follows the long axis. Filter frequencies above pixel resolution.
  float frequency = 720.0;
  float grainPhase = vUv.x * frequency + sin(vUv.y * 23.0 + vSeed * 8.0) * 0.06;
  float grainAA = 1.0 - smoothstep(0.22, 0.70, fwidth(grainPhase));
  float silkGrain = sin(grainPhase * 6.283185) * grainAA;
  float fineGrain = sin(grainPhase * 12.56637 + 1.8) * grainAA;
  float roughness = clamp(uRoughness + (subtleNoise - 0.36) * 0.095 + silkGrain * 0.018, 0.10, 0.9);
  vec3 N = normalize(vNormal);
  vec3 T = normalize(vTangent);
  vec3 V = normalize(-vPosition);
  vec3 L = normalize(vec3(-1.8 + uLight.x * 3.5, 1.3 + uLight.y * 3.0, 2.7) - vPosition * 0.15);
  vec3 H = normalize(L + V);
  float diffuse = max(dot(N, L), 0.0);
  // Kajiya-Kay style anisotropy: broad across the fiber, narrow along it.
  float exponent = mix(14.0, 155.0, 1.0 - roughness);
  float primary = strandHighlight(T, H, -0.10 + subtleNoise * 0.05, exponent);
  float secondary = strandHighlight(T, H, 0.22, exponent * 0.38);
  float surfaceFacing = smoothstep(-0.1, 0.7, dot(N, L));
  float rim = pow(1.0 - max(dot(N, V), 0.0), 2.7);
  float lockShade = mix(0.62, 1.0, pow(max(0.0, sin(vLockUv * 3.14159)), 0.20));
  float strandShade = 0.90 + silkGrain * 0.075 + fineGrain * 0.035 + (subtleNoise - 0.36) * 0.1;
  // A moving studio strip light; it changes illumination only, never the silhouette.
  float sweepCenter = 0.50 + sin(uSweep) * 0.46 + uLight.y * 0.16;
  float distanceToSweep = (vUv.y - sweepCenter + vUv.x * 0.08) / mix(0.24, 0.065, 1.0 - roughness);
  float lightSweep = exp(-distanceToSweep * distanceToSweep) * (0.45 + diffuse * 0.55);
  vec3 base = uColor * (0.48 + diffuse * 0.64) * strandShade * lockShade;
  vec3 lightTint = mix(vec3(0.83, 0.88, 1.0), vec3(1.0, 0.89, 0.76), 0.62);
  vec3 specular = lightTint * (primary * 0.25 + secondary * 0.11) * uSpecular * surfaceFacing;
  vec3 strip = lightTint * lightSweep * uHighlight * 0.24 * strandShade * lockShade;
  vec3 edge = vec3(0.65, 0.74, 0.90) * rim * (0.035 + uSpecular * 0.10);
  float tipFade = 1.0 - smoothstep(0.96, 1.0, vUv.y);
  float rootFade = smoothstep(0.0, 0.028, vUv.y);
  gl_FragColor = vec4(base + specular + strip + edge, tipFade * rootFade);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
