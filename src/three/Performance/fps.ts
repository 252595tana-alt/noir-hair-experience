export type FpsSample = { elapsed: number; frames: number; slow: number };
/** Six continuous seconds below 30 FPS; ignore pauses and isolated stalls. */
export function sampleFps(
  sample: FpsSample,
  delta: number,
  threshold = 30,
): boolean {
  if (delta > 0.25) {
    sample.elapsed = 0;
    sample.frames = 0;
    sample.slow = 0;
    return false;
  }
  sample.elapsed += delta;
  sample.frames++;
  if (sample.elapsed < 3) return false;
  sample.slow =
    sample.frames / sample.elapsed < threshold ? sample.slow + 1 : 0;
  sample.elapsed = 0;
  sample.frames = 0;
  if (sample.slow < 2) return false;
  sample.slow = 0;
  return true;
}
