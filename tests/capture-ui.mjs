import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const playwrightPath = '/Users/hejuntao/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(playwrightPath).href);
const base = process.argv[2] || 'http://127.0.0.1:4318';
const output = process.argv[3] || '/tmp/design-memory-ui';
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });

const results = [];
for (const viewport of [{ name: 'desktop', width: 1440, height: 1000 }, { name: 'tablet', width: 1024, height: 900 }, { name: 'mobile', width: 390, height: 844 }]) {
  const page = await browser.newPage({ viewport });
  await page.goto(base, { waitUntil: 'networkidle' });
  const measurements = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    smallTargets: [...document.querySelectorAll('button,a')].map(element => {
      const rect = element.getBoundingClientRect();
      return { text: element.textContent.trim().slice(0, 30), width: rect.width, height: rect.height };
    }).filter(item => item.width > 0 && item.height > 0 && (item.width < 44 || item.height < 44)),
  }));
  await page.screenshot({ path: `${output}/${viewport.name}.png`, fullPage: true });
  results.push({ viewport, ...measurements });
  await page.close();
}
await browser.close();
console.log(JSON.stringify(results, null, 2));
