/**
 * Sound for the comic, synthesised live with Web Audio (no audio files, so no licences to track).
 * A layered ambient score that crossfades by chapter, plus the SFX the story needs. Starts only
 * after the hold-to-enter gesture; one toggle, remembered per visitor.
 */
import type { SoundScene } from "@/story/types";

type Layer = { gain: GainNode; stop: () => void };
export type Sfx =
  | "ping"
  | "connect"
  | "scratch"
  | "splash"
  | "rustle"
  | "type"
  | "impact"
  | "shatter"
  | "whoosh"
  | "tick"
  | "burst";

const NOTE = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

export class Sound {
  ctx: AudioContext | null = null;
  private master!: GainNode;
  private bus!: GainNode;
  private verb!: ConvolverNode;
  private layers = new Map<SoundScene, Layer>();
  private scene: SoundScene | null = null;
  private hum: { osc: OscillatorNode; gain: GainNode; filter: BiquadFilterNode } | null = null;
  private timers: number[] = [];
  muted = false;

  /** Must be called from a user gesture. */
  start() {
    if (this.ctx) return;
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.8;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 3;
    this.master.connect(comp).connect(ctx.destination);
    this.verb = ctx.createConvolver();
    this.verb.buffer = this.impulse(3.2);
    const wet = ctx.createGain();
    wet.gain.value = 0.35;
    this.verb.connect(wet).connect(this.master);
    this.bus = ctx.createGain();
    this.bus.connect(this.master);
    this.bus.connect(this.verb);
    for (const s of ["ink", "night", "swell", "colour", "system", "calm"] as SoundScene[])
      this.layers.set(s, this.makeLayer(s));
    this.setScene("ink");
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.8, this.ctx.currentTime, 0.2);
  }

  setScene(s: SoundScene) {
    if (!this.ctx || s === this.scene) return;
    this.scene = s;
    const now = this.ctx.currentTime;
    for (const [k, l] of this.layers) l.gain.gain.setTargetAtTime(k === s ? 1 : 0, now, 1.4);
  }

  private impulse(seconds: number) {
    const ctx = this.ctx!;
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    return buf;
  }

  private noiseBuffer(seconds = 2) {
    const ctx = this.ctx!;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02; // brown-ish
      d[i] = last * 3.5 + w * 0.15;
    }
    return buf;
  }

  private pad(out: AudioNode, notes: number[], type: OscillatorType, cutoff: number, vol: number) {
    const ctx = this.ctx!;
    const g = ctx.createGain();
    g.gain.value = vol;
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = cutoff;
    f.Q.value = 0.6;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoG = ctx.createGain();
    lfoG.gain.value = cutoff * 0.35;
    lfo.connect(lfoG).connect(f.frequency);
    lfo.start();
    const oscs = notes.flatMap((n) =>
      [-6, 6].map((det) => {
        const o = ctx.createOscillator();
        o.type = type;
        o.frequency.value = NOTE(n);
        o.detune.value = det;
        o.connect(f);
        o.start();
        return o;
      }),
    );
    f.connect(g).connect(out);
    return () => {
      oscs.forEach((o) => o.stop());
      lfo.stop();
    };
  }

  private wind(out: AudioNode, freq: number, q: number, vol: number) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(4);
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.value = vol;
    src.connect(f).connect(g).connect(out);
    src.start();
    return () => src.stop();
  }

  /** Sparse plucked notes from a scale, forever. */
  private plucks(
    out: AudioNode,
    scale: number[],
    every: number,
    vol: number,
    type: OscillatorType = "triangle",
  ) {
    const tick = () => {
      if (!this.ctx) return;
      const n = scale[Math.floor(Math.random() * scale.length)];
      this.tone(out, NOTE(n), 0.002, 1.6, vol, type);
      this.timers.push(window.setTimeout(tick, every * (0.6 + Math.random() * 0.9) * 1000));
    };
    this.timers.push(window.setTimeout(tick, every * 1000));
  }

  private tone(
    out: AudioNode,
    freq: number,
    attack: number,
    decay: number,
    vol: number,
    type: OscillatorType = "sine",
    at = 0,
  ) {
    const ctx = this.ctx!;
    const t = ctx.currentTime + at;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + attack + decay + 0.05);
  }

  private makeLayer(s: SoundScene): Layer {
    const ctx = this.ctx!;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(this.bus);
    const stops: (() => void)[] = [];
    if (s === "ink") {
      stops.push(this.pad(gain, [45, 52, 57, 60], "triangle", 700, 0.035));
      stops.push(this.wind(gain, 500, 0.7, 0.05));
      this.plucks(gain, [69, 72, 74, 76, 79], 2.6, 0.03);
    } else if (s === "night") {
      stops.push(this.pad(gain, [38, 45, 50], "sawtooth", 260, 0.03));
      stops.push(this.wind(gain, 2600, 0.4, 0.06)); // rain hiss
      stops.push(this.wind(gain, 180, 1.2, 0.08)); // room hum
      this.plucks(gain, [62, 65, 69], 4, 0.018, "sine");
    } else if (s === "swell") {
      stops.push(this.pad(gain, [50, 57, 62, 66, 69], "sawtooth", 1400, 0.028));
      stops.push(this.wind(gain, 1200, 0.5, 0.05));
    } else if (s === "colour") {
      stops.push(this.pad(gain, [48, 55, 59, 62, 64], "triangle", 1800, 0.035));
      this.plucks(gain, [72, 74, 76, 79, 81, 84], 0.9, 0.035);
    } else if (s === "system") {
      stops.push(this.pad(gain, [41, 48, 53], "square", 420, 0.02));
      this.plucks(gain, [84, 88, 91, 96], 1.3, 0.02, "square");
    } else {
      stops.push(this.pad(gain, [52, 59, 64, 67], "sine", 900, 0.04));
      this.plucks(gain, [76, 79, 83, 86], 2.2, 0.03, "sine");
    }
    return { gain, stop: () => stops.forEach((f) => f()) };
  }

  private burst(
    dur: number,
    freq: number,
    q: number,
    vol: number,
    type: BiquadFilterType = "bandpass",
    sweepTo?: number,
  ) {
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(Math.max(0.3, dur + 0.1));
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.bus);
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  play(s: Sfx, intensity = 1) {
    if (!this.ctx || this.muted) return;
    const v = intensity;
    switch (s) {
      case "ping":
        this.tone(
          this.bus,
          NOTE(72 + Math.floor(Math.random() * 3) * 5),
          0.003,
          0.7,
          0.12 * v,
          "sine",
        );
        break;
      case "connect":
        this.tone(this.bus, NOTE(79), 0.002, 0.4, 0.06 * v, "triangle");
        break;
      case "scratch":
        this.burst(0.08, 3800, 2, 0.05 * v);
        break;
      case "splash":
        this.burst(0.9, 900, 0.6, 0.25 * v, "lowpass", 200);
        break;
      case "rustle":
        this.burst(0.35, 2400, 0.8, 0.06 * v, "highpass");
        break;
      case "type":
        this.burst(0.03, 2000 + Math.random() * 1500, 4, 0.12 * v);
        break;
      case "impact":
        this.tone(this.bus, 50, 0.005, 1.4, 0.5 * v, "sine");
        this.tone(this.bus, 100, 0.005, 0.6, 0.25 * v, "triangle");
        this.burst(0.6, 600, 0.5, 0.35 * v, "lowpass", 80);
        break;
      case "shatter":
        this.burst(1.1, 5200, 1.5, 0.22 * v, "highpass");
        for (let i = 0; i < 8; i++)
          this.tone(this.bus, 2400 + Math.random() * 3000, 0.001, 0.4, 0.03 * v, "sine", i * 0.05);
        break;
      case "whoosh":
        this.burst(0.8, 300, 0.9, 0.2 * v, "bandpass", 2800);
        break;
      case "tick":
        this.tone(this.bus, 1800, 0.001, 0.06, 0.05 * v, "square");
        break;
      case "burst":
        this.burst(1.2, 400, 0.5, 0.3 * v, "lowpass", 4000);
        this.tone(this.bus, NOTE(84), 0.01, 1.6, 0.06 * v, "sine");
        break;
    }
  }

  /** A hum whose pitch rises with a hold (0..1); 0 stops it. */
  holdHum(p: number) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    if (p <= 0.001) {
      if (this.hum) {
        this.hum.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
        const h = this.hum;
        this.hum = null;
        setTimeout(() => h.osc.stop(), 400);
      }
      return;
    }
    if (!this.hum) {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 300;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      osc.connect(filter).connect(gain).connect(this.bus);
      osc.start();
      this.hum = { osc, gain, filter };
    }
    const t = ctx.currentTime;
    this.hum.osc.frequency.setTargetAtTime(70 + p * 160, t, 0.05);
    this.hum.filter.frequency.setTargetAtTime(300 + p * 2600, t, 0.05);
    this.hum.gain.gain.setTargetAtTime(this.muted ? 0 : 0.05 + p * 0.08, t, 0.05);
  }

  dispose() {
    this.timers.forEach((t) => clearTimeout(t));
    for (const l of this.layers.values()) l.stop();
    this.ctx?.close();
    this.ctx = null;
  }
}
