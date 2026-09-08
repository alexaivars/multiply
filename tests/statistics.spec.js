import { test, expect } from '@playwright/test';
import { choosePractice } from './practice.js';
import { STORAGE_KEY, emptyStatistics } from '../public/statistics.js';

async function answerFirst(page, answer = '4', mode = 'Series 1–9') {
  await choosePractice(page, mode);
  await page.getByRole('textbox', { name: 'Your answer' }).fill(answer);
  await page.getByRole('button', { name: 'Check answer' }).click();
}
const overall = page => page.getByRole('region', { name: 'All practice', exact: true }).locator('dd');

test('partial rounds save once, refresh preserves totals, and switching modes starts fresh', async ({ page }) => {
  await page.goto('/');
  await answerFirst(page);
  await page.getByRole('textbox').press('Enter');
  await page.reload();
  await expect(page.getByRole('heading', { name: /Get to know/ })).toBeVisible();
  await page.getByRole('button', { name: 'Statistics', exact: true }).click();
  await expect(overall(page)).toHaveText(['1', '1', '100%']);
  await expect(page.getByRole('listitem').filter({ has: page.getByRole('heading', { name: 'Table 4', exact: true }) }).locator('dd')).toHaveText(['1', '1', '100%']);
  await page.getByRole('button', { name: 'Back to choices' }).click();
  await answerFirst(page, '0', 'Mixed all');
  await expect(page.locator('#round-stats dd')).toHaveText(['0', '1', '0%']);
  const firstFactor = Number((await page.locator('#equation').textContent())[0]);
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Back to choices' }).click();
  await page.getByRole('button', { name: 'Statistics', exact: true }).click();
  await expect(overall(page)).toHaveText(['1', '2', '50%']);
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), STORAGE_KEY);
  expect(saved.tables[firstFactor].answered).toBe(firstFactor === 4 ? 2 : 1);
  expect(saved.modes.all).toEqual({ answered: 1, correct: 0 });
});

test('reset cancel and Escape preserve results; confirm removes only app statistics', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('unrelated', 'keep'));
  await answerFirst(page);
  await page.getByRole('button', { name: 'Statistics', exact: true }).click();
  await page.getByRole('button', { name: 'Reset statistics', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Keep my statistics' })).toBeFocused();
  await page.getByRole('button', { name: 'Keep my statistics' }).click();
  await expect(overall(page)).toHaveText(['1', '1', '100%']);
  await page.getByRole('button', { name: 'Reset statistics', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(overall(page)).toHaveText(['1', '1', '100%']);
  await page.getByRole('button', { name: 'Reset statistics', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Reset statistics', exact: true }).click();
  await expect(overall(page)).toHaveText(['0', '0', 'No answers yet']);
  await expect(page.locator('#storage-notice')).toContainText('Statistics reset.');
  expect(await page.evaluate(key => localStorage.getItem(key), STORAGE_KEY)).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('unrelated'))).toBe('keep');
});

for (const [name, saved] of [['valid', JSON.stringify(emptyStatistics())], ['malformed', '{'], ['unsupported', '{"version":2}']]) {
  test(`loads ${name} saved data without blocking practice`, async ({ page }) => {
    await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), { key: STORAGE_KEY, value: saved });
    await page.goto('/');
    if (name !== 'valid') await expect(page.locator('#storage-notice')).toContainText('could not be loaded');
    await answerFirst(page);
    await expect(page.locator('#feedback')).toContainText('Correct!');
  });
}

for (const operation of ['getItem', 'setItem', 'removeItem']) {
  test(`${operation} failure is honest and practice remains usable`, async ({ page }) => {
    await page.addInitScript(operation => {
      Storage.prototype[operation] = () => { throw new DOMException('Simulated storage failure', 'SecurityError'); };
    }, operation);
    await page.goto('/');
    await answerFirst(page);
    await expect(page.locator('#feedback')).toContainText('Correct!');
    await page.getByRole('button', { name: 'Statistics', exact: true }).click();
    await expect(overall(page)).toHaveText(['1', '1', '100%']);
    if (operation !== 'removeItem') await expect(page.locator('#storage-notice')).toContainText('will not be saved');
    else {
      await page.getByRole('button', { name: 'Reset statistics', exact: true }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Reset statistics', exact: true }).click();
      await expect(page.locator('#storage-notice')).toContainText('could not be reset');
      await expect(overall(page)).toHaveText(['1', '1', '100%']);
    }
  });
}
