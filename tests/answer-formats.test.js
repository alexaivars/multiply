import test from 'node:test';
import assert from 'node:assert/strict';
import { answerOptions, createAnswerFormatStore, FORMAT_KEY } from '../public/answer-formats.js';

function seeded(seed) {
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

test('all 81 questions have four unique positive options with exactly one correct answer', () => {
  const positions = new Set();
  for (let a = 1; a <= 9; a++) for (let b = 1; b <= 9; b++) for (let seed = 1; seed <= 20; seed++) {
    const options = answerOptions(a, b, seeded(seed));
    assert.equal(options.length, 4);
    assert.equal(new Set(options).size, 4);
    assert.equal(options.filter(value => value === a * b).length, 1);
    assert.ok(options.every(value => Number.isInteger(value) && value > 0 && value <= 81));
    assert.deepEqual(options, answerOptions(a, b, seeded(seed)));
    positions.add(options.indexOf(a * b));
  }
  assert.equal(positions.size, 4);
});

test('distractors use nearby factor mistakes, with nearby fallback values at edges', () => {
  const options = answerOptions(4, 7, seeded(10));
  assert.ok(options.every(value => [28, 21, 35, 24, 32].includes(value)));
  assert.deepEqual(answerOptions(1, 1, seeded(1)).sort((a, b) => a - b), [1, 2, 3, 4]);
  assert.deepEqual(answerOptions(9, 9, seeded(1)).sort((a, b) => a - b), [72, 79, 80, 81]);
  assert.notDeepEqual(answerOptions(4, 7, seeded(1)), answerOptions(4, 7, seeded(42)));
  for (const [a, b] of [[0, 1], [10, 2], [1.5, 4], [4, NaN]]) assert.throws(() => answerOptions(a, b), RangeError);
});

test('answer preference uses session storage, validates saved values and survives reload', () => {
  const entries = new Map();
  const storage = { getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value) };
  const store = createAnswerFormatStore(() => storage);
  assert.equal(store.value, 'typed');
  store.set('choice');
  assert.equal(entries.get(FORMAT_KEY), 'choice');
  assert.equal(createAnswerFormatStore(() => storage).value, 'choice');
  assert.equal(createAnswerFormatStore(() => ({ getItem: () => 'invalid' })).value, 'typed');
  assert.throws(() => store.set('unknown'), TypeError);
  assert.equal(store.value, 'choice');
});

test('answer preference still works when session storage cannot be read or written', () => {
  for (const getStorage of [
    () => { throw Error('denied'); },
    () => ({ getItem() { throw Error('denied'); } }),
    () => ({ getItem: () => null, setItem() { throw Error('quota'); } }),
  ]) {
    const store = createAnswerFormatStore(getStorage);
    store.set('choice');
    assert.equal(store.value, 'choice');
    assert.match(store.notice, /until this page reloads/);
    store.set('typed');
    assert.equal(store.value, 'typed');
  }
});
