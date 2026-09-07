import { BufferGeometry, Float32BufferAttribute } from "three";

/** A single tapered surface. Its topology stays immutable while GLSL shapes it. */
export function createHairJourneyGeometry(
  lengthSegments: number,
  widthSegments: number,
) {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let y = 0; y <= lengthSegments; y += 1) {
    const longitudinal = y / lengthSegments;
    const vertical = (longitudinal - 0.5) * 3.4;
    const rootTaper = Math.min(1, longitudinal / 0.09);
    const tipTaper = Math.min(1, (1 - longitudinal) / 0.18);
    const taper = Math.max(0.05, Math.min(rootTaper, tipTaper));

    for (let x = 0; x <= widthSegments; x += 1) {
      const across = x / widthSegments;
      positions.push((across - 0.5) * 0.52 * taper, vertical, 0);
      uvs.push(across, longitudinal);
    }
  }

  const row = widthSegments + 1;
  for (let y = 0; y < lengthSegments; y += 1) {
    for (let x = 0; x < widthSegments; x += 1) {
      const a = y * row + x;
      const b = a + row;
      indices.push(a, b, b + 1, a, b + 1, a + 1);
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}
