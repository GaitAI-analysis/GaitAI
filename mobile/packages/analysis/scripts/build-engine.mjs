// Builds the on-device analysis engine: a small HTML page (MediaPipe Tasks
// Vision loader + bundle + our runtime, ~0.5 MB) and, beside it, the
// WebAssembly binary and the model files as separate assets. The apps bundle
// all four as Android raw resources; at start-up expo-asset extracts them to
// the app cache and the hidden WebView loads the page from there, fetching the
// binaries over file://. Analysis never leaves the phone and needs no server.
//
//   node packages/analysis/scripts/build-engine.mjs        (from mobile/)
//
// Inputs: <repo>/node_modules/@mediapipe/tasks-vision (site dependency, 1.0.1),
//         <repo>/public/assets/models/pose_landmarker_lite.task,
//         mobile/packages/analysis/models/efficientdet_lite0_int8.tflite
// Output: mobile/packages/analysis/engine/{engine.html, vision_wasm_internal.wasm,
//         pose_landmarker_lite.task, efficientdet_lite0_int8.tflite, engine.json}
//
// Why not one self-contained page with base64 models (the previous design):
// measured on the emulator, that 30 MB page cost ~235 MB of renderer memory
// and 4.4 s of base64 decoding on every analysis, which is exactly the kind of
// load that gets a WebView renderer killed on a phone.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../../../..");
const mp = path.join(repo, "node_modules/@mediapipe/tasks-vision");
const out = path.join(here, "../engine");
fs.mkdirSync(out, { recursive: true });

const sha = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex").slice(0, 16);
const mpPkg = JSON.parse(fs.readFileSync(path.join(mp, "package.json"), "utf8"));
const visionJs = fs.readFileSync(path.join(mp, "vision_bundle.mjs"), "utf8");
const loaderJs = fs.readFileSync(path.join(mp, "wasm/vision_wasm_internal.js"), "utf8");
const wasmPath = path.join(mp, "wasm/vision_wasm_internal.wasm");
const poseModel = path.join(repo, "public/assets/models/pose_landmarker_lite.task");
const detModel = path.join(here, "../models/efficientdet_lite0_int8.tflite");
for (const p of [wasmPath, poseModel, detModel]) if (!fs.existsSync(p)) throw new Error(`missing input ${p}`);

const runtime = fs.readFileSync(path.join(here, "engine-runtime.js"), "utf8");

// The bundle is an ES module whose public classes are exported under minified
// names (`export{ Kc as PoseLandmarker, ... }`). Inlined into one module script
// those public names do not exist as bindings, so they are bound here, in the
// runtime's own scope, from the bundle's export clause.
const exportClause = [...visionJs.matchAll(/export\s*\{([^}]*)\}/g)].pop();
if (!exportClause) throw new Error("vision_bundle.mjs: export clause not found");
const exported = Object.fromEntries(exportClause[1].split(",").map((e) => e.trim().split(/\s+as\s+/)).map(([local, name]) => [name ?? local, local]));
const RUNTIME_IMPORTS = ["FilesetResolver", "PoseLandmarker", "ObjectDetector"];
for (const n of RUNTIME_IMPORTS) if (!exported[n]) throw new Error(`vision_bundle.mjs does not export ${n}`);
const bindings = RUNTIME_IMPORTS.map((n) => `const ${n} = ${exported[n]};`).join("\n");

const noClose = (s) => s.replace(/<\/script/g, "<\\/script");
const html = `<!doctype html><meta charset="utf-8"><title>GaitAI analysis engine</title>
<style>html,body{margin:0;background:#000}video,canvas{position:absolute;left:0;top:0;width:1px;height:1px;opacity:0}</style>
<video id="v" playsinline muted preload="auto"></video><canvas id="c"></canvas>
<script id="loader" type="text/plain">${noClose(loaderJs)}</script>
<script>
window.__GAITAI_ENGINE__ = {
  version: ${JSON.stringify(`mediapipe-tasks-vision@${mpPkg.version}`)},
  models: { pose: ${JSON.stringify(`pose_landmarker_lite.task#${sha(poseModel)}`)}, detector: ${JSON.stringify(`efficientdet_lite0_int8.tflite#${sha(detModel)}`)} },
};
</script>
<script type="module">
${noClose(visionJs)}
// The runtime is scoped in its own function: it shares this module scope with the
// minified vision bundle above, whose top-level names (e.g. its base64 helper named E)
// would otherwise collide with ours and turn the whole module into a SyntaxError.
(() => {
${bindings}
${runtime}
})();
</script>`;

fs.writeFileSync(path.join(out, "engine.html"), html);
const copies = [[wasmPath, "vision_wasm_internal.wasm"], [poseModel, "pose_landmarker_lite.task"], [detModel, "efficientdet_lite0_int8.tflite"]];
for (const [src, name] of copies) fs.copyFileSync(src, path.join(out, name));

const size = (p) => fs.statSync(p).size;
fs.writeFileSync(path.join(out, "engine.json"), JSON.stringify({
  built: new Date().toISOString(),
  runtime: `mediapipe-tasks-vision@${mpPkg.version}`,
  page: { file: "engine.html", bytes: size(path.join(out, "engine.html")) },
  wasm: { file: "vision_wasm_internal.wasm", sha256_16: sha(wasmPath), bytes: size(wasmPath) },
  pose: { file: "pose_landmarker_lite.task", sha256_16: sha(poseModel), bytes: size(poseModel) },
  detector: { file: "efficientdet_lite0_int8.tflite", sha256_16: sha(detModel), bytes: size(detModel), licence: "Apache-2.0 (MediaPipe models)" },
}, null, 2) + "\n");
console.log("engine.html", (size(path.join(out, "engine.html")) / 1024).toFixed(0), "KB;", copies.map(([s, n]) => `${n} ${(size(s) / 1048576).toFixed(1)} MB`).join("; "));
