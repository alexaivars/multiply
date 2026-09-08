export const MODES = {
  series: { label: 'Series 1–9', description: 'Find the pattern. One table, in order.', detail: '9 questions · in order' },
  mixed: { label: 'Mixed 1–9', description: 'Mix things up. One table, shuffled.', detail: '9 questions · shuffled' },
  all: { label: 'Mixed all', description: 'Try a bit of everything. All nine tables.', detail: '81 questions · stop whenever you like' },
};

export function validChoice(mode, table) {
  return Object.hasOwn(MODES, mode) && (mode === 'all' || (Number.isInteger(table) && table >= 1 && table <= 9));
}

export function seriesDeck(table) {
  if (!validChoice('series', table)) throw new RangeError('Choose a table from 1 to 9.');
  return Array.from({ length: 9 }, (_, index) => [table, index + 1]);
}

export function createRound(deck) {
  return { deck, index: 0, answered: 0, correct: 0, checked: false };
}

export function parseAnswer(value) {
  if (typeof value !== 'string' || !/^\d+$/.test(value.trim())) return null;
  const answer = Number(value.trim());
  return Number.isSafeInteger(answer) ? answer : null;
}

export function checkAnswer(round, value) {
  if (round.checked || round.index >= round.deck.length) return { status: 'locked' };
  const answer = parseAnswer(value);
  if (answer === null) return { status: 'invalid' };
  const [a, b] = round.deck[round.index];
  const correct = answer === a * b;
  round.checked = true;
  round.answered++;
  if (correct) round.correct++;
  return { status: 'checked', correct, table: a, equation: `${a} × ${b} = ${a * b}` };
}

export function nextQuestion(round) {
  if (!round.checked || round.index >= round.deck.length) return false;
  round.index++;
  round.checked = false;
  return true;
}
