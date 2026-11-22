/**
 * Opt-in Web Audio. Nothing makes a sound until the visitor turns sound on,
 * and the AudioContext is only created on that click (browsers require a gesture).
 */
type Listener = (on: boolean) => void;

let ac: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = false;
const listeners = new Set<Listener>();

export interface PluckOptions {
  type?: OscillatorType;
  wave?: PeriodicWave;
  gain?: number;
  decay?: number;
  when?: number;
}

export const sound = {
  get enabled() {
    return enabled;
  },
  /** The live AudioContext, or null while sound is off. */
  get context(): AudioContext | null {
    return enabled ? ac : null;
  },
  get output(): AudioNode | null {
    return enabled ? master : null;
  },
  toggle() {
    enabled = !enabled;
    if (enabled) {
      if (!ac) {
        ac = new AudioContext();
        master = ac.createGain();
        master.gain.value = 0.8;
        master.connect(ac.destination);
      }
      void ac.resume();
    } else {
      void ac?.suspend();
    }
    listeners.forEach((l) => l(enabled));
  },
  onChange(fn: Listener) {
    listeners.add(fn);
    return () => void listeners.delete(fn);
  },
  /** A short percussive note. Silently does nothing while sound is off. */
  pluck(freq: number, { type = 'triangle', wave, gain = 0.2, decay = 0.6, when = 0 }: PluckOptions = {}) {
    if (!enabled || !ac || !master) return;
    const t0 = ac.currentTime + when;
    const osc = ac.createOscillator();
    const env = ac.createGain();
    if (wave) osc.setPeriodicWave(wave);
    else osc.type = type;
    osc.frequency.value = freq;
    env.gain.setValueAtTime(0, t0);
    env.gain.linearRampToValueAtTime(gain, t0 + 0.005);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + decay);
    osc.connect(env).connect(master);
    osc.start(t0);
    osc.stop(t0 + decay + 0.05);
  },
};

/** C major pentatonic, two octaves from C5. Every combination sounds friendly. */
export const PENTATONIC = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760];
