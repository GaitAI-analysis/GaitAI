/**
 * RENDER THE MOVEMENT INTELLIGENCE LAB'S DEMO CLIP.
 *
 * `walker.html` beside this file draws a side-view walker whose gait is
 * kinematically consistent — the planted foot is anchored to the floor and the
 * leg is solved by inverse kinematics from that contact, so nothing slides.
 * This script drives it in headless Chrome, checks the gait numerically
 * (planted-foot slip, floor contact, knee range, heel-strike times), writes
 * one PNG per frame, and the two ffmpeg commands below turn those into the
 * clip and its poster that live in `public/assets/videos/samples/`.
 *
 * It is a one-off asset tool, not part of the build, and it needs two things
 * the repository does not install: `puppeteer-core` (npm i puppeteer-core@22
 * in a scratch folder and run from there, or set NODE_PATH) and a local
 * Chrome at the path below. ffmpeg is needed for the encode.
 *
 *   node render.mjs frames 30
 *   ffmpeg -framerate 30 -i frames/%04d.png -c:v libx264 -pix_fmt yuv420p  *     -crf 20 -preset slow -profile:v high -level 4.0 -movflags +faststart  *     mobility-walk-demo.mp4
 *   ffmpeg -i frames/0099.png -q:v 3 mobility-walk-demo-poster.jpg
 *
 * Detection is measured, not assumed: BlazePose lite found the body in 52 of
 * 53 sampled instants of the shipped clip at figure scale S = 1.08. At
 * S = 0.78 it found none, so do not shrink the figure to lengthen the walk.
 */
import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";

const out = process.argv[2] || "frames";
const fps = Number(process.argv[3] || 30);
const diagOnly = process.argv[4] === "diag";
fs.mkdirSync(out, { recursive: true });
const html = "file:///" + path.resolve("walker.html").replace(/\\/g, "/");

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--allow-file-access-from-files"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
await page.goto(html, { waitUntil: "load" });
const cfg = await page.evaluate(() => { const w = window.__walker; return { DURATION: w.DURATION, T: w.T, V: w.V, STEP: w.STEP, FLOOR: w.FLOOR, LEAD: w.LEAD }; });
const frames = Math.ceil(cfg.DURATION * fps);
console.log("config", JSON.stringify(cfg), "frames", frames);

// ── diagnostics over the whole clip: planted-foot slip, knee ranges, floor contact, reach
const d = await page.evaluate((fps, frames) => {
  const w = window.__walker;
  const rows = [];
  for (let i = 0; i < frames; i++) rows.push({ t: i / fps, ...w.diag(i / fps) });
  const slip = { near: 0, far: 0 }, floorErr = { near: 0, far: 0 }; let over = 0;
  const knee = { near: [1e9, -1e9], far: [1e9, -1e9] };
  const swingKneePeak = { near: 0, far: 0 };
  let prev = null;
  for (const r of rows) {
    for (const s of ["near", "far"]) {
      const L = r[s];
      knee[s][0] = Math.min(knee[s][0], L.knee); knee[s][1] = Math.max(knee[s][1], L.knee);
      if (!L.planted) swingKneePeak[s] = Math.max(swingKneePeak[s], L.knee);
      over = Math.max(over, L.over);
      if (L.planted) {
        // the contact point must sit on the floor and not move between frames
        const contact = L.heel[1] >= L.toe[1] ? L.heel : L.toe;
        floorErr[s] = Math.max(floorErr[s], Math.abs(contact[1] - w.FLOOR));
        if (prev && prev[s].planted) {
          const pc = prev[s].heel[1] >= prev[s].toe[1] ? prev[s].heel : prev[s].toe;
          // same contact type → its x must not move
          const sameType = (L.heel[1] >= L.toe[1]) === (prev[s].heel[1] >= prev[s].toe[1]);
          if (sameType) slip[s] = Math.max(slip[s], Math.abs(contact[0] - pc[0]));
        }
      }
    }
    prev = r;
  }
  // gait events for the near leg: heel strikes = phase wraps
  const strikes = [];
  for (let i = 1; i < rows.length; i++) if (rows[i].near.phase < rows[i - 1].near.phase) strikes.push(+rows[i].t.toFixed(2));
  const visible = rows.filter((r) => r.hip[0] > 0 && r.hip[0] < w.W).map((r) => r.t);
  return { slip, floorErr, over, knee, swingKneePeak, strikes, visibleFrom: visible[0], visibleTo: visible[visible.length - 1], hipStart: rows[0].hip, hipEnd: rows[rows.length - 1].hip };
}, fps, frames);
console.log("DIAG", JSON.stringify(d, null, 1));

if (!diagOnly) {
  for (let i = 0; i < frames; i++) {
    const dataUrl = await page.evaluate((t) => { window.__walker.draw(t); return document.getElementById("c").toDataURL("image/png"); }, i / fps);
    fs.writeFileSync(path.join(out, String(i).padStart(4, "0") + ".png"), Buffer.from(dataUrl.split(",")[1], "base64"));
  }
  console.log("wrote", frames, "frames to", out);
}
await browser.close();
