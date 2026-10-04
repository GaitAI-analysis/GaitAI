// Runs inside the engine WebView. build-engine.mjs appends this after the
// MediaPipe vision bundle, inside one function scope where FilesetResolver,
// PoseLandmarker and ObjectDetector are bound from the bundle's export clause.
//
// The page is small: the WebAssembly runtime and the model files are separate
// files beside it in the app cache, fetched over file:// with XMLHttpRequest
// (fetch() refuses file URLs). Nothing is inlined as base64 any more: the old
// 30 MB page cost ~235 MB of renderer memory and 4.4 s of decoding per run.
//
// Protocol (every message is JSON):
//   app → page   {cmd:"init", warm:["pose"|"detect"], assets:{wasm, pose, detector}}  file:// URIs
//                {cmd:"pose"|"detect", id, uri, sampleFps, maxSeconds}
//                {cmd:"cancel"}
//   page → app   {type:"booted", runtime}                       module ran, listeners attached
//                {type:"status", phase:"runtime"|"model", model} what is loading right now
//                {type:"ready", runtime, warmed:[...]}           runtime + requested models loaded
//                {type:"stage", id, stage, runtime, model, width, height, duration}
//                {type:"progress", id, done, total}
//                {type:"frame", id, t, landmarks|boxes}
//                {type:"done", id, frames, fps, duration, width, height, withSubject}
//                {type:"cancelled", id}
//                {type:"error", id?, code, message}             code: see EngineErrorCode in src/errors.ts
//                {type:"log", level, message}                   captured console / window errors
const E = window.__GAITAI_ENGINE__;
const send = (m) => {
  const bridge = window.ReactNativeWebView;
  if (!bridge) return false;
  bridge.postMessage(JSON.stringify(m));
  return true;
};
class EngineErr extends Error { constructor(code, message) { super(message); this.code = code; } }
const asErr = (e, fallback) => (e && e.code ? e : new EngineErr(fallback, (e && e.message) || String(e)));

// ── Diagnostics: forward console errors/warnings and uncaught errors to the app. Never any frame data.
const forward = (level, args) => {
  try {
    const message = args.map((a) => (a instanceof Error ? a.message : typeof a === "string" ? a : JSON.stringify(a))).join(" ").slice(0, 400);
    // MediaPipe prints its INFO lines through console.error and glog warnings through console.warn.
    if (/^(INFO:|I\d{4} )/.test(message)) return;
    send({ type: "log", level: /^W\d{4} /.test(message) ? "warn" : level, message });
  } catch (_) { /* never throw from a logger */ }
};
for (const level of ["error", "warn"]) { const orig = console[level].bind(console); console[level] = (...a) => { orig(...a); forward(level, a); }; }
window.addEventListener("error", (ev) => forward("error", [`uncaught: ${ev.message} (line ${ev.lineno})`]));
window.addEventListener("unhandledrejection", (ev) => forward("error", [`unhandled rejection: ${(ev.reason && ev.reason.message) || ev.reason}`]));

// ── Asset loading over file:// ───────────────────────────────────────────────
function xhrBytes(url, code, what) {
  return new Promise((res, rej) => {
    const x = new XMLHttpRequest();
    x.open("GET", url, true);
    x.responseType = "arraybuffer";
    x.onload = () => {
      const ok = x.status === 0 || (x.status >= 200 && x.status < 300);
      if (ok && x.response && x.response.byteLength > 0) res(x.response);
      else rej(new EngineErr(code, `${what} could not be read (status ${x.status}, ${x.response ? x.response.byteLength : 0} bytes).`));
    };
    x.onerror = () => rej(new EngineErr(code, `${what} could not be read (request failed).`));
    x.onabort = () => rej(new EngineErr(code, `${what} load was aborted.`));
    try { x.send(); } catch (e) { rej(new EngineErr(code, `${what} could not be requested: ${e.message}`)); }
  });
}
const blobUrl = (data, type) => URL.createObjectURL(new Blob([data], { type }));

let assets = null;          // {wasm, pose, detector} file:// URIs from the app
let fileset = null;         // {wasmLoaderPath, wasmBinaryPath} blob URLs
let filesetPromise = null;
const modelBytes = {};      // kind → Uint8Array
const tasks = {};           // kind → { task, stamp }
const MODEL_FOR = { pose: "pose", detect: "detector" };

