import { test, expect } from '@playwright/test';
import { choosePractice } from './practice.js';

test('only the available question action appears, with numeric entry and no disabled controls', async ({ page }) => {
  await page.goto('/');
  await choosePractice(page);
  const input = page.getByRole('spinbutton', { name: 'Your answer' });
  for (const [name, value] of Object.entries({ type: 'number', inputmode: 'numeric', min: '0', step: '1' })) {
    await expect(input).toHaveAttribute(name, value);
  }
  await expect(page.locator('#answer-form button')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Next' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Check answer' }).click();
  await expect(page.locator('#feedback')).toContainText('Type a whole number');
  await expect(page.getByRole('button', { name: 'Check answer' })).toBeEnabled();
  await input.fill('4');
  await page.getByRole('button', { name: 'Check answer' }).click();
  await expect(page.getByRole('button', { name: 'Check answer' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Next' })).toBeVisible();
  await expect(page.locator('#answer-form button')).toHaveCount(1);
  await expect(input).toHaveAttribute('readonly', '');
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('button', { name: 'Check answer' })).toBeVisible();
  await expect(input).toBeEditable();
  await expect(input).toBeFocused();
  await expect(page.locator('button:disabled')).toHaveCount(0);
});

test('double clicks cannot trigger an action that replaced the clicked control', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Series 1–9/ }).dblclick();
  await expect(page.getByRole('heading', { name: 'Which table?' })).toBeVisible();
  await page.getByRole('button', { name: 'Table 4', exact: true }).click();
  await page.getByRole('spinbutton').fill('4');
  await page.getByRole('button', { name: 'Check answer' }).dblclick();
  await expect(page.locator('#feedback')).toContainText('Correct!');
  await expect(page.locator('#position')).toHaveText('Question 1 of 9');
  await expect(page.locator('#round-stats dd')).toHaveText(['1', '1', '100%']);
  await page.getByRole('button', { name: 'Next' }).dblclick();
  await expect(page.locator('#position')).toHaveText('Question 2 of 9');
  await expect(page.locator('#feedback')).toBeEmpty();
  await expect(page.getByRole('spinbutton')).toBeFocused();
});

test('holding Enter on the action cannot check and advance with the same key press', async ({ page }) => {
  await page.goto('/');
  await choosePractice(page);
  await page.getByRole('spinbutton').fill('4');
  await page.getByRole('button', { name: 'Check answer' }).focus();
  await page.keyboard.down('Enter');
  await page.keyboard.down('Enter');
  await page.keyboard.down('Enter');
  await page.keyboard.up('Enter');
  await expect(page.locator('#position')).toHaveText('Question 1 of 9');
  await expect(page.locator('#feedback')).toContainText('Correct!');
  await expect(page.getByRole('button', { name: 'Next' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#position')).toHaveText('Question 2 of 9');
  await expect(page.getByRole('spinbutton')).toBeFocused();
});

test.describe('touch actions', () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });
  test('a double tap keeps feedback visible, and a later tap advances once', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Series 1–9/ }).tap();
    await page.getByRole('button', { name: 'Table 4', exact: true }).tap();
    await page.getByRole('spinbutton').fill('4');
    const action = page.locator('#question-action');
    await action.scrollIntoViewIfNeeded();
    const box = await action.boundingBox();
    const point = [box.x + box.width / 2, box.y + box.height / 2];
    await page.touchscreen.tap(...point);
    await page.touchscreen.tap(...point);
    await expect(page.locator('#position')).toHaveText('Question 1 of 9');
    await expect(page.locator('#feedback')).toContainText('Correct!');
    // A deliberate later tap is a new gesture, after time to read feedback.
    await page.waitForTimeout(450);
    await page.getByRole('button', { name: 'Next' }).tap();
    await expect(page.locator('#position')).toHaveText('Question 2 of 9');
    await expect(page.getByRole('spinbutton')).toBeFocused();
    await expect(page.locator('#feedback')).toBeEmpty();
  });
});
