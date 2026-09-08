import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', testMatch: '*.spec.js', fullyParallel: true,
  use: { baseURL: 'http://127.0.0.1:8000' },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
  webServer: { command: 'npm start', url: 'http://127.0.0.1:8000', reuseExistingServer: !process.env.CI },
});
