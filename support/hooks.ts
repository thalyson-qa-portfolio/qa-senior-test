import { Before, After, BeforeAll, AfterAll, setDefaultTimeout, Status } from '@cucumber/cucumber';
import { chromium, Browser, Page, BrowserContext } from '@playwright/test';

setDefaultTimeout(60000);

let browser: Browser;
let context: BrowserContext;
export let page: Page;

BeforeAll(async () => {
  browser = await chromium.launch({ 
    headless: process.env.HEADLESS !== 'false',
    slowMo: process.env.SLOWMO ? parseInt(process.env.SLOWMO) : 0,
  });
});

Before(async () => {
  context = await browser.newContext({
    recordVideo: process.env.VIDEO === 'true' ? { dir: 'videos/' } : undefined,
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  page = await context.newPage();
});

After(async function (scenario) {
  const scenarioName = scenario.pickle.name.replace(/\s+/g, '_');
  
  if (scenario.result?.status === Status.FAILED) {
    await page.screenshot({ path: `screenshots/${scenarioName}.png` });
  }
  
  await context.tracing.stop({ path: `traces/${scenarioName}.zip` });
  await page.close();
  await context.close();
});

AfterAll(async () => {
  await browser.close();
});
