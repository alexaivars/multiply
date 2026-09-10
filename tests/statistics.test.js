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
    data => { data.version = 3; },
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

test('every scored answer is attributed to its answer format without changing aggregate counts', () => {
  const storage = memoryStorage();
  const store = createStatisticsStore(() => storage);
  store.record('series', 4, true, 'typed');
  store.record('series', 4, false, 'choice');
  store.record('all', 7, true, 'choice');
  assert.deepEqual(store.data.overall, { answered: 3, correct: 2 });
  assert.deepEqual(store.data.formats.typed.overall, { answered: 1, correct: 1 });
  assert.deepEqual(store.data.formats.choice.overall, { answered: 2, correct: 1 });
  assert.deepEqual(store.data.formats.choice.tables[7], { answered: 1, correct: 1 });
  assert.deepEqual(store.data.formats.choice.modes.series, { answered: 1, correct: 0 });
  assert.ok(validStatistics(store.data));
  assert.deepEqual(createStatisticsStore(() => storage).data, store.data);
  assert.throws(() => store.record('series', 4, true, 'invalid'), TypeError);
  assert.equal(store.data.overall.answered, 3);
  store.data.formats.choice.tables[7].correct = 0;
  assert.equal(validStatistics(store.data), false);
});

test('legacy typed statistics migrate without losing counts or writing before a checked answer', () => {
  const old = emptyStatistics();
  delete old.formats;
  old.version = 1;
  for (const counts of [old.overall, old.tables[4], old.modes.series]) Object.assign(counts, { answered: 3, correct: 2 });
  const encoded = JSON.stringify(old);
  const storage = memoryStorage({ [STORAGE_KEY]: encoded });
  const store = createStatisticsStore(() => storage);
  assert.equal(store.notice, '');
  assert.equal(store.data.version, 2);
  assert.deepEqual(store.data.overall, old.overall);
  assert.deepEqual(store.data.formats.typed.tables[4], old.tables[4]);
  assert.deepEqual(store.data.formats.choice.overall, { answered: 0, correct: 0 });
  assert.equal(storage.getItem(STORAGE_KEY), encoded);
  store.record('all', 8, true, 'choice');
  assert.deepEqual(store.data.formats.typed.overall, { answered: 3, correct: 2 });
  assert.deepEqual(store.data.overall, { answered: 4, correct: 3 });
  assert.ok(validStatistics(JSON.parse(storage.getItem(STORAGE_KEY))));
  store.reset();
  assert.equal(storage.getItem(STORAGE_KEY), null);
  assert.deepEqual(createStatisticsStore(() => storage).data, emptyStatistics());
});
