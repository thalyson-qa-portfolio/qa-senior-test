import { defineConfig } from '@playwright/test';
import { API_BASE_URL } from './support/config';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  use: {
    baseURL: API_BASE_URL,
    extraHTTPHeaders: {
      'Accept': 'application/json',
    },
  },
  reporter: [['html', { open: 'never' }], ['github']],
});
