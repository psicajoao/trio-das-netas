// ============================================================
//  PAUTA (clave de sol) + NOTA MÓVEL
//  Coordenadas internas (viewBox): altura fixa 320; a largura acompanha o painel.
//  Posição vertical sai de note.staffPos (ver notes.js): y = BASE - HS * staffPos.
// ============================================================
import { CLEF_PATH, CLEF_BOUNDS } from './clef.js';

export const VBH = 306;
const VBY0 = 6;           // topo visível do viewBox (cabe até o Fá5, linha de cima, sem cortar)
const BASE = 234;          // y da 1ª linha (Mi4)
const HS = 25;             // meio espaço da pauta (distância linha<->espaço)
export const posY = (pos) => BASE - HS * pos;

const NAVY = '#24306A';
const CLEF_SCALE = 0.125;  // reduzido p/ caber (a clave padrão passaria do topo)
const CLEF_X = 18;

const FLAME =
  '<path d="M0,-62 C14,-40 30,-30 26,-8 C24,8 10,16 0,16 C-12,16 -26,6 -26,-10 C-26,-24 -14,-30 -10,-44 C-6,-36 -2,-40 0,-62Z" fill="#FF6B1A" stroke="#C2410C" stroke-width="3" stroke-linejoin="round"/>' +
  '<path d="M0,-34 C8,-22 16,-16 13,-3 C11,6 5,10 0,10 C-6,10 -13,4 -13,-5 C-13,-14 -6,-18 -4,-26 C-2,-22 0,-26 0,-34Z" fill="#FFC93C"/>';

/** SVG (como texto) de uma nota semibreve: oval vazio, contorno azul-marinho e anel colorido. */
export function noteShapeSvg(color, { ledger = false } = {}) {
  return (
    (ledger ? `<line class="ledger" x1="-56" x2="56" y1="0" y2="0" stroke="${NAVY}" stroke-width="5" stroke-linecap="round"/>` : '') +
    `<ellipse cx="0" cy="0" rx="32" ry="17.5" fill="none" stroke="${NAVY}" stroke-width="15"/>` +
    `<ellipse cx="0" cy="0" rx="32" ry="17.5" fill="none" stroke="${color}" stroke-width="10"/>`
  );
}

export function createStaff(root) {
  root.innerHTML =
    '<svg class="staff-svg" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">' +
    '<g class="lines"></g>' +
    `<path class="clef" d="${CLEF_PATH}" fill="${NAVY}"/>` +
    '<g class="mv" visibility="hidden">' +
    '<ellipse class="ring" cx="0" cy="0" rx="54" ry="36" fill="none" stroke="#FFC93C" stroke-width="9"/>' +
    '<g class="shape"></g>' +
    `<g class="flame" transform="translate(0,12)">${FLAME}</g>` +
    '</g></svg>';

  const svg = root.querySelector('svg');
  const linesG = svg.querySelector('.lines');
  const clef = svg.querySelector('.clef');
  const mv = svg.querySelector('.mv');
  const shape = svg.querySelector('.shape');

  const m = { vbW: 1000, endX: 175, startX: 1060, centerX: 560 };
  let curY = 0;

  function layout() {
    const w = root.clientWidth || 800;
    const h = root.clientHeight || 300;
    m.vbW = (VBH * w) / h;
    svg.setAttribute('viewBox', `0 ${VBY0} ${m.vbW} ${VBH}`);
    m.startX = m.vbW + 60;
    m.centerX = m.endX + (m.vbW - m.endX) * 0.5;
    let s = '';
    for (let i = 0; i < 5; i++) {
      s += `<line x1="8" x2="${m.vbW - 8}" y1="${posY(i * 2)}" y2="${posY(i * 2)}" stroke="${NAVY}" stroke-width="4" stroke-linecap="round"/>`;
    }
    linesG.innerHTML = s;
    // Linha do Sol (pos 2) coincide com y=0 do glifo.
    clef.setAttribute(
      'transform',
      `translate(${CLEF_X - CLEF_BOUNDS.x0 * CLEF_SCALE},${posY(2)}) scale(${CLEF_SCALE},${-CLEF_SCALE})`
    );
  }
  if (window.ResizeObserver) new ResizeObserver(layout).observe(root);
  window.addEventListener('resize', layout);
  layout();

  return {
    metrics: m,
    relayout: layout,
    /** Cria a nota (ainda fora da tela, à direita). */
    showNote(note, { colorHelp = true } = {}) {
      curY = posY(note.staffPos);
      shape.innerHTML = noteShapeSvg(colorHelp ? note.color : NAVY, { ledger: note.needsLedger });
      mv.setAttribute('class', 'mv');
      mv.setAttribute('visibility', 'visible');
      this.setX(m.startX);
    },
    setX(x) { mv.setAttribute('transform', `translate(${x},${curY})`); },
    setState(cls) { mv.setAttribute('class', 'mv ' + (cls || '')); },
    hide() { mv.setAttribute('visibility', 'hidden'); mv.setAttribute('class', 'mv'); },
    /** Centro da nota na tela (px), para o voo até a boca do Mimo. */
    noteCenter() {
      const r = shape.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
    },
    /** Escala px por unidade do viewBox (para dimensionar o clone voador). */
    pxPerUnit() { return svg.getBoundingClientRect().height / VBH; },
  };
}
