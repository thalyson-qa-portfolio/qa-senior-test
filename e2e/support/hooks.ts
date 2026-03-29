import { Before, After, BeforeAll, AfterAll, setDefaultTimeout, Status } from '@cucumber/cucumber';
import { chromium, Browser, Page, BrowserContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

setDefaultTimeout(60000);

const TEST_OUTPUT = 'test-output';
const dirs = {
  screenshots: path.join(TEST_OUTPUT, 'screenshots'),
  traces: path.join(TEST_OUTPUT, 'traces'),
  videos: path.join(TEST_OUTPUT, 'videos'),
  reports: path.join(TEST_OUTPUT, 'reports'),
};

let browser: Browser;
let context: BrowserContext;
export let page: Page;

BeforeAll(async () => {
  Object.values(dirs).forEach((dir) => fs.mkdirSync(dir, { recursive: true }));
  browser = await chromium.launch({
    headless: process.env.HEADLESS !== 'false',
    slowMo: process.env.SLOWMO ? parseInt(process.env.SLOWMO) : 0,
  });
});

Before(async () => {
  context = await browser.newContext({
    recordVideo: process.env.VIDEO === 'true' ? { dir: dirs.videos } : undefined,
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  page = await context.newPage();
});

After(async function (scenario) {
  const scenarioName = scenario.pickle.name.replace(/\s+/g, '_');

  if (scenario.result?.status === Status.FAILED) {
    await page.screenshot({ path: path.join(dirs.screenshots, `${scenarioName}.png`) });
  }

  await context.tracing.stop({ path: path.join(dirs.traces, `${scenarioName}.zip`) });
  await page.close();
  await context.close();
});

AfterAll(async () => {
  await browser.close();
});
