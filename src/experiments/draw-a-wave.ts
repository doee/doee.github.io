import { defineExperiment } from '../engine/experiment';

const N = 256;
const HARMONICS = 64;
const CHORD = [220, 277.18, 329.63, 440, 554.37];

export default defineExperiment({
  id: 'draw-a-wave',
  title: 'Draw a wave',
  blurb: 'Draw one cycle of a waveform, then let go to hear it played as an arpeggio. The shape you draw is the timbre you hear.',
  order: 2,
  setup(canvas, ctx) {
    const g = canvas.getContext('2d')!;
    const wave = new Float32Array(N).map((_, i) => Math.sin((i / N) * Math.PI * 2) * 0.7);
    let W = 0, H = 0;
    let drawing = false;
    let lastIdx = -1;
    let playStart = -1;
    const PLAY_LEN = CHORD.length * 0.14 + 0.5;

    const point = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const pad = 24;
      const idx = Math.round(((e.clientX - r.left - pad) / (r.width - pad * 2)) * (N - 1));
      const val = 1 - ((e.clientY - r.top) / r.height) * 2;
      return [Math.max(0, Math.min(N - 1, idx)), Math.max(-1, Math.min(1, val * 1.15))] as const;
    };
    const paint = (e: PointerEvent) => {
      const [idx, val] = point(e);
      if (lastIdx < 0) lastIdx = idx;
      // fill the gap between pointer events so fast strokes stay continuous
      const from = Math.min(lastIdx, idx), to = Math.max(lastIdx, idx);
      const a = wave[lastIdx];
      for (let i = from; i <= to; i++) {
        const t = to === from ? 1 : (i - lastIdx) / (idx - lastIdx);
        wave[i] = a + (val - a) * t;
      }
      lastIdx = idx;
    };

    function play() {
      const ac = ctx.sound.context;
      if (!ac) return;
      // DFT of the drawn cycle -> PeriodicWave, so the oscillator plays exactly this shape.
      const real = new Float32Array(HARMONICS);
      const imag = new Float32Array(HARMONICS);
      for (let k = 1; k < HARMONICS; k++) {
        let re = 0, im = 0;
        for (let n = 0; n < N; n++) {
          const ph = (2 * Math.PI * k * n) / N;
          re += wave[n] * Math.cos(ph);
          im += wave[n] * Math.sin(ph);
        }
        real[k] = (re * 2) / N;
        imag[k] = (im * 2) / N;
      }
      const pw = ac.createPeriodicWave(real, imag);
      CHORD.forEach((f, i) => ctx.sound.pluck(f, { wave: pw, gain: 0.16, decay: 0.7, when: i * 0.14 }));
      playStart = performance.now();
    }

    ctx.on(canvas, 'pointerdown', (e) => {
      canvas.setPointerCapture(e.pointerId);
      drawing = true;
      lastIdx = -1;
      paint(e);
    });
    ctx.on(canvas, 'pointermove', (e) => drawing && paint(e));
    ctx.on(canvas, 'pointerup', () => {
      if (!drawing) return;
      drawing = false;
      play();
    });

    return {
      resize(w, h, dpr) {
        W = w; H = h;
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
      },
      frame() {
        const pad = 24;
        const mid = H / 2;
        g.fillStyle = '#140F3C';
        g.fillRect(0, 0, W, H);

        g.strokeStyle = 'rgba(241, 238, 255, 0.18)';
        g.lineWidth = 2;
        g.setLineDash([6, 10]);
        g.beginPath();
        g.moveTo(pad, mid);
        g.lineTo(W - pad, mid);
        g.stroke();
        g.setLineDash([]);

        const xAt = (i: number) => pad + (i / (N - 1)) * (W - pad * 2);
        const yAt = (v: number) => mid - v * (H / 2 - pad);

        g.strokeStyle = '#FFD93B';
        g.lineWidth = 5;
        g.lineJoin = 'round';
        g.beginPath();
        for (let i = 0; i < N; i++) i ? g.lineTo(xAt(i), yAt(wave[i])) : g.moveTo(xAt(i), yAt(wave[i]));
        g.stroke();

        // playhead dot sweeps the cycle while the arpeggio sounds
        if (playStart > 0) {
          const t = (performance.now() - playStart) / 1000;
          if (t > PLAY_LEN) playStart = -1;
          else {
            const i = Math.floor(((t * 3) % 1) * (N - 1));
            g.fillStyle = '#FF7AD9';
            g.beginPath();
            g.arc(xAt(i), yAt(wave[i]), 11, 0, Math.PI * 2);
            g.fill();
          }
        }

        g.fillStyle = 'rgba(241, 238, 255, 0.7)';
        g.font = '600 15px "Instrument Sans", system-ui, sans-serif';
        g.fillText(ctx.sound.enabled ? 'Draw across the line, then let go.' : 'Turn sound on (top right) to hear your wave.', pad, H - pad);
      },
    };
  },
});
