import { defineComponent, ctx as baseCtx } from '../engine/component';
import type { ExperimentDef, ExperimentCtx, ExperimentInstance } from '../engine/experiment';

/**
 * Hosts every file in src/experiments/. Add a file there and it appears as a new tab.
 * The host owns the canvas, sizing, the frame loop, pausing and cleanup.
 */
const modules = import.meta.glob<{ default: ExperimentDef }>('../experiments/*.ts', { eager: true });
const experiments = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

export default defineComponent({
  name: 'playground',
  mount(root) {
    const tabs = root.querySelector<HTMLElement>('.pg-tabs')!;
    const stage = root.querySelector<HTMLElement>('.pg-stage')!;
    const blurb = root.querySelector<HTMLElement>('.pg-blurb')!;
    const playBtn = root.querySelector<HTMLButtonElement>('.pg-play')!;

    let canvas: HTMLCanvasElement;
    let inst: ExperimentInstance | null = null;
    let cleanups: (() => void)[] = [];
    let width = 0, height = 0, dpr = 1;
    let visible = false;
    let playing = !baseCtx.motion.reduced;
    let stopTick: (() => void) | null = null;

    const frame = (dt: number, t: number) => inst?.frame?.(dt, t);
    function sync() {
      const shouldRun = visible && playing && !!inst?.frame;
      if (shouldRun && !stopTick) stopTick = baseCtx.ticker.add(frame);
      if (!shouldRun && stopTick) {
        stopTick();
        stopTick = null;
      }
      playBtn.textContent = playing ? 'Pause' : 'Play';
      playBtn.setAttribute('aria-pressed', String(!playing));
    }

    function measure() {
      const r = stage.getBoundingClientRect();
      width = r.width;
      height = r.height;
      dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }

    function start(def: ExperimentDef) {
      inst?.destroy?.();
      cleanups.forEach((c) => c());
      cleanups = [];
      // A fresh canvas per experiment so 2D and WebGL contexts never collide.
      canvas?.remove();
      canvas = document.createElement('canvas');
      canvas.className = 'pg-canvas';
      canvas.setAttribute('aria-label', def.title);
      stage.append(canvas);
      measure();

      const ectx: ExperimentCtx = {
        ...baseCtx,
        get width() { return width; },
        get height() { return height; },
        get dpr() { return dpr; },
        on(target, type, fn, opts) {
          target.addEventListener(type, fn as EventListener, opts);
          cleanups.push(() => target.removeEventListener(type, fn as EventListener, opts));
        },
      };
      inst = def.setup(canvas, ectx);
      inst.resize?.(width, height, dpr);
      // Draw one frame even when paused so the stage is never blank.
      inst.frame?.(1 / 60, performance.now() / 1000);

      blurb.textContent = def.blurb;
      tabs.querySelectorAll('button').forEach((b) => {
        const on = b.dataset.id === def.id;
        b.setAttribute('aria-selected', String(on));
        b.tabIndex = on ? 0 : -1;
      });
      sync();
    }

    tabs.innerHTML = experiments
      .map((e) => `<button type="button" role="tab" data-id="${e.id}" aria-selected="false">${e.title}</button>`)
      .join('');
    tabs.addEventListener('click', (e) => {
      const id = (e.target as HTMLElement).closest<HTMLButtonElement>('[role=tab]')?.dataset.id;
      const def = experiments.find((x) => x.id === id);
      if (def) start(def);
    });
    tabs.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const btns = [...tabs.querySelectorAll<HTMLButtonElement>('[role=tab]')];
      const i = btns.findIndex((b) => b.getAttribute('aria-selected') === 'true');
      const next = btns[(i + (e.key === 'ArrowRight' ? 1 : btns.length - 1)) % btns.length];
      next.click();
      next.focus();
    });

    playBtn.addEventListener('click', () => {
      playing = !playing;
      sync();
    });

    new ResizeObserver(() => {
      if (!inst) return;
      measure();
      inst.resize?.(width, height, dpr);
    }).observe(stage);
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      sync();
    }).observe(stage);

    if (experiments.length) start(experiments[0]);
  },
});
