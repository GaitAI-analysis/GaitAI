/**
 * The on-device analysis engine, as a React component with an explicit
 * lifecycle.
 *
 *   UNINITIALIZED → INITIALIZING → LOADING_ASSETS → READY ⇄ ANALYZING
 *                        ↘              ↘             ↘
 *                                     ERROR  (retry() → INITIALIZING)
 *
 * INITIALIZING   expo-asset extracts the engine page, the WebAssembly runtime
 *                and the model files from the APK to the app cache, the hidden
 *                WebView loads the page, and the page reports "booted".
 * LOADING_ASSETS the page fetches and compiles the runtime and warms the
 *                product's model; it reports each phase, then "ready".
 * READY          analyses may start. ANALYZING: exactly one is running.
 * ERROR          carries an EngineError; whenReady() rejects with it at once so
 *                the UI shows the specific problem and a working Retry.
 *
 * Analysis never starts before READY: runPose/runDetect await whenReady(),
 * which has a bounded timeout and a meaningful error, so no caller needs an
 * arbitrary delay. A renderer crash, a page load failure, a silent boot and a
 * stalled analysis all end in a typed error instead of a hang. Nothing is
 * uploaded: the page is file:// and reads a file:// video.
 */
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { View } from "react-native";
import { WebView as RNWebView, type WebViewMessageEvent } from "react-native-webview";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import type { Landmark, PoseInstant } from "./gait";
import type { DetectionFrame } from "./crowd";
import { ENGINE_ASSETS, type EngineAssetKey } from "./engine-assets";
import { EngineError, toEngineError, type EngineErrorCode } from "./errors";
import { diag } from "./diag";

/* react-native-webview ships class-component typings that collapse to `never`
   under React 19; the runtime component is fine, so it is typed loosely here. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const WebView = RNWebView as unknown as React.ComponentType<any>;

export type EngineState = "UNINITIALIZED" | "INITIALIZING" | "LOADING_ASSETS" | "READY" | "ANALYZING" | "ERROR";
export type EngineKind = "pose" | "detect";
export interface EngineStatus {
  state: EngineState;
  /** What is happening right now, in plain words ("Loading movement model"). */
  detail: string;
  error: EngineError | null;
  /** Initialisation attempt number (1 = first start). */
  attempt: number;
  /** When this state was entered (ms since epoch). */
  since: number;
  /** Which model kinds the page has warmed. */
  warmed: EngineKind[];
}
export type EngineStage = "engine" | "preparing" | "detecting" | "tracking" | "computing" | "reporting";
export interface EngineProgress { stage: EngineStage; fraction: number; detail?: string }
export interface EngineMeta { runtime: string; model: string; width: number; height: number; duration: number; frames: number; fps: number; withSubject: number }
export interface RunOptions { sampleFps?: number; maxSeconds?: number }

export interface EngineHandle {
  status(): EngineStatus;
  /** Resolves once the engine is READY; rejects with the EngineError when it is in ERROR, busy, or the wait times out. */
  whenReady(timeoutMs?: number): Promise<void>;
  /** Re-initialises from scratch (new WebView) and resolves when READY. */
  retry(): Promise<void>;
  /** Stops the running analysis; its promise rejects with CANCELLED. */
  cancel(): void;
  runPose(uri: string, opts: RunOptions, onProgress: (p: EngineProgress) => void): Promise<{ instants: PoseInstant[]; meta: EngineMeta }>;
  runDetect(uri: string, opts: RunOptions, onProgress: (p: EngineProgress) => void): Promise<{ frames: DetectionFrame[]; meta: EngineMeta }>;
}

