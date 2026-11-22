import { defineComponent } from '../engine/component';

export default defineComponent({
  name: 'sound-toggle',
  eager: true,
  mount(el, { sound }) {
    const label = el.querySelector('.sound-label')!;
    const render = (on: boolean) => {
      el.setAttribute('aria-pressed', String(on));
      label.textContent = on ? 'Sound on' : 'Sound off';
    };
    el.addEventListener('click', () => {
      sound.toggle();
      // A little chime so you know it worked.
      sound.pluck(783.99, { gain: 0.12, decay: 0.4 });
      sound.pluck(1046.5, { gain: 0.1, decay: 0.6, when: 0.08 });
    });
    sound.onChange(render);
    render(sound.enabled);
  },
});
