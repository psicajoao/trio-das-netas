// Testes das regras puras:  node tests/rules.test.mjs
import assert from 'node:assert/strict';
import { noteByMidi, isBlack, keyboardLayout, KEY_FIRST, KEY_LAST, SUPPORT_COLORS } from '../js/notes.js';
import { PHASES, makeSequence, starsFor, phaseNotesAreValid } from '../js/phases.js';

let n = 0;
const ok = (name, fn) => { fn(); n++; console.log('  ok', name); };

// --- mapeamento pauta de sol  <->  tecla ---------------------------------
// posição: 0=1ª linha ... 8=5ª linha; espaços são ímpares
const esperado = {
  60: ['Dó', -2, 'linha suplementar (abaixo da pauta)'],
  62: ['Ré', -1, 'espaço abaixo da 1ª linha'],
  64: ['Mi', 0, '1ª linha'],
  65: ['Fá', 1, '1º espaço'],
  67: ['Sol', 2, '2ª linha (linha do Sol)'],
  69: ['Lá', 3, '2º espaço'],
  71: ['Si', 4, '3ª linha'],
  72: ['Dó', 5, '3º espaço'],
  74: ['Ré', 6, '4ª linha'],
  76: ['Mi', 7, '4º espaço'],
  77: ['Fá', 8, '5ª linha'],
};
for (const [m, [nome, pos, desc]] of Object.entries(esperado)) {
  ok(`MIDI ${m} = ${nome} na posição ${pos} (${desc})`, () => {
    const nt = noteByMidi(+m);
    assert.equal(nt.name, nome);
    assert.equal(nt.staffPos, pos);
  });
}

ok('Sol fica na 2ª linha (clave de sol = linha do Sol4)', () => {
  assert.equal(noteByMidi(67).staffPos, 2);
  assert.equal(noteByMidi(67).staffPos % 2, 0); // posição par = sobre uma linha
});

ok('só o Dó central precisa de linha suplementar', () => {
  for (let m = KEY_FIRST; m <= KEY_LAST; m++) {
    const nt = noteByMidi(m);
    if (nt) assert.equal(nt.needsLedger, m === 60);
  }
});

ok('teclado: 25 teclas, 15 brancas, 10 pretas, Dó a Dó', () => {
  const { whites, blacks } = keyboardLayout();
  assert.equal(whites.length, 15);
  assert.equal(blacks.length, 10);
  assert.equal(whites.length + blacks.length, 25);
  assert.equal(whites[0].midi, 60);
  assert.equal(whites[14].midi, 84);
  assert.equal(noteByMidi(whites[0].midi).letter, 'C');
  assert.equal(noteByMidi(whites[14].midi).letter, 'C');
});

ok('pretas ficam entre as brancas certas (Dó#, Ré#, Fá#, Sol#, Lá#)', () => {
  const { whites, blacks } = keyboardLayout();
  const letras = blacks.map((b) => noteByMidi(whites[b.leftWhite].midi).letter);
  assert.deepEqual(letras.slice(0, 5), ['C', 'D', 'F', 'G', 'A']);
  assert.deepEqual(letras.slice(5), ['C', 'D', 'F', 'G', 'A']);
  assert.ok(blacks.every((b) => isBlack(b.midi) && noteByMidi(b.midi) === null));
});

ok('cada letra tem sua cor de apoio (Dó vermelho ... Si roxo) e Dó agudo repete a cor', () => {
  assert.equal(Object.keys(SUPPORT_COLORS).length, 7);
  assert.equal(noteByMidi(60).color, noteByMidi(72).color);
  assert.notEqual(noteByMidi(60).color, noteByMidi(62).color);
});

// --- fases ----------------------------------------------------------------
ok('fase 1 ensina só Dó, Ré e Mi', () => {
  assert.deepEqual(PHASES[0].pool.map((m) => noteByMidi(m).name), ['Dó', 'Ré', 'Mi']);
});

ok('todas as fases usam só notas desenháveis (-2..8)', () => {
  PHASES.forEach((p) => assert.ok(phaseNotesAreValid(p), 'fase ' + p.id));
});

ok('sequências: tamanho certo, só notas da fase, sem repetição seguida, todas as notas aparecem', () => {
  for (const p of PHASES) {
    for (let t = 0; t < 200; t++) {
      const seq = makeSequence(p.pool, p.length);
      assert.equal(seq.length, p.length);
      assert.ok(seq.every((m) => p.pool.includes(m)));
      for (let i = 1; i < seq.length; i++) assert.notEqual(seq[i], seq[i - 1]);
      p.pool.forEach((m) => assert.ok(seq.includes(m), `fase ${p.id}: faltou ${m}`));
    }
  }
});

ok('estrelas: 0-1 erro = 3; 2-3 = 2; 4+ = 1 (sempre pelo menos 1 ao terminar)', () => {
  assert.equal(starsFor(0), 3);
  assert.equal(starsFor(1), 3);
  assert.equal(starsFor(2), 2);
  assert.equal(starsFor(3), 2);
  assert.equal(starsFor(4), 1);
  assert.equal(starsFor(99), 1);
});

console.log(`\nregras ok (${n} verificações)`);
