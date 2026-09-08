import test from 'node:test';
import assert from 'node:assert/strict';
import { validChoice } from '../public/core.js';
test('only the three modes and tables 1–9 are accepted', () => {
  for (const mode of ['series', 'mixed']) {
    for (let table = 1; table <= 9; table++) assert.equal(validChoice(mode, table), true);
    for (const table of [undefined, null, 0, 10, -1, 2.5, '4']) assert.equal(validChoice(mode, table), false);
  }
  assert.equal(validChoice('all'), true);
  assert.equal(validChoice('other', 4), false);
  assert.equal(validChoice('toString', 4), false);
});
