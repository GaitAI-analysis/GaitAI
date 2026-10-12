import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from '../tmp/qa/node_modules/playwright/index.mjs';
import AxeBuilder from '../tmp/qa/node_modules/@axe-core/playwright/dist/index.mjs';

process.env.GAITAI_AUDIT_OUT = 'out';
const { serve } = await import('./audit-server.mjs');
const live = process.env.CARE_TEST_BASE;
const { server, base } = live ? { server: { close() {} }, base: live.replace(/\/$/, '') } : await serve();
const browser = await chromium.launch({ headless: true });
const directory = `tmp/care-launch/${live ? 'live' : 'local'}`;
fs.mkdirSync(directory, { recursive: true });
const result = { base, checks: [], consoleErrors: [], accessibility: [] };
const check = (ok, message) => { assert(ok, message); result.checks.push(message); };
const sizes = [[1440, 900], [1280, 800], [768, 1024], [390, 844]];
try {
  for (const [width, height] of sizes) for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({ viewport: { width, height }, colorScheme: theme, reducedMotion: 'reduce' });
    await context.addInitScript(theme => localStorage.setItem('theme', theme), theme);
    const page = await context.newPage();
    page.on('pageerror', error => result.consoleErrors.push({ url: page.url(), message: error.message }));
    const label = `${width}-${theme}`;
    let response = await page.goto(base + '/gaitai-care/', { waitUntil: 'networkidle' });
    check(response.status() === 200, `${label}: product page loads`);
    await page.locator('h1').waitFor();
    await page.evaluate(() => document.fonts.ready);
    check(await page.evaluate(theme => document.documentElement.classList.contains(theme), theme), `${label}: theme applied`);
    const buttons = page.locator('main').getByRole('link');
    const web = buttons.filter({ hasText: /^Try Web App/ }).first();
    const android = buttons.filter({ hasText: /^Download for Android/ }).first();
    for (const [link, name, href] of [[web, 'web', 'https://care.gaitai.in/'], [android, 'android', '/gaitai-care/download/']]) {
      const box = await link.boundingBox();
      check(box && box.y >= 0 && box.y + box.height <= height && box.x >= 0 && box.x + box.width <= width, `${label}: ${name} CTA above fold`);
      check(await link.getAttribute('href') === href, `${label}: ${name} CTA destination`);
    }
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${label}: no horizontal overflow`);
    check(await page.locator('main img:visible').evaluateAll(images => images.every(i => i.complete && i.naturalWidth > 0)), `${label}: product imagery loads`);
    await page.screenshot({ path: `${directory}/product-${label}.png`, fullPage: true });
    await page.screenshot({ path: `${directory}/product-hero-${label}.png` });
    if (width === 1440 || width === 390) {
      const audit = await new AxeBuilder({ page }).include('main').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      result.accessibility.push({ label, violations: audit.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => n.target) })) });
      check(!audit.violations.length, `${label}: product accessibility checks`);
    }
    await page.getByText('Is GaitAI Care the same as MobilityCare?', { exact: true }).click();
    check(await page.getByText(/GaitAI Care does not perform gait analysis/).isVisible(), `${label}: scope disclosure works`);
    await android.click();
    await page.waitForURL('**/gaitai-care/download/');
    check(await page.getByRole('heading', { name: 'Download not yet available' }).isVisible(), `${label}: release availability is explicit`);
    check(await page.locator('a[href$=".apk"]').count() === 0, `${label}: unapproved APK is not linked`);
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${label}: download page has no overflow`);
    await page.screenshot({ path: `${directory}/download-${label}.png`, fullPage: true });
    await page.goto(base + '/', { waitUntil: 'networkidle' });
    const feature = page.locator('#gaitai-care');
    await feature.scrollIntoViewIfNeeded();
    check(await feature.getByRole('heading', { name: /Your health story/ }).isVisible(), `${label}: homepage discovery`);
    check(await feature.getByRole('link', { name: /Try Web App/ }).isVisible(), `${label}: homepage web CTA`);
    check(await feature.getByRole('link', { name: /Download for Android/ }).isVisible(), `${label}: homepage Android CTA`);
    check(await feature.getByRole('link', { name: /Learn More/ }).getAttribute('href') === '/gaitai-care/', `${label}: homepage Learn More destination`);
    await feature.screenshot({ path: `${directory}/homepage-feature-${label}.png` });
    await feature.getByRole('link', { name: /Learn More/ }).click();
    await page.waitForURL('**/gaitai-care/');
    // Use the existing navigation, rather than directly navigating to the product.
    if (width >= 1040) {
      await page.locator('header nav').getByRole('link', { name: 'Products', exact: true }).hover();
      check(await page.locator('header nav').getByRole('link', { name: /GaitAI Care/ }).isVisible(), `${label}: Products dropdown discovery`);
    } else {
      await page.getByRole('button', { name: 'Open menu' }).click();
      check(await page.locator('.mnav').getByRole('link', { name: /GaitAI Care/ }).isVisible(), `${label}: mobile Products discovery`);
    }
    await context.close();
  }
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  for (const route of ['/products/', '/mobilitycare/', '/securevision/', '/insights/', '/insights/archive/', '/insights/wiki/', '/insights/wiki/gaitai-care/', '/research/']) {
    const response = await page.goto(base + route, { waitUntil: 'networkidle' });
    check(response.status() === 200 && await page.locator('main').innerText(), `Existing route works: ${route}`);
    check(await page.locator('footer').getByRole('link', { name: 'GaitAI Care', exact: true }).count() === 1, `Footer product discovery: ${route}`);
    if (route === '/products/') check(await page.locator('#gaitai-care').count() === 1, 'Catalogue contains standalone Care product');
    if (route === '/mobilitycare/') check(await page.locator('aside').getByRole('link', { name: 'Explore GaitAI Care' }).count() === 1, 'MobilityCare contextual cross-link');
    if (route === '/insights/wiki/gaitai-care/') check(await page.getByRole('navigation', { name: 'GaitAI Care application links' }).getByRole('link').count() === 3, 'Wiki application and product links');
  }
  await page.goto(base + '/gaitai-care/');
  await page.keyboard.press('Control+k');
  const search = page.getByRole('combobox');
  await search.fill('GaitAI Care');
  check(await page.getByRole('option').filter({ hasText: 'GaitAI Care' }).count() > 0, 'Global search discovers GaitAI Care');
  await context.close();
  check(!result.consoleErrors.length, 'No browser JavaScript errors on responsive Care/home checks');
} finally {
  fs.writeFileSync(`${directory}/results.json`, JSON.stringify(result, null, 2));
  await browser.close(); server.close();
}
console.log(`${result.checks.length} browser checks passed. Screenshots: ${directory}`);
