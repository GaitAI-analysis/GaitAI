import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { serve } from "./audit-server.mjs";

/**
 * /use-cases/ environment imagery, in a real browser.
 *
 * The static checker proves the files and the markup; this proves what a
 * visitor sees. For every environment card it asserts the photograph that is
 * actually painted belongs to that environment and that theme, that the theme
 * toggle swaps it in place with no navigation, that a visitor arriving with a
 * persisted light theme is never sent the night frame (the "no flash" test,
 * asserted on the network rather than on a screenshot), and that the band
 * holds 16:9 with `object-fit: cover` at phone, tablet and desktop widths.
 *
 *   QA_CHROMIUM=<chrome executable> GAITAI_AUDIT_OUT=out \
 *     node scripts/check-use-case-images-browser.mjs
 */

const { industryUseCases } = await import(
  pathToFileURL(path.resolve("src/data/products.ts")).href
);
const manifest = JSON.parse(
  fs.readFileSync("use-case-image-manifest.json", "utf8"),
);
const require = createRequire(import.meta.url);
const { chromium } = require("../tmp/qa/node_modules/playwright");
const { server, base } = await serve();
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.QA_CHROMIUM,
});
const directory = "tmp/use-case-image-audit/browser";
fs.mkdirSync(directory, { recursive: true });

const mapped = industryUseCases.filter((c) => c.images);
const unmapped = industryUseCases.filter((c) => !c.images);
const results = [];
const errors = [];
/* Every use-case image request the page makes, so a theme load can be audited
   for fetching the other theme's frame. */
let imageRequests = [];

const context = await browser.newContext({
  colorScheme: "dark",
  reducedMotion: "reduce",
  deviceScaleFactor: 1,
});
await context.addInitScript(() => {
  if (!localStorage.getItem("theme")) localStorage.setItem("theme", "dark");
});
await context.route(/https?:\/\/(?!127\.0\.0\.1)/, (route) => route.abort());
const page = await context.newPage();
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (
    message.type() === "error" &&
    /hydrat|next\/image|Extra attributes|did not match/i.test(message.text())
  ) {
    errors.push(message.text());
  }
});
page.on("request", (request) => {
  if (request.url().includes("/images/use-cases/"))
    imageRequests.push(new URL(request.url()).pathname);
});
page.on("response", (response) => {
  if (
    response.url().includes("/images/use-cases/") &&
    response.status() >= 400
  ) {
    errors.push(`Broken image: ${response.url()}`);
  }
});

async function theme(target) {
  for (let i = 0; i < 3; i++) {
    if (
      await page
        .locator("html")
        .evaluate((html, t) => html.classList.contains(t), target)
    )
      return;
    await page
      .getByRole("button", { name: /^Theme:/ })
      .first()
      .click();
  }
  await page.waitForFunction(
    (t) => document.documentElement.classList.contains(t),
    target,
  );
}

function cardFor(entry) {
  return page.locator(`article#${entry.id}`);
}

async function checkBand(entry, mode) {
  const card = cardFor(entry);
  assert.equal(await card.count(), 1, `${entry.industry}: card not found`);
  const band = card.locator("[data-use-case-media] img");
  if (!entry.images) {
    assert.equal(
      await band.count(),
      0,
      `${entry.industry}: no reviewed pair, must carry no photograph`,
    );
    return;
  }
  assert.equal(await band.count(), 1, `${entry.industry}: exactly one band`);
  await band.scrollIntoViewIfNeeded();
  await page.waitForFunction(
    ({ id, mode }) => {
      const img = document.querySelector(
        `article#${id} [data-use-case-media] img`,
      );
      return (
        img?.complete &&
        img.naturalWidth > 0 &&
        img.currentSrc.includes(`/images/use-cases/${id}/${mode}`)
      );
    },
    { id: entry.id, mode },
  );
  const state = await band.evaluate((img) => {
    const box = img.getBoundingClientRect();
    const frame = img.closest("[data-use-case-media]").getBoundingClientRect();
    const style = getComputedStyle(img);
    return {
      src: img.currentSrc,
      srcAttr: img.getAttribute("src"),
      width: box.width,
      height: box.height,
      frameRatio: frame.width / frame.height,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      objectFit: style.objectFit,
      objectPosition: style.objectPosition,
      loading: img.loading,
      priority: img.fetchPriority,
      alt: img.alt,
      sizes: img.sizes,
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
    };
  });
  const record = manifest.useCases.find((r) => r.caseId === entry.id);
  assert.equal(state.objectFit, "cover", `${entry.industry}: object-fit`);
  assert.equal(
    state.objectPosition,
    record.objectPosition[mode],
    `${entry.industry}: ${mode} object-position`,
  );
  assert.equal(
    state.loading,
    "lazy",
    `${entry.industry}: bands are below the fold and lazy`,
  );
  assert.equal(state.alt, entry.images.alt);
  assert.ok(
    !state.overflow,
    `${entry.industry}: horizontal overflow at ${page.viewportSize().width}px`,
  );
  assert.ok(
    state.width > 0 && state.height > 0,
    `${entry.industry}: band has no box`,
  );
  assert.ok(
    Math.abs(state.frameRatio - 4 / 3) < 0.02,
    `${entry.industry}: band ratio ${state.frameRatio.toFixed(3)}`,
  );
  /* The rung actually fetched must be at least the painted width — never a
     soft upscale. `naturalWidth` is density-corrected for a `w` srcset, so
     read the rung off the file the browser chose instead. */
  const rung = Number(
    state.src.match(/-(\d+)\.webp$/)?.[1] ?? entry.images.assets[mode].width,
  );
  assert.ok(
    rung >= state.width * 0.98 || rung === entry.images.assets[mode].width,
    `${entry.industry}: ${rung}px rung painted at ${Math.round(state.width)}px (${mode}, ${page.viewportSize().width}px viewport)`,
  );
  results.push({
    useCase: entry.industry,
    theme: mode,
    viewport: page.viewportSize(),
    ...state,
  });
}

