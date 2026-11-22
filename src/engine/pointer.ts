/** Global pointer state with smoothed velocity in px/s. */
export const pointer = { x: 0, y: 0, vx: 0, vy: 0, down: false };

let lastT = performance.now();
const MAX_V = 6000;
const clamp = (v: number) => Math.max(-MAX_V, Math.min(MAX_V, v));

addEventListener(
  'pointermove',
  (e) => {
    const now = performance.now();
    const dt = Math.max(1, now - lastT) / 1000;
    pointer.vx = clamp(pointer.vx * 0.5 + ((e.clientX - pointer.x) / dt) * 0.5);
    pointer.vy = clamp(pointer.vy * 0.5 + ((e.clientY - pointer.y) / dt) * 0.5);
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    lastT = now;
  },
  { passive: true },
);
addEventListener('pointerdown', () => (pointer.down = true), { passive: true });
addEventListener('pointerup', () => (pointer.down = false), { passive: true });
addEventListener('pointercancel', () => (pointer.down = false), { passive: true });
