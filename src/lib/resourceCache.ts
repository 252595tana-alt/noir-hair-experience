/** Bounded asynchronous LRU. Pinned resources survive eviction; stale loads are disposed. */
export class ResourceCache<T> {
  private entries = new Map<
    string,
    { promise: Promise<T>; value?: T; pins: number; evicted: boolean }
  >();
  constructor(
    private capacity: number,
    private load: (key: string) => Promise<T>,
    private dispose: (value: T) => void,
  ) {}
  acquire(key: string): Promise<T> {
    let entry = this.entries.get(key);
    if (!entry) {
      entry = { promise: Promise.resolve(null as T), pins: 0, evicted: false };
      const owned = entry;
      entry.promise = this.load(key)
        .then((value) => {
          if (owned.evicted) {
            this.dispose(value);
          } else {
            owned.value = value;
          }
          return value;
        })
        .catch((error) => {
          if (this.entries.get(key) === owned) this.entries.delete(key);
          throw error;
        });
    }
    entry.pins++;
    this.entries.delete(key);
    this.entries.set(key, entry);
    this.trim();
    return entry.promise;
  }
  release(key: string) {
    const entry = this.entries.get(key);
    if (entry) entry.pins = Math.max(0, entry.pins - 1);
    this.trim();
  }
  private trim() {
    for (const [key, entry] of this.entries) {
      if (this.entries.size <= this.capacity) break;
      if (!entry.pins) this.evict(key);
    }
  }
  private evict(key: string) {
    const entry = this.entries.get(key);
    if (!entry) return;
    entry.evicted = true;
    if (entry.value !== undefined) this.dispose(entry.value);
    this.entries.delete(key);
  }
  clear() {
    for (const key of this.entries.keys()) this.evict(key);
  }
  get size() {
    return this.entries.size;
  }
}
