// ============================================================
//  PARTIDA  —  máquina de estados do jogo (uma nota por vez).
//
//  Rodada 1 ("main"): a nota entra pela direita e anda para a esquerda.
//    - tecla certa  -> a nota voa até a boca do Mimo (+10)
//    - tecla errada, ou a nota chega à clave -> a nota pega fogo, vai para a fogueira
//      (o jogo NÃO reinicia: segue para a próxima nota)
//  Rodada 2 ("retry"): segunda chance com as notas erradas, uma por vez.
//    A nota entra, para no meio e espera (aro amarelo). Errar só balança a nota;
//    depois de 2 erros na mesma nota a tecla certa pisca (dica). Acerto vale +5.
//  Estrelas: ver STAR_RULES em phases.js (erros da rodada 1).
//
//  Todo o tempo do jogo passa por tick(dt): com dt = 0 (pausa) nada anda.
// ============================================================
import { noteByMidi } from './notes.js';
import { makeSequence, starsFor, POINTS } from './phases.js';
import { Sound } from './sound.js';
import { noteShapeSvg } from './staff.js';

const FLY_TIME = 0.6;
const BURN_TIME = 0.85;
const GAP = 0.55;          // pausa entre notas (s)
const RETRY_ENTER_SPEED = 5; // a nota da 2ª rodada entra mais depressa

