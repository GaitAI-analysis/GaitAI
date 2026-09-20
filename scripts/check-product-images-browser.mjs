import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { serve } from "./audit-server.mjs";

const { allProducts } = await import(pathToFileURL(path.resolve("src/data/products.ts")).href);
const require = createRequire(import.meta.url);
const { chromium } = require("../tmp/qa/node_modules/playwright");
const { server, base } = await serve();
const browser = await chromium.launch({ headless: true, executablePath: process.env.QA_CHROMIUM });
const directory = "tmp/product-image-audit/browser";
fs.mkdirSync(directory, { recursive: true });
const results = [];
const errors = [];

// THEME LEDGER. One row per product; every cell is asserted below and the
// table at the end is printed from these rows, so a pass is never implicit.
//   distinct   dark-hero.webp and light-hero.webp are different files (and so
//              is every rung of their srcset ladders) — a light theme cannot
//              show the dark photograph by way of a duplicated export.
//   dark/light img.currentSrc — what the browser is actually painting —
//              names the theme's own file, at every width checked.
//   toggle     dark → light → dark on one loaded page, without a reload,
//              moves currentSrc each time.
const ledger = new Map(allProducts.map((p) => [p.id, { product: p.short, distinct: null, dark: null, light: null, toggle: null, cardDark: null, cardLight: null }]));
const sha256 = (file) => createHash("sha256").update(fs.readFileSync(file)).digest("hex");
for (const product of allProducts.filter((p) => p.images)) {
  const row = ledger.get(product.id);
  const dark = sha256(path.join("public", product.images.heroDark));
  const light = sha256(path.join("public", product.images.heroLight));
  assert.notEqual(dark, light, `${product.short}: dark-hero.webp and light-hero.webp are the same file`);
  const darkRungs = new Set(product.images.assets.heroDark.variants.map((v) => v.sha256));
  for (const variant of product.images.assets.heroLight.variants) {
    assert.ok(!darkRungs.has(variant.sha256), `${product.short}: light rung ${variant.src} is a dark-hero derivative`);
    assert.ok(variant.src.includes("/light-hero"), `${product.short}: heroLight variant is not a light-hero file: ${variant.src}`);
  }
  for (const variant of product.images.assets.heroDark.variants) {
    assert.ok(variant.src.includes("/dark-hero"), `${product.short}: heroDark variant is not a dark-hero file: ${variant.src}`);
  }
  row.distinct = true;
}
const context = await browser.newContext({ colorScheme: "dark", reducedMotion: "reduce", deviceScaleFactor: 1 });
await context.addInitScript(() => {
  if (!localStorage.getItem("theme")) localStorage.setItem("theme", "dark");
});
await context.route(/https?:\/\/(?!127\.0\.0\.1)/, (route) => route.abort());
const page = await context.newPage();
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error" && /hydrat|next\/image|Extra attributes|did not match/i.test(message.text())) errors.push(message.text());
});
page.on("response", (response) => {
  if (response.url().includes("/images/products/") && response.status() >= 400) errors.push(`Broken image: ${response.url()}`);
});

async function theme(target) {
  for (let i = 0; i < 3; i++) {
    if (await page.locator("html").evaluate((html, t) => html.classList.contains(t), target)) return;
    await page.getByRole("button", { name: /^Theme:/ }).first().click();
  }
  await page.waitForFunction((t) => document.documentElement.classList.contains(t), target);
}

