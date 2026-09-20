import assert from "node:assert/strict";
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
    return { src: img.currentSrc, width: box.width, height: box.height, naturalWidth: img.naturalWidth,
      objectFit: style.objectFit, objectPosition: style.objectPosition, loading: img.loading,
      priority: img.fetchPriority, overflow: document.documentElement.scrollWidth > innerWidth + 1 };
  });
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
    for (const mode of ["dark", "light", "dark"]) {
      await theme(mode);
      await checkHero(product, mode);
    }
    if (product.images) {
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
    for (const product of products) {
      const card = cards.filter({ has: page.getByRole("link", { name: `View product: ${product.name}`, exact: true }) });
      const image = card.locator("[data-product-card-image] img");
      assert.equal(await image.count(), product.images ? 1 : 0);
      if (!product.images) continue;
      await image.scrollIntoViewIfNeeded();
      await image.evaluate((img) => img.decode());
      const state = await image.evaluate((img) => ({ src: img.currentSrc, loading: img.loading, fit: getComputedStyle(img).objectFit,
        ratio: img.getBoundingClientRect().width / img.getBoundingClientRect().height }));
      assert.ok(state.src.includes(`/images/products/${product.id}/card`));
      assert.equal(state.loading, "lazy");
      assert.equal(state.fit, "cover");
      assert.ok(Math.abs(state.ratio - 4 / 3) < 0.01);
      if (vertical === "all") await card.locator("[data-product-card-image]").screenshot({ path: `${directory}/${product.id}-card.png`, animations: "disabled" });
    }
    console.log(`Catalogue: /${route}/ — ${products.length} product cards, ${products.filter((p) => p.images).length} reviewed images.`);
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
  fs.writeFileSync(`${directory}/${selectedIds ? "focused-results" : "results"}.json`, JSON.stringify({ routes: checkedProducts.length, reviewedSets: allProducts.filter((p) => p.images).length, results, errors }, null, 2));
  console.log(`PASS: ${checkedProducts.length} routes, three catalogues, client navigation, ${results.length} hero checks; no image or hydration errors. Source coverage remains ${allProducts.filter((p) => p.images).length}/24.`);
} finally {
  await browser.close();
  server.close();
}
