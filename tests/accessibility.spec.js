import { test, expect } from '@playwright/test';

test('keyboard-only practice, visible focus, and live feedback work', async ({ page, browserName }) => {
  const tabKey = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (['error', 'warning'].includes(message.type())) errors.push(message.text()); });
  await page.goto('/');
  await expect(page).toHaveTitle('Multiply — Times table practice');
  await page.keyboard.press(tabKey);
  await expect(page.getByRole('link', { name: 'Multiply home' })).toBeFocused();
  const outline = await page.locator(':focus').evaluate(node => getComputedStyle(node).outlineStyle);
  expect(outline).toBe('solid');
  for (let i = 0; i < 20 && !await page.locator('#start').evaluate(node => node === document.activeElement); i++) await page.keyboard.press(tabKey);
  await expect(page.locator('#start')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('textbox')).toBeFocused();
  await page.keyboard.type('4');
  await page.keyboard.press('Enter');
  await expect(page.locator('#feedback')).toContainText('Correct!');
  await expect(page.locator('#feedback')).toHaveAttribute('aria-live', 'polite');
  await page.keyboard.press(tabKey);
  await expect(page.getByRole('button', { name: 'Next' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('textbox')).toBeFocused();
  await expect(page.locator('#equation')).toHaveText('4 × 2 = ?');
  expect(errors).toEqual([]);
});

for (const [width, height] of [[390, 844], [844, 390], [768, 1024], [1024, 768], [320, 568], [390, 340]]) {
  test(`practice, summary, statistics, and reset fit ${width}×${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.getByRole('button', { name: 'Start practice' }).click();
    const fits = async () => {
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const sizes = await page.locator('button:visible, input:visible').evaluateAll(nodes => nodes.map(node => {
        const rect = node.getBoundingClientRect(); return [rect.width, rect.height];
      }));
      for (const [w, h] of sizes) { expect(w).toBeGreaterThanOrEqual(48); expect(h).toBeGreaterThanOrEqual(48); }
    };
    await fits();
    for (let i = 1; i <= 9; i++) {
      await page.getByRole('textbox').fill(String(i * 4));
      await page.getByRole('button', { name: 'Check answer' }).click();
      await page.getByRole('button', { name: 'Next' }).click();
    }
    await expect(page.getByRole('heading', { name: 'Round complete' })).toBeVisible();
    await fits();
    await page.getByRole('button', { name: 'Statistics', exact: true }).click();
    await fits();
    await page.getByRole('button', { name: 'Reset statistics', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await fits();
    await page.getByRole('button', { name: 'Keep my statistics' }).click();
  });
}

test('text resizing keeps choices and practice controls usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.addStyleTag({ content: ':root { font-size: 36px; }' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Start practice' }).click();
  await page.getByRole('textbox').fill('4');
  await page.getByRole('button', { name: 'Check answer' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
