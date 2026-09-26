// node run-render.mjs <outDir> "<query string>" <mode: solve|travel|cycle> [frames] [speed]
import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";
import { serve } from "./serve.mjs";

const [outDir, query = "", mode = "solve", nFrames = "36", speedArg = "1"] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const q = new URLSearchParams(query);
const W = +(q.get("w") || 560), H = +(q.get("h") || 1160);
const server = await serve();
const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage();
page.on("console", (m) => console.log("page:", m.text()));
page.on("pageerror", (e) => console.log("pageerror:", e.message));
await page.setViewport({ width: W, height: H });
await page.goto(`http://127.0.0.1:${server.address().port}/render.html?${query}`);
await page.waitForFunction("window.ready", { timeout: 60000 });
const s = await page.evaluate(() => window.solve(480));
const ppm = await page.evaluate(() => window.pxPerMetre());
console.log(JSON.stringify({ ...s, stances: undefined, ppm }));
console.log("yaw", JSON.stringify(await page.evaluate(() => window.yaw())));
const meta = { ...s, ppm, W, H, query, frames: [] };
if (mode !== "solve") {
  const n = +nFrames;
  const speed = +speedArg;
  for (let i = 0; i < n; i++) {
    // cycle: n frames exactly spanning one clip period; travel: n frames at 30fps * speed
    const t = mode === "cycle" ? (i / n) * s.T : (i / 30) * speed;
    const r = await page.evaluate((t, tr) => window.frame(t, tr), t, mode === "travel");
    fs.writeFileSync(path.join(outDir, `f${String(i).padStart(4, "0")}.png`), Buffer.from(r.png.split(",")[1], "base64"));
    meta.frames.push({ t, J: r.J, K: r.K, rootX: r.rootX, root: r.root, floorY: r.floorY });
  }
}
fs.writeFileSync(path.join(outDir, "meta.json"), JSON.stringify(meta));
await browser.close();
server.close();
