import { test, expect } from '@playwright/test';
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
