// Rasterise every SVG master in ./svg to a 512x512 transparent PNG in ./png
// with Chromium (the site's own renderer for these gradients and filters).
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const REPO = process.cwd();
// Usage: QA_CHROMIUM=<browser> node scripts/icons/rasterize_icons.mjs [dir]   (dir holds svg/, gets png/; default tmp/icons)
const HERE = path.resolve(process.argv[2] || "tmp/icons");
const { chromium } = createRequire(path.join(REPO, "package.json"))(path.join(REPO, "tmp/qa/node_modules/playwright"));
const SVG = path.join(HERE, "svg"), PNG = path.join(HERE, "png");
fs.mkdirSync(PNG, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.QA_CHROMIUM || undefined });
const page = await browser.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 1 });
for (const f of fs.readdirSync(SVG).filter((n) => n.endsWith(".svg")).sort()) {
  const svg = fs.readFileSync(path.join(SVG, f), "utf8");
  await page.setContent(`<!doctype html><html><body style="margin:0;background:transparent">${svg}</body></html>`);
  await page.waitForTimeout(60);
  await page.screenshot({ path: path.join(PNG, f.replace(".svg", ".png")), omitBackground: true, clip: { x: 0, y: 0, width: 512, height: 512 } });
  console.log("rasterised", f);
}
await browser.close();
