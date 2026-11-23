/**
 * Sound design (PRD F7): off by default, one toggle, remembered per visitor.
 * Every sound is synthesised with Web Audio (noise + oscillators + envelopes), so there are no sample files
 * and nothing to license. Nothing plays until the visitor turns sound on (which also unlocks the AudioContext).
 */
export const SOUND_KEY = "aw:sound";

export const SFX_NAMES = [
  "chime",
  "hoof",
  "flame",
  "neigh",
  "footfall",
  "crack",
  "trumpet",
  "thunder",
  "wing",
  "screech",
  "drum",
  "choir",
  "roar",
  "boom",
  "whoosh",
  "rise",
] as const;
export type Sfx = (typeof SFX_NAMES)[number];

export function readSoundPref(raw: string | null): boolean {
  return raw === "on";
}

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let on = false;
const listeners = new Set<(on: boolean) => void>();

export function isSoundOn() {
  return on;
}
export function onSoundChange(fn: (on: boolean) => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Reads the remembered preference. Audio is only created after a click (browser autoplay rules). */
export function initSound() {
  try {
    on = readSoundPref(localStorage.getItem(SOUND_KEY));
  } catch {
    on = false;
  }
  listeners.forEach((l) => l(on));
}

export function setSound(next: boolean) {
  on = next;
  try {
    localStorage.setItem(SOUND_KEY, next ? "on" : "off");
  } catch {
    /* private mode: keep it for this visit only */
  }
  if (next) ensureCtx()?.resume();
  listeners.forEach((l) => l(on));
}

function ensureCtx(): AudioContext | null {
  if (ctx) return ctx;
  const AC =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.5;
  const comp = ctx.createDynamicsCompressor();
  master.connect(comp).connect(ctx.destination);
  return ctx;
}

// ---------- tiny synth kit ----------
function noiseBuffer(c: AudioContext, seconds: number) {
  const b = c.createBuffer(1, Math.ceil(c.sampleRate * seconds), c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}
function env(g: GainNode, t: number, a: number, peak: number, d: number) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
}
function noise(
  c: AudioContext,
  t: number,
  o: {
    dur: number;
    type: BiquadFilterType;
    freq: number;
    q?: number;
    peak: number;
    attack?: number;
    sweepTo?: number;
  },
) {
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, o.dur + 0.1);
  const f = c.createBiquadFilter();
  f.type = o.type;
  f.frequency.setValueAtTime(o.freq, t);
  if (o.sweepTo) f.frequency.exponentialRampToValueAtTime(o.sweepTo, t + o.dur);
  f.Q.value = o.q ?? 1;
  const g = c.createGain();
  env(g, t, o.attack ?? 0.005, o.peak, o.dur);
  src.connect(f).connect(g).connect(master!);
  src.start(t);
  src.stop(t + o.dur + 0.1);
}
function tone(
  c: AudioContext,
  t: number,
  o: {
    dur: number;
    type: OscillatorType;
    freq: number;
    to?: number;
    peak: number;
    attack?: number;
    vibrato?: number;
  },
) {
  const osc = c.createOscillator();
  osc.type = o.type;
  osc.frequency.setValueAtTime(o.freq, t);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + o.dur);
  if (o.vibrato) {
    const lfo = c.createOscillator();
    const lg = c.createGain();
    lfo.frequency.value = o.vibrato;
    lg.gain.value = o.freq * 0.03;
    lfo.connect(lg).connect(osc.frequency);
    lfo.start(t);
    lfo.stop(t + o.dur + 0.1);
  }
  const g = c.createGain();
  env(g, t, o.attack ?? 0.01, o.peak, o.dur);
  osc.connect(g).connect(master!);
  osc.start(t);
  osc.stop(t + o.dur + 0.1);
}

