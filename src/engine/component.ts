import { ticker } from './ticker';
import { pointer } from './pointer';
import { sound } from './sound';
import { motion } from './motion';

/** Everything a component or experiment gets handed when it mounts. */
export const ctx = { ticker, pointer, sound, motion };
export type Ctx = typeof ctx;

export type Cleanup = void | (() => void);

export interface ComponentDef {
  /** Matches `data-component="name"` in the HTML. */
  name: string;
  /** Mount as soon as the page loads instead of when scrolled near. Default: false. */
  eager?: boolean;
  mount(el: HTMLElement, ctx: Ctx): Cleanup;
}

const registry = new Map<string, ComponentDef>();

export function defineComponent(def: ComponentDef): ComponentDef {
  registry.set(def.name, def);
  return def;
}

/** Find every `[data-component]` under root and mount it (lazily, unless eager). */
export function mountAll(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('[data-component]').forEach((el) => {
    const name = el.dataset.component!;
    const def = registry.get(name);
    if (!def) {
      console.warn(`No component registered for data-component="${name}"`);
      return;
    }
    if (def.eager) {
      def.mount(el, ctx);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          def.mount(el, ctx);
        }
      },
      { rootMargin: '300px' },
    );
    io.observe(el);
  });
}