/** Bounded waits. Generous for slow phones, finite so a dead engine is reported, never spun on. */
export const ENGINE_TIMEOUTS = {
  /** From mount to the page's "booted" message (asset extraction + page load). */
  bootMs: 45_000,
  /** From "booted" to "ready" (runtime compile + model warm-up). */
  initMs: 60_000,
  /** Default wait inside runPose/runDetect for the engine to become READY. */
  readyMs: 90_000,
  /** Analysis watchdog: no message from the page for this long → ANALYSIS_TIMEOUT. */
  analysisIdleMs: 30_000,
  /** Absolute cap on one analysis. */
  analysisMaxMs: 5 * 60_000,
} as const;

type Pending = {
  id: number; kind: EngineKind;
  onProgress: (p: EngineProgress) => void;
  frames: unknown[]; meta: Partial<EngineMeta>;
  resolve: (v: unknown) => void; reject: (e: EngineError) => void;
  idle: ReturnType<typeof setTimeout> | null; max: ReturnType<typeof setTimeout> | null;
  started: number;
};
type Waiter = { resolve: () => void; reject: (e: EngineError) => void; timer: ReturnType<typeof setTimeout> };
type Page = { uri: string; assets: Record<Exclude<EngineAssetKey, "page">, string> };

/** Copies a content:// or ph:// picker URI into app cache as a plain file the WebView can read. */
export async function localizeVideo(uri: string): Promise<string> {
  if (uri.startsWith("file://")) return uri;
  const dest = `${FileSystem.cacheDirectory}gaitai-input-${Date.now()}.mp4`;
  await FileSystem.copyAsync({ from: uri, to: dest });
  return dest;
}

const WARM: Record<"mobilitycare" | "securevision", EngineKind[]> = { mobilitycare: ["pose"], securevision: ["detect"] };
const MODEL_LABEL: Record<EngineKind, string> = { pose: "Loading movement model", detect: "Loading person detector" };

