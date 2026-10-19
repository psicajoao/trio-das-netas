// Progresso e preferências no aparelho (localStorage, tudo opcional: o jogo funciona sem ele).
const KEY = 'mimo:v1';
const DEFAULT = { stars: {}, colorHelp: true, sound: true };

let state = { ...DEFAULT, stars: {} };
try {
  const raw = localStorage.getItem(KEY);
  if (raw) state = { ...DEFAULT, ...JSON.parse(raw) };
} catch (e) { /* modo privado / sem armazenamento */ }

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignora */ }
}

export const Store = {
  get colorHelp() { return state.colorHelp !== false; },
  set colorHelp(v) { state.colorHelp = !!v; save(); },
  get sound() { return state.sound !== false; },
  set sound(v) { state.sound = !!v; save(); },
  starsOf(phaseId) { return (state.stars && state.stars[phaseId]) || 0; },
  /** Guarda a melhor marca e devolve true se esta foi a primeira vez que a fase foi concluída. */
  setStars(phaseId, n) {
    state.stars = state.stars || {};
    const first = !state.stars[phaseId];
    if (n > (state.stars[phaseId] || 0)) state.stars[phaseId] = n;
    save();
    return first;
  },
  /** Fase 1 sempre liberada; as demais exigem ao menos 1 estrela na anterior. */
  isUnlocked(phaseId) { return phaseId === 1 || this.starsOf(phaseId - 1) >= 1; },
  reset() { state = { ...DEFAULT, stars: {} }; save(); },
};
