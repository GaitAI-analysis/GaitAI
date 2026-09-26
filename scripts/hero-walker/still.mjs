// node still.mjs <out.png> "<query>" <t-fraction>   -> one frame of the cycle
import puppeteer from "puppeteer-core";
import fs from "node:fs";
import { serve } from "./serve.mjs";
const [out, query, frac = "0"] = process.argv.slice(2);
const q = new URLSearchParams(query); const W = +(q.get("w") || 560), H = +(q.get("h") || 1160);
const server = await serve();
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage();
page.on("console", (m) => console.log("page:", m.text())); page.on("pageerror", (e) => console.log("pageerror:", e.message));
await page.setViewport({ width: W, height: H });
await page.goto(`http://127.0.0.1:${server.address().port}/render.html?${query}`);
await page.waitForFunction("window.ready", { timeout: 60000 });
const fr = frac.split(",");
for (let k = 0; k < fr.length; k++) {
  const r = await page.evaluate((f) => { const s = window.solve(120); return window.frame(f * s.T); }, +fr[k]);
  fs.writeFileSync(fr.length > 1 ? out.replace(".png", `-${k}.png`) : out, Buffer.from(r.png.split(",")[1], "base64"));
}
await browser.close(); server.close();
