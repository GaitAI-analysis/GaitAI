import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '../tmp/qa/node_modules/playwright/index.mjs';

const source = path.resolve('../..', 'GaitAI-Care/web');
process.env.GAITAI_AUDIT_OUT = source;
const { serve } = await import('./audit-server.mjs');
const { server, base } = await serve();
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1360, height: 820 }, deviceScaleFactor: 1 });
await context.route('**/api/**', route => route.abort());
const page = await context.newPage();
fs.mkdirSync('public/images/gaitai-care', { recursive: true });
try {
  await page.goto(base);
  await page.locator('#auth-form').waitFor();
  // Render the app's unmodified document component with its initial empty state.
  // No account, profile, API fixture, patient record, or invented UI is used.
  for (const theme of ['light', 'dark']) {
    await page.evaluate(theme => {
      localStorage.setItem('theme', theme);
      document.documentElement.dataset.theme = theme;
      S.tab = 'documents';
      document.querySelector('#app').innerHTML = layout(docsView());
      document.querySelectorAll('.brandrow').forEach(row => { row.innerHTML = gcBrand(); });
    }, theme);
    await page.screenshot({ path: `public/images/gaitai-care/records-${theme}.png` });
  }
  fs.copyFileSync(path.join(source, 'icon-192.png'), 'public/images/gaitai-care/app-icon.png');
  console.log('Captured actual empty document component in two themes. No patient data or production writes.');
} finally {
  await browser.close(); server.close();
}
