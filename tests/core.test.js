import test from 'node:test';
import assert from 'node:assert/strict';
import { validChoice, seriesDeck, createRound, parseAnswer, checkAnswer, nextQuestion, makeDeck, shuffle } from '../public/core.js';
test('only the three modes and tables 1–9 are accepted', () => {
  for (const mode of ['series', 'mixed']) {
    for (let table = 1; table <= 9; table++) assert.equal(validChoice(mode, table), true);
    for (const table of [undefined, null, 0, 10, -1, 2.5, '4']) assert.equal(validChoice(mode, table), false);
  }
  assert.equal(validChoice('all'), true);
  assert.equal(validChoice('other', 4), false);
  assert.equal(validChoice('toString', 4), false);
});

test('every series has exactly its nine equations in order', () => {
  for (let table = 1; table <= 9; table++) {
    assert.deepEqual(seriesDeck(table), Array.from({ length: 9 }, (_, i) => [table, i + 1]));
  }
  assert.throws(() => seriesDeck(10), RangeError);
});

test('mixed decks contain every required pair exactly once across deterministic shuffles', () => {
  for (const random of [() => 0, () => 0.5, () => 0.999999]) {
    for (let table = 1; table <= 9; table++) {
      const mixed = makeDeck('mixed', table, random);
      assert.equal(mixed.length, 9);
      assert.deepEqual([...mixed].sort((a, b) => a[1] - b[1]), seriesDeck(table));
    }
    const all = makeDeck('all', undefined, random);
    assert.equal(all.length, 81);
    assert.equal(new Set(all.map(pair => pair.join(','))).size, 81);
    assert.ok(all.every(pair => pair.every(n => n >= 1 && n <= 9)));
    assert.ok(all.some(([a, b]) => a === 3 && b === 4));
    assert.ok(all.some(([a, b]) => a === 4 && b === 3));
  }
  const source = [[1, 1], [1, 2], [1, 3]];
  assert.deepEqual(shuffle(source, () => 0), [[1, 2], [1, 3], [1, 1]]);
  assert.deepEqual(source, [[1, 1], [1, 2], [1, 3]]);
  assert.notDeepEqual(makeDeck('mixed', 4, () => 0), makeDeck('mixed', 4, () => 0.5));
});

test('only safe whole-number answers are accepted', () => {
  for (const input of ['', ' ', '\n', '-1', '2.5', '1e1', 'abc', '+4', 'Infinity', '9007199254740992']) assert.equal(parseAnswer(input), null);
  for (const input of ['0', '4', '04', ' 81 ']) assert.equal(parseAnswer(input), Number(input));
});

test('invalid input, duplicate submissions and premature Next never score or skip', () => {
  const round = createRound(seriesDeck(4));
  assert.equal(nextQuestion(round), false);
  assert.equal(checkAnswer(round, '').status, 'invalid');
  assert.equal(round.answered, 0);
  assert.equal(checkAnswer(round, '5').correct, false);
  assert.equal(checkAnswer(round, '4').status, 'locked');
  assert.equal(round.correct, 0);
  assert.equal(round.answered, 1);
  assert.equal(nextQuestion(round), true);
  assert.equal(nextQuestion(round), false);
  for (let i = 2; i <= 9; i++) {
    assert.equal(checkAnswer(round, String(4 * i)).correct, true);
    assert.equal(nextQuestion(round), true);
  }
  assert.equal(round.answered, 9);
  assert.equal(round.correct, 8);
  assert.equal(checkAnswer(round, '36').status, 'locked');
  assert.equal(nextQuestion(round), false);
});
