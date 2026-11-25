// Sound for Copper Ladle: every noise is synthesized with WebAudio,
// no audio files, no network. The kitchen is quiet until the cook's
// first click — browsers only allow sound after a gesture.

export class SoundBank {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.sizzleNodes = null;
  }

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return true;
    }
    try {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return false;
      this.ctx = new Ctor();
      return true;
    } catch (err) {
      return false;
    }
  }

  tone(freq, dur, type, gainValue, slideTo) {
    if (this.muted || !this.ensure()) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(gainValue || 0.08, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  noise(dur, gainValue, filterFreq) {
    if (this.muted || !this.ensure()) return;
    const t0 = this.ctx.currentTime;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq || 1200;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainValue || 0.05, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    src.start(t0);
  }

  pickup() { this.tone(520, 0.08, 'triangle', 0.06); }
  place() { this.tone(330, 0.09, 'triangle', 0.06, 240); }
  chop() { this.noise(0.05, 0.12, 900); this.tone(180, 0.05, 'square', 0.04); }
  chopDone() { this.tone(660, 0.12, 'triangle', 0.07); this.tone(880, 0.14, 'triangle', 0.06); }
  sizzle() { this.noise(0.5, 0.05, 3200); }
  sizzleDone() { this.tone(740, 0.1, 'sine', 0.06); this.tone(988, 0.16, 'sine', 0.06); }
  burn() { this.tone(220, 0.4, 'sawtooth', 0.05, 110); }
  serve() { this.tone(1046, 0.12, 'sine', 0.09); this.tone(1318, 0.2, 'sine', 0.09); }
  error() { this.tone(160, 0.16, 'square', 0.05, 120); }
  trash() { this.noise(0.18, 0.08, 500); }
  tick() { this.tone(880, 0.05, 'sine', 0.04); }
  rush() { this.tone(392, 0.12, 'triangle', 0.08); this.tone(523, 0.12, 'triangle', 0.08); this.tone(659, 0.2, 'triangle', 0.08); }
  click() { this.tone(700, 0.05, 'triangle', 0.05); }
}
