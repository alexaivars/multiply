import { shuffle } from './core.js';

export const ANSWER_FORMATS = { typed: 'Typed answers', choice: 'Multiple choice' };
export const FORMAT_KEY = 'multiply.answer-format.v1';

export function answerOptions(a, b, random = Math.random) {
  if (![a, b].every(value => Number.isInteger(value) && value >= 1 && value <= 9)) {
    throw new RangeError('Choose factors from 1 to 9.');
  }
  const correct = a * b;
  const distractors = new Set();
  const add = value => {
    if (value > 0 && value <= 81 && value !== correct) distractors.add(value);
  };
  // Nearby factor mistakes come first; duplicates and zero are never options.
  for (const value of [(a - 1) * b, (a + 1) * b, a * (b - 1), a * (b + 1)]) add(value);
  for (let distance = 1; distractors.size < 3; distance++) {
    add(correct - distance);
    add(correct + distance);
  }
  return shuffle([correct, ...shuffle([...distractors], random).slice(0, 3)], random);
}

export function createAnswerFormatStore(getStorage = () => window.sessionStorage) {
  let value = 'typed';
  let storage;
  let notice = '';
  const unavailable = 'Your answer format will only be remembered until this page reloads.';
  try {
    storage = getStorage();
    const saved = storage.getItem(FORMAT_KEY);
    if (Object.hasOwn(ANSWER_FORMATS, saved)) value = saved;
  } catch {
    storage = null;
    notice = unavailable;
  }
  return {
    get value() { return value; },
    get notice() { return notice; },
    set(next) {
      if (!Object.hasOwn(ANSWER_FORMATS, next)) throw new TypeError('Unknown answer format');
      value = next;
      try {
        if (!storage) throw new Error('Storage unavailable');
        storage.setItem(FORMAT_KEY, value);
        notice = '';
      } catch {
        notice = unavailable;
      }
    },
  };
}
