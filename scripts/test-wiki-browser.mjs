import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "../tmp/qa/node_modules/playwright");
const guides = JSON.parse(fs.readFileSync("src/data/wiki-pages.json", "utf8"));
const routes = ["/insights/wiki/", "/insights/wiki/gaitai-care/", ...guides.map((p) => `/insights/wiki/gaitai-care/${p.slug}/`)];
const live = process.env.WIKI_TEST_BASE;
process.env.GAITAI_AUDIT_OUT = "out";
const { serve } = await import("./audit-server.mjs");
const { server, base } = live ? { server: { close() {} }, base: live.replace(/\/$/, "") } : await serve();
const browser = await chromium.launch({ headless: true, executablePath: process.env.QA_CHROMIUM });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, permissions: ["clipboard-read", "clipboard-write"] });
const page = await context.newPage();
const consoleErrors = [];
page.on("pageerror", (e) => consoleErrors.push(`${page.url()}: ${e.message}`));
const directory = "tmp/wiki-qa";
fs.mkdirSync(directory, { recursive: true });
let checks = 0, headingLinks = 0, diagrams = 0;
const check = (value, message) => { assert(value, message); checks++; };
try {
  for (const route of routes) {
    const response = await page.goto(base + route, { waitUntil: "domcontentloaded" });
    check(response?.status() === 200, `${route}: status`);
    await page.locator("main h1").waitFor({ state: "visible" });
    check(await page.locator("main h1").count() === 1, `${route}: single H1`);
    check((await page.locator('link[rel="canonical"]').getAttribute("href")) === `https://gaitai.in${route}`, `${route}: canonical`);
    check(Boolean(await page.locator('meta[name="description"]').getAttribute("content")), `${route}: description`);
    const result = await page.evaluate(() => {
      const content = document.querySelector("main");
      const ids = [...content.querySelectorAll("[id]")].map((e) => e.id);
      const anchors = [...content.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute("href").slice(1));
      const broken = anchors.filter((id) => !document.getElementById(decodeURIComponent(id)));
      const svg = [...content.querySelectorAll('figure svg[role="img"]')];
      return { duplicate: ids.filter((id, i) => ids.indexOf(id) !== i), broken, anchors: anchors.length, diagrams: svg.length, accessible: svg.every((s) => s.querySelector("title") && s.querySelector("desc")), overflow: document.documentElement.scrollWidth > innerWidth + 1, rawDiagram: /```diagram/.test(content.innerText) };
    });
    check(!result.duplicate.length, `${route}: duplicate IDs ${result.duplicate}`);
    check(!result.broken.length, `${route}: broken headings ${result.broken}`);
    check(!result.overflow, `${route}: horizontal page overflow`);
    check(result.accessible && !result.rawDiagram, `${route}: static diagrams`);
    headingLinks += result.anchors; diagrams += result.diagrams;
  }

  await page.goto(base + "/insights/wiki/");
  const search = page.getByRole("searchbox", { name: "Search Wiki pages" });
  for (const [query, area] of [["keystore", "android"], ["browser sessions", "web"], ["PostgreSQL", "backend"]]) {
    await search.fill(query);
    const results = page.getByRole("search", { name: "Wiki search" }).locator("li a");
    await results.first().waitFor();
    check((await results.evaluateAll((links) => links.map((a) => a.getAttribute("href")))).some((href) => href.includes(`/${area}/`)), `Search finds ${area}`);
    await search.press("ArrowDown");
    check(await results.first().evaluate((a) => a === document.activeElement), "Search keyboard Down Arrow");
    await page.keyboard.press("Escape");
    check(await search.inputValue() === "", "Search Escape clears");
  }
  await search.fill("zzzzunlikelynomatchzzzz");
  await page.getByText("No matching pages", { exact: false }).waitFor(); checks++;
  await search.fill("Keystore");
  await page.getByRole("search", { name: "Wiki search" }).locator("li a").first().click();
  await page.waitForURL(/\/android\//); checks++;

  await page.goto(base + "/insights/wiki/gaitai-care/backend/api/");
  await page.getByRole("button", { name: "Copy json code" }).click();
  await page.getByText("Copied", { exact: true }).waitFor();
  check((await page.evaluate(() => navigator.clipboard.readText())).includes('"workflow": "document-review"'), "Copy exact code");
  check(await page.locator('code .hljs-attr').count() > 0, "Syntax highlighting");
  await page.locator('article h2 a').first().click();
  check(new URL(page.url()).hash.length > 1, "Direct heading link");
  await page.reload();
  check(new URL(page.url()).hash.length > 1, "Heading deep-link refresh");

  for (const width of [1440, 820, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const theme of ["light", "dark"]) {
      await page.evaluate((value) => localStorage.setItem("theme", value), theme);
      for (const slug of ["", "gaitai-care/", "gaitai-care/web/architecture/", "gaitai-care/android/build/", "gaitai-care/backend/data-model/"]) {
        await page.goto(base + "/insights/wiki/" + slug);
        await page.locator("main h1").waitFor();
        await page.waitForFunction((target) => document.documentElement.classList.contains(target), theme);
        check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${width}/${theme}/${slug}: no page overflow`);
        if (slug && width <= 900) {
          const toggle = page.getByRole("button", { name: "Documentation navigation" });
          await toggle.click();
          check(await toggle.getAttribute("aria-expanded") === "true", "Mobile documentation navigation opens");
          await toggle.click();
          check(await toggle.getAttribute("aria-expanded") === "false", "Mobile documentation navigation closes");
        }
        if ([1440, 390].includes(width)) await page.screenshot({ path: `${directory}/${width}-${theme}-${slug.replaceAll("/", "-") || "directory"}.png`, fullPage: false });
      }
    }
  }

  // A direct load and full refresh of each existing site section must still work.
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const route of ["/", "/insights/", "/insights/archive/", "/insights/start-here/", "/research/", "/publications/", "/products/", "/mobilitycare/", "/securevision/"]) {
    const response = await page.goto(base + route, { waitUntil: "domcontentloaded" });
    check(response?.status() === 200, `Existing route ${route}`);
    check(await page.locator("main h1").count() > 0, `Existing heading ${route}`);
  }
  // Exercise the actual shared desktop and mobile Blog menus, not a duplicate fixture.
  await page.locator("header").getByRole("link", { name: "Blog", exact: true }).hover();
  const desktopMenu = page.locator('[data-nav-menu="/insights"]');
  await desktopMenu.waitFor({ state: "visible" });
  assert.deepEqual(await desktopMenu.locator("a").evaluateAll((a) => a.map((e) => e.getAttribute("href").replace(/\/$/, ""))), ["/insights", "/insights/archive", "/insights/wiki"]); checks++;
  await desktopMenu.getByRole("link", { name: /^Wiki/ }).click();
  await page.waitForURL(/\/insights\/wiki\/?$/); checks++;
  for (const width of [820, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.getByRole("button", { name: "Open menu", exact: true }).click();
    const menu = page.getByRole("dialog", { name: "Site navigation" });
    const blog = menu.getByRole("button", { name: "Blog", exact: true });
    if (await blog.getAttribute("aria-expanded") !== "true") await blog.click();
    const mobileMenu = page.locator("#mnav-insights");
    assert.deepEqual(await mobileMenu.locator("a").evaluateAll((a) => a.map((e) => e.getAttribute("href").replace(/\/$/, ""))), ["/insights", "/insights/archive", "/insights/wiki"]); checks++;
    await mobileMenu.getByRole("link", { name: /^Wiki/ }).click();
    await menu.waitFor({ state: "hidden" }); checks++;
  }
  const staticContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 1000 } });
  const staticPage = await staticContext.newPage();
  for (const route of ["web/architecture", "android", "backend/data-model", "backend/email"]) {
    await staticPage.goto(`${base}/insights/wiki/gaitai-care/${route}/`);
    check(await staticPage.locator('figure svg[role="img"]').count() > 0, `No-JavaScript diagram: ${route}`);
    check(await staticPage.locator("article h2").count() > 1, `No-JavaScript article: ${route}`);
  }
  await staticContext.close();
  check(consoleErrors.length === 0, `Browser errors: ${consoleErrors.join("\n")}`);
  const result = { origin: base, pages: routes.length, guides: guides.length, checks, headingLinks, diagrams, consoleErrors, status: "passed" };
  fs.writeFileSync(path.join(directory, live ? "live-results.json" : "results.json"), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
} finally { await browser.close(); server.close(); }
