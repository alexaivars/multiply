import { test, expect } from '@playwright/test';
test('series answers are checked once and advance only with Next', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start practice' }).click();
  const answer = page.getByRole('textbox', { name: 'Your answer' });
  await expect(answer).toBeFocused();
  await expect(page.locator('#equation')).toHaveText('4 × 1 = ?');
  for (const invalid of ['', ' ', '-1', '1.2', 'abc']) {
    await answer.fill(invalid);
    await answer.press('Enter');
    await expect(page.getByRole('status')).toHaveText('Type a whole number, like 12.');
    await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled();
  }
  await answer.fill('5');
  await answer.press('Enter');
  await expect(page.getByRole('status')).toContainText('Keep learning: 4 × 1 = 4.');
  await answer.press('Enter');
  await expect(page.locator('#position')).toHaveText('Question 1 of 9');
  await expect(answer).toHaveAttribute('readonly', '');
  await page.getByRole('button', { name: 'Next' }).dblclick();
  await expect(page.locator('#position')).toHaveText('Question 2 of 9');
  await expect(answer).toBeFocused();
  await expect(answer).toHaveValue('');
  await expect(page.getByRole('status')).toBeEmpty();
  for (let multiplier = 2; multiplier <= 9; multiplier++) {
    await expect(page.locator('#equation')).toHaveText(`4 × ${multiplier} = ?`);
    await answer.fill(String(4 * multiplier));
    await answer.press('Enter');
    await expect(page.getByRole('status')).toContainText('Correct!');
    await page.getByRole('button', { name: 'Next' }).click();
  }
  await expect(page.getByRole('heading', { name: 'Round complete' })).toBeVisible();
});
test('choose a mode and table, or all tables without a selector', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Multiply — Times table practice');
  await expect(page.getByRole('group', { name: 'Practice choices' }).getByRole('button')).toHaveCount(3);
  await page.getByRole('button', { name: 'Table 7', exact: true }).click();
  await expect(page.locator('#selection')).toContainText('Table 7');
  await page.getByRole('button', { name: /Mixed 1–9/ }).click();
  await expect(page.locator('#selection')).toContainText('9 questions · shuffled');
  await page.getByRole('button', { name: /Mixed all/ }).click();
  await expect(page.locator('#table-picker')).toBeHidden();
  await page.getByRole('button', { name: 'Start practice' }).click();
  await expect(page.getByRole('heading', { name: 'Mixed all' })).toBeVisible();
  await page.getByRole('button', { name: 'Back to choices' }).click();
  await expect(page.getByRole('heading', { name: /Get to know/ })).toBeVisible();
});
for (const [width, height] of [[1280, 900], [390, 844], [844, 390], [768, 1024], [1024, 768], [320, 568]]) {
  test(`choices fit ${width}×${height} with generous touch targets`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const sizes = await page.locator('button:visible, a:visible').evaluateAll(nodes => nodes.map(node => {
      const rect = node.getBoundingClientRect(); return [rect.width, rect.height];
    }));
    for (const [w, h] of sizes) { expect(w).toBeGreaterThanOrEqual(48); expect(h).toBeGreaterThanOrEqual(48); }
  });
}
