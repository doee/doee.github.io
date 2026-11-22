/**
 * One shared requestAnimationFrame loop for the whole site.
 * It only runs while something is subscribed, so idle pages cost nothing.
 */
export type Tick = (dt: number, t: number) => void;

const subs = new Set<Tick>();
let raf = 0;
let last = 0;

function loop(now: number) {
  // Clamp dt so a backgrounded tab doesn't explode the physics on return.
  const dt = Math.min((now - last) / 1000, 1 / 20);
  last = now;
  for (const fn of subs) fn(dt, now / 1000);
  raf = subs.size ? requestAnimationFrame(loop) : 0;
}

export const ticker = {
  add(fn: Tick): () => void {
    subs.add(fn);
    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }
    return () => void subs.delete(fn);
  },
  has(fn: Tick) {
    return subs.has(fn);
  },
};