export const AnalysisEngine = forwardRef<EngineHandle, { product: "mobilitycare" | "securevision"; onStatus?: (s: EngineStatus) => void }>(function AnalysisEngine({ product, onStatus }, ref) {
  const web = useRef<{ postMessage(m: string): void } | null>(null);
  const [page, setPage] = useState<Page | null>(null);
  const [attempt, setAttempt] = useState(1);
  const status = useRef<EngineStatus>({ state: "UNINITIALIZED", detail: "Not started", error: null, attempt: 0, since: Date.now(), warmed: [] });
  const waiters = useRef<Waiter[]>([]);
  const pending = useRef<Pending | null>(null);
  const bootTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pageRef = useRef<Page | null>(null);
  const autoRetries = useRef(0);
  const runId = useRef(0);
  /** True from a start() call until its command is posted: a second start() while the first still waits for READY is refused, never queued behind it. */
  const starting = useRef(false);
  const onStatusRef = useRef(onStatus); onStatusRef.current = onStatus;
  const live = useRef(true);

  const clearTimers = () => { if (bootTimer.current) clearTimeout(bootTimer.current); if (initTimer.current) clearTimeout(initTimer.current); bootTimer.current = null; initTimer.current = null; };

  const setStatus = useCallback((patch: Partial<EngineStatus> & { state: EngineState }) => {
    const prev = status.current;
    status.current = { ...prev, error: null, ...patch, since: patch.state === prev.state ? prev.since : Date.now() };
    diag.log(`state ${prev.state} → ${status.current.state}`, { detail: status.current.detail, attempt: status.current.attempt, code: status.current.error?.code ?? null });
    onStatusRef.current?.(status.current);
    if (status.current.state === "READY") { const ws = waiters.current.splice(0); ws.forEach((w) => { clearTimeout(w.timer); w.resolve(); }); }
  }, []);

  const rejectPending = useCallback((err: EngineError) => {
    const p = pending.current; if (!p) return;
    pending.current = null;
    if (p.idle) clearTimeout(p.idle); if (p.max) clearTimeout(p.max);
    diag.error("analysis failed", { kind: p.kind, code: err.code, message: err.message, elapsedMs: Date.now() - p.started });
    p.reject(err);
  }, []);

  const fail = useCallback((code: EngineErrorCode, message: string, detail?: string) => {
    clearTimers();
    const err = new EngineError(code, message, detail);
    diag.error("engine error", { code, message, detail: detail ?? null, state: status.current.state });
    rejectPending(err.code === "ENGINE_INITIALIZATION_FAILED" && pending.current ? new EngineError("ANALYSIS_FAILED", "The analysis engine stopped while this clip was being analysed.", message) : err);
    const ws = waiters.current.splice(0); ws.forEach((w) => { clearTimeout(w.timer); w.reject(err); });
    setStatus({ state: "ERROR", detail: message, error: err });
  }, [rejectPending, setStatus]);

  // ── Initialisation: one run per attempt ──────────────────────────────────
  useEffect(() => {
    live.current = true;
    let cancelled = false;
    clearTimers();
    setPage(null); pageRef.current = null;
    setStatus({ state: "INITIALIZING", detail: "Extracting engine files", attempt, warmed: [] });
    diag.log("engine initialization started", { attempt, product });
    const t0 = Date.now();
    (async () => {
      const keys = Object.keys(ENGINE_ASSETS) as EngineAssetKey[];
      const local: Partial<Record<EngineAssetKey, string>> = {};
      for (const key of keys) {
        try {
          const asset = Asset.fromModule(ENGINE_ASSETS[key]);
          await asset.downloadAsync();
          const uri = asset.localUri ?? asset.uri;
          if (!uri || !uri.startsWith("file://")) throw new Error(`no local file for ${key}`);
          const info = await FileSystem.getInfoAsync(uri);
          if (!info.exists || !(info as { size?: number }).size) throw new Error(`${key} extracted empty`);
          local[key] = uri;
          diag.log("asset ready", { key, bytes: (info as { size?: number }).size ?? null, elapsedMs: Date.now() - t0 });
        } catch (e) {
          diag.error("asset failed", { key, message: e instanceof Error ? e.message : String(e) });
          throw new EngineError(key === "page" || key === "wasm" ? "ENGINE_INITIALIZATION_FAILED" : "MODEL_ASSET_MISSING", key === "page" || key === "wasm" ? "The engine files could not be prepared on this phone." : "A model file could not be prepared on this phone.", e instanceof Error ? e.message : String(e));
        }
      }
      if (cancelled) return;
      const p: Page = { uri: local.page!, assets: { wasm: local.wasm!, pose: local.pose!, detector: local.detector! } };
      pageRef.current = p;
      setStatus({ state: "INITIALIZING", detail: "Starting analysis runtime" });
      bootTimer.current = setTimeout(() => { if (!cancelled && status.current.state === "INITIALIZING") fail("ENGINE_INITIALIZATION_FAILED", "The analysis engine did not start in time.", `no booted message within ${ENGINE_TIMEOUTS.bootMs} ms`); }, ENGINE_TIMEOUTS.bootMs);
      setPage(p);
    })().catch((e) => { if (cancelled) return; const err = toEngineError(e, "ENGINE_INITIALIZATION_FAILED"); fail(err.code, err.message, err.detail); });
    return () => { cancelled = true; live.current = false; clearTimers(); };
  }, [attempt, product, fail, setStatus]);

  // ── Messages from the page ───────────────────────────────────────────────
  const touchWatchdog = (p: Pending) => {
    if (p.idle) clearTimeout(p.idle);
    p.idle = setTimeout(() => { if (pending.current === p) { rejectPending(new EngineError("ANALYSIS_TIMEOUT", "The analysis stopped reporting progress.", `no message for ${ENGINE_TIMEOUTS.analysisIdleMs} ms`)); setStatus({ state: "READY", detail: "Ready to analyze" }); } }, ENGINE_TIMEOUTS.analysisIdleMs);
  };

  const onMessage = useCallback((e: WebViewMessageEvent) => {
    let m: Record<string, unknown>;
    try { m = JSON.parse(e.nativeEvent.data); } catch { return; }
    const type = m.type as string;
    if (type === "log") { (m.level === "error" ? diag.error : diag.warn)(`page ${m.level}`, { message: String(m.message).slice(0, 300) }); return; }
    if (type === "booted") {
      diag.log("READY handshake: booted received", { runtime: String(m.runtime) });
      if (bootTimer.current) { clearTimeout(bootTimer.current); bootTimer.current = null; }
      const p = pageRef.current; if (!p || !web.current) return;
      const warm = WARM[product];
      setStatus({ state: "LOADING_ASSETS", detail: "Loading analysis runtime" });
      web.current.postMessage(JSON.stringify({ cmd: "init", warm, assets: p.assets }));
      initTimer.current = setTimeout(() => { if (status.current.state === "LOADING_ASSETS") fail("ENGINE_INITIALIZATION_FAILED", "The movement model did not finish loading in time.", `no ready message within ${ENGINE_TIMEOUTS.initMs} ms`); }, ENGINE_TIMEOUTS.initMs);
      return;
    }
    if (type === "status") {
      const phase = m.phase as string;
      const kind = (m.model as string | undefined)?.startsWith("pose") ? "pose" : "detect";
      setStatus({ state: "LOADING_ASSETS", detail: phase === "runtime" ? "Loading analysis runtime" : MODEL_LABEL[kind] });
      diag.log(phase === "runtime" ? "asset loading: runtime" : "model loading started", { model: m.model ? String(m.model) : null });
      return;
    }
    if (type === "ready") {
      if (initTimer.current) { clearTimeout(initTimer.current); initTimer.current = null; }
      autoRetries.current = 0;
      const warmed = (m.warmed as EngineKind[]) ?? [];
      diag.log("READY message received", { warmed: warmed.join(","), sinceMountMs: Date.now() - status.current.since });
      setStatus({ state: "READY", detail: "Ready to analyze", warmed });
      return;
    }
    const p = pending.current;
    if (type === "error" && (m.id == null || !p)) { fail((m.code as EngineErrorCode) ?? "ENGINE_INITIALIZATION_FAILED", String(m.message)); return; }
    if (!p || m.id !== p.id) return;
    touchWatchdog(p);
    if (type === "stage") {
      p.meta = { ...p.meta, runtime: m.runtime as string, model: (m.model as string) ?? p.meta.model, width: m.width as number, height: m.height as number, duration: m.duration as number };
      const stage = m.stage as EngineStage;
      if (stage === "detecting") diag.log("inference started", { kind: p.kind, width: m.width as number, height: m.height as number, durationS: m.duration as number });
      else diag.log("video opened", { kind: p.kind });
      p.onProgress({ stage, fraction: stage === "preparing" ? 0.03 : 0.06, detail: m.model as string | undefined });
    } else if (type === "progress") {
      p.onProgress({ stage: "detecting", fraction: 0.06 + 0.84 * ((m.done as number) / (m.total as number)), detail: p.meta.model });
    } else if (type === "frame") {
      if (p.kind === "pose") {
        const lm = m.landmarks as number[][] | null;
        p.frames.push({ t: m.t as number, landmarks: lm ? lm.map(([x, y, z, visibility]) => ({ x, y, z, visibility } as Landmark)) : null });
      } else p.frames.push({ t: m.t as number, boxes: m.boxes as DetectionFrame["boxes"] });
    } else if (type === "done") {
      p.meta = { ...p.meta, frames: m.frames as number, fps: m.fps as number, withSubject: m.withSubject as number, duration: (m.duration as number) ?? p.meta.duration, width: (m.width as number) ?? p.meta.width, height: (m.height as number) ?? p.meta.height };
      pending.current = null; if (p.idle) clearTimeout(p.idle); if (p.max) clearTimeout(p.max);
      diag.log("inference completed", { kind: p.kind, frames: p.meta.frames ?? null, withSubject: p.meta.withSubject ?? null, elapsedMs: Date.now() - p.started });
      setStatus({ state: "READY", detail: "Ready to analyze" });
      p.resolve(p.kind === "pose" ? { instants: p.frames, meta: p.meta } : { frames: p.frames, meta: p.meta });
    } else if (type === "cancelled") {
      rejectPending(new EngineError("CANCELLED", "The analysis was cancelled."));
      setStatus({ state: "READY", detail: "Ready to analyze" });
    } else if (type === "error") {
      const code = (m.code as EngineErrorCode) ?? "ANALYSIS_FAILED";
      rejectPending(new EngineError(code, String(m.message)));
      // Engine-level codes mean the page itself is unhealthy; everything else leaves it READY.
      if (code === "ENGINE_INITIALIZATION_FAILED" || code === "MODEL_ASSET_MISSING") fail(code, String(m.message)); else setStatus({ state: "READY", detail: "Ready to analyze" });
    }
  }, [fail, product, rejectPending, setStatus]);

  // ── Public handle ────────────────────────────────────────────────────────
  const whenReady = useCallback((timeoutMs: number = ENGINE_TIMEOUTS.readyMs) => new Promise<void>((resolve, reject) => {
    const s = status.current;
    if (s.state === "READY") { resolve(); return; }
    if (s.state === "ERROR") { reject(s.error ?? new EngineError("ENGINE_INITIALIZATION_FAILED", "The analysis engine is not available.")); return; }
    if (s.state === "ANALYZING") { reject(new EngineError("ENGINE_BUSY", "Another analysis is running.")); return; }
    const timer = setTimeout(() => {
      const i = waiters.current.findIndex((w) => w.timer === timer); if (i >= 0) waiters.current.splice(i, 1);
      reject(new EngineError("ENGINE_INITIALIZATION_FAILED", "The analysis engine did not become ready in time.", `waited ${timeoutMs} ms in state ${status.current.state}`));
    }, timeoutMs);
    waiters.current.push({ resolve, reject, timer });
  }), []);

  const retry = useCallback(() => {
    diag.log("retry requested", { fromState: status.current.state, attempt: status.current.attempt });
    rejectPending(new EngineError("CANCELLED", "The engine is restarting."));
    autoRetries.current = 0;
    clearTimers();
    // Leave ERROR synchronously so the wait below subscribes instead of rejecting;
    // the effect for the new attempt then takes over on the next render.
    setStatus({ state: "INITIALIZING", detail: "Restarting engine", attempt: status.current.attempt + 1, warmed: [] });
    setAttempt((a) => a + 1);
    return whenReady(ENGINE_TIMEOUTS.bootMs + ENGINE_TIMEOUTS.initMs);
  }, [rejectPending, setStatus, whenReady]);

  const cancel = useCallback(() => {
    if (!pending.current) return;
    diag.log("cancel requested", { kind: pending.current.kind });
    web.current?.postMessage(JSON.stringify({ cmd: "cancel" }));
    rejectPending(new EngineError("CANCELLED", "The analysis was cancelled."));
    setStatus({ state: "READY", detail: "Ready to analyze" });
  }, [rejectPending, setStatus]);

  const start = useCallback(async (kind: EngineKind, uri: string, opts: RunOptions, onProgress: Pending["onProgress"]) => {
    if (pending.current || starting.current) throw new EngineError("ENGINE_BUSY", "Another analysis is running.");
    starting.current = true;
    try {
      if (status.current.state !== "READY") {
        onProgress({ stage: "engine", fraction: 0.01, detail: status.current.detail });
        diag.log("analysis requested before READY; waiting", { state: status.current.state });
        // Keep the caller's stage text truthful while the engine comes up.
        const prevOnStatus = onStatusRef.current;
        onStatusRef.current = (s) => { prevOnStatus?.(s); if (s.state !== "READY") onProgress({ stage: "engine", fraction: 0.01, detail: s.detail }); };
        try { await whenReady(); } finally { onStatusRef.current = prevOnStatus; }
      }
      if (!web.current) throw new EngineError("ENGINE_INITIALIZATION_FAILED", "The analysis engine is not available.");
      const id = ++runId.current;
      return new Promise<unknown>((resolve, reject) => {
        const p: Pending = { id, kind, onProgress, frames: [], meta: {}, resolve, reject, idle: null, max: null, started: Date.now() };
        pending.current = p;
        p.max = setTimeout(() => { if (pending.current === p) { rejectPending(new EngineError("ANALYSIS_TIMEOUT", "The analysis took too long and was stopped.", `over ${ENGINE_TIMEOUTS.analysisMaxMs} ms`)); web.current?.postMessage(JSON.stringify({ cmd: "cancel" })); setStatus({ state: "READY", detail: "Ready to analyze" }); } }, ENGINE_TIMEOUTS.analysisMaxMs);
        touchWatchdog(p);
        setStatus({ state: "ANALYZING", detail: kind === "pose" ? "Analysing your walk" : "Counting people" });
        onProgress({ stage: "preparing", fraction: 0.02 });
        diag.log("analysis command posted", { kind, sampleFps: opts.sampleFps ?? 10, maxSeconds: opts.maxSeconds ?? 20 });
        web.current!.postMessage(JSON.stringify({ cmd: kind, id, uri, sampleFps: opts.sampleFps ?? 10, maxSeconds: opts.maxSeconds ?? 20 }));
      });
    } finally {
      // The executor above ran synchronously, so pending.current now guards the run.
      starting.current = false;
    }
  }, [rejectPending, setStatus, whenReady]);

  useImperativeHandle(ref, () => ({
    status: () => status.current,
    whenReady, retry, cancel,
    runPose: (uri, opts, onProgress) => start("pose", uri, opts, onProgress) as Promise<{ instants: PoseInstant[]; meta: EngineMeta }>,
    runDetect: (uri, opts, onProgress) => start("detect", uri, opts, onProgress) as Promise<{ frames: DetectionFrame[]; meta: EngineMeta }>,
  }), [cancel, retry, start, whenReady]);

  // ── WebView failure paths ────────────────────────────────────────────────
  const onRenderProcessGone = useCallback((e: { nativeEvent: { didCrash: boolean } }) => {
    diag.error("WebView renderer gone", { didCrash: e.nativeEvent.didCrash, state: status.current.state });
    const wasAnalysing = status.current.state === "ANALYZING";
    fail("ENGINE_INITIALIZATION_FAILED", wasAnalysing ? "The analysis engine ran out of memory or was stopped by the system." : "The analysis engine stopped unexpectedly.", `renderer gone, didCrash=${e.nativeEvent.didCrash}`);
    if (!wasAnalysing && autoRetries.current < 1 && live.current) { autoRetries.current++; diag.log("auto re-initialising after renderer loss"); setAttempt((a) => a + 1); }
  }, [fail]);
  const onError = useCallback((e: { nativeEvent: { description?: string; code?: number } }) => {
    fail("ENGINE_INITIALIZATION_FAILED", "The analysis engine page could not be loaded.", `${e.nativeEvent.code ?? ""} ${e.nativeEvent.description ?? ""}`.trim());
  }, [fail]);

  if (!page) return null;
  return (
    <View style={{ position: "absolute", width: 1, height: 1, opacity: 0, left: -10, top: -10 }} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <WebView
        key={attempt}
        ref={web}
        source={{ uri: page.uri }}
        originWhitelist={["*"]}
        allowFileAccess
        allowFileAccessFromFileURLs
        allowUniversalAccessFromFileURLs
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled={false}
        cacheEnabled={false}
        setSupportMultipleWindows={false}
        webviewDebuggingEnabled={__DEV__}
        onMessage={onMessage}
        onError={onError}
        onRenderProcessGone={onRenderProcessGone}
        onLoadEnd={() => diag.log("engine page loaded", { attempt })}
        style={{ width: 1, height: 1, backgroundColor: "transparent" }}
      />
    </View>
  );
});
