import { defineConfig } from '@playwright/test';
import { API_BASE_URL } from './e2e/support/config';

export default defineConfig({
  testDir: './tests',
  outputDir: 'test-output/test-results',
  timeout: 30000,
  use: {
    baseURL: API_BASE_URL,
    extraHTTPHeaders: {
      'Accept': 'application/json',
    },
  },
  reporter: [['html', { open: 'never', outputFolder: 'test-output/playwright-report' }]],
});
