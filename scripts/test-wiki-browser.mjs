import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "../tmp/qa/node_modules/playwright");
const guides = JSON.parse(fs.readFileSync("src/data/wiki-pages.json", "utf8"));
const routes = ["/insights/wiki/", "/insights/wiki/gaitai-care/", ...guides.map((p) => `/insights/wiki/gaitai-care/${p.slug}/`)];
assert.equal(routes.length, 49, "Preserve all published Wiki pages");
const live = process.env.WIKI_TEST_BASE;
process.env.GAITAI_AUDIT_OUT = "out";
const { serve } = await import("./audit-server.mjs");
const { server, base } = live ? { server: { close() {} }, base: live.replace(/\/$/, "") } : await serve();
const browser = await chromium.launch({ headless: true, executablePath: process.env.QA_CHROMIUM });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, permissions: ["clipboard-read", "clipboard-write"] });
const page = await context.newPage();
page.setDefaultTimeout(15000);
page.setDefaultNavigationTimeout(30000);
const consoleErrors = [];
page.on("pageerror", (e) => consoleErrors.push(`${page.url()}: ${e.message}`));
const directory = "tmp/wiki-qa";
fs.mkdirSync(directory, { recursive: true });
let checks = 0, headingLinks = 0, diagrams = 0;
const check = (value, message) => { assert(value, message); checks++; };
const blogEntries = [
  { href: "/insights", text: "Latest Stories Recent articles, research notes and GaitAI updates" },
  { href: "/insights/start-here", text: "GaitAI Foundations The five ideas behind movement-intelligence thinking" },
  { href: "/insights/archive", text: "Archive Everything GaitAI has published" },
  { href: "/insights/wiki", text: "Wiki Product architecture and technical documentation" },
];
async function checkBlogMenu(menu) {
  await menu.locator("a").last().waitFor({ state: "visible" });
  assert.deepEqual(await menu.locator("a").evaluateAll((links) => links.map((a) => ({
    href: a.getAttribute("href").replace(/\/$/, ""),
    text: a.innerText.replace(/\s+/g, " ").trim(),
  }))), blogEntries, `${page.url()}: original Blog entries followed by Wiki`);
  checks++;
}
async function openBlogMenu(mobile) {
  // ThemeToggle mounts only after hydration. SSR links are visible sooner,
  // but hovering them before event handlers attach does not open a menu.
  await page.locator('header button[aria-label^="Theme:"]').waitFor({ state: "attached" });
  // Live Insights can keep background requests open. Wait for the page and
  // its visible UI, rather than requiring the entire network to become idle.
  await page.waitForLoadState("load");
  await page.evaluate(() => document.fonts.ready);
  if (new URL(page.url()).pathname === "/") {
    // Use the site's existing ready state rather than racing the homepage's
    // initial greeting/theme effects or adding a fixed sleep.
    await page.waitForFunction(() => {
      const slot = document.querySelector('nav[aria-label="You are here"] [data-phase]');
      return !slot || slot.getAttribute("data-phase") === "atlas";
    });
  }
  // Give the mount/theme effects their render frame before hover; those
  // effects intentionally dismiss any menu that was open during a change.
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  if (mobile) {
    await page.getByRole("button", { name: "Open menu", exact: true }).click();
    const blog = page.getByRole("dialog", { name: "Site navigation" }).getByRole("button", { name: "Blog", exact: true });
    if (await blog.getAttribute("aria-expanded") !== "true") await blog.click();
    return page.locator("#mnav-insights");
  }
  // Escape intentionally leaves a pointer-opened menu closed until the
  // pointer leaves and re-enters its trigger. Exercise a fresh hover.
  await page.mouse.move(10, 180);
  await page.locator("header").getByRole("link", { name: "Blog", exact: true }).hover();
  return page.locator('[data-nav-menu="/insights"]');
}
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
      return { duplicate: ids.filter((id, i) => ids.indexOf(id) !== i), broken, anchors: anchors.length, diagrams: svg.length, accessible: svg.every((s) => s.querySelector("title") && s.querySelector("desc")), overflow: document.documentElement.scrollWidth > innerWidth + 1, rawDiagram: /```diagram/.test(content.innerText), placeholders: [...content.querySelectorAll('[aria-hidden="true"]')].some((element) => /^[?\uFFFD]$/.test(element.textContent.trim())) };
    });
    check(!result.duplicate.length, `${route}: duplicate IDs ${result.duplicate}`);
    check(!result.broken.length, `${route}: broken headings ${result.broken}`);
    check(!result.overflow, `${route}: horizontal page overflow`);
    check(result.accessible && !result.rawDiagram, `${route}: static diagrams`);
    check(!result.placeholders, `${route}: no placeholder navigation glyphs`);
    headingLinks += result.anchors; diagrams += result.diagrams;
    const menu = await openBlogMenu(false);
    await checkBlogMenu(menu);
    check((await menu.locator('a[aria-current="page"]').getAttribute("href")).replace(/\/$/, "") === "/insights/wiki", `${route}: only Wiki is active`);
    await page.keyboard.press("Escape");
    await menu.waitFor({ state: "hidden" });
  }
  console.log(`All ${routes.length} Wiki pages and their desktop Blog menus passed.`);

  await page.goto(base + "/insights/wiki/");
  const search = page.getByRole("searchbox", { name: "Search Wiki pages" });
  for (const [query, area] of [["keystore", "android"], ["browser sessions", "web"], ["PostgreSQL", "backend"]]) {
    await search.fill(query);
    const results = page.getByRole("search", { name: "Wiki search" }).locator("li a");
    await results.first().waitFor();
    check((await results.evaluateAll((links) => links.map((a) => a.getAttribute("href")))).some((href) => href.includes(`/${area}/`)), `Search finds ${area}`);
    await search.press("ArrowDown");
    check(await results.first().evaluate((a) => a === document.activeElement), "Search keyboard Down Arrow");
    await page.keyboard.press("ArrowDown");
    check(await results.nth(1).evaluate((a) => a === document.activeElement), "Search next result");
    await page.keyboard.press("ArrowUp");
    check(await results.first().evaluate((a) => a === document.activeElement), "Search previous result");
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

  for (const width of [1440, 1280, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const theme of ["light", "dark"]) {
      await page.evaluate((value) => localStorage.setItem("theme", value), theme);
      for (const slug of ["", "gaitai-care/", "gaitai-care/web/architecture/", "gaitai-care/android/build/", "gaitai-care/backend/data-model/"]) {
        await page.goto(base + "/insights/wiki/" + slug);
        await page.locator("main h1").waitFor();
        await page.waitForFunction((target) => document.documentElement.classList.contains(target), theme);
        check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${width}/${theme}/${slug}: no page overflow`);
        if (slug && width <= 1023) {
          const toggle = page.getByRole("button", { name: "Documentation navigation" });
          await toggle.click();
          check(await toggle.getAttribute("aria-expanded") === "true", "Mobile documentation navigation opens");
          await toggle.click();
          check(await toggle.getAttribute("aria-expanded") === "false", "Mobile documentation navigation closes");
        }
        if (slug === "gaitai-care/") {
          const cards = page.getByRole("region", { name: "Explore by platform" }).locator("a");
          check(await cards.count() === 3, "Three platform documentation cards");
          check(await cards.locator("svg").count() === 3, "Platform cards use SVG navigation arrows");
          const toggle = page.getByRole("button", { name: "Documentation navigation" });
          if (width <= 1023) await toggle.click();
          const navigation = page.getByRole("navigation", { name: "GaitAI Care documentation", exact: true });
          check(await navigation.locator("details").count() === 4, "Four distinct documentation groups");
          const android = navigation.locator("summary").filter({ hasText: "Android application" });
          await android.click();
          check(await android.evaluate((summary) => summary.parentElement.open), "Sidebar group expands");
          await android.press("Enter");
          check(!await android.evaluate((summary) => summary.parentElement.open), "Sidebar group collapses with keyboard");
          if (width <= 1023) await toggle.click();
        }
        if (slug === "gaitai-care/web/architecture/" && width >= 1200) {
          const toc = page.getByRole("navigation", { name: "On this page", exact: true });
          await toc.getByRole("link", { name: "Technology inventory", exact: true }).click();
          await page.waitForFunction(() => document.querySelector('nav[aria-label="On this page"] a[aria-current="location"]')?.getAttribute("href") === "#technology-inventory");
          check(await toc.isVisible(), `${width}/${theme}: sticky active table of contents`);
          await page.evaluate(() => window.scrollTo(0, 0));
        }
        if ([1440, 390].includes(width)) await page.screenshot({ path: `${directory}/${width}-${theme}-${slug.replaceAll("/", "-") || "directory"}.png`, fullPage: false });
      }
    }
  }

  for (const width of [1440, 1280, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(base + "/insights/wiki/gaitai-care/");
    const toggle = page.getByRole("button", { name: "Documentation navigation" });
    if (width <= 1023) await toggle.click();
    const navigation = page.getByRole("navigation", { name: "GaitAI Care documentation", exact: true });
    await navigation.locator("summary").filter({ hasText: "Android application" }).click();
    await navigation.getByRole("link", { name: "Android Architecture and Stack", exact: true }).click();
    await page.waitForURL(/\/android\/architecture\/?$/);
    if (width <= 1023) check(await toggle.getAttribute("aria-expanded") === "false", "Mobile sidebar closes after navigation");
    else check(await navigation.getByRole("link", { name: "Android Architecture and Stack", exact: true }).getAttribute("aria-current") === "page", "Sidebar follows the current page");
  }

  // The Wiki must leave the website's existing global search shortcut intact.
  await page.goto(base + "/insights/wiki/");
  await page.waitForLoadState("networkidle");
  await page.keyboard.press("/");
  const globalSearch = page.getByRole("dialog", { name: "GaitAI intelligence search" });
  await globalSearch.waitFor({ state: "visible" }); checks++;
  await page.keyboard.press("Escape");
  await globalSearch.waitFor({ state: "hidden" }); checks++;

  // A direct load and full refresh of each existing site section must still work.
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const route of ["/", "/insights/", "/insights/archive/", "/insights/start-here/", "/research/", "/publications/", "/products/", "/mobilitycare/", "/securevision/"]) {
    const response = await page.goto(base + route, { waitUntil: "domcontentloaded" });
    check(response?.status() === 200, `Existing route ${route}`);
    check(await page.locator("main h1").count() > 0, `Existing heading ${route}`);
    const menu = await openBlogMenu(false);
    await checkBlogMenu(menu);
    await page.keyboard.press("Escape");
    await menu.waitFor({ state: "hidden" });
  }
  // Follow all four links from both the main site and Wiki, on desktop,
  // tablet and phone in each theme. The shared menu must close on navigation.
  for (const width of [1440, 1280, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    const mobile = width < 1040;
    for (const theme of ["light", "dark"]) {
      await page.evaluate((value) => localStorage.setItem("theme", value), theme);
      for (const origin of ["/", "/insights/wiki/gaitai-care/android/build/"]) {
        for (const entry of blogEntries) {
          await page.goto(base + origin);
          await page.waitForFunction((value) => document.documentElement.classList.contains(value), theme);
          const menu = await openBlogMenu(mobile);
          await checkBlogMenu(menu);
          await menu.getByRole("link", { name: entry.text, exact: true }).click();
          await page.waitForURL((url) => url.pathname.replace(/\/$/, "") === entry.href);
          await page.waitForFunction((href) => {
            const canonical = document.querySelector('link[rel="canonical"]');
            return canonical && new URL(canonical.href).pathname.replace(/\/$/, "") === href;
          }, entry.href);
          await page.locator("main h1").waitFor({ state: "visible" });
          await (mobile ? page.getByRole("dialog", { name: "Site navigation" }) : menu).waitFor({ state: "hidden" });
          check(new URL(page.url()).pathname.replace(/\/$/, "") === entry.href, `${width}/${theme}: ${entry.text} destination`);
          const currentMenu = await openBlogMenu(mobile);
          await checkBlogMenu(currentMenu);
          assert.deepEqual(await currentMenu.locator('a[aria-current="page"]').evaluateAll((links) => links.map((a) => a.getAttribute("href").replace(/\/$/, ""))), [entry.href], `${width}/${theme}/${page.url()}: active Blog entry`); checks++;
          await page.keyboard.press("Escape");
          await (mobile ? page.getByRole("dialog", { name: "Site navigation" }) : currentMenu).waitFor({ state: "hidden" });
        }
      }
      await page.goto(base + "/insights/wiki/gaitai-care/web/");
      await openBlogMenu(mobile);
      await page.screenshot({ path: `${directory}/blog-${width}-${theme}.png` });
      await page.keyboard.press("Escape");
      console.log(`Blog navigation passed: ${width}px ${theme}, all four destinations from Home and Wiki.`);
    }
  }
  // Keyboard focus follows the original reading order, including the new fourth item.
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base + "/insights/wiki/gaitai-care/backend/");
  await page.locator("header").getByRole("link", { name: "Blog", exact: true }).focus();
  for (const entry of blogEntries) {
    await page.keyboard.press("Tab");
    check(await page.evaluate(() => document.activeElement?.getAttribute("href")?.replace(/\/$/, "")) === entry.href, `Keyboard order: ${entry.text}`);
  }
  await page.keyboard.press("Escape");
  await page.locator('[data-nav-menu="/insights"]').waitFor({ state: "hidden" });
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
} catch (error) {
  console.error(`Failure at ${page.url()} (${JSON.stringify(page.viewportSize())})`);
  await page.screenshot({ path: `${directory}/failure.png` }).catch(() => {});
  throw error;
} finally { await browser.close(); server.close(); }