async function checkHero(product, mode) {
  const selector = "[data-product-hero-image] img";
  if (!product.images) {
    assert.equal(await page.locator(selector).count(), 0, `${product.short}: missing set must not use a substitute`);
    return;
  }
  await page.waitForFunction(({ selector, id, mode }) => {
    const img = document.querySelector(selector);
    return img?.complete && img.naturalWidth > 0 && img.currentSrc.includes(`/images/products/${id}/${mode}-hero`);
  }, { selector, id: product.id, mode });
  const state = await page.locator(selector).evaluate((img) => {
    const box = img.getBoundingClientRect();
    const style = getComputedStyle(img);
    const picture = img.closest("picture");
    const sources = Array.from(picture?.querySelectorAll("source") ?? []);
    return { src: img.currentSrc, width: box.width, height: box.height, naturalWidth: img.naturalWidth,
      objectFit: style.objectFit, objectPosition: style.objectPosition, loading: img.loading,
      priority: img.fetchPriority, overflow: document.documentElement.scrollWidth > innerWidth + 1,
      pictureTheme: picture?.dataset.theme ?? null,
      candidates: sources.flatMap((s) => (s.getAttribute("srcset") ?? "").split(",").map((c) => c.trim().split(/\s+/)[0]).filter(Boolean)),
      attributes: [img.getAttribute("src") ?? "", ...sources.map((s) => s.getAttribute("srcset") ?? "")].join(" ") };
  });
  // The key check. currentSrc is the file the browser chose and is painting:
  // it must be THIS theme's photograph, and nothing of the other theme may be
  // left in the <picture> for any engine to pick instead.
  const other = mode === "dark" ? "light" : "dark";
  assert.ok(state.src.includes(`/images/products/${product.id}/${mode}-hero`), `${product.short}: ${mode} theme paints ${state.src}`);
  assert.ok(!state.src.includes(`/${other}-hero`), `${product.short}: ${mode} theme paints the ${other} photograph`);
  assert.equal(state.pictureTheme, mode, `${product.short}: <picture data-theme> lags the ${mode} theme`);
  assert.ok(state.candidates.length > 0 && state.candidates.every((url) => url.includes(`/${mode}-hero`)), `${product.short}: ${mode} <source srcset> carries ${state.candidates.join(", ")}`);
  assert.ok(!state.attributes.includes(`${other}-hero`), `${product.short}: ${other}-hero still referenced in ${mode} theme markup`);
  ledger.get(product.id)[mode] = true;
  assert.equal(state.objectFit, "cover");
  assert.equal(state.loading, "eager");
  assert.equal(state.priority, "high");
  assert.ok(!state.overflow, `${product.short}: horizontal overflow`);
  assert.ok(state.width > 0 && state.height > 0);
  const expectedRatio = page.viewportSize().width < 1024 ? 16 / 9 : product.images.heroWide ? 4 / 3 : 4 / 5;
  assert.ok(Math.abs(state.width / state.height - expectedRatio) < 0.02, `${product.short}: hero frame ratio`);
  results.push({ product: product.short, theme: mode, viewport: page.viewportSize(), ...state });
}

