import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "../tmp/qa/node_modules/playwright");
process.env.GAITAI_AUDIT_OUT = "out";
const { serve } = await import("./audit-server.mjs");
const { server, base } = await serve();
const privateOrigin = "https://gaitai-wiki.gait-ai-founder.workers.dev";
const routes = JSON.parse(fs.readFileSync("src/data/wiki-legacy-routes.json", "utf8"));
const browser = await chromium.launch({ headless: true });
let checks = 0;
const check = (value, message) => { assert(value, message); checks++; };
const expected = [
  { href: "/insights", text: "Latest Stories Recent articles, research notes and GaitAI updates" },
  { href: "/insights/start-here", text: "GaitAI Foundations The five ideas behind movement-intelligence thinking" },
  { href: "/insights/archive", text: "Archive Everything GaitAI has published" },
  { href: privateOrigin + "/insights/wiki", text: "Wiki Product architecture and technical documentation" },
];
const directory = "tmp/wiki-private-public";
fs.mkdirSync(directory, { recursive: true });
try {
  const noScript = await browser.newContext({ javaScriptEnabled: false });
  const plain = await noScript.newPage();
  for (const route of routes) {
    check((await plain.goto(base + route)).status() === 200, `${route} entry remains available`);
    check(await plain.locator("main h1").innerText() === "Private technical documentation", `${route} has no article content`);
    check(await plain.getByRole("link", { name: "Open private Wiki", exact: true }).getAttribute("href") === privateOrigin + route, `${route} points to its protected counterpart`);
    check(await plain.locator("article, figure, pre").count() === 0, `${route} exposes no technical documentation`);
  }
  await noScript.close();
  const context = await browser.newContext();
  await context.route(privateOrigin + "/**", (route) => route.fulfill({ status: 401, contentType: "text/html", body: "<h1>Private Wiki access gate</h1>" }));
  const page = await context.newPage();
  for (const width of [1440, 1280, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const theme of ["light", "dark"]) {
      await page.goto(base + "/insights/");
      await page.evaluate((value) => localStorage.setItem("theme", value), theme);
      await page.reload();
      await page.waitForFunction((value) => document.documentElement.classList.contains(value), theme);
      for (const path of ["/insights/", "/insights/start-here/", "/insights/archive/", "/research/", "/publications/", "/gaitai-care/"]) {
        check((await page.goto(base + path)).status() === 200, `Public page ${path}`);
        await page.locator("main h1").waitFor();
        await page.evaluate(() => document.fonts.ready);
        await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        let menu;
        if (width < 1040) {
          await page.getByRole("button", { name: "Open menu", exact: true }).click();
          const trigger = page.getByRole("dialog", { name: "Site navigation" }).getByRole("button", { name: "Blog", exact: true });
          if (await trigger.getAttribute("aria-expanded") !== "true") await trigger.click();
          menu = page.locator("#mnav-insights");
        } else {
          await page.mouse.move(10, 180);
          await page.locator("header").getByRole("link", { name: "Blog", exact: true }).hover();
          menu = page.locator('[data-nav-menu="/insights"]');
        }
        await menu.locator("a").last().waitFor();
        // Capture the settled drawer, not the partially transparent opening frame.
        if (width < 1040) {
          await page.waitForFunction(() => [...document.querySelectorAll(".mnav, .mnav__panel")].every((element) => Number(getComputedStyle(element).opacity) >= 0.999));
        }
        await menu.evaluate(async (element) => {
          await Promise.all(element.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => {})));
        });
        assert.deepEqual(await menu.locator("a").evaluateAll((links) => links.map((a) => ({ href: a.getAttribute("href").replace(/\/$/, ""), text: a.innerText.replace(/\s+/g, " ").trim() }))), expected);
        checks++;
        if (path === "/insights/archive/" && [1440,390].includes(width)) await page.screenshot({ path: `${directory}/${width}-${theme}-blog-menu.png`, animations: "disabled" });
        if (path === "/gaitai-care/") {
          await menu.getByRole("link", { name: /^Wiki / }).click();
          await page.waitForURL(privateOrigin + "/insights/wiki");
          check(await page.getByRole("heading", { name: "Private Wiki access gate" }).isVisible(), "Wiki item follows the private destination");
        }
      }
    }
  }
  const deep = "/insights/wiki/gaitai-care/android/build/?source=bookmark#build";
  await page.goto(base + deep);
  await page.waitForURL(privateOrigin + deep);
  check(page.url() === privateOrigin + deep, "Legacy deep links retain their path, query and heading");
  const result = { checks, legacyRoutes: routes.length, viewports: [1440,1280,768,390], themes: ["light","dark"] };
  fs.writeFileSync(`${directory}/results.json`, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
} finally { await browser.close(); await new Promise((resolve) => server.close(resolve)); }
