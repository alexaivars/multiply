import test from 'node:test';
import assert from 'node:assert/strict';
import { STORAGE_KEY, emptyStatistics, validStatistics, createStatisticsStore } from '../public/statistics.js';

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
}

test('missing data starts empty and checked answers persist overall, table and mode counts', () => {
  const storage = memoryStorage();
  const store = createStatisticsStore(() => storage);
  assert.equal(store.notice, '');
  assert.deepEqual(store.data, emptyStatistics());
  store.record('series', 4, true);
  store.record('mixed', 4, false);
  store.record('all', 7, true);
  assert.deepEqual(store.data.overall, { answered: 3, correct: 2 });
  assert.deepEqual(store.data.tables[4], { answered: 2, correct: 1 });
  assert.deepEqual(store.data.tables[7], { answered: 1, correct: 1 });
  assert.deepEqual(store.data.modes.all, { answered: 1, correct: 1 });
  assert.equal(validStatistics(store.data), true);
  assert.deepEqual(createStatisticsStore(() => storage).data, store.data);
});

test('malformed, unsupported and invalid saves are rejected gracefully', () => {
  const invalid = ['{', 'null', '[]', '{}'];
  for (const mutate of [
    data => { data.version = 2; },
    data => { data.overall.answered = -1; },
    data => { data.tables[1].correct = 1; },
    data => { data.modes.series.answered = 0.5; },
    data => { data.overall.answered = '1'; },
    data => { data.overall.answered = Number.MAX_SAFE_INTEGER + 1; },
    data => { delete data.tables[9]; },
    data => { data.modes.extra = { answered: 0, correct: 0 }; },
    data => { data.overall.answered = 1; },
    data => { data.personal = 'not allowed'; },
  ]) {
    const data = emptyStatistics(); mutate(data); invalid.push(JSON.stringify(data));
  }
  for (const value of invalid) {
    const store = createStatisticsStore(() => memoryStorage({ [STORAGE_KEY]: value }));
    assert.deepEqual(store.data, emptyStatistics());
    assert.match(store.notice, /could not be loaded/);
    store.record('all', 4, true);
    assert.equal(store.data.overall.answered, 1);
  }
});

test('read and write failures keep practice in memory', () => {
  for (const getStorage of [() => { throw Error('denied'); }, () => ({ getItem() { throw Error('denied'); } })]) {
    const store = createStatisticsStore(getStorage);
    assert.match(store.notice, /will not be saved/);
    store.record('series', 4, true);
    assert.equal(store.data.overall.correct, 1);
    assert.match(store.notice, /will not be saved/);
  }
  const storage = memoryStorage();
  storage.setItem = () => { throw Error('quota'); };
  const store = createStatisticsStore(() => storage);
  store.record('mixed', 3, false);
  assert.equal(store.data.overall.answered, 1);
  assert.match(store.notice, /will not be saved/);
});

test('reset removes only this app key and changes no results when removal fails', () => {
  const storage = memoryStorage({ unrelated: 'keep' });
  const store = createStatisticsStore(() => storage);
  store.record('all', 5, true);
  const remove = storage.removeItem;
  storage.removeItem = () => { throw Error('denied'); };
  assert.equal(store.reset(), false);
  assert.equal(store.data.overall.correct, 1);
  assert.match(store.notice, /could not be reset/);
  storage.removeItem = remove;
  assert.equal(store.reset(), true);
  assert.equal(storage.getItem(STORAGE_KEY), null);
  assert.equal(storage.getItem('unrelated'), 'keep');
  assert.deepEqual(store.data, emptyStatistics());
});