async function getFileset() {
  if (fileset) return fileset;
  if (!filesetPromise) filesetPromise = (async () => {
    send({ type: "status", phase: "runtime" });
    const t0 = performance.now();
    const wasm = await xhrBytes(assets.wasm, "ENGINE_INITIALIZATION_FAILED", "The analysis runtime (WebAssembly)");
    // Compile once up front so a broken binary fails here, with a clear code, not inside MediaPipe.
    await WebAssembly.compile(wasm);
    fileset = { wasmLoaderPath: blobUrl(document.getElementById("loader").textContent, "text/javascript"), wasmBinaryPath: blobUrl(wasm, "application/wasm") };
    console.log(`[engine] runtime loaded: ${(wasm.byteLength / 1048576).toFixed(1)} MB in ${Math.round(performance.now() - t0)} ms`);
    return fileset;
  })().catch((e) => { filesetPromise = null; throw asErr(e, "ENGINE_INITIALIZATION_FAILED"); });
  return filesetPromise;
}

async function getModelBytes(kind) {
  const key = MODEL_FOR[kind];
  if (modelBytes[key]) return modelBytes[key];
  const buf = await xhrBytes(assets[key], "MODEL_ASSET_MISSING", kind === "pose" ? "The pose model file" : "The person-detector model file");
  modelBytes[key] = new Uint8Array(buf);
  return modelBytes[key];
}

/** Creates (or returns) the long-lived task for a kind. Tasks stay open between runs; timestamps keep increasing. */
async function getTask(kind) {
  if (tasks[kind]) return tasks[kind];
  const fs = await getFileset();
  send({ type: "status", phase: "model", model: kind === "pose" ? E.models.pose : E.models.detector });
  const t0 = performance.now();
  const bytes = await getModelBytes(kind);
  let task;
  try {
    task = kind === "pose"
      ? await PoseLandmarker.createFromOptions(fs, { baseOptions: { modelAssetBuffer: bytes, delegate: "CPU" }, runningMode: "VIDEO", numPoses: 1, minPoseDetectionConfidence: 0.5, minPosePresenceConfidence: 0.5, minTrackingConfidence: 0.5 })
      : await ObjectDetector.createFromOptions(fs, { baseOptions: { modelAssetBuffer: bytes, delegate: "CPU" }, runningMode: "VIDEO", scoreThreshold: 0.4, maxResults: 40, categoryAllowlist: ["person"] });
  } catch (e) { throw new EngineErr("ENGINE_INITIALIZATION_FAILED", `The ${kind === "pose" ? "pose" : "detector"} model could not be initialised: ${(e && e.message) || e}`); }
  console.log(`[engine] ${kind} model ready in ${Math.round(performance.now() - t0)} ms`);
  tasks[kind] = { task, stamp: 0 };
  return tasks[kind];
}
function dropTask(kind) { const t = tasks[kind]; if (!t) return; try { t.task.close(); } catch (_) { /* already gone */ } delete tasks[kind]; }

// ── Init handshake ──────────────────────────────────────────────────────────
let initPromise = null;
function init(cmd) {
  assets = cmd.assets;
  const warm = Array.isArray(cmd.warm) && cmd.warm.length ? cmd.warm : ["pose"];
  initPromise = (async () => {
    await getFileset();
    for (const kind of warm) await getTask(kind);
    send({ type: "ready", runtime: E.version, warmed: Object.keys(tasks) });
  })().catch((e) => { const err = asErr(e, "ENGINE_INITIALIZATION_FAILED"); send({ type: "error", code: err.code, message: err.message }); });
  return initPromise;
}

// ── Video ───────────────────────────────────────────────────────────────────
const video = document.getElementById("v");
const withTimeout = (p, ms, code, message) => new Promise((res, rej) => { const t = setTimeout(() => rej(new EngineErr(code, message)), ms); p.then((v) => { clearTimeout(t); res(v); }, (e) => { clearTimeout(t); rej(e); }); });
function loadVideo(uri) {
  const p = new Promise((res, rej) => {
    const done = () => { cleanup(); res(); };
    const fail = () => { cleanup(); const err = video.error; rej(new EngineErr("VIDEO_DECODE_FAILED", `The video could not be opened${err ? ` (media error ${err.code})` : ""}.`)); };
    const cleanup = () => { video.removeEventListener("loadedmetadata", done); video.removeEventListener("error", fail); };
    video.addEventListener("loadedmetadata", done); video.addEventListener("error", fail);
    video.src = uri; video.load();
  });
  return withTimeout(p, 20000, "VIDEO_DECODE_FAILED", "The video took too long to open.");
}
function seek(t) {
  const p = new Promise((res) => { const h = () => { video.removeEventListener("seeked", h); res(); }; video.addEventListener("seeked", h); video.currentTime = t; });
  return withTimeout(p, 8000, "VIDEO_DECODE_FAILED", `The video could not be decoded at ${t.toFixed(1)} s.`);
}
function releaseVideo() { try { video.pause(); video.removeAttribute("src"); video.load(); } catch (_) { /* best effort */ } }

