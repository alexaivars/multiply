import { MODES, validChoice } from './core.js';
import { ANSWER_FORMATS } from './answer-formats.js';

// Keep the original key so migration and reset use one atomic record. The
// payload's version determines its schema; no second legacy key can reappear.
export const STORAGE_KEY = 'multiply.statistics.v1';
const count = () => ({ answered: 0, correct: 0 });
const tableKeys = Array.from({ length: 9 }, (_, i) => String(i + 1));
const modeKeys = Object.keys(MODES);

function emptyGroups() {
  return {
    overall: count(),
    tables: Object.fromEntries(tableKeys.map(key => [key, count()])),
    modes: Object.fromEntries(modeKeys.map(key => [key, count()])),
  };
}

export function emptyStatistics() {
  return {
    version: 2,
    ...emptyGroups(),
    formats: Object.fromEntries(Object.keys(ANSWER_FORMATS).map(key => [key, emptyGroups()])),
  };
}

function exactKeys(value, keys) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
}

function validCounts(value) {
  return exactKeys(value, ['answered', 'correct'])
    && Number.isSafeInteger(value.answered) && Number.isSafeInteger(value.correct)
    && value.answered >= 0 && value.correct >= 0 && value.correct <= value.answered;
}

function validGroups(value) {
  if (!validCounts(value.overall)) return false;
  for (const [group, keys] of [[value.tables, tableKeys], [value.modes, modeKeys]]) {
    if (!exactKeys(group, keys) || !keys.every(key => validCounts(group[key]))) return false;
    for (const field of ['answered', 'correct']) {
      if (keys.reduce((sum, key) => sum + group[key][field], 0) !== value.overall[field]) return false;
    }
  }
  return true;
}

export function validStatistics(value) {
  if (!exactKeys(value, ['version', 'overall', 'tables', 'modes', 'formats']) || value.version !== 2 || !validGroups(value)) return false;
  const formats = Object.keys(ANSWER_FORMATS);
  if (!exactKeys(value.formats, formats)) return false;
  for (const format of formats) {
    const group = value.formats[format];
    if (!exactKeys(group, ['overall', 'tables', 'modes']) || !validGroups(group)) return false;
  }
  const groups = data => [data.overall, ...tableKeys.map(key => data.tables[key]), ...modeKeys.map(key => data.modes[key])];
  return groups(value).every((counts, index) => ['answered', 'correct'].every(field =>
    formats.reduce((sum, format) => sum + groups(value.formats[format])[index][field], 0) === counts[field]));
}

function migrateStatistics(value) {
  if (!exactKeys(value, ['version', 'overall', 'tables', 'modes']) || value.version !== 1 || !validGroups(value)) return value;
  // Before answer formats were introduced, all saved answers were typed.
  const next = emptyStatistics();
  for (const key of ['overall', 'tables', 'modes']) {
    next[key] = structuredClone(value[key]);
    next.formats.typed[key] = structuredClone(value[key]);
  }
  return next;
}

// Storage access is injectable so read, write and reset failures are testable.
export function createStatisticsStore(getStorage = () => window.localStorage) {
  let statistics = emptyStatistics();
  let storage;
  let notice = '';
  try {
    storage = getStorage();
    const saved = storage.getItem(STORAGE_KEY);
    if (saved !== null) {
      try {
        const parsed = migrateStatistics(JSON.parse(saved));
        if (!validStatistics(parsed)) throw new Error('Invalid statistics');
        statistics = parsed;
      } catch {
        notice = 'Saved statistics could not be loaded. We’re starting with empty statistics.';
      }
    }
  } catch {
    storage = null;
    notice = 'Browser storage is unavailable. You can practise, but progress will not be saved.';
  }

  return {
    get data() { return statistics; },
    get notice() { return notice; },
    record(mode, table, correct, format = 'typed') {
      if (!validChoice(mode, table) || !tableKeys.includes(String(table)) || typeof correct !== 'boolean' || !Object.hasOwn(ANSWER_FORMATS, format)) throw new TypeError('Invalid result');
      if (statistics.overall.answered === Number.MAX_SAFE_INTEGER) {
        notice = 'Saved statistics are full. New progress will not be saved until statistics are reset.';
        return;
      }
      for (const group of [statistics, statistics.formats[format]]) {
        for (const counts of [group.overall, group.tables[table], group.modes[mode]]) {
          counts.answered++;
          if (correct) counts.correct++;
        }
      }
      try {
        if (!storage) throw new Error('Storage unavailable');
        storage.setItem(STORAGE_KEY, JSON.stringify(statistics));
        notice = '';
      } catch {
        notice = 'Progress will not be saved. You can keep practising; results stay here until you close or reload this page.';
      }
    },
    reset() {
      try {
        if (!storage) throw new Error('Storage unavailable');
        storage.removeItem(STORAGE_KEY);
        statistics = emptyStatistics();
        notice = 'Statistics reset. Ready for a fresh start.';
        return true;
      } catch {
        notice = 'Statistics could not be reset. Your results are unchanged.';
        return false;
      }
    },
  };
}
