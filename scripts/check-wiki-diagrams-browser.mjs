/**
 * Browser check for the Wiki's technical diagrams.
 *
 * Renders every page that embeds a figure at desktop, laptop, tablet and phone
 * widths in both themes, screenshots each figure, and measures the REAL text
 * geometry in Chromium: every <text> must stay inside its box and inside the
 * drawing, no two labels may overlap, pages must not scroll sideways, and the
 * enlarge, SVG and PNG tools must work. Set WIKI_TEST_BASE to check a live
 * origin (used for the before/after comparison); otherwise the static export
 * in ./out is served locally.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "../tmp/qa/node_modules/playwright");
const live = process.env.WIKI_TEST_BASE;
const directory = process.env.WIKI_DIAGRAM_OUT || (live ? "tmp/wiki-diagrams/before" : "tmp/wiki-diagrams/after");
fs.mkdirSync(directory, { recursive: true });

const guides = JSON.parse(fs.readFileSync("src/data/wiki-pages.json", "utf8"));
const pages = guides.filter((p) => /```diagram/.test(fs.readFileSync(`content/wiki/gaitai-care/${p.slug}.md`, "utf8"))).map((p) => `/insights/wiki/gaitai-care/${p.slug}/`);
process.env.GAITAI_AUDIT_OUT = "out";
const { serve } = await import("./audit-server.mjs");
const { server, base } = live ? { server: { close() {} }, base: live.replace(/\/$/, "") } : await serve();
const browser = await chromium.launch({ headless: true, executablePath: process.env.QA_CHROMIUM });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true, deviceScaleFactor: 2 });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(`${page.url()}: ${e.message}`));
let checks = 0, figures = 0, texts = 0, shots = 0;
const problems = [];
const check = (value, message) => { if (!value) problems.push(message); checks++; };
const seen = new Set();

try {
  for (const width of [1440, 1280, 768, 390]) {
    await page.setViewportSize({ width, height: width < 800 ? 900 : 1000 });
    for (const theme of ["light", "dark"]) {
      await page.goto(base + "/insights/wiki/");
      await page.evaluate((value) => localStorage.setItem("theme", value), theme);
      for (const route of pages) {
        await page.goto(base + route, { waitUntil: "load" });
        await page.locator("main h1").waitFor();
        await page.waitForFunction((target) => document.documentElement.classList.contains(target), theme);
        await page.evaluate(() => document.fonts.ready);
        const result = await page.evaluate((slug) => {
          const out = { figures: [], overflow: document.documentElement.scrollWidth > innerWidth + 1 };
          for (const [i, figure] of [...document.querySelectorAll("main figure")].entries()) {
            const svg = figure.querySelector("svg");
            const name = svg?.getAttribute("data-diagram") || `${slug}-figure-${i + 1}`;
            const entry = { name, texts: 0, outside: [], overlaps: [], escaped: [], hasTitle: Boolean(svg?.querySelector("title")), hasDesc: Boolean(svg?.querySelector("desc")), caption: Boolean(figure.querySelector("figcaption")?.textContent?.trim()), width: svg?.getBoundingClientRect().width ?? 0, scrollable: false };
            if (!svg) { out.figures.push(entry); continue; }
            const region = figure.querySelector('[data-frame-svg]');
            if (region) entry.scrollable = region.scrollWidth > region.clientWidth + 1;
            const [, , vw, vh] = (svg.getAttribute("viewBox") || "0 0 0 0").split(/\s+/).map(Number);
            const boxes = [];
            for (const text of svg.querySelectorAll("text")) {
              const b = text.getBBox();
              if (!text.textContent.trim()) continue;
              entry.texts++;
              const label = text.textContent.trim().slice(0, 40);
              if (b.x < -0.5 || b.y < -0.5 || b.x + b.width > vw + 0.5 || b.y + b.height > vh + 0.5) entry.escaped.push(label);
              const owner = text.closest("[data-node],[data-entity],[data-participant]");
              if (owner) {
                const shape = owner.matches("[data-participant]") ? owner.querySelector("rect") : owner.querySelector("rect,path,circle");
                if (!shape) continue;
                const s = shape.getBBox();
                const isActor = owner.className.baseVal.includes("actor");
                if (!isActor && (b.x < s.x - 1 || b.x + b.width > s.x + s.width + 1 || b.y < s.y - 1 || b.y + b.height > s.y + s.height + 1)) entry.outside.push(`${label} (${Math.round(b.x + b.width - s.x - s.width)}px)`);
              }
              const halo = text.parentElement?.querySelector("rect");
              if (text.parentElement?.className.baseVal.includes("edgeLabel") && halo) {
                const h = halo.getBBox();
                if (b.width > h.width - 2) entry.outside.push(`label ${label} wider than its halo`);
              }
              boxes.push({ label, b: { x: b.x + 1, y: b.y + 2, w: b.width - 2, h: b.height - 4 }, group: owner });
            }
            for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
              const a = boxes[i], c = boxes[j];
              if (a.b.x < c.b.x + c.b.w && c.b.x < a.b.x + a.b.w && a.b.y < c.b.y + c.b.h && c.b.y < a.b.y + a.b.h) entry.overlaps.push(`"${a.label}" × "${c.label}"`);
            }
            out.figures.push(entry);
          }
          return out;
        }, route.split("/").filter(Boolean).slice(3).join("-") || "product");
        check(!result.overflow, `${width}/${theme}${route}: page scrolls sideways`);
        for (const [index, figure] of result.figures.entries()) {
          figures++; texts += figure.texts;
          const key = `${figure.name}-${width}-${theme}`;
          check(figure.hasTitle && figure.hasDesc, `${key}: svg title/desc`);
          check(figure.caption, `${key}: caption under the figure`);
          check(!figure.escaped.length, `${key}: text outside the drawing: ${figure.escaped.join(", ")}`);
          check(!figure.outside.length, `${key}: text outside its box: ${figure.outside.join("; ")}`);
          check(!figure.overlaps.length, `${key}: overlapping labels: ${figure.overlaps.slice(0, 6).join(", ")}`);
          if (width === 390) check(figure.scrollable || figure.width <= 390, `${key}: phone figure neither fits nor scrolls`);
          if (!seen.has(key) && [1440, 390].includes(width)) {
            seen.add(key);
            const element = page.locator("main figure").nth(index);
            await element.scrollIntoViewIfNeeded();
            await element.screenshot({ path: path.join(directory, `${key}.png`) });
            shots++;
          }
        }
      }
    }
  }

  // Tools: enlarge, zoom, SVG and PNG downloads on a desktop page.
  if (!live) {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(base + "/insights/wiki/gaitai-care/backend/data-model/", { waitUntil: "load" });
    const figure = page.locator("main figure").first();
    await figure.getByRole("button", { name: "Enlarge" }).click();
    const dialog = page.locator("dialog[open]");
    await dialog.waitFor();
    check(await dialog.locator("svg").count() === 1, "Enlarge shows one copy of the drawing");
    check(await dialog.locator("svg [id]").evaluateAll((els) => els.every((e) => e.id.endsWith("-zoom"))), "Enlarged copy uses suffixed ids");
    check(!(await page.evaluate(() => { const ids = [...document.querySelectorAll("[id]")].map((e) => e.id); return ids.some((id, i) => ids.indexOf(id) !== i); })), "No duplicate ids while enlarged");
    await dialog.getByRole("button", { name: "Zoom in" }).click();
    check((await dialog.locator("svg").evaluate((svg) => svg.getBoundingClientRect().width)) > 1200, "Zoom in widens the drawing");
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    for (const [label, type] of [["SVG", "svg"], ["PNG", "png"]]) {
      const [download] = await Promise.all([page.waitForEvent("download", { timeout: 30000 }), figure.getByRole("button", { name: label, exact: true }).click()]);
      const file = path.join(directory, download.suggestedFilename());
      await download.saveAs(file);
      const size = fs.statSync(file).size;
      check(download.suggestedFilename().endsWith(`.${type}`) && size > 5000, `${label} download has content (${size} bytes)`);
      if (type === "svg") { const text = fs.readFileSync(file, "utf8"); check(text.includes("<svg") && !text.includes("var(--"), "Exported SVG is standalone (no CSS variables)"); }
      else check(fs.readFileSync(file).subarray(1, 4).toString() === "PNG", "Exported PNG has a PNG signature");
    }
    const staticContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 900 } });
    const staticPage = await staticContext.newPage();
    for (const route of pages.slice(0, 4)) {
      await staticPage.goto(base + route);
      check((await staticPage.locator('main figure svg[role="img"]').count()) > 0, `No-JavaScript figure: ${route}`);
    }
    await staticContext.close();
  }
  check(errors.length === 0, `Browser errors: ${errors.join("\n")}`);
  const summary = { origin: base, pages: pages.length, figures, texts, checks, screenshots: shots, problems, status: problems.length ? "failed" : "passed" };
  fs.writeFileSync(path.join(directory, "results.json"), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
  assert.equal(problems.length, 0, `${problems.length} diagram problem(s)`);
} finally { await browser.close(); server.close(); }
