import test from 'node:test';
import assert from 'node:assert/strict';
import { validChoice, seriesDeck, createRound, parseAnswer, checkAnswer, nextQuestion } from '../public/core.js';
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
