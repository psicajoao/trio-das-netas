// ============================================================
//  MAIN  —  telas (inicial, fases, jogo, pausa, resultado) e laço do jogo.
// ============================================================
import { PHASES, STAR_RULES, phaseById } from './phases.js';
import { noteByMidi } from './notes.js';
import { Store } from './store.js';
import { Sound } from './sound.js';
import { createStaff } from './staff.js';
import { createKeyboard } from './keyboard.js';
import { createMimo } from './mimo.js';
import { createHud } from './hud.js';
import { createGame } from './game.js';

const $ = (s) => document.querySelector(s);
const screens = { home: $('#home'), select: $('#select'), game: $('#game') };

function show(name) {
  Object.entries(screens).forEach(([k, el]) => { el.hidden = k !== name; });
  document.body.dataset.screen = name;
}

Sound.setEnabled(Store.sound);

// ---- componentes do jogo -------------------------------------------------
show('game'); // precisa estar visível para medir tamanhos
const fx = $('#fx');
const staff = createStaff($('#staffBox'));
const keyboard = createKeyboard($('#kb'), { onPress });
const mimo = createMimo($('#mimoPanel'), fx);
const hud = createHud($('#game'));
const game = createGame({
  staff, keyboard, mimo, hud, fxLayer: fx,
  getColorHelp: () => Store.colorHelp,
  onFinish: showResult,
});
keyboard.setColorHelp(Store.colorHelp);
show('home');

function onPress(midi) {
  Sound.unlock();
  Sound.note(midi); // o teclado sempre toca, jogando ou não
  game.press(midi);
}

// ---- laço ------------------------------------------------------------------
let last = performance.now();
function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  game.tick(dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
document.addEventListener('visibilitychange', () => { if (document.hidden && game.running) pause(); });

// ---- navegação -----------------------------------------------------------
let currentPhase = PHASES[0];

function startPhase(p) {
  currentPhase = p;
  closeOverlays();
  show('game');
  staff.relayout();
  game.start(p);
}

function toSelect() {
  game.stop();
  closeOverlays();
  buildSelect();
  show('select');
}

function closeOverlays() {
  $('#pause').hidden = true;
  $('#result').hidden = true;
  document.body.classList.remove('paused');
}

$('#btnPlay').addEventListener('click', () => { Sound.unlock(); Sound.tap(); toSelect(); });
$('#btnBack').addEventListener('click', () => { Sound.tap(); show('home'); });

function buildSelect() {
  const grid = $('#phaseGrid');
  grid.innerHTML = '';
  PHASES.forEach((p) => {
    const unlocked = Store.isUnlocked(p.id);
    const stars = Store.starsOf(p.id);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'phase-card' + (unlocked ? '' : ' locked');
    b.disabled = !unlocked;
    b.dataset.phase = p.id;
    const dots = [...new Set(p.pool.map((m) => noteByMidi(m).letter))]
      .map((l) => `<i style="background:${noteByMidi(p.pool.find((m) => noteByMidi(m).letter === l)).color}"></i>`).join('');
    b.innerHTML =
      `<span class="num">${p.id}</span><span class="nm">${p.name}</span><span class="dots">${dots}</span>` +
      `<span class="pst">${[1, 2, 3].map((i) => `<i class="${i <= stars ? 'on' : ''}">★</i>`).join('')}</span>` +
      (unlocked ? '' : '<span class="lock" aria-label="Bloqueada">🔒</span>');
    b.addEventListener('click', () => { Sound.unlock(); Sound.tap(); startPhase(p); });
    grid.appendChild(b);
  });
  refreshHelpLabels();
}

// ---- ajuda por cor / som --------------------------------------------------
function refreshHelpLabels() {
  const on = Store.colorHelp;
  [['#btnHelp'], ['#pHelp']].forEach(([s]) => {
    const e = $(s);
    e.querySelector('b').textContent = on ? 'ligadas' : 'desligadas';
    e.setAttribute('aria-pressed', on);
  });
  const sEl = $('#pSound');
  sEl.querySelector('b').textContent = Store.sound ? 'ligado' : 'desligado';
}
function toggleHelp() {
  Store.colorHelp = !Store.colorHelp;
  keyboard.setColorHelp(Store.colorHelp);
  refreshHelpLabels();
}
$('#btnHelp').addEventListener('click', toggleHelp);
$('#pHelp').addEventListener('click', toggleHelp);
$('#pSound').addEventListener('click', () => {
  Store.sound = !Store.sound;
  Sound.setEnabled(Store.sound);
  refreshHelpLabels();
});

// ---- pausa ------------------------------------------------------------------
function pause() {
  if (!game.running || game.paused) return;
  game.pause();
  document.body.classList.add('paused');
  refreshHelpLabels();
  $('#pause').hidden = false;
}
function resume() {
  $('#pause').hidden = true;
  document.body.classList.remove('paused');
  game.resume();
}
$('#btnPause').addEventListener('click', () => { Sound.unlock(); pause(); });
$('#pContinue').addEventListener('click', resume);
$('#pRestart').addEventListener('click', () => startPhase(currentPhase));
$('#pPhases').addEventListener('click', toSelect);

// ---- resultado --------------------------------------------------------------
function showResult(r) {
  Store.setStars(r.phase.id, r.stars);
  $('#rTitle').textContent = r.stars === 3 ? 'Perfeito!' : 'Fase concluída!';
  [...$('#rStars').children].forEach((s, i) => {
    s.classList.toggle('on', i < r.stars);
    s.style.animationDelay = 0.25 * i + 's';
  });
  $('#rLine').innerHTML =
    `<b>${r.score}</b> pontos · acertou <b>${r.firstHits}</b> de <b>${r.total}</b> de primeira` +
    (r.retried ? ` · ${r.retried} na segunda chance` : '');
  $('#rRule').textContent = STAR_RULES.map((s) => '★'.repeat(s.stars) + ' ' + s.text).join('   ·   ');
  const next = phaseById(r.phase.id + 1);
  const nb = $('#rNext');
  nb.textContent = next ? 'CONTINUAR' : 'FASES';
  nb.onclick = () => { Sound.tap(); next ? startPhase(next) : toSelect(); };
  $('#rAgain').onclick = () => { Sound.tap(); startPhase(r.phase); };
  $('#rPhases').onclick = () => { Sound.tap(); toSelect(); };
  $('#result').hidden = false;
}

// ---- PWA / offline ----------------------------------------------------------
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

// ---- gancho para testes automáticos -----------------------------------------
window.__mimo = { game, keyboard, staff, Store, show, startPhase, toSelect, pause, resume };
