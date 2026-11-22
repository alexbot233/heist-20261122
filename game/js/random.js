// Deterministic small PRNG so seeded shots and tool sparks replay identically.
export function makeRandom(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedFromQuery(text) {
  const value = Number(text);
  return Number.isFinite(value) && value !== 0 ? value >>> 0 : 1;
}