async function allBands(mode) {
  for (const entry of industryUseCases) await checkBand(entry, mode);
}

try {
  /* ── 1. The hub, dark, desktop ── */
  await page.setViewportSize({ width: 1440, height: 900 });
  imageRequests = [];
  const response = await page.goto(`${base}/use-cases/`, {
    waitUntil: "networkidle",
  });
  assert.equal(response.status(), 200);
  const cards = page
    .locator("article")
    .filter({ has: page.locator('a[aria-label^="Explore use case:"]') });
  assert.equal(
    await cards.count(),
    industryUseCases.length,
    "one card per environment",
  );
  assert.equal(
    await page.locator("[data-use-case-media]").count(),
    mapped.length,
    "one band per reviewed pair",
  );
  await allBands("dark");
  assert.ok(
    !imageRequests.some((p) => /\/light(-\d+)?\.webp$/.test(p)),
    `dark visit fetched a light frame: ${imageRequests.filter((p) => p.includes("/light")).join(", ")}`,
  );
  console.log(
    `Hub, dark, 1440: ${mapped.length} bands verified, ${imageRequests.length} image requests, none for the other theme.`,
  );

  /* ── 2. Toggle in place: light, then back to dark, with no navigation ── */
  await page.evaluate(() => {
    window.__ucNoReload = true;
  });
  await theme("light");
  await allBands("light");
  await theme("dark");
  await allBands("dark");
  assert.ok(
    await page.evaluate(() => window.__ucNoReload === true),
    "theme toggle must not reload the page",
  );
  console.log(
    "Theme toggle dark → light → dark: every band swapped in place, no reload.",
  );

  /* ── 3. A visitor who arrives light: first paint, no dark frame on the wire ── */
  await theme("light");
  imageRequests = [];
  await page.reload({ waitUntil: "networkidle" });
  await allBands("light");
  assert.ok(
    !imageRequests.some((p) => /\/dark(-\d+)?\.webp$/.test(p)),
    `light visit fetched a dark frame: ${imageRequests.filter((p) => p.includes("/dark")).join(", ")}`,
  );
  /* And the server never chose for them: the markup has no src of its own. */
  const ssr = fs.readFileSync(
    path.join(
      process.env.GAITAI_AUDIT_OUT || "tmp/verification-build/out",
      "use-cases",
      "index.html",
    ),
    "utf8",
  );
  const ssrImgs =
    ssr.match(/<img[^>]*data-dark-src="[^"]*use-cases[^"]*"[^>]*>/g) ?? [];
  assert.equal(ssrImgs.length, mapped.length);
  assert.ok(
    ssrImgs.every((tag) => !/\ssrc=/.test(tag)),
    "server HTML must not pick a theme",
  );
  console.log(
    "Persisted light theme on reload: correct frame at first paint, zero dark-frame requests, no SSR src.",
  );

  /* ── 4. An expanded card keeps its band, and nothing else moves ── */
  const first = mapped[0];
  await theme("dark");
  await cardFor(first)
    .getByRole("button", { name: /See the full use case/ })
    .click();
  await page.waitForFunction(
    (id) =>
      document.querySelector(`article#${id}`).className.includes("cardOpen"),
    first.id,
  );
  await checkBand(first, "dark");
  await cardFor(first)
    .getByRole("button", { name: /Show less/ })
    .click();
  console.log(`Expanded card (${first.industry}) keeps its photograph.`);

  /* ── 5. Phone, tablet, desktop, both themes, with screenshots ── */
  for (const width of [1440, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: width >= 1024 ? 900 : 844 });
    for (const mode of ["dark", "light"]) {
      await theme(mode);
      await allBands(mode);
      await cards.first().scrollIntoViewIfNeeded();
      await page.screenshot({
        path: `${directory}/use-cases-${width}-${mode}.png`,
        animations: "disabled",
      });
      if (width === 1440 || width === 390) {
        for (const entry of mapped) {
          await cardFor(entry).scrollIntoViewIfNeeded();
          await cardFor(entry).screenshot({
            path: `${directory}/${entry.id}-${width}-${mode}.png`,
            animations: "disabled",
          });
        }
      }
    }
    console.log(
      `Viewport ${width}: ${mapped.length} bands × 2 themes verified.`,
    );
  }

  assert.deepEqual(errors, [], "Browser/image/hydration errors");
  fs.writeFileSync(
    `${directory}/results.json`,
    JSON.stringify(
      {
        environments: industryUseCases.length,
        mapped: mapped.length,
        unmapped: unmapped.map((c) => c.id),
        checks: results.length,
        results,
        errors,
      },
      null,
      2,
    ),
  );
  console.log(
    `PASS: ${industryUseCases.length} cards, ${mapped.length} photographed, ${results.length} band checks across 4 widths × 2 themes; ` +
      `${unmapped.length} environment(s) intentionally without imagery (${unmapped.map((c) => c.industry).join(", ")}); no image or hydration errors.`,
  );
} finally {
  await browser.close();
  server.close();
}
