// Builds the on-device analysis engine page: one self-contained HTML file with
// the MediaPipe Tasks Vision runtime (loader JS + WebAssembly) and the model
// files inlined as base64. The apps load it in an invisible WebView from the
// app bundle, so analysis never leaves the phone and needs no server.
//
//   node packages/analysis/scripts/build-engine.mjs
//
// Inputs: node_modules/@mediapipe/tasks-vision (site dependency, 1.0.1),
//         public/assets/models/pose_landmarker_lite.task,
//         mobile/packages/analysis/models/efficientdet_lite0_int8.tflite
// Output: mobile/packages/analysis/engine/engine.html (+ engine.json manifest)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../../../..");
const mp = path.join(repo, "node_modules/@mediapipe/tasks-vision");
const out = path.join(here, "../engine");
fs.mkdirSync(out, { recursive: true });

const b64 = (p) => fs.readFileSync(p).toString("base64");
const sha = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex").slice(0, 16);
const mpPkg = JSON.parse(fs.readFileSync(path.join(mp, "package.json"), "utf8"));
const visionJs = fs.readFileSync(path.join(mp, "vision_bundle.mjs"), "utf8");
const loaderJs = fs.readFileSync(path.join(mp, "wasm/vision_wasm_internal.js"), "utf8");
const wasmB64 = b64(path.join(mp, "wasm/vision_wasm_internal.wasm"));
const poseModel = path.join(repo, "public/assets/models/pose_landmarker_lite.task");
const detModel = path.join(here, "../models/efficientdet_lite0_int8.tflite");
const poseB64 = b64(poseModel), detB64 = b64(detModel);

const runtime = fs.readFileSync(path.join(here, "engine-runtime.js"), "utf8");

const html = `<!doctype html><meta charset="utf-8"><title>GaitAI analysis engine</title>
<style>html,body{margin:0;background:#000}video,canvas{position:absolute;left:0;top:0;width:1px;height:1px;opacity:0}</style>
<video id="v" playsinline muted preload="auto"></video><canvas id="c"></canvas>
<script id="loader" type="text/plain">${loaderJs.replace(/<\/script/g, "<\\/script")}</script>
<script>
window.__GAITAI_ENGINE__ = {
  version: ${JSON.stringify(`mediapipe-tasks-vision@${mpPkg.version}`)},
  models: { pose: ${JSON.stringify(`pose_landmarker_lite.task#${sha(poseModel)}`)}, detector: ${JSON.stringify(`efficientdet_lite0_int8.tflite#${sha(detModel)}`)} },
  wasmB64: ${JSON.stringify(wasmB64)},
  poseB64: ${JSON.stringify(poseB64)},
  detB64: ${JSON.stringify(detB64)},
};
</script>
<script type="module">
${visionJs.replace(/<\/script/g, "<\\/script")}
${runtime}
</script>`;

fs.writeFileSync(path.join(out, "engine.html"), html);
fs.writeFileSync(path.join(out, "engine.json"), JSON.stringify({
  built: new Date().toISOString(),
  runtime: `mediapipe-tasks-vision@${mpPkg.version}`,
  pose: { file: "pose_landmarker_lite.task", sha256_16: sha(poseModel), bytes: fs.statSync(poseModel).size },
  detector: { file: "efficientdet_lite0_int8.tflite", sha256_16: sha(detModel), bytes: fs.statSync(detModel).size, licence: "Apache-2.0 (MediaPipe models)" },
  htmlBytes: fs.statSync(path.join(out, "engine.html")).size,
}, null, 2));
console.log("engine.html", (fs.statSync(path.join(out, "engine.html")).size / 1048576).toFixed(1), "MB");
