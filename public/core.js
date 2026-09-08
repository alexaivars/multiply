export const MODES = {
  series: { label: 'Series 1–9', description: 'Find the pattern. One table, in order.', detail: '9 questions · in order' },
  mixed: { label: 'Mixed 1–9', description: 'Mix things up. One table, shuffled.', detail: '9 questions · shuffled' },
  all: { label: 'Mixed all', description: 'Try a bit of everything. All nine tables.', detail: '81 questions · stop whenever you like' },
};

export function validChoice(mode, table) {
  return Object.hasOwn(MODES, mode) && (mode === 'all' || (Number.isInteger(table) && table >= 1 && table <= 9));
}
