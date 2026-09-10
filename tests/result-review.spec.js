import { test, expect } from '@playwright/test';
import { choosePractice } from './practice.js';

for (const format of ['typed', 'choice']) {
  for (const enlarged of [false, true]) {
    test(`${format} results use one review state and reset on mobile${enlarged ? ' with enlarged text' : ''}`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto('/');
      if (enlarged) await page.addStyleTag({ content: ':root { font-size: 36px; }' });
      if (format === 'choice') await page.getByRole('button', { name: 'Choose answer', exact: true }).click();
      await choosePractice(page);
      const card = page.locator('.question-prompt');
      const neutral = await card.evaluate(node => getComputedStyle(node).backgroundColor);
      const surfaces = [];
      const colors = [];
      for (const correct of [false, true]) {
        await expect(page.locator('#equation-answer')).toHaveText('?');
        expect(await card.evaluate(node => getComputedStyle(node).backgroundColor)).toBe(neutral);
        const [a, b] = (await page.locator('#equation').textContent()).match(/\d+/g).map(Number);
        let submitted = correct ? a * b : 12;
        let entryBox;
        const bounds = node => {
          const r = node.getBoundingClientRect();
          return { x: r.x, y: r.y + scrollY, width: r.width, height: r.height };
        };
        if (format === 'typed') {
          const input = page.getByRole('spinbutton', { name: 'Your answer' });
          await input.fill(String(submitted));
          entryBox = await input.evaluate(bounds);
          await page.getByRole('button', { name: 'Check answer' }).click();
          await expect(input).toHaveCount(0);
          expect(await page.getByRole('button', { name: 'Next' }).evaluate(bounds)).toEqual(entryBox);
        } else {
          if (!correct) submitted = Number(await page.locator(`[data-answer]:not([data-answer="${a * b}"])`).first().getAttribute('data-answer'));
          await page.locator(`[data-answer="${submitted}"]`).click();
          await expect(page.locator('[data-answer]')).toHaveCount(0);
        }
        await expect(page.locator('#equation')).toHaveText(`${a} × ${b} = ${submitted}`);
        await expect(page.locator('#feedback')).toContainText(correct ? 'Correct!' : `Correct answer is ${a} × ${b} = ${a * b}.`);
        await expect(page.getByRole('button', { name: 'Next' })).toBeFocused();
        const number = await page.locator('#equation-answer').evaluate(node => {
          const s = getComputedStyle(node); return { color: s.color, weight: Number(s.fontWeight) };
        });
        expect(number.weight).toBeGreaterThanOrEqual(700);
        expect(await page.locator('#feedback').evaluate(node => getComputedStyle(node).color)).toBe(number.color);
        if (format === 'choice') expect(await page.locator('[data-selected]').evaluate(node => getComputedStyle(node).backgroundColor)).toBe(number.color);
        colors.push(number.color);
        surfaces.push(await card.evaluate(node => getComputedStyle(node).backgroundColor));
        expect(surfaces.at(-1)).toBe(neutral);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await page.getByRole('button', { name: 'Next' }).click();
        await expect(page.locator('#feedback')).toBeEmpty();
      }
      expect(colors[0]).not.toBe(colors[1]);
      expect(surfaces[0]).toBe(surfaces[1]);
      expect(await card.evaluate(node => getComputedStyle(node).backgroundColor)).toBe(neutral);
    });
  }
}