export function createGame({ staff, keyboard, mimo, hud, fxLayer, getColorHelp, onFinish, rand = Math.random }) {
  let G = null;
  let cur = null;
  let timers = [];
  let flyer = null;

  const m = staff.metrics;
  const later = (sec, fn) => { const gen = G && G.gen; timers.push({ t: sec, fn, gen }); };
  const alive = (gen) => G && G.gen === gen;
  let genCounter = 0;

  // ---------------------------------------------------------------- início
  function start(phase) {
    cleanup();
    G = {
      gen: ++genCounter,
      phase,
      seq: makeSequence(phase.pool, phase.length, rand),
      idx: 0,
      mode: 'main',
      score: 0,
      errors: [],        // índices (na sequência) das notas erradas
      retryList: [],
      ri: 0,
      firstHits: 0,
      retryWrong: 0,
      paused: false,
      done: false,
    };
    keyboard.setColorHelp(getColorHelp());
    keyboard.clearHint();
    hud.reset(phase);
    hud.setPrompt('Toque a tecla da nota');
    hud.setCount(0, G.seq.length);
    mimo.say('Vamos lá!');
    later(0.9, spawnMain);
  }

  function cleanup() {
    timers = [];
    cur = null;
    if (flyer) { flyer.el.remove(); flyer = null; }
    staff.hide();
    keyboard.clearHint();
  }

  function stop() { cleanup(); G = null; }

  // ---------------------------------------------------------------- notas
  function spawnMain() {
    if (!G || G.done) return;
    const midi = G.seq[G.idx];
    spawn(midi, { idx: G.idx, retry: false });
    hud.setCount(G.idx + 1, G.seq.length);
  }

  function spawnRetry() {
    if (!G || G.done) return;
    const midi = G.retryList[G.ri].midi;
    spawn(midi, { idx: G.retryList[G.ri].idx, retry: true });
    hud.setCount(G.ri + 1, G.retryList.length);
  }

  function spawn(midi, { idx, retry }) {
    const note = noteByMidi(midi);
    staff.showNote(note, { colorHelp: getColorHelp() });
    cur = { midi, note, idx, retry, x: m.startX, state: 'moving', attempts: 0, t: 0 };
    keyboard.clearHint();
    mimo.say(retry ? 'Tente de novo!' : 'Qual é esta nota?');
  }

  const visible = () => cur && cur.x < m.vbW - 24;

  // ---------------------------------------------------------------- entrada
  function press(midi) {
    if (!G || G.paused || G.done || !cur) return;
    if (cur.state !== 'moving' && cur.state !== 'waiting') return;
    if (!visible()) return;
    if (midi === cur.midi) hit(midi);
    else wrong(midi);
  }

  function hit(midi) {
    const retry = cur.retry;
    G.score += retry ? POINTS.retry : POINTS.first;
    if (!retry) G.firstHits++;
    hud.setScore(G.score);
    keyboard.flash(midi, 'ok');
    keyboard.clearHint();
    Sound.hit();

    // clone voador (coordenadas de tela) da nota até a boca do Mimo
    const from = staff.noteCenter();
    const to = mimo.mouthPoint();
    const ppu = staff.pxPerUnit();
    const el = document.createElement('div');
    el.className = 'fly';
    el.style.width = 90 * ppu + 'px';
    el.style.height = 60 * ppu + 'px';
    el.innerHTML = `<svg viewBox="-45 -30 90 60" width="100%" height="100%">${noteShapeSvg(cur.note.color && getColorHelp() ? cur.note.color : '#24306A')}</svg>`;
    fxLayer.appendChild(el);
    flyer = { el, from, to, t: 0, label: retry ? '+' + POINTS.retry : '+' + POINTS.first, name: cur.note.name, retry };
    place(flyer, 0);
    staff.hide();
    cur.state = 'flying';
  }

  function place(f, p) {
    const e = p * p;
    const x = f.from.x + (f.to.x - f.from.x) * e;
    const y = f.from.y + (f.to.y - f.from.y) * e - Math.sin(p * Math.PI) * 40;
    const s = 1 - 0.7 * e;
    f.el.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%) scale(${s}) rotate(${p * 200}deg)`;
  }

  function arrived() {
    const f = flyer;
    f.el.remove();
    flyer = null;
    mimo.eat();
    Sound.chew();
    mimo.burst(5, f.label);
    mimo.say(`Isso! É o ${f.name}!`);
    if (f.retry) hud.douse();
    const gen = G.gen;
    later(0.95, () => { if (alive(gen)) advance(); });
  }

  function wrong(midi) {
    if (cur.retry) {
      // 2ª rodada: a nota fica; balança; dica após 2 erros
      cur.attempts++;
      G.retryWrong++;
      Sound.miss();
      keyboard.flash(midi, 'bad');
      mimo.sad();
      mimo.say('Quase! Olhe a linha.');
      cur.shake = 0.5;
      staff.setState('burning small');
      if (cur.attempts >= 2) keyboard.hint(cur.midi);
      return;
    }
    keyboard.flash(midi, 'bad');
    burn(false);
  }

  /** Nota queimada na rodada 1 (tecla errada ou tempo esgotado). */
  function burn(timeout) {
    Sound.miss();
    mimo.sad();
    mimo.say(timeout ? `Era o ${cur.note.name}. Vamos de novo depois!` : `Era o ${cur.note.name}.`);
    if (!G.errors.includes(cur.idx)) {
      G.errors.push(cur.idx);
      hud.setErrors(G.errors.length);
      hud.addFlame();
    }
    cur.state = 'burning';
    cur.t = BURN_TIME;
    staff.setState('burning');
  }

  function advance() {
    if (!G) return;
    cur = null;
    staff.hide();
    keyboard.clearHint();
    if (G.mode === 'main') {
      G.idx++;
      if (G.idx < G.seq.length) later(GAP, spawnMain);
      else endMain();
    } else {
      G.ri++;
      if (G.ri < G.retryList.length) later(GAP, spawnRetry);
      else finish();
    }
  }

  function endMain() {
    if (G.errors.length === 0) { finish(); return; }
    G.mode = 'retry';
    G.retryList = G.errors.slice().sort((a, b) => a - b).map((i) => ({ idx: i, midi: G.seq[i] }));
    G.ri = 0;
    hud.setPrompt('Segunda chance!');
    mimo.say('Segunda chance!');
    hud.banner('Segunda chance!');
    later(1.6, spawnRetry);
  }

  function finish() {
    G.done = true;
    const stars = starsFor(G.errors.length);
    const result = {
      phase: G.phase,
      stars,
      score: G.score,
      total: G.seq.length,
      firstHits: G.firstHits,
      errors: G.errors.length,
      retried: G.retryList.length,
    };
    mimo.cheer();
    mimo.say('Muito bem!');
    Sound.fanfare(stars);
    const gen = G.gen;
    later(1.4, () => { if (alive(gen)) onFinish(result); });
  }

  // ---------------------------------------------------------------- relógio
  function tick(dt) {
    if (!G) return;
    if (G.paused) dt = 0;
    if (dt > 0.1) dt = 0.1;

    // temporizadores
    if (dt > 0 && timers.length) {
      const due = [];
      timers = timers.filter((t) => { t.t -= dt; if (t.t <= 0) { due.push(t); return false; } return true; });
      due.forEach((t) => { if (t.gen === (G && G.gen)) t.fn(); });
    }

    if (flyer) {
      flyer.t += dt / FLY_TIME;
      if (flyer.t >= 1) arrived(); else place(flyer, flyer.t);
    }

    if (!cur) return;
    const speedMain = (m.startX - m.endX) / G.phase.travel;

    if (cur.state === 'moving') {
      if (cur.retry) {
        cur.x -= speedMain * RETRY_ENTER_SPEED * dt;
        if (cur.x <= m.centerX) { cur.x = m.centerX; cur.state = 'waiting'; staff.setState('waiting'); }
      } else {
        cur.x -= speedMain * dt;
        if (cur.x <= m.endX) { cur.x = m.endX; burn(true); }
      }
      staff.setX(cur.x);
    } else if (cur.state === 'burning') {
      cur.t -= dt;
      staff.setX(cur.x + Math.sin(cur.t * 60) * 5);
      if (cur.t <= 0 && dt > 0) { const gen = G.gen; cur.state = 'gone'; if (alive(gen)) advance(); }
    } else if (cur.state === 'waiting') {
      if (cur.shake > 0) {
        cur.shake -= dt;
        staff.setX(cur.x + Math.sin(cur.shake * 70) * 6);
        if (cur.shake <= 0) { staff.setX(cur.x); staff.setState('waiting'); }
      }
    }
  }

  return {
    start, stop, press, tick,
    pause() { if (G) G.paused = true; },
    resume() { if (G) G.paused = false; },
    get running() { return !!G && !G.done; },
    get paused() { return !!G && G.paused; },
    /** Para os testes automáticos. */
    snapshot() {
      if (!G) return null;
      return {
        mode: G.mode, idx: G.idx, score: G.score, errors: G.errors.slice(), done: G.done,
        seq: G.seq.slice(), retryList: G.retryList.map((r) => r.midi),
        cur: cur && { midi: cur.midi, x: cur.x, state: cur.state, attempts: cur.attempts, visible: visible() },
      };
    },
  };
}
