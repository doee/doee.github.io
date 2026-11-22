const query = matchMedia('(prefers-reduced-motion: reduce)');

export const motion = {
  get reduced() {
    return query.matches;
  },
  onChange(fn: (reduced: boolean) => void) {
    const h = () => fn(query.matches);
    query.addEventListener('change', h);
    return () => query.removeEventListener('change', h);
  },
};

/**
 * Semi-implicit Euler step of a damped spring toward 0.
 * Returns the new [position, velocity].
 */
export function springStep(x: number, v: number, dt: number, stiffness: number, damping: number): [number, number] {
  v += (-stiffness * x - damping * v) * dt;
  return [x + v * dt, v];
}
