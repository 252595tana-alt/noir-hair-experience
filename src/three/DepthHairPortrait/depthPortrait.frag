uniform sampler2D uPhoto;
uniform sampler2D uHairMask;
uniform vec3 uTint;
uniform float uExposure;
uniform vec2 uPointer;
uniform vec2 uTexel;
uniform float uTime;
uniform float uOriginal;
varying vec2 vUv;
varying float vDepth;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1.)), f.x), f.y);
}
void main() {
  // The color texture is decoded from sRGB by Three.js. Data masks stay linear.
  vec3 photo = texture2D(uPhoto, vUv).rgb;
  float mask = texture2D(uHairMask, vUv).r * (1.0 - uOriginal);
  float luminance = dot(photo, vec3(0.2126, 0.7152, 0.0722));
  vec3 tint = uTint / max(dot(uTint, vec3(0.2126, 0.7152, 0.0722)), 0.001);
  // Preserve the original photographed strands, shadows and local contrast.
  vec3 coloredHair = mix(vec3(luminance), photo, 0.07) * tint * uExposure;
  float fineNoise = 0.0;
  vec2 frequency = vUv * vec2(510., 880.);
  for (int i = 0; i < NOISE_OCTAVES; i++) {
    fineNoise += (noise(frequency) - 0.5) * (i == 0 ? 0.003 : 0.0015);
    frequency *= 1.93;
  }
  // Approximate anisotropy follows the center part toward the two side lengths.
  float flow = (vUv.x - 0.5) * (0.68 - vUv.y) * 0.26;
  float strip = vUv.y - (0.56 + uPointer.y * 0.09 + sin(uTime * 0.32) * 0.16) + flow;
  float sweep = exp(-strip * strip / 0.006);
  float anisotropic = pow(max(0., 1.0 - abs(strip + 0.04) * 3.8), 14.0);
  float edge;
  #if PORTRAIT_HIGH_QUALITY == 1
    vec2 offset = uTexel * 2.5;
    vec2 gradient = vec2(
      texture2D(uHairMask, vUv + vec2(offset.x, 0.)).r - texture2D(uHairMask, vUv - vec2(offset.x, 0.)).r,
      texture2D(uHairMask, vUv + vec2(0., offset.y)).r - texture2D(uHairMask, vUv - vec2(0., offset.y)).r);
    edge = clamp(length(gradient), 0., 1.);
  #else
    edge = clamp(fwidth(mask) * 1.5, 0., 1.);
  #endif
  float hairGloss = smoothstep(0.10, 0.57, luminance) * (0.035 + anisotropic * 0.038);
  float light = (sweep * 0.016 + anisotropic * 0.018 + hairGloss + edge * 0.015) * (0.65 + vDepth * 0.35);
  vec3 finish = coloredHair + vec3(0.92, 0.95, 1.0) * light + fineNoise;
  // Every color and finish term is masked; skin, eyes, clothing and background
  // retain their source RGB. No global tone mapping changes the portrait.
  gl_FragColor = vec4(mix(photo, max(finish, vec3(0.0)), mask), 1.0);
  #include <colorspace_fragment>
}
