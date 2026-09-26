/**
 * The hero walker's clock, shared.
 *
 * HeroWalker publishes where in the gait cycle the digital human is, every
 * frame it paints; the Pose rail subscribes and sets its live read-outs from
 * the same measured tables (HERO_GAIT), so what the rail says is what the
 * body is doing on screen. Module scope, no React state: a subscriber writes
 * its own DOM, and only when a value changes.
 */
export type GaitTick = {
  /** The frame on screen, 0..N-1 (frame 0 = right heel strike). */
  i: number;
  /** Continuous frame position, for the cursor and the waveform. */
  f: number;
};

type Listener = (tick: GaitTick) => void;

const listeners = new Set<Listener>();
let last: GaitTick | null = null;

export function publishGait(tick: GaitTick) {
  last = tick;
  for (const fn of listeners) fn(tick);
}

export function subscribeGait(fn: Listener) {
  listeners.add(fn);
  if (last) fn(last);
  return () => {
    listeners.delete(fn);
  };
}
