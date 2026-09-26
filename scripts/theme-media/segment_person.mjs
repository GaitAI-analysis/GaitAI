#!/usr/bin/env node
/**
 * GaitAI THEME MEDIA — per-frame person masks for a console film
 * =============================================================================
 * The two homepage console films show a photographic person walking through a
 * rendered scene. The light companion re-inks the scene (see make_light_lut.py)
 * but must NOT push the person through the colour transform — a negative of a
 * face is not a light theme. So the person is masked out and composited back
 * untouched by render_light.py.
 *
 * The mask comes from the same MediaPipe pose model the Movement Lab ships
 * (public/assets/models/pose_landmarker_lite.task) with segmentation masks on,
 * run in headless Chrome because the tasks-vision runtime is a browser build.
 *
 *   ffmpeg -i public/assets/videos/platform/securevision-intelligence.mp4 \
 *          tmp/theme-media/securevision-intelligence/frames/%04d.png
 *   node scripts/theme-media/segment_person.mjs \
 *          tmp/theme-media/securevision-intelligence/frames \
 *          tmp/theme-media/securevision-intelligence/masks
 *
 * Needs `puppeteer-core` resolvable (npm i -D puppeteer-core, or set
 * PUPPETEER_CORE to its directory) and Chrome (CHROME_PATH, default below).
 * One person per frame; a crowd is out of scope for this model — the
 * SecureVision hero is a dark island for exactly that reason.
 * =============================================================================
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..", "..");
const [, , FRAMES, OUT] = process.argv;
if (!FRAMES || !OUT) {
  console.error("usage: segment_person.mjs <frames-dir> <masks-dir>");
  process.exit(2);
}

let puppeteer;
try {
  puppeteer = require(process.env.PUPPETEER_CORE || "puppeteer-core");
} catch {
  console.error("puppeteer-core is not installed: npm i -D puppeteer-core (or set PUPPETEER_CORE to its directory)");
  process.exit(2);
}
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const WASM = path.join(ROOT, "node_modules/@mediapipe/tasks-vision/wasm");
const BUNDLE = path.join(ROOT, "node_modules/@mediapipe/tasks-vision/vision_bundle.mjs");
const MODEL = path.join(ROOT, "public/assets/models/pose_landmarker_lite.task");
fs.mkdirSync(OUT, { recursive: true });

const TYPES = { ".js": "text/javascript", ".mjs": "text/javascript", ".wasm": "application/wasm", ".task": "application/octet-stream", ".png": "image/png", ".html": "text/html" };

const PAGE = `<!doctype html><html><body><canvas id=c></canvas><script type="module">
import * as vision from "/vision.mjs";
window.ready = (async () => {
  const fileset = await vision.FilesetResolver.forVisionTasks("/wasm");
  window.lm = await vision.PoseLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: "/model.task", delegate: "GPU" },
    runningMode: "IMAGE", numPoses: 1, outputSegmentationMasks: true,
    minPoseDetectionConfidence: 0.3, minPosePresenceConfidence: 0.3,
  });
  return true;
})();
window.segment = async (url) => {
  const img = new Image(); img.src = url; await img.decode();
  const res = window.lm.detect(img);
  const w = img.naturalWidth, h = img.naturalHeight;
  const acc = new Float32Array(w * h);
  for (const m of res.segmentationMasks || []) {
    const a = m.getAsFloat32Array();
    for (let i = 0; i < acc.length; i++) if (a[i] > acc[i]) acc[i] = a[i];
    m.close();
  }
  const c = document.getElementById("c"); c.width = w; c.height = h;
  const ctx = c.getContext("2d"); const id = ctx.createImageData(w, h);
  for (let i = 0; i < acc.length; i++) { const v = Math.round(acc[i] * 255); id.data[i*4] = id.data[i*4+1] = id.data[i*4+2] = v; id.data[i*4+3] = 255; }
  ctx.putImageData(id, 0, 0);
  return { poses: res.landmarks.length, png: c.toDataURL("image/png") };
};
</script></body></html>`;

// wasm cannot be fetched from file://, so serve the runtime, the model and the frames.
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split("?")[0]);
  let file;
  if (u === "/") { res.setHeader("content-type", "text/html"); return res.end(PAGE); }
  if (u.startsWith("/wasm/")) file = path.join(WASM, u.slice(6));
  else if (u === "/vision.mjs") file = BUNDLE;
  else if (u === "/model.task") file = MODEL;
  else if (u.startsWith("/frames/")) file = path.join(FRAMES, u.slice(8));
  if (!file || !fs.existsSync(file)) { res.statusCode = 404; return res.end("not found"); }
  res.setHeader("content-type", TYPES[path.extname(file)] || "application/octet-stream");
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--no-sandbox"],
});
const page = await browser.newPage();
page.on("pageerror", (e) => console.error("[page]", e.message));
await page.goto(`http://127.0.0.1:${server.address().port}/`);
await page.evaluate(() => window.ready);

const frames = fs.readdirSync(FRAMES).filter((f) => f.endsWith(".png")).sort();
const t0 = Date.now();
let missing = 0;
for (const [i, f] of frames.entries()) {
  const r = await page.evaluate((u) => window.segment(u), `/frames/${f}`);
  if (r.poses === 0) missing++;
  fs.writeFileSync(path.join(OUT, f), Buffer.from(r.png.split(",")[1], "base64"));
  if (i % 24 === 0) console.log(`${f}  poses=${r.poses}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
await browser.close();
server.close();
console.log(`done: ${frames.length} masks, ${missing} frames without a person`);
if (missing) process.exitCode = 1;