// ── Analysis ────────────────────────────────────────────────────────────────
let active = null; // { id, cancelled }
async function run(cmd) {
  const id = cmd.id;
  if (active) { send({ type: "error", id, code: "ENGINE_BUSY", message: "Another analysis is running." }); return; }
  if (!assets) { send({ type: "error", id, code: "ENGINE_INITIALIZATION_FAILED", message: "The engine was asked to analyse before it was initialised." }); return; }
  active = { id, cancelled: false };
  const kind = cmd.cmd;
  try {
    send({ type: "stage", id, stage: "preparing", runtime: E.version });
    const tk = await getTask(kind); // already warm in the normal case
    await loadVideo(cmd.uri);
    if (!Number.isFinite(video.duration) || video.duration <= 0) throw new EngineErr("VIDEO_DECODE_FAILED", "The video has no readable duration.");
    if (!video.videoWidth || !video.videoHeight) throw new EngineErr("VIDEO_DECODE_FAILED", "The video has no readable picture.");
    const duration = Math.min(video.duration, cmd.maxSeconds || 20);
    const fps = cmd.sampleFps || 10;
    const total = Math.max(1, Math.floor(duration * fps));
    const W = video.videoWidth, H = video.videoHeight;
    send({ type: "stage", id, stage: "detecting", model: kind === "pose" ? E.models.pose : E.models.detector, runtime: E.version, width: W, height: H, duration });
    let withSubject = 0;
    const t0 = performance.now();
    for (let i = 0; i < total; i++) {
      if (active.cancelled) { send({ type: "cancelled", id }); return; }
      const t = i / fps;
      await seek(t);
      tk.stamp += Math.round(1000 / fps); // monotonic across runs: MediaPipe VIDEO mode requires it
      if (kind === "pose") {
        const r = tk.task.detectForVideo(video, tk.stamp);
        const lm = r.landmarks && r.landmarks[0] ? r.landmarks[0].map((p) => [+p.x.toFixed(4), +p.y.toFixed(4), +p.z.toFixed(3), +(p.visibility ?? 0).toFixed(2)]) : null;
        if (lm) withSubject++;
        send({ type: "frame", id, t, landmarks: lm });
      } else {
        const r = tk.task.detectForVideo(video, tk.stamp);
        const boxes = (r.detections || []).map((d) => ({ x: +(d.boundingBox.originX / W).toFixed(4), y: +(d.boundingBox.originY / H).toFixed(4), w: +(d.boundingBox.width / W).toFixed(4), h: +(d.boundingBox.height / H).toFixed(4), score: +(d.categories[0]?.score ?? 0).toFixed(2) }));
        if (boxes.length) withSubject++;
        send({ type: "frame", id, t, boxes });
      }
      if (i % 5 === 0 || i === total - 1) send({ type: "progress", id, done: i + 1, total });
    }
    console.log(`[engine] ${kind}: ${total} frames in ${Math.round(performance.now() - t0)} ms, ${withSubject} with a subject`);
    send({ type: "done", id, frames: total, fps, duration, width: W, height: H, withSubject });
  } catch (e) {
    const err = asErr(e, "ANALYSIS_FAILED");
    // A task that threw mid-run is not trusted again; the next run recreates it.
    if (err.code === "ANALYSIS_FAILED") dropTask(kind);
    send({ type: "error", id, code: err.code, message: err.message });
  } finally {
    releaseVideo();
    active = null;
  }
}

function onCommand(raw) {
  let cmd;
  try { cmd = JSON.parse(raw); } catch (e) { send({ type: "error", code: "ANALYSIS_FAILED", message: `Bad command: ${String(e)}` }); return; }
  if (!cmd || typeof cmd !== "object") return;
  if (cmd.cmd === "init") { init(cmd); return; }
  if (cmd.cmd === "cancel") { if (active) active.cancelled = true; return; }
  if (cmd.cmd === "pose" || cmd.cmd === "detect") { run(cmd); return; }
  send({ type: "error", id: cmd.id, code: "ANALYSIS_FAILED", message: `Unknown command ${cmd.cmd}` });
}
window.addEventListener("message", (ev) => onCommand(ev.data));
document.addEventListener("message", (ev) => onCommand(ev.data));

if (!send({ type: "booted", runtime: E.version })) console.error("ReactNativeWebView bridge missing at boot");
