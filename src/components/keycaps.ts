import { defineComponent } from '../engine/component';
import { springStep } from '../engine/motion';
import { PENTATONIC } from '../engine/sound';

/**
 * The hero: each letter of data-text becomes a chunky keycap on a spring.
 * Drag and fling them; with sound on, every swing back through home plays a note.
 */
const FACES = ['var(--bubble)', 'var(--butter)', 'var(--white)', 'var(--bubble)', 'var(--butter)'];

interface Body {
  el: HTMLButtonElement;
  x: number; y: number; vx: number; vy: number;
  r: number; vr: number;
  drag: boolean;
  delay: number;
  note: number;
  // direction of the last release, used to detect swinging back through home
  dx: number; dy: number; side: number;
  grabX: number; grabY: number; lastMove: number;
}

export default defineComponent({
  name: 'keycaps',
  eager: true,
  mount(root, { ticker, sound, motion, pointer }) {
    const text = root.dataset.text ?? '';
    const bodies: Body[] = [...text].map((ch, i) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'key';
      el.textContent = ch;
      el.style.setProperty('--face', FACES[i % FACES.length]);
      el.setAttribute('aria-label', `Flick the letter ${ch}`);
      root.append(el);
      return {
        el, x: 0, y: 0, vx: 0, vy: 0, r: 0, vr: 0, drag: false, delay: 0,
        note: PENTATONIC[(i * 2) % PENTATONIC.length],
        dx: 0, dy: -1, side: 0, grabX: 0, grabY: 0, lastMove: 0,
      };
    });

    const stiffness = 170;
    const damping = () => (motion.reduced ? 2 * Math.sqrt(stiffness) : 9);
    let stop: (() => void) | null = null;
    const wake = () => {
      if (!stop) stop = ticker.add(step);
    };

    function release(b: Body) {
      const len = Math.hypot(b.x, b.y) || 1;
      b.dx = b.x / len;
      b.dy = b.y / len;
      b.side = Math.sign(b.x * b.dx + b.y * b.dy);
    }

    function step(dt: number) {
      let awake = false;
      const c = damping();
      for (const b of bodies) {
        if (b.delay > 0) {
          b.delay -= dt;
          awake = true;
          continue;
        }
        if (!b.drag) {
          [b.x, b.vx] = springStep(b.x, b.vx, dt, stiffness, c);
          [b.y, b.vy] = springStep(b.y, b.vy, dt, stiffness, c);
          // Swinging back through home: play a note scaled by speed.
          const side = Math.sign(b.x * b.dx + b.y * b.dy);
          const speed = Math.hypot(b.vx, b.vy);
          if (side !== 0 && side !== b.side && speed > 180) {
            sound.pluck(b.note, { gain: Math.min(0.22, speed / 9000), decay: 0.5 });
          }
          if (side !== 0) b.side = side;
        }
        // Rotation follows horizontal velocity, springing to upright.
        const rTarget = Math.max(-25, Math.min(25, b.vx * 0.012));
        [b.r, b.vr] = springStep(b.r - rTarget, b.vr, dt, 220, 14);
        b.r += rTarget;

        b.el.style.transform = `translate(${b.x.toFixed(1)}px, ${b.y.toFixed(1)}px) rotate(${b.r.toFixed(2)}deg)`;
        const moving = b.drag || Math.abs(b.x) + Math.abs(b.y) > 0.3 || Math.hypot(b.vx, b.vy) > 4 || Math.abs(b.r) > 0.1;
        awake ||= moving;
      }
      if (!awake) {
        for (const b of bodies) {
          b.x = b.y = b.vx = b.vy = b.r = b.vr = 0;
          b.el.style.transform = '';
        }
        stop?.();
        stop = null;
      }
    }

    for (const b of bodies) {
      const el = b.el;
      el.addEventListener('pointerdown', (e) => {
        el.setPointerCapture(e.pointerId);
        b.drag = true;
        b.delay = 0;
        b.grabX = e.clientX - b.x;
        b.grabY = e.clientY - b.y;
        b.lastMove = performance.now();
        el.classList.add('is-held');
        sound.pluck(b.note * 2, { gain: 0.06, decay: 0.15, type: 'sine' });
        wake();
      });
      el.addEventListener('pointermove', (e) => {
        if (!b.drag) return;
        const now = performance.now();
        const dt = Math.max(1, now - b.lastMove) / 1000;
        const nx = e.clientX - b.grabX;
        const ny = e.clientY - b.grabY;
        b.vx = b.vx * 0.4 + ((nx - b.x) / dt) * 0.6;
        b.vy = b.vy * 0.4 + ((ny - b.y) / dt) * 0.6;
        b.x = nx;
        b.y = ny;
        b.lastMove = now;
      });
      const end = () => {
        if (!b.drag) return;
        b.drag = false;
        // If the pointer paused before letting go, don't fling.
        if (performance.now() - b.lastMove > 80) b.vx = b.vy = 0;
        el.classList.remove('is-held');
        release(b);
      };
      el.addEventListener('pointerup', end);
      el.addEventListener('pointercancel', end);
      // A pointer sweeping across a resting key nudges it.
      el.addEventListener('pointerenter', () => {
        if (b.drag || pointer.down) return;
        b.vx += pointer.vx * 0.12;
        b.vy += pointer.vy * 0.12;
        release(b);
        b.dx = Math.sign(pointer.vx) || 1;
        b.dy = 0;
        b.side = -1;
        wake();
      });
      // Keyboard (Enter/Space) gives the key a flick upward.
      el.addEventListener('click', (e) => {
        if (e.detail !== 0) return;
        b.vy -= 1500;
        b.vx += (Math.random() - 0.5) * 600;
        b.dx = 0;
        b.dy = 1;
        b.side = 1;
        wake();
      });
    }

    // The one orchestrated moment: keys drop in one after another on load.
    if (!motion.reduced) {
      const drop = innerHeight * 0.9;
      bodies.forEach((b, i) => {
        b.y = -drop;
        b.delay = 0.25 + i * 0.11;
        b.el.style.transform = `translate(0, ${-drop}px)`;
        b.dx = 0;
        b.dy = -1;
        b.side = 1;
      });
      wake();
    }
  },
});