try {
  const selectedIds = process.env.PRODUCT_IMAGE_QA_IDS?.split(",");
  const checkedProducts = selectedIds ? allProducts.filter((product) => selectedIds.includes(product.id)) : allProducts;
  const widths = selectedIds ? [1440, 375] : [1920, 1440, 1280, 768, 390, 375];
  for (const product of checkedProducts) {
    await page.setViewportSize({ width: 1440, height: 900 });
    const response = await page.goto(`${base}/${product.vertical}/${product.id}/`, { waitUntil: "networkidle" });
    assert.equal(response.status(), 200);
    assert.equal(await page.locator("h1").textContent(), product.name);
    // Live toggle on one loaded page, no reload: dark → light → dark. Each
    // step waits for currentSrc to name the new theme's file and asserts it.
    const toggled = [];
    for (const mode of ["dark", "light", "dark"]) {
      await theme(mode);
      await checkHero(product, mode);
      if (product.images) toggled.push(await page.locator("[data-product-hero-image] img").evaluate((img) => img.currentSrc));
    }
    if (product.images) {
      assert.ok(toggled[0].includes("/dark-hero") && toggled[1].includes("/light-hero") && toggled[2].includes("/dark-hero"), `${product.short}: live toggle sequence ${toggled.join(" → ")}`);
      assert.notEqual(toggled[0], toggled[1], `${product.short}: theme toggle did not change currentSrc`);
      ledger.get(product.id).toggle = true;
      // Also verify a persisted light theme on reload, before user interaction.
      await theme("light");
      await page.reload({ waitUntil: "networkidle" });
      await checkHero(product, "light");
      for (const width of widths) {
        await page.setViewportSize({ width, height: width === 1920 ? 1080 : 900 });
        for (const mode of ["dark", "light"]) {
          await theme(mode);
          await checkHero(product, mode);
          await page.locator("[data-product-hero-image]").screenshot({ path: `${directory}/${product.id}-${width}-${mode}.png`, animations: "disabled" });
          if ((width === 1440 && mode === "dark") || (width === 375 && mode === "light")) {
            await page.evaluate(() => window.scrollTo(0, 0));
            await page.screenshot({ path: `${directory}/${product.id}-${width}-${mode}-page.png`, animations: "disabled" });
          }
        }
      }
    }
    console.log(`Product route and theme toggle: ${product.short}${product.images ? ` (hero verified at ${widths.length} widths)` : " (source set missing)"}`);
  }

  for (const vertical of ["all", "mobilitycare", "securevision"]) {
    const route = vertical === "all" ? "products" : vertical;
    await page.goto(`${base}/${route}/`, { waitUntil: "networkidle" });
    const products = allProducts.filter((p) => vertical === "all" || p.vertical === vertical);
    const cards = page.locator("article").filter({ has: page.locator('a[aria-label^="View product:"]') });
    assert.equal(await cards.count(), products.length);
    // Cards are the theme's hero cropped to 4:3: light-hero in light, dark-hero
    // in dark, re-selected on a live toggle. Dark → light → dark on one load.
    for (const mode of ["dark", "light", "dark"]) {
      await theme(mode);
      const other = mode === "dark" ? "light" : "dark";
      for (const product of products) {
        const card = cards.filter({ has: page.getByRole("link", { name: `View product: ${product.name}`, exact: true }) });
        const image = card.locator("[data-product-card-image] img");
        assert.equal(await image.count(), product.images ? 1 : 0);
        if (!product.images) continue;
        await image.scrollIntoViewIfNeeded();
        await image.evaluate((img) => img.decode());
        await page.waitForFunction(({ id, mode, name }) => {
          const img = document.querySelector(`article:has(a[aria-label="View product: ${name}"]) [data-product-card-image] img`);
          return img?.complete && img.naturalWidth > 0 && img.currentSrc.includes(`/images/products/${id}/${mode}-hero`);
        }, { id: product.id, mode, name: product.name });
        const state = await image.evaluate((img) => ({ src: img.currentSrc, loading: img.loading, fit: getComputedStyle(img).objectFit,
          position: getComputedStyle(img).objectPosition, pictureTheme: img.closest("picture")?.dataset.theme ?? null,
          markup: [img.getAttribute("src") ?? "", ...Array.from(img.closest("picture")?.querySelectorAll("source") ?? []).map((s) => s.getAttribute("srcset") ?? "")].join(" "),
          ratio: img.getBoundingClientRect().width / img.getBoundingClientRect().height }));
        assert.ok(state.src.includes(`/images/products/${product.id}/${mode}-hero`), `${product.short} card in ${mode}: ${state.src}`);
        assert.ok(!state.markup.includes(`${other}-hero`) && !state.markup.includes("/card"), `${product.short} card in ${mode} still references ${other}-hero or card.webp`);
        assert.equal(state.pictureTheme, mode, `${product.short} card: <picture data-theme> lags ${mode}`);
        assert.equal(state.loading, "lazy");
        assert.equal(state.fit, "cover");
        assert.equal(state.position, product.images.heroPosition, `${product.short} card: object-position must anchor the reviewed subject`);
        assert.ok(Math.abs(state.ratio - 4 / 3) < 0.01);
        ledger.get(product.id)[mode === "dark" ? "cardDark" : "cardLight"] = true;
        if (vertical === "all") await card.locator("[data-product-card-image]").screenshot({ path: `${directory}/${product.id}-card-${mode}.png`, animations: "disabled" });
      }
    }
    // Reload while light: the persisted theme's card must be the first paint.
    await theme("light");
    await page.reload({ waitUntil: "networkidle" });
    for (const product of products.filter((p) => p.images)) {
      const image = cards.filter({ has: page.getByRole("link", { name: `View product: ${product.name}`, exact: true }) }).locator("[data-product-card-image] img");
      await image.scrollIntoViewIfNeeded();
      await page.waitForFunction(({ id, name }) => {
        const img = document.querySelector(`article:has(a[aria-label="View product: ${name}"]) [data-product-card-image] img`);
        return img?.complete && img.naturalWidth > 0 && img.currentSrc.includes(`/images/products/${id}/light-hero`);
      }, { id: product.id, name: product.name });
    }
    await theme("dark");
    console.log(`Catalogue: /${route}/ — ${products.length} product cards, ${products.filter((p) => p.images).length} theme-aware images (dark → light → dark, light reload).`);
    await cards.first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${directory}/${route}-catalogue.png`, animations: "disabled" });
  }

  // Exercise client navigation rather than only independent full page loads.
  await page.goto(`${base}/products/`, { waitUntil: "networkidle" });
  await theme("light");
  for (const product of checkedProducts.filter((p) => p.images)) {
    await page.getByRole("link", { name: `View product: ${product.name}`, exact: true }).click();
    await checkHero(product, "light");
    await page.goBack({ waitUntil: "networkidle" });
  }
  assert.deepEqual(errors, [], "Browser/image/hydration errors");

  const rows = [...ledger.values()].filter((row) => checkedProducts.some((p) => p.short === row.product));
  const mark = (v) => (v === true ? "\u2713" : v === null ? "\u2014" : "\u2717");
  const pad = (text, n) => String(text).padEnd(n);
  console.log(`\n${pad("Product", 18)}${pad("Dark hash != Light hash", 26)}${pad("Dark currentSrc", 18)}${pad("Light currentSrc", 18)}${pad("Live toggle", 14)}${pad("Card dark", 12)}Card light`);
  for (const row of rows) console.log(`${pad(row.product, 18)}${pad(mark(row.distinct), 26)}${pad(mark(row.dark), 18)}${pad(mark(row.light), 18)}${pad(mark(row.toggle), 14)}${pad(mark(row.cardDark), 12)}${mark(row.cardLight)}`);
  const count = (key) => rows.filter((row) => row[key] === true).length;
  const folders = allProducts.filter((p) => fs.existsSync(path.join("public/images/products", p.id, "dark-hero.webp")) && fs.existsSync(path.join("public/images/products", p.id, "light-hero.webp"))).length;
  console.log(`\nPhysical product folders: ${folders}/${allProducts.length}`);
  console.log(`Dark/light distinct: ${count("distinct")}/${rows.length}`);
  console.log(`Dark theme correct: ${count("dark")}/${rows.length}`);
  console.log(`Light theme correct: ${count("light")}/${rows.length}`);
  console.log(`Live theme toggles correct: ${count("toggle")}/${rows.length}`);
  console.log(`Catalogue cards dark correct: ${count("cardDark")}/${rows.length}`);
  console.log(`Catalogue cards light correct: ${count("cardLight")}/${rows.length}`);
  for (const key of ["distinct", "dark", "light", "toggle", "cardDark", "cardLight"]) {
    const expected = rows.filter((row) => allProducts.find((p) => p.short === row.product).images).length;
    assert.equal(count(key), expected, `${key}: ${count(key)}/${expected} products with a reviewed set passed`);
  }
  fs.writeFileSync(`${directory}/${selectedIds ? "focused-results" : "results"}.json`, JSON.stringify({ routes: checkedProducts.length, reviewedSets: allProducts.filter((p) => p.images).length, themeLedger: rows, results, errors }, null, 2));
  console.log(`PASS: ${checkedProducts.length} routes, three catalogues, client navigation, ${results.length} hero checks; no image or hydration errors. Source coverage remains ${allProducts.filter((p) => p.images).length}/24.`);
} finally {
  await browser.close();
  server.close();
}
