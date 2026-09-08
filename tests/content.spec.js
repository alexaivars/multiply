import { test, expect } from '@playwright/test';

test('installation help stays at the start, and scores appear only after the round', async ({ page }) => {
  await page.goto('/');
  const help = page.locator('.install-help');
  await expect(page.locator('.site-header').getByRole('button', { name: 'Statistics', exact: true })).toHaveCount(0);
  await expect(help).toBeVisible();
  await expect(help).not.toHaveAttribute('open');
  await page.getByText('Add to iPhone or iPad', { exact: true }).click();
  await expect(help).toHaveAttribute('open');
  await expect(help.locator('ol')).toBeVisible();
  await page.getByRole('button', { name: /Series 1–9/ }).click();
  await expect(help).toBeHidden();
  await page.getByRole('button', { name: 'Table 4', exact: true }).click();
  for (let i = 1; i <= 9; i++) {
    await expect(help).toBeHidden();
    await expect(page.getByRole('button', { name: 'Statistics', exact: true })).toHaveCount(0);
    await expect(page.locator('.score-strip')).toHaveCount(0);
    await expect(page.locator('#position')).toHaveText(`Question ${i} of 9`);
    await page.getByRole('spinbutton').fill(String(4 * i));
    await page.getByRole('button', { name: 'Check answer' }).click();
    await expect(page.locator('#feedback')).toContainText(`Correct! 4 × ${i} = ${4 * i}.`);
    await expect(page.locator('.score-strip')).toHaveCount(0);
    await page.getByRole('button', { name: 'Next' }).click();
  }
  await expect(page.getByRole('heading', { name: 'Round complete' })).toBeVisible();
  await expect(page.locator('.score-strip dd')).toHaveText(['9', '9', '100%']);
  await expect(help).toBeHidden();
  await page.getByRole('button', { name: 'Statistics', exact: true }).click();
  await expect(help).toBeHidden();
  await expect(page.getByRole('region', { name: 'All practice', exact: true }).locator('dd')).toHaveText(['9', '9', '100%']);
  await page.getByRole('button', { name: 'Back to choices' }).click();
  await expect(help).toBeVisible();
  await expect(help).not.toHaveAttribute('open');
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await expect(page.locator('#offline-status')).toBeHidden();
  await expect(page.locator('#offline-status')).toBeEmpty();
});
