// node kin.mjs "<query>" out.json  -> kinematics of the cycle
import puppeteer from "puppeteer-core";
import fs from "node:fs";
import { serve } from "./serve.mjs";
const [query, out] = process.argv.slice(2);
const server = await serve();
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("pageerror:", e.message));
await page.setViewport({ width: 300, height: 500 });
await page.goto(`http://127.0.0.1:${server.address().port}/render.html?${query}&w=300&h=500`);
await page.waitForFunction("window.ready", { timeout: 60000 });
const k = await page.evaluate(() => { const s = window.solve(240); return { solve: s, rows: window.kin(72), foot: window.__footRest }; });
fs.writeFileSync(out, JSON.stringify(k));
await browser.close(); server.close();
