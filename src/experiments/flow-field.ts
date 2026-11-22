import { defineExperiment } from '../engine/experiment';

const INK = '#140F3C';
const COLORS = ['#FF7AD9', '#FFD93B', '#F1EEFF', '#6F7DFF'];

export default defineExperiment({
  id: 'flow-field',
  title: 'Flow field',
  blurb: 'Two thousand particles riding a slowly shifting vector field. Drag through it to stir up a whirlpool.',
  order: 1,
  setup(canvas, ctx) {
    const g = canvas.getContext('2d')!;
    const N = 2000;
    // x, y, vx, vy per particle
    const p = new Float32Array(N * 4);
    let W = 0, H = 0;
    const stir = { x: 0, y: 0, on: false };

    const spawn = (i: number) => {
      p[i * 4] = Math.random() * W;
      p[i * 4 + 1] = Math.random() * H;
      p[i * 4 + 2] = 0;
      p[i * 4 + 3] = 0;
    };
    const local = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      stir.x = e.clientX - r.left;
      stir.y = e.clientY - r.top;
    };
    ctx.on(canvas, 'pointerdown', (e) => { stir.on = true; local(e); });
    ctx.on(canvas, 'pointermove', local);
    ctx.on(window, 'pointerup', () => (stir.on = false));

    return {
      resize(w, h, dpr) {
        W = w; H = h;
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        g.fillStyle = INK;
        g.fillRect(0, 0, W, H);
        for (let i = 0; i < N; i++) spawn(i);
      },
      frame(dt, t) {
        g.fillStyle = 'rgba(20, 15, 60, 0.07)';
        g.fillRect(0, 0, W, H);
        g.lineWidth = 2.2;
        g.lineCap = 'round';
        const k = dt * 60;
        for (let c = 0; c < COLORS.length; c++) {
          g.strokeStyle = COLORS[c];
          g.beginPath();
          for (let i = c; i < N; i += COLORS.length) {
            const o = i * 4;
            const x = p[o], y = p[o + 1];
            const a = Math.sin(x * 0.0045 + t * 0.35) * 2.2 + Math.cos(y * 0.0052 - t * 0.27) * 2.2;
            let vx = p[o + 2] + Math.cos(a) * 0.24 * k;
            let vy = p[o + 3] + Math.sin(a) * 0.24 * k;
            if (stir.on) {
              const dx = stir.x - x, dy = stir.y - y;
              const d2 = dx * dx + dy * dy + 400;
              const f = (1800 / d2) * k;
              // perpendicular pull = swirl, plus a little attraction
              vx += (-dy * f + dx * f * 0.3) * 0.05;
              vy += (dx * f + dy * f * 0.3) * 0.05;
            }
            vx *= 0.94; vy *= 0.94;
            const nx = x + vx * k, ny = y + vy * k;
            g.moveTo(x, y);
            g.lineTo(nx, ny);
            p[o] = nx; p[o + 1] = ny; p[o + 2] = vx; p[o + 3] = vy;
            if (nx < -10 || ny < -10 || nx > W + 10 || ny > H + 10 || Math.random() < 0.002) spawn(i);
          }
          g.stroke();
        }
      },
    };
  },
});
