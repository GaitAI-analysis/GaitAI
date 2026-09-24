// Run the site's own MediaPipe pose landmarker over the cut-out hero figure,
// so the rig's joints sit where the product's engine says they are rather than
// where I guessed. Serves the wasm, the .task model and the image over http
// (module + wasm loading does not work from file://) and drives it in Chromium.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { createRequire } from "node:module";

const REPO = "C:/Users/Anubha/Documents/website/GaitAI-main/GaitAI";
const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const PKG = path.join(REPO, "node_modules/@mediapipe/tasks-vision");

const IMAGE = process.argv[2] || "pose_input.png";

const files = {
  "/vision_bundle.mjs": path.join(PKG, "vision_bundle.mjs"),
  "/model.task": path.join(REPO, "public/assets/models/pose_landmarker_lite.task"),
  "/input.png": path.join(HERE, IMAGE),
};
for (const f of fs.readdirSync(path.join(PKG, "wasm"))) {
  files[`/wasm/${f}`] = path.join(PKG, "wasm", f);
}

const TYPES = {
  ".mjs": "text/javascript",
  ".js": "text/javascript",
  ".wasm": "application/wasm",
  ".png": "image/png",
  ".task": "application/octet-stream",
  ".html": "text/html",
};

const HTML = `<!doctype html><meta charset=utf-8><body><img id=img src=/input.png>
<script type=module>
import { FilesetResolver, PoseLandmarker } from "/vision_bundle.mjs";
window.__run = (async () => {
  const fileset = await FilesetResolver.forVisionTasks("/wasm");
  const lm = await PoseLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: "/model.task", delegate: "CPU" },
    runningMode: "IMAGE",
    numPoses: 1,
    minPoseDetectionConfidence: 0.2,
    minPosePresenceConfidence: 0.2,
    outputSegmentationMasks: false,
  });
  const img = document.getElementById("img");
  await img.decode();
  const res = lm.detect(img);
  return {
    w: img.naturalWidth,
    h: img.naturalHeight,
    landmarks: res.landmarks?.[0] ?? null,
    world: res.worldLandmarks?.[0] ?? null,
  };
})();
</script>`;

const server = http.createServer((req, res) => {
  const url = req.url.split("?")[0];
  if (url === "/") {
    res.writeHead(200, { "content-type": "text/html" });
    return res.end(HTML);
  }
  const file = files[url];
  if (!file || !fs.existsSync(file)) {
    res.writeHead(404);
    return res.end("no");
  }
  res.writeHead(200, {
    "content-type": TYPES[path.extname(file)] || "application/octet-stream",
    "cross-origin-embedder-policy": "require-corp",
    "cross-origin-opener-policy": "same-origin",
  });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;

const { chromium } = createRequire(import.meta.url)("playwright-core");
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.QA_CHROMIUM,
  args: ["--enable-features=SharedArrayBuffer"],
});
const page = await browser.newPage();
page.on("console", (m) => { if (m.type() === "error") console.error("console:", m.text()); });
page.on("pageerror", (e) => console.error("pageerror:", e.message));
await page.goto(base, { waitUntil: "load" });
const out = await page.evaluate(() => window.__run);
await browser.close();
server.close();

if (!out.landmarks) {
  console.error("NO POSE DETECTED");
  process.exit(1);
}
const NAMES = [
  "nose", "eye_inner_l", "eye_l", "eye_outer_l", "eye_inner_r", "eye_r", "eye_outer_r",
  "ear_l", "ear_r", "mouth_l", "mouth_r", "shoulder_l", "shoulder_r", "elbow_l", "elbow_r",
  "wrist_l", "wrist_r", "pinky_l", "pinky_r", "index_l", "index_r", "thumb_l", "thumb_r",
  "hip_l", "hip_r", "knee_l", "knee_r", "ankle_l", "ankle_r", "heel_l", "heel_r",
  "foot_l", "foot_r",
];
const px = out.landmarks.map((p, i) => ({
  name: NAMES[i] || `p${i}`,
  x: +(p.x * out.w).toFixed(1),
  y: +(p.y * out.h).toFixed(1),
  v: +(p.visibility ?? 0).toFixed(2),
}));
fs.writeFileSync(
  path.join(HERE, "pose_landmarks.json"),
  JSON.stringify({ image: out.w + "x" + out.h, px, world: out.world }, null, 1),
);
for (const p of px) console.log(p.name.padEnd(12), String(p.x).padStart(7), String(p.y).padStart(7), p.v);
