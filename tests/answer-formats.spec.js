import { test, expect } from '@playwright/test';
import { choosePractice } from './practice.js';
import { FORMAT_KEY } from '../public/answer-formats.js';
import { STORAGE_KEY, emptyStatistics } from '../public/statistics.js';

test('answer format is a session preference and does not add practice setup steps', async ({ page, browser }) => {
  await page.goto('/');
  await expect(page.getByText('Answer with', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Choose how to practise.', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('group', { name: 'Answer format', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Type answer', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Choose answer', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Choose answer', exact: true })).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(key => sessionStorage.getItem(key), FORMAT_KEY)).toBe('choice');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Choose answer', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await choosePractice(page);
  await expect(page.getByRole('group', { name: 'Answer format', exact: true })).toHaveCount(0);
  await expect(page.getByRole('spinbutton')).toHaveCount(0);
  await expect(page.locator('[data-answer]')).toHaveCount(4);
  await page.getByRole('button', { name: 'Back to choices' }).click();
  await page.getByRole('button', { name: 'Type answer', exact: true }).click();
  await choosePractice(page, 'All nine tables, shuffled');
  await expect(page.getByRole('spinbutton')).toBeFocused();
  const separate = await browser.newContext();
  try {
    const otherPage = await separate.newPage();
    await otherPage.goto('http://127.0.0.1:8000');
    await expect(otherPage.getByRole('button', { name: 'Type answer', exact: true })).toHaveAttribute('aria-pressed', 'true');
  } finally { await separate.close(); }
});

for (const [mode, count] of [['One table, in order', 9], ['One table, shuffled', 9], ['All nine tables, shuffled', 81]]) {
  test(`${mode} supports full multiple-choice rounds, first-answer scoring and practice again`, async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Choose answer', exact: true }).click();
    await choosePractice(page, mode);
    const seen = new Set();
    for (let index = 0; index < count; index++) {
      const equation = await page.locator('#equation').textContent();
      const [a, b] = equation.match(/\d+/g).map(Number);
      seen.add(`${a},${b}`);
      const values = await page.locator('[data-answer]').evaluateAll(nodes => nodes.map(node => Number(node.dataset.answer)));
      expect(values).toHaveLength(4);
      expect(new Set(values).size).toBe(4);
      expect(values.filter(value => value === a * b)).toHaveLength(1);
      await expect(page.getByRole('button', { name: 'Next', exact: true })).toHaveCount(0);
      const selected = index === 0 ? values.find(value => value !== a * b) : a * b;
      await page.locator(`[data-answer="${selected}"]`).click();
      await expect(page.locator('#feedback')).toContainText(index === 0 ? `The answer is ${a} × ${b} = ${a * b}.` : 'Correct!');
      await expect(page.locator('[data-answer], button:disabled, .score-strip')).toHaveCount(0);
      await expect(page.locator('[data-selected]')).toContainText('Chosen');
      await expect(page.getByRole('button', { name: 'Next' })).toBeFocused();
      await page.getByRole('button', { name: 'Next' }).click();
    }
    expect(seen.size).toBe(count);
    await expect(page.getByRole('heading', { name: 'Round complete' })).toBeVisible();
    await expect(page.locator('.score-strip dd')).toHaveText([String(count - 1), String(count), `${Math.round((count - 1) / count * 100)}%`]);
    const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), STORAGE_KEY);
    expect(saved.formats.choice.overall).toEqual({ answered: count, correct: count - 1 });
    expect(saved.formats.typed.overall.answered).toBe(0);
    await page.getByRole('button', { name: 'Practice again' }).click();
    await expect(page.locator('#position')).toHaveText(`Question 1 of ${count}`);
    await expect(page.locator('[data-answer]')).toHaveCount(4);
    await expect(page.locator('[data-answer]').first()).toBeFocused();
  });
}

test('keyboard repeats and double clicks do not skip feedback or score twice', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Choose answer', exact: true }).click();
  await choosePractice(page);
  await page.locator('[data-answer="4"]').focus();
  await page.keyboard.down('Enter');
  await page.keyboard.down('Enter');
  await page.keyboard.up('Enter');
  await expect(page.locator('#position')).toHaveText('Question 1 of 9');
  await expect(page.locator('#feedback')).toContainText('Correct!');
  await page.keyboard.press('Enter');
  await expect(page.locator('#position')).toHaveText('Question 2 of 9');
  await expect(page.locator('[data-answer]').first()).toBeFocused();
  await page.locator('[data-answer="8"]').dblclick();
  await expect(page.locator('#position')).toHaveText('Question 2 of 9');
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), STORAGE_KEY);
  expect(saved.overall).toEqual({ answered: 2, correct: 2 });
});

