import { BufferGeometry, Float32BufferAttribute } from "three";

/** A single draw call. Each lock has a curved cross section and a tapered tip. */
export function createHairMaterialGeometry(locks: number, segments: number) {
  const positions: number[] = [], uvs: number[] = [], lockUvs: number[] = [], seeds: number[] = [], indices: number[] = [];
  const across = 3;
  for (let lock = 0; lock < locks; lock++) {
    const seed = Math.sin((lock + 1) * 127.1) * 43758.5453 % 1;
    const start = positions.length / 3;
    for (let row = 0; row <= segments; row++) {
      for (let col = 0; col <= across; col++) {
        const local = col / across;
        const u = (lock + local * 0.98 + 0.01) / locks;
        const v = row / segments;
        positions.push((u - 0.5) * 2.6, (0.5 - v) * 3.8, 0);
        uvs.push(u, v);
        lockUvs.push(local);
        seeds.push(Math.abs(seed));
      }
    }
    for (let row = 0; row < segments; row++) {
      for (let col = 0; col < across; col++) {
        const a = start + row * (across + 1) + col, b = a + across + 1;
        indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setAttribute("aLockUv", new Float32BufferAttribute(lockUvs, 1));
  geometry.setAttribute("aSeed", new Float32BufferAttribute(seeds, 1));
  geometry.setIndex(indices);
  return geometry;
}
