import type { Ctx } from './component';

/** What an experiment receives: the shared services plus canvas size and an auto-cleaned listener helper. */
export interface ExperimentCtx extends Ctx {
  readonly width: number;
  readonly height: number;
  readonly dpr: number;
  /** addEventListener that is removed automatically when the experiment is switched away. */
  on<K extends keyof HTMLElementEventMap>(
    target: HTMLElement | Window,
    type: K,
    fn: (e: HTMLElementEventMap[K]) => void,
    opts?: AddEventListenerOptions,
  ): void;
}

export interface ExperimentInstance {
  /** Called every frame while the playground is visible and playing. */
  frame?(dt: number, t: number): void;
  /** Called once after setup and whenever the stage changes size. Sizes are CSS pixels. */
  resize?(width: number, height: number, dpr: number): void;
  destroy?(): void;
}

export interface ExperimentDef {
  id: string;
  title: string;
  /** One or two sentences shown under the canvas. */
  blurb: string;
  /** Lower comes first in the tab list. */
  order?: number;
  setup(canvas: HTMLCanvasElement, ctx: ExperimentCtx): ExperimentInstance;
}

export const defineExperiment = (def: ExperimentDef) => def;
