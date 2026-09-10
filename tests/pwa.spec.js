import { test, expect } from '@playwright/test';
import { choosePractice } from './practice.js';
import { mkdtemp, cp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { publicServer } from './static-server.js';

async function ready(page) {
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await expect(page.locator('#offline-status')).toBeHidden();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
}

test('offline launch, all modes, refresh and reset work with only local requests', async ({ page, context, browserName }) => {
  const server = await publicServer();
  try {
    const errors = [];
    const external = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (!request.url().startsWith(server.url)) external.push(request.url()); });
    await page.goto(server.url);
    await ready(page);
    server.disconnect();
    // WebKit's simulated offline switch blocks even cached service-worker fetches.
    // Both engines face a genuinely unreachable origin; Chromium also goes offline.
    if (browserName === 'chromium') await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole('heading', { name: /Get to know/ })).toBeVisible();
    for (const format of ['Type answer', 'Choose answer']) {
      await page.getByRole('button', { name: format, exact: true }).click();
      for (const label of ['One table, in order', 'One table, shuffled', 'All nine tables, shuffled']) {
        await choosePractice(page, label);
        const [a, b] = (await page.locator('#equation').textContent()).match(/\d/g).map(Number);
        if (format === 'Type answer') {
          await page.getByRole('spinbutton', { name: 'Your answer' }).fill(String(a * b));
          await page.getByRole('button', { name: 'Check answer' }).click();
        } else {
          await page.locator(`[data-answer="${a * b}"]`).click();
        }
        await expect(page.locator('#feedback')).toContainText('Correct!');
        await page.getByRole('button', { name: 'Back to choices' }).click();
      }
    }
    await page.reload();
    await page.getByRole('button', { name: 'Statistics', exact: true }).click();
    await expect(page.getByRole('region', { name: 'All practice', exact: true }).locator('dd')).toHaveText(['6', '6', '100%']);
    await page.getByRole('button', { name: 'Reset statistics', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Reset statistics', exact: true }).click();
    await expect(page.locator('#storage-notice')).toContainText('Statistics reset.');
    await page.reload();
    await page.getByRole('button', { name: 'Statistics', exact: true }).click();
    await expect(page.getByRole('region', { name: 'All practice', exact: true }).locator('dd')).toHaveText(['0', '0', 'No answers yet']);
    expect(errors).toEqual([]);
    expect(external).toEqual([]);
  } finally { await server.close(); }
});

test('offline setup failure reports the problem without blocking practice', async ({ page }) => {
  await page.addInitScript(() => {
    navigator.serviceWorker.register = () => Promise.reject(new Error('Simulated registration failure'));
  });
  await page.goto('/');
  await expect(page.locator('#offline-status')).toContainText('Offline setup could not finish');
  await expect(page.locator('#offline-status')).toBeVisible();
  await choosePractice(page);
  await expect(page.locator('#offline-status')).toBeVisible();
  await expect(page.locator('.install-help')).toBeHidden();
  await page.getByRole('spinbutton').fill('4');
  await page.getByRole('button', { name: 'Check answer' }).click();
  await expect(page.locator('#feedback')).toContainText('Correct!');
});

test('a real asset update activates after close and reopen without resetting statistics', async ({ browser, browserName }) => {
  const directory = await mkdtemp(join(tmpdir(), 'multiply-update-'));
  await cp(new URL('../public/', import.meta.url), directory, { recursive: true });
  // Isolated public-only fixture: never mutate the real app or serve the repo.
  const server = await publicServer(directory);
  const url = server.url;
  const context = await browser.newContext();
  try {
    const first = await context.newPage();
    await first.goto(url);
    await ready(first);
    await choosePractice(first);
    await first.getByRole('spinbutton').fill('4');
    await first.getByRole('button', { name: 'Check answer' }).click();
    await first.evaluate(async () => { await caches.open('unrelated-test-cache'); });
    const sw = await readFile(join(directory, 'sw.js'), 'utf8');
    const currentCache = sw.match(/const CACHE = '([^']+)'/)[1];
    const updatedCache = `${currentCache}-updated`;
    await writeFile(join(directory, 'sw.js'), sw.replace(currentCache, updatedCache));
    await first.evaluate(async () => { const registration = await navigator.serviceWorker.getRegistration(); await registration.update(); });
    await expect(first.locator('#offline-status')).toContainText('An update is ready.');
    await first.close();
    const second = await context.newPage();
    await second.goto(url);
    await ready(second);
    await expect.poll(() => second.evaluate(() => caches.keys())).toContain(updatedCache);
    const keys = await second.evaluate(() => caches.keys());
    expect(keys).toContain('unrelated-test-cache');
    expect(keys).not.toContain(currentCache);
    server.disconnect();
    if (browserName === 'chromium') await context.setOffline(true);
    await second.reload();
    await second.getByRole('button', { name: 'Statistics', exact: true }).click();
    await expect(second.getByRole('region', { name: 'All practice', exact: true }).locator('dd')).toHaveText(['1', '1', '100%']);
  } finally {
    await context.close();
    await server.close();
    await rm(directory, { recursive: true, force: true });
  }
});
