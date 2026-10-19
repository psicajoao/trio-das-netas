// ============================================================
//  FASES, SEQUÊNCIAS, PONTUAÇÃO E ESTRELAS  (lógica pura, sem DOM)
//  Para criar uma fase nova basta acrescentar um objeto em PHASES.
// ============================================================
import { noteByMidi } from './notes.js';

export const CLEFS = [
  { id: 'sol', name: 'Clave de Sol', available: true },
  { id: 'fa', name: 'Clave de Fá', available: false }, // etapa futura
];

export const PHASES = [
  { id: 1, clef: 'sol', name: 'Dó, Ré e Mi',      pool: [60, 62, 64],                         length: 8,  travel: 10 },
  { id: 2, clef: 'sol', name: 'Mi, Fá e Sol',     pool: [64, 65, 67],                         length: 8,  travel: 9.5 },
  { id: 3, clef: 'sol', name: 'De Dó a Sol',      pool: [60, 62, 64, 65, 67],                 length: 10, travel: 9 },
  { id: 4, clef: 'sol', name: 'Sol, Lá e Si',     pool: [67, 69, 71],                         length: 8,  travel: 9 },
  { id: 5, clef: 'sol', name: 'Todas as notas',   pool: [60, 62, 64, 65, 67, 69, 71, 72],     length: 12, travel: 8.5 },
];

export const POINTS = { first: 10, retry: 5 };

// Critério de estrelas (erros na 1ª rodada; a segunda chance não conta):
export const STAR_RULES = [
  { stars: 3, text: 'até 1 erro' },
  { stars: 2, text: 'até 3 erros' },
  { stars: 1, text: 'terminar a fase' },
];

export function starsFor(errors) {
  return errors <= 1 ? 3 : errors <= 3 ? 2 : 1;
}

/** Estrelas ainda possíveis durante a partida (para o indicador do topo). */
export const liveStars = starsFor;

export function phaseById(id) {
  return PHASES.find((p) => p.id === id) || null;
}

/** Sequência sem repetir a mesma nota seguida; todas as notas da fase aparecem. */
export function makeSequence(pool, length, rand = Math.random) {
  const seq = [];
  let bag = [];
  while (seq.length < length) {
    if (bag.length === 0) {
      bag = pool.slice();
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
      // evita repetir a última nota ao reabastecer a sacola
      if (pool.length > 1 && seq.length && bag[bag.length - 1] === seq[seq.length - 1]) {
        const k = Math.floor(rand() * (bag.length - 1));
        [bag[bag.length - 1], bag[k]] = [bag[k], bag[bag.length - 1]];
      }
    }
    seq.push(bag.pop());
  }
  return seq;
}

/** Todas as notas de uma fase têm que ser desenháveis sem linha suplementar, exceto o Dó central. */
export function phaseNotesAreValid(phase) {
  return phase.pool.every((m) => {
    const n = noteByMidi(m);
    return n && n.staffPos >= -2 && n.staffPos <= 8;
  });
}
