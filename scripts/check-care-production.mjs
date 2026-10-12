import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from '../tmp/qa/node_modules/playwright/index.mjs';

const result = { checkedAt: new Date().toISOString(), checks: [], limitations: ['Successful sign-in, delivered verification email and verified-account record access require an approved test account and mailbox. No account or records created.'] };
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
fs.mkdirSync('tmp/care-launch', { recursive: true });
try {
  for (const origin of ['https://care.gaitai.in', 'https://gaitai-care-project.web.app']) {
    const response = await page.goto(origin, { waitUntil: 'networkidle', timeout: 60000 });
    assert.equal(response.status(), 200);
    assert(await page.evaluate(() => window.isSecureContext));
    await page.locator('#auth-form').waitFor();
    assert(await page.getByRole('button', { name: /sign in/i, exact: false }).count());
    result.checks.push(`${origin}: trusted HTTPS and login UI`);
    await page.locator('[data-action="toggle-auth"]').click();
    assert(await page.locator('input[name="consent"][required]').isVisible());
    assert(await page.getByRole('button', { name: /Create private account/ }).isVisible());
    result.checks.push(`${origin}: registration UI and mandatory privacy consent`);
    const privacy = await context.request.get(`${origin}/privacy.html`);
    assert.equal(privacy.status(), 200);
    assert((await privacy.text()).includes('Privacy notice'));
  }
  const api = 'https://gaitai-care-api.onrender.com/api';
  const headers = { Origin: 'https://care.gaitai.in', 'X-Requested-With': 'BabyCare' };
  for (const route of ['/me', '/patients']) {
    const response = await context.request.get(api + route, { headers, timeout: 60000 });
    assert.equal(response.status(), 401);
    result.checks.push(`${route}: unauthenticated access refused (401)`);
  }
  // Intentionally invalid inputs: no account can be created, and no email is sent.
  const register = await context.request.post(api + '/auth/register', { headers, data: { email: 'invalid', password: 'short', accepted_privacy: false } });
  assert.equal(register.status(), 422);
  result.checks.push('Registration: invalid input rejected (422), no account created');
  const login = await context.request.post(api + '/auth/login', { headers, data: { email: 'nonexistent-care-launch-check@example.invalid', password: 'invalid-check-only-2026' } });
  assert.equal(login.status(), 401);
  result.checks.push('Login: invalid credentials rejected (401)');
  const verify = await context.request.post(api + '/auth/verify-email/confirm', { headers, data: { token: 'invalid-verification-check-no-token' } });
  assert([400, 422].includes(verify.status()));
  result.checks.push(`Email verification: invalid token rejected (${verify.status()})`);
  await page.goto('https://care.gaitai.in/#verify-email=invalid-verification-check-no-token', { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'This link no longer works' }).waitFor();
  assert(!page.url().includes('verify-email='));
  result.checks.push('Verification UI rejects invalid link and removes token fragment');
  assert.deepEqual(errors, []);
  result.checks.push('No browser JavaScript errors');
} finally {
  fs.writeFileSync('tmp/care-launch/production-auth.json', JSON.stringify(result, null, 2));
  await browser.close();
}
console.log(JSON.stringify(result, null, 2));
