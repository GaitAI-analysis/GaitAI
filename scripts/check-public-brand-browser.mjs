import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import { serve } from "./audit-server.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("../tmp/qa/node_modules/playwright");
const live = process.env.BRAND_CHECK_BASE;
const { server, base } = live ? { server: { close() {} }, base: live.replace(/\/$/, "") } : await serve();
const dir = `tmp/brand-browser-${live ? "live" : "local"}`;
fs.mkdirSync(dir, { recursive: true });
const results = [];
const browser = await chromium.launch({ headless: true });
const routes = ["/", "/publications/", "/publications/iet-pose-2022/", "/publications/ivc-2023/", "/research/", "/research/talks/", "/trust/", "/securevision/"];
try {
  for (const width of [1440, 1280, 768, 390]) for (const theme of ["light", "dark"]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, colorScheme: theme, reducedMotion: "reduce" });
    await context.addInitScript(theme => localStorage.setItem("theme", theme), theme);
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    for (const route of routes) {
      const response = await page.goto(base + route, { waitUntil: "networkidle" });
      assert.equal(response.status(), 200, route);
      await page.locator("h1").first().waitFor();
      assert.equal(await page.locator("h1").count(), 1, `${route}: one page heading`);
      assert.equal(await page.locator("html").evaluate((el, theme) => el.classList.contains(theme), theme), true, `${route}: theme`);
      const body = await page.locator("body").innerText();
      assert.doesNotMatch(body, /founder[- ](?:led|authored|research)|authored by (?:the )?founder|founder speaking record/i);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      assert.equal(overflow, false, `${route}: ${width}px horizontal overflow`);
      if (route.startsWith("/publications/")) {
        assert.equal(await page.locator('img[src*="/publications/paper-"], img[src*="patent-certificate"]').count(), 0);
        assert.equal(await page.locator('a[href*="scholar.google.com/citations"],a[href*=".github.io"]').count(), 0);
        assert.doesNotMatch(body, /\bCo-authors\b|\bAuthors\n|\bWith [A-Z][a-z]+ [A-Z][a-z]+/);
      }
      if ([1440, 390].includes(width) && ["/", "/publications/", "/publications/iet-pose-2022/", "/research/talks/"].includes(route)) {
        await page.screenshot({ path: `${dir}/${width}-${theme}-${route.replaceAll("/", "_") || "home"}.png`, fullPage: true });
      }
      results.push({ route, width, theme, status: response.status(), overflow });
    }
    await page.goto(base + "/publications/", { waitUntil: "networkidle" });
    await page.getByRole("tab", { name: "List", exact: true }).click();
    await page.getByRole("searchbox", { name: "Search research outputs" }).fill("pose features");
    assert.equal(await page.getByRole("heading", { name: "A robust covariate-invariant gait recognition based on pose features", exact: true }).count(), 1);
    await page.getByRole("button", { name: "Clear filters", exact: true }).click();
    assert.match(await page.locator('[aria-live="polite"]').first().innerText(), /9 research outputs/);
    await page.getByRole("tab", { name: "Grid", exact: true }).click();
    await page.getByRole("combobox", { name: "Filter by year" }).selectOption("2024");
    assert.match(await page.locator('[aria-live="polite"]').first().innerText(), /2 research outputs/);
    // The mobile menu is the accessible launcher when the floating button is parked.
    if (width < 1024) {
      await page.getByRole("button", { name: "Open menu", exact: true }).click();
      await page.getByRole("button", { name: /Ask GaitAI/ }).filter({ visible: true }).first().click();
    } else {
      await page.getByRole("button", { name: "Ask GaitAI — your guide to movement intelligence", exact: true }).click();
    }
    const dialog = page.getByRole("dialog", { name: "Ask GaitAI", exact: true });
    await dialog.getByRole("textbox", { name: "Ask anything about GaitAI" }).fill("Who founded GaitAI?");
    await dialog.getByRole("button", { name: "Send question", exact: true }).click();
    await dialog.getByText(/Individual identities and personal profiles are outside its public scope/).waitFor();
    assert.deepEqual(errors, [], `${width}/${theme}: browser errors`);
    await context.close();
    console.log(`PASS ${width}px ${theme}: pages, filters, public-scope answer`);
  }
  fs.writeFileSync(`${dir}/results.json`, JSON.stringify({ base, results }, null, 2));
  console.log(`PASS ${results.length} page/viewport/theme checks`);
} finally { await browser.close(); server.close(); }