const RECIPES: Record<Sfx, (c: AudioContext, t: number) => void> = {
  chime: (c, t) => {
    tone(c, t, { dur: 1.2, type: "sine", freq: 1318, peak: 0.18 });
    tone(c, t + 0.04, { dur: 1.4, type: "sine", freq: 1975, peak: 0.08 });
  },
  hoof: (c, t) => {
    for (const dt of [0, 0.09, 0.22, 0.3]) {
      tone(c, t + dt, { dur: 0.09, type: "sine", freq: 140, to: 60, peak: 0.6 });
      noise(c, t + dt, { dur: 0.05, type: "bandpass", freq: 900, q: 2, peak: 0.25 });
    }
  },
  flame: (c, t) =>
    noise(c, t, {
      dur: 1.6,
      type: "lowpass",
      freq: 300,
      sweepTo: 1600,
      q: 0.7,
      peak: 0.5,
      attack: 0.25,
    }),
  neigh: (c, t) =>
    tone(c, t, { dur: 0.9, type: "sawtooth", freq: 620, to: 380, peak: 0.12, vibrato: 18 }),
  footfall: (c, t) => {
    tone(c, t, { dur: 0.5, type: "sine", freq: 70, to: 32, peak: 0.9 });
    noise(c, t, { dur: 0.3, type: "lowpass", freq: 400, peak: 0.4 });
  },
  crack: (c, t) => {
    noise(c, t, { dur: 0.25, type: "highpass", freq: 1500, peak: 0.7, attack: 0.001 });
    noise(c, t + 0.05, { dur: 0.6, type: "bandpass", freq: 500, q: 0.8, peak: 0.35 });
  },
  trumpet: (c, t) => {
    tone(c, t, {
      dur: 1.1,
      type: "sawtooth",
      freq: 330,
      to: 440,
      peak: 0.16,
      attack: 0.08,
      vibrato: 6,
    });
    tone(c, t, { dur: 1.1, type: "square", freq: 660, to: 880, peak: 0.05, attack: 0.1 });
  },
  thunder: (c, t) => {
    noise(c, t, { dur: 0.12, type: "highpass", freq: 2000, peak: 0.8, attack: 0.001 });
    noise(c, t + 0.05, {
      dur: 2.4,
      type: "lowpass",
      freq: 900,
      sweepTo: 80,
      peak: 0.7,
      attack: 0.02,
    });
  },
  wing: (c, t) => {
    for (const dt of [0, 0.32, 0.64])
      noise(c, t + dt, { dur: 0.28, type: "bandpass", freq: 350, q: 0.6, peak: 0.4, attack: 0.08 });
  },
  screech: (c, t) =>
    tone(c, t, { dur: 0.7, type: "sawtooth", freq: 2200, to: 1300, peak: 0.07, vibrato: 30 }),
  drum: (c, t) => {
    for (const dt of [0, 0.45, 0.9, 1.35]) {
      tone(c, t + dt, { dur: 0.3, type: "sine", freq: 110, to: 50, peak: 0.7 });
      noise(c, t + dt, { dur: 0.08, type: "bandpass", freq: 1800, peak: 0.15 });
    }
  },
  choir: (c, t) => {
    for (const f of [261.6, 329.6, 392, 523.3])
      tone(c, t, { dur: 2.6, type: "triangle", freq: f, peak: 0.07, attack: 0.9, vibrato: 5 });
  },
  roar: (c, t) => {
    noise(c, t, {
      dur: 1.6,
      type: "lowpass",
      freq: 600,
      sweepTo: 180,
      q: 4,
      peak: 0.8,
      attack: 0.15,
    });
    tone(c, t, {
      dur: 1.5,
      type: "sawtooth",
      freq: 95,
      to: 60,
      peak: 0.25,
      attack: 0.15,
      vibrato: 11,
    });
  },
  boom: (c, t) => {
    tone(c, t, { dur: 1.4, type: "sine", freq: 55, to: 28, peak: 1 });
    noise(c, t, { dur: 0.9, type: "lowpass", freq: 200, peak: 0.5 });
  },
  whoosh: (c, t) =>
    noise(c, t, {
      dur: 0.9,
      type: "bandpass",
      freq: 300,
      sweepTo: 3000,
      q: 1.5,
      peak: 0.45,
      attack: 0.3,
    }),
  rise: (c, t) =>
    tone(c, t, { dur: 1.8, type: "sine", freq: 220, to: 1760, peak: 0.15, attack: 0.6 }),
};

/** Plays a synthesised effect if sound is on; silently does nothing otherwise. */
export function play(name: Sfx, delaySec = 0) {
  if (!on) return;
  const c = ensureCtx();
  if (!c || !master) return;
  RECIPES[name](c, c.currentTime + delaySec);
}
