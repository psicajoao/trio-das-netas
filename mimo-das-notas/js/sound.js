// ============================================================
//  SOM  —  placeholders sintetizados com WebAudio (sem arquivos de áudio).
//  Para trocar por áudio real, substitua as funções de `Sound`
//  (ex.: Sound.note = (midi) => tocarAmostra(midi)). Nada mais muda.
// ============================================================
let ctx = null;
let master = null;
let enabled = true;

function ensure() {
  if (!enabled) return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.7;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

function tone(freq, { t = 0, dur = 0.5, type = 'triangle', gain = 0.3, attack = 0.008, slideTo = null } = {}) {
  const c = ensure();
  if (!c) return;
  const t0 = c.currentTime + t;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(master);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

function noiseBurst(t, dur, gain, freq) {
  const c = ensure();
  if (!c) return;
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = c.createBufferSource();
  s.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = freq;
  const g = c.createGain();
  g.gain.value = gain;
  s.connect(f).connect(g).connect(master);
  s.start(c.currentTime + t);
}

export const Sound = {
  /** Liga/desliga todo o som. */
  setEnabled(v) { enabled = !!v; },
  isEnabled() { return enabled; },
  /** Deve ser chamado num toque do usuário (política de áudio do Android). */
  unlock() { ensure(); },

  /** Som de piano (placeholder) da tecla tocada. */
  note(midi) {
    const f = hz(midi);
    tone(f, { dur: 0.9, type: 'triangle', gain: 0.32 });
    tone(f * 2, { dur: 0.5, type: 'sine', gain: 0.1 });
  },
  /** Acerto: dois "plins" subindo. */
  hit() {
    tone(880, { dur: 0.18, type: 'sine', gain: 0.18 });
    tone(1318.5, { t: 0.1, dur: 0.32, type: 'sine', gain: 0.18 });
  },
  /** Erro: "bup" grave e curto. */
  miss() {
    tone(220, { dur: 0.28, type: 'sawtooth', gain: 0.12, slideTo: 120 });
    noiseBurst(0, 0.18, 0.12, 900);
  },
  /** Mastigar: três estalinhos. */
  chew() {
    [0, 0.18, 0.36].forEach((t) => noiseBurst(t, 0.07, 0.35, 500 + t * 400));
  },
  /** Fim de fase. */
  fanfare(stars) {
    const seq = [523.25, 659.25, 783.99, 1046.5];
    seq.slice(0, 2 + stars).forEach((f, i) => tone(f, { t: i * 0.14, dur: 0.4, type: 'triangle', gain: 0.22 }));
  },
  /** Botões. */
  tap() { tone(660, { dur: 0.08, type: 'sine', gain: 0.12 }); },
};
