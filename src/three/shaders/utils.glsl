vec2 coverUv(vec2 uv, vec2 imageSize, vec2 resolution, float focusY) {
  float imageAspect = imageSize.x / imageSize.y;
  float viewAspect = resolution.x / resolution.y;
  vec2 scale = vec2(min(viewAspect / imageAspect, 1.0), min(imageAspect / viewAspect, 1.0));
  return (uv - vec2(0.5, focusY)) * scale + vec2(0.5, focusY);
}
vec2 containUv(vec2 uv, vec2 imageSize, vec2 resolution) {
  float imageAspect = imageSize.x / imageSize.y;
  float viewAspect = resolution.x / resolution.y;
  vec2 scale = vec2(min(imageAspect / viewAspect, 1.0), min(viewAspect / imageAspect, 1.0));
  return (uv - 0.5) / scale + 0.5;
}
float inFrame(vec2 uv) { return step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0); }
