import 'dotenv/config';

const DEFAULT_API_BASE_URL = 'https://restful-booker.herokuapp.com';
const DEFAULT_E2E_BASE_URL = 'https://automationexercise.com';

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

function envUrl(key: string, fallback: string): string {
  const v = process.env[key];
  const raw =
    v !== undefined && String(v).trim() !== '' ? String(v).trim() : fallback;
  return stripTrailingSlash(raw);
}

/** Restful-Booker — testes de API (`playwright.config.ts` baseURL). */
export const API_BASE_URL = envUrl('API_BASE_URL', DEFAULT_API_BASE_URL);

/** Automation Exercise — suíte E2E (Cucumber + Playwright). */
export const E2E_BASE_URL = envUrl('E2E_BASE_URL', DEFAULT_E2E_BASE_URL);
