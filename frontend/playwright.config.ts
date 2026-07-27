import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  workers: 1,
  retries: 0,
  preserveOutput: 'never',
  reporter: 'line',
  use: {
    baseURL: process.env['E2E_BASE_URL'] ?? 'http://127.0.0.1:4200',
    screenshot: 'off',
    trace: 'off',
    video: 'off',
  },
});
