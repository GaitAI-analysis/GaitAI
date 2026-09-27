// Runs inside the engine WebView. Appended after the MediaPipe vision bundle
// (an ES module that defines FilesetResolver, PoseLandmarker, ObjectDetector
// on the module scope). Talks to the app over postMessage:
//   app → page:  {cmd:"pose"|"detect", uri, sampleFps, maxSeconds}
//   page → app:  {type:"stage", stage}, {type:"progress", done, total},
//                {type:"frame", t, landmarks|boxes}, {type:"done", ...}, {type:"error", message}
const send = (m) => window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(m));
const E = window.__GAITAI_ENGINE__;
const bytes = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
const blobUrl = (data, type) => URL.createObjectURL(new Blob([data], { type }));

let fileset = null;
async function getFileset() {
  if (fileset) return fileset;
  const loaderUrl = blobUrl(document.getElementById("loader").textContent, "text/javascript");
  const wasmUrl = blobUrl(bytes(E.wasmB64), "application/wasm");
  fileset = { wasmLoaderPath: loaderUrl, wasmBinaryPath: wasmUrl };
  return fileset;
}

const video = document.getElementById("v");
function loadVideo(uri) {
  return new Promise((res, rej) => {
    video.onloadedmetadata = () => res();
    video.onerror = () => rej(new Error("The video could not be opened."));
    video.src = uri; video.load();
  });
}
function seek(t) {
  return new Promise((res) => { const h = () => { video.removeEventListener("seeked", h); res(); }; video.addEventListener("seeked", h); video.currentTime = t; });
}

async function run(cmd) {
  try {
    send({ type: "stage", stage: "preparing" });
    await loadVideo(cmd.uri);
    const duration = Math.min(video.duration || 0, cmd.maxSeconds || 20);
    const fps = cmd.sampleFps || 10;
    const total = Math.max(1, Math.floor(duration * fps));
    const fs = await getFileset();
    let task;
    if (cmd.cmd === "pose") {
      task = await PoseLandmarker.createFromOptions(fs, {
        baseOptions: { modelAssetBuffer: bytes(E.poseB64), delegate: "CPU" },
        runningMode: "VIDEO", numPoses: 1, minPoseDetectionConfidence: 0.5, minPosePresenceConfidence: 0.5, minTrackingConfidence: 0.5,
      });
    } else {
      task = await ObjectDetector.createFromOptions(fs, {
        baseOptions: { modelAssetBuffer: bytes(E.detB64), delegate: "CPU" },
        runningMode: "VIDEO", scoreThreshold: 0.4, maxResults: 40, categoryAllowlist: ["person"],
      });
    }
    send({ type: "stage", stage: cmd.cmd === "pose" ? "detecting" : "detecting", model: cmd.cmd === "pose" ? E.models.pose : E.models.detector, runtime: E.version, width: video.videoWidth, height: video.videoHeight, duration });
    let stamp = 0;
    for (let i = 0; i < total; i++) {
      const t = i / fps;
      await seek(t);
      stamp += 1000 / fps;
      if (cmd.cmd === "pose") {
        const r = task.detectForVideo(video, stamp);
        const lm = r.landmarks && r.landmarks[0] ? r.landmarks[0].map((p) => [+p.x.toFixed(4), +p.y.toFixed(4), +p.z.toFixed(3), +(p.visibility ?? 0).toFixed(2)]) : null;
        send({ type: "frame", t, landmarks: lm });
      } else {
        const r = task.detectForVideo(video, stamp);
        const W = video.videoWidth || 1, H = video.videoHeight || 1;
        const boxes = (r.detections || []).map((d) => ({ x: +(d.boundingBox.originX / W).toFixed(4), y: +(d.boundingBox.originY / H).toFixed(4), w: +(d.boundingBox.width / W).toFixed(4), h: +(d.boundingBox.height / H).toFixed(4), score: +(d.categories[0]?.score ?? 0).toFixed(2) }));
        send({ type: "frame", t, boxes });
      }
      if (i % 5 === 0) send({ type: "progress", done: i + 1, total });
    }
    task.close();
    send({ type: "done", frames: total, fps, duration, width: video.videoWidth, height: video.videoHeight });
  } catch (e) {
    send({ type: "error", message: (e && e.message) || String(e) });
  }
}

window.addEventListener("message", (ev) => { try { run(JSON.parse(ev.data)); } catch (e) { send({ type: "error", message: String(e) }); } });
document.addEventListener("message", (ev) => { try { run(JSON.parse(ev.data)); } catch (e) { send({ type: "error", message: String(e) }); } });
send({ type: "ready", runtime: E.version });