test('statistics migrate previous typed results and display separate answer formats', async ({ page }) => {
  await page.goto('/');
  const legacy = emptyStatistics();
  delete legacy.formats;
  legacy.version = 1;
  for (const counts of [legacy.overall, legacy.tables[4], legacy.modes.series]) Object.assign(counts, { answered: 2, correct: 1 });
  await page.evaluate(({ key, data }) => localStorage.setItem(key, JSON.stringify(data)), { key: STORAGE_KEY, data: legacy });
  await page.reload();
  await page.getByRole('button', { name: 'Choose answer', exact: true }).click();
  await choosePractice(page);
  await page.locator('[data-answer="4"]').click();
  await page.getByRole('button', { name: 'Back to choices' }).click();
  await page.getByRole('button', { name: 'Statistics', exact: true }).click();
  const formats = page.getByRole('region', { name: 'By answer format' });
  await expect(formats.getByRole('listitem').filter({ hasText: 'Typed answers' }).locator('dd')).toHaveText(['1', '2', '50%']);
  await expect(formats.getByRole('listitem').filter({ hasText: 'Multiple choice' }).locator('dd')).toHaveText(['1', '1', '100%']);
  await expect(page.getByRole('region', { name: 'All practice', exact: true }).locator('dd')).toHaveText(['2', '3', '67%']);
});

for (const operation of ['getItem', 'setItem']) {
  test(`session ${operation} failure keeps multiple choice usable`, async ({ page }) => {
    await page.addInitScript(operation => {
      const original = Storage.prototype[operation];
      Storage.prototype[operation] = function (...args) {
        if (this === sessionStorage) throw new DOMException('Simulated failure', 'SecurityError');
        return original.apply(this, args);
      };
    }, operation);
    await page.goto('/');
    await page.getByRole('button', { name: 'Choose answer', exact: true }).click();
    await expect(page.locator('#format-notice')).toContainText('until this page reloads');
    await choosePractice(page);
    await page.locator('[data-answer="4"]').click();
    await expect(page.locator('#feedback')).toContainText('Correct!');
  });
}

for (const [width, height, enlarged] of [[390, 844, false], [844, 390, false], [768, 1024, false], [1024, 768, false], [320, 568, false], [390, 844, true]]) {
  test(`multiple-choice controls fit ${width}×${height}${enlarged ? ' enlarged text' : ''} and remain stable after checking`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    if (enlarged) await page.addStyleTag({ content: ':root { font-size: 36px; }' });
    await page.getByRole('button', { name: 'Choose answer', exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await choosePractice(page);
    await expect(page.getByText('Choose your answer', { exact: true })).toHaveCount(0);
    await expect(page.locator('.screen-heading p')).toHaveCount(0);
    await expect(page.getByRole('group', { name: 'Answer options', exact: true })).toBeVisible();
    const before = await page.locator('.answer-option').evaluateAll(nodes => nodes.map(node => { const r = node.getBoundingClientRect(); return [r.width, r.height, r.top + scrollY]; }));
    const cardHeight = (await page.locator('.question-card').boundingBox()).height;
    for (const [w, h] of before) { expect(w).toBeGreaterThanOrEqual(48); expect(h).toBeGreaterThanOrEqual(48); }
    await page.locator('[data-answer="4"]').click();
    const after = await page.locator('.answer-option').evaluateAll(nodes => nodes.map(node => { const r = node.getBoundingClientRect(); return [r.width, r.height, r.top + scrollY]; }));
    expect(after).toEqual(before);
    const equationBounds = await page.locator('#equation').boundingBox();
    const feedbackBounds = await page.locator('#feedback').boundingBox();
    const optionsBounds = await page.locator('.answer-grid').boundingBox();
    expect(feedbackBounds.y).toBeGreaterThanOrEqual(equationBounds.y + equationBounds.height);
    expect(feedbackBounds.y + feedbackBounds.height).toBeLessThanOrEqual(optionsBounds.y);
    expect((await page.locator('.question-card').boundingBox()).height).toBeGreaterThan(cardHeight);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.locator('#position')).toHaveText('Question 2 of 9');
    // Browsers round scroll positions to pixels; allow subpixel edge rounding.
    const equation = await page.locator('#equation').boundingBox();
    expect(equation.y).toBeGreaterThanOrEqual(-1);
    expect(equation.y + equation.height).toBeLessThanOrEqual(height + 1);
  });
}

test.describe('multiple-choice touch', () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });
  test('a double tap keeps feedback visible until an intentional Next tap', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Choose answer', exact: true }).tap();
    await page.getByRole('button', { name: /One table, in order/ }).tap();
    await page.waitForTimeout(450);
    await page.getByRole('button', { name: 'Table 4', exact: true }).tap();
    const box = await page.locator('[data-answer="4"]').boundingBox();
    const point = [box.x + box.width / 2, box.y + box.height / 2];
    await page.touchscreen.tap(...point);
    await page.touchscreen.tap(...point);
    await expect(page.locator('#feedback')).toContainText('Correct!');
    await expect(page.locator('#position')).toHaveText('Question 1 of 9');
    await page.waitForTimeout(450);
    await page.getByRole('button', { name: 'Next' }).tap();
    await expect(page.locator('#position')).toHaveText('Question 2 of 9');
  });
});
