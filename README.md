# doee.github.io

My portfolio, built on a tiny homemade engine (Vite + TypeScript, no UI framework).

```
npm install
npm run dev      # http://localhost:5173
npm run build    # outputs dist/
```

Pushing to `main` deploys to GitHub Pages via `.github/workflows/deploy.yml`.

## Editing content

- **Projects**: `src/content/projects.ts`
- **Hero, intro text, contact**: `index.html`
- **Colors and type**: tokens at the top of `src/styles.css`

## The engine (`src/engine/`)

| File | What it gives you |
| --- | --- |
| `ticker.ts` | One shared animation loop. `ticker.add((dt, t) => ...)` returns an unsubscribe. It stops itself when nothing is subscribed. |
| `pointer.ts` | Global pointer position and velocity (px/s). |
| `sound.ts` | Opt-in Web Audio. `sound.pluck(freq, opts)` is silent until the visitor turns sound on. |
| `motion.ts` | `motion.reduced` (prefers-reduced-motion) and `springStep()` for spring physics. |
| `component.ts` | `defineComponent({ name, mount(el, ctx) })`. Any element with `data-component="name"` mounts it when scrolled near (or immediately with `eager: true`). |
| `experiment.ts` | `defineExperiment(...)` for playground sketches. |

### Add a component

Create `src/components/my-thing.ts`:

```ts
import { defineComponent } from '../engine/component';

export default defineComponent({
  name: 'my-thing',
  mount(el, { ticker, pointer, sound, motion }) {
    const stop = ticker.add((dt, t) => {
      el.style.transform = `rotate(${Math.sin(t) * 10}deg)`;
    });
    return stop; // cleanup
  },
});
```

Then put `<div data-component="my-thing"></div>` anywhere in `index.html`. Files in `components/` are picked up automatically.

### Add a playground experiment

Drop a file in `src/experiments/` and it becomes a new tab:

```ts
import { defineExperiment } from '../engine/experiment';

export default defineExperiment({
  id: 'circles',
  title: 'Circles',
  blurb: 'What it does, in a sentence.',
  order: 3,
  setup(canvas, ctx) {
    const g = canvas.getContext('2d')!; // or 'webgl2'
    let W = 0, H = 0;
    ctx.on(canvas, 'pointerdown', () => ctx.sound.pluck(440)); // auto-removed on tab switch
    return {
      resize(w, h, dpr) { W = w; H = h; g.setTransform(dpr, 0, 0, dpr, 0, 0); },
      frame(dt, t) { /* draw */ },
      destroy() {},
    };
  },
});
```

The host handles canvas sizing, high-DPI, pausing when off-screen, a Pause/Play button, and cleanup. Each experiment gets a fresh canvas, so WebGL works too.
