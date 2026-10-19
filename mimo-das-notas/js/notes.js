// ============================================================
//  DEFINIÇÕES CENTRAIS DAS NOTAS  (única fonte da verdade)
//  Nome, posição na pauta, tecla correspondente e cor de apoio
//  saem todos daqui. Nenhum outro arquivo repete essas tabelas.
// ============================================================

// Convenção de oitavas: usamos o número MIDI (60 = Dó central).
// No teclado de 25 teclas "Dó3 a Dó5" (numeração Yamaha, em que o Dó central é Dó3)
// a primeira tecla é o Dó central (MIDI 60) e a última, dois "Dó" acima (MIDI 84).
export const KEY_FIRST = 60;
export const KEY_LAST = 84;

export const NOTE_NAMES = { C: 'Dó', D: 'Ré', E: 'Mi', F: 'Fá', G: 'Sol', A: 'Lá', B: 'Si' };

// Cores de apoio pedidas no brief (Dó vermelho, Ré laranja, Mi amarelo, Fá verde,
// Sol turquesa, Lá azul, Si roxo). Mesmas cores na nota e na tecla.
export const SUPPORT_COLORS = {
  C: '#EF4444', D: '#FF8A3A', E: '#FFC93C', F: '#5FCB5E', G: '#2EC4B6', A: '#3B82F6', B: '#8B5CF6',
};

const LETTERS = [
  { letter: 'C', semitone: 0, step: 0 },
  { letter: 'D', semitone: 2, step: 1 },
  { letter: 'E', semitone: 4, step: 2 },
  { letter: 'F', semitone: 5, step: 3 },
  { letter: 'G', semitone: 7, step: 4 },
  { letter: 'A', semitone: 9, step: 5 },
  { letter: 'B', semitone: 11, step: 6 },
];

// Posição na pauta de sol: 0 = 1ª linha (Mi4), 1 = 1º espaço (Fá4), 2 = 2ª linha (Sol4) ...
// 8 = 5ª linha (Fá5). Números negativos ficam abaixo da pauta; -2 = Dó central (linha suplementar).
const E4_DIATONIC = 4 * 7 + 2;

export function isBlack(midi) {
  return !LETTERS.some((l) => l.semitone === ((midi % 12) + 12) % 12);
}

/** Dados completos de uma nota natural (tecla branca). Devolve null para teclas pretas. */
export function noteByMidi(midi) {
  const pc = ((midi % 12) + 12) % 12;
  const l = LETTERS.find((x) => x.semitone === pc);
  if (!l) return null;
  const octave = Math.floor(midi / 12) - 1; // científica: 60 -> 4
  return {
    midi,
    letter: l.letter,
    name: NOTE_NAMES[l.letter],
    color: SUPPORT_COLORS[l.letter],
    octave,
    staffPos: octave * 7 + l.step - E4_DIATONIC,
    needsLedger: octave * 7 + l.step - E4_DIATONIC === -2, // só o Dó central (ver README)
  };
}

/** Tecla que a criança deve tocar para uma nota natural: é o próprio MIDI. */
export function keyForNote(note) {
  return note.midi;
}

/** Layout do teclado: 15 brancas e 10 pretas, Dó central a Dó duas oitavas acima. */
export function keyboardLayout() {
  const whites = [];
  const blacks = [];
  for (let m = KEY_FIRST; m <= KEY_LAST; m++) {
    if (isBlack(m)) blacks.push({ midi: m, leftWhite: whites.length - 1 });
    else whites.push({ midi: m, index: whites.length });
  }
  return { whites, blacks };
}
