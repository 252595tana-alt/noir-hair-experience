import { BufferGeometry, Float32BufferAttribute } from "three";

const random = (value: number) => {
  const result = Math.sin(value * 12.9898) * 43758.5453;
  return result - Math.floor(result);
};

/** One indexed geometry carries every ribbon, keeping the gallery to two draws. */
export function createRibbonGeometry(ribbonCount: number, segmentCount: number) {
  const positions: number[] = [];
  const uvs: number[] = [];
  const ribbonIndices: number[] = [];
  const randoms: number[] = [];
  const bandUvs: number[] = [];
  const indices: number[] = [];

  for (let ribbon = 0; ribbon < ribbonCount; ribbon += 1) {
    const ribbonIndex = ribbonCount === 1 ? 0.5 : ribbon / (ribbonCount - 1);
    const top = 1 - (ribbon / ribbonCount) * 2;
    const bottom = 1 - ((ribbon + 1) / ribbonCount) * 2;
    const uvTop = 1 - ribbon / ribbonCount;
    const uvBottom = 1 - (ribbon + 1) / ribbonCount;
    const variation = [
      random(ribbon + 1.17),
      random(ribbon + 7.31),
      random(ribbon + 19.73),
      random(ribbon + 31.91),
    ];
    const rowStart = positions.length / 3;

    for (let segment = 0; segment <= segmentCount; segment += 1) {
      const unitX = segment / segmentCount;
      const x = unitX * 2 - 1;
      positions.push(x, top, 0, x, bottom, 0);
      uvs.push(unitX, uvTop, unitX, uvBottom);
      ribbonIndices.push(ribbonIndex, ribbonIndex);
      randoms.push(...variation, ...variation);
      bandUvs.push(1, 0);
    }

    for (let segment = 0; segment < segmentCount; segment += 1) {
      const topLeft = rowStart + segment * 2;
      const bottomLeft = topLeft + 1;
      const topRight = topLeft + 2;
      const bottomRight = topLeft + 3;
      indices.push(topLeft, bottomLeft, bottomRight, topLeft, bottomRight, topRight);
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setAttribute(
    "aRibbonIndex",
    new Float32BufferAttribute(ribbonIndices, 1),
  );
  geometry.setAttribute("aRandom", new Float32BufferAttribute(randoms, 4));
  geometry.setAttribute("aBandUv", new Float32BufferAttribute(bandUvs, 1));
  geometry.setIndex(indices);
  return geometry;
}
