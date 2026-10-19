// ============================================================
//  TECLADO  —  15 brancas + 10 pretas (Dó central a Dó duas oitavas acima).
//  Sem nomes nas teclas. Desenhado em HTML/CSS (nítido em qualquer resolução).
// ============================================================
import { keyboardLayout, noteByMidi } from './notes.js';

export function createKeyboard(root, { onPress }) {
  const { whites, blacks } = keyboardLayout();
  const W = 100 / whites.length;
  const BW = W * 0.62;

  root.innerHTML = '<div class="kb-frame"><div class="kb-keys"></div></div>';
  const keys = root.querySelector('.kb-keys');
  const byMidi = new Map();

  whites.forEach((w) => {
    const el = document.createElement('div');
    el.className = 'wk';
    el.dataset.midi = w.midi;
    el.style.left = w.index * W + '%';
    el.style.width = W + '%';
    el.style.setProperty('--kc', noteByMidi(w.midi).color);
    keys.appendChild(el);
    byMidi.set(w.midi, el);
  });
  blacks.forEach((b) => {
    const el = document.createElement('div');
    el.className = 'bk';
    el.dataset.midi = b.midi;
    el.style.left = (b.leftWhite + 1) * W - BW / 2 + '%';
    el.style.width = BW + '%';
    keys.appendChild(el);
    byMidi.set(b.midi, el);
  });

  const active = new Map(); // pointerId -> elemento
  const keyFrom = (t) => (t && t.closest ? t.closest('[data-midi]') : null);

  keys.addEventListener('pointerdown', (e) => {
    const el = keyFrom(e.target);
    if (!el) return;
    e.preventDefault();
    active.set(e.pointerId, el);
    el.classList.add('down');
    onPress(+el.dataset.midi);
  });
  const release = (e) => {
    const el = active.get(e.pointerId);
    if (el) { el.classList.remove('down'); active.delete(e.pointerId); }
  };
  keys.addEventListener('pointerup', release);
  keys.addEventListener('pointercancel', release);
  keys.addEventListener('pointerleave', release);
  keys.addEventListener('contextmenu', (e) => e.preventDefault());

  return {
    el: root,
    /** Liga/desliga as faixas coloridas (ajuda por cor). */
    setColorHelp(on) { root.classList.toggle('color-help', !!on); },
    /** Pisca a tecla correta (dica depois de 2 erros na mesma nota). */
    hint(midi) {
      byMidi.forEach((el) => el.classList.remove('hint'));
      if (midi != null && byMidi.has(midi)) byMidi.get(midi).classList.add('hint');
    },
    clearHint() { byMidi.forEach((el) => el.classList.remove('hint')); },
    /** Feedback rápido numa tecla (certo/errado). */
    flash(midi, kind) {
      const el = byMidi.get(midi);
      if (!el) return;
      const cls = kind === 'ok' ? 'flash-ok' : 'flash-bad';
      el.classList.remove('flash-ok', 'flash-bad');
      void el.offsetWidth;
      el.classList.add(cls);
      setTimeout(() => el.classList.remove(cls), 450);
    },
    /** Usado nos testes: elemento da tecla. */
    keyEl(midi) { return byMidi.get(midi); },
  };
}
