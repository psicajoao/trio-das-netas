// ============================================================
//  HUD  —  fase, pontos, erros, estrelas possíveis, pausa e fogueira de erros.
// ============================================================
import { liveStars } from './phases.js';

const FLAME_SVG =
  '<svg viewBox="-30 -66 60 84" aria-hidden="true"><path d="M0,-62 C14,-40 30,-30 26,-8 C24,8 10,16 0,16 C-12,16 -26,6 -26,-10 C-26,-24 -14,-30 -10,-44 C-6,-36 -2,-40 0,-62Z" fill="#FF6B1A" stroke="#24306A" stroke-width="5" stroke-linejoin="round"/><path d="M0,-34 C8,-22 16,-16 13,-3 C11,6 5,10 0,10 C-6,10 -13,4 -13,-5 C-13,-14 -6,-18 -4,-26 C-2,-22 0,-26 0,-34Z" fill="#FFC93C"/></svg>';

export function createHud(q) {
  const $ = (id) => q.querySelector(id);
  const el = {
    phase: $('#hPhase'), score: $('#hScore'), err: $('#hErr'), stars: $('#hStars'),
    prompt: $('#prompt'), count: $('#count'), flames: $('#flames'), banner: $('#banner'),
  };
  const pad = (n, w) => String(n).padStart(w, '0');
  let bannerTimer = null;

  function setStars(n) {
    el.stars.querySelectorAll('.st').forEach((s, i) => s.classList.toggle('on', i < n));
  }

  return {
    reset(phase) {
      el.phase.textContent = 'FASE ' + pad(phase.id, 2);
      el.score.textContent = 'PONTOS ' + pad(0, 3);
      el.err.textContent = 'ERROS 0';
      el.flames.innerHTML = '';
      setStars(3);
      el.banner.classList.remove('show');
    },
    setScore(n) { el.score.textContent = 'PONTOS ' + pad(n, 3); },
    setErrors(n) { el.err.textContent = 'ERROS ' + n; setStars(liveStars(n)); },
    setPrompt(t) { el.prompt.textContent = t; },
    setCount(i, n) { el.count.textContent = i + ' / ' + n; },
    addFlame() {
      if (el.flames.children.length >= 8) return;
      const s = document.createElement('span');
      s.className = 'flame';
      s.innerHTML = FLAME_SVG;
      el.flames.appendChild(s);
    },
    /** Uma chama se apaga quando a criança acerta a nota na segunda chance. */
    douse() {
      const f = [...el.flames.children].find((c) => !c.classList.contains('out'));
      if (f) f.classList.add('out');
    },
    banner(text) {
      el.banner.textContent = text;
      el.banner.classList.add('show');
      clearTimeout(bannerTimer);
      bannerTimer = setTimeout(() => el.banner.classList.remove('show'), 1500);
    },
  };
}
