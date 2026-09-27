/**
 * The on-device analysis engine, as a React component.
 *
 * It mounts an invisible WebView that runs `engine/engine.html` (MediaPipe
 * WebAssembly + models, inlined) from the app bundle and exposes one
 * imperative method per model. Frames stream back over postMessage; the
 * caller receives truthful stage changes and a progress fraction. Nothing is
 * uploaded: the WebView loads a file:// page and reads a file:// video.
 */
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { View } from "react-native";
import { WebView as RNWebView, type WebViewMessageEvent } from "react-native-webview";

/* react-native-webview 14 ships class-component typings that collapse to `never`
   under React 19; the runtime component is fine, so it is typed loosely here. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const WebView = RNWebView as unknown as React.ComponentType<any>;
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import type { Landmark, PoseInstant } from "./gait";
import type { DetectionFrame } from "./crowd";

export type EngineStage = "preparing" | "detecting" | "tracking" | "computing" | "reporting";
export interface EngineProgress { stage: EngineStage; fraction: number; detail?: string }
export interface EngineMeta { runtime: string; model: string; width: number; height: number; duration: number; frames: number; fps: number }

export interface EngineHandle {
  ready: boolean;
  runPose(uri: string, opts: { sampleFps?: number; maxSeconds?: number }, onProgress: (p: EngineProgress) => void): Promise<{ instants: PoseInstant[]; meta: EngineMeta }>;
  runDetect(uri: string, opts: { sampleFps?: number; maxSeconds?: number }, onProgress: (p: EngineProgress) => void): Promise<{ frames: DetectionFrame[]; meta: EngineMeta }>;
}

type Pending = { onProgress: (p: EngineProgress) => void; frames: unknown[]; meta: Partial<EngineMeta>; resolve: (v: unknown) => void; reject: (e: Error) => void; kind: "pose" | "detect" };

/** Copies a content:// or ph:// picker URI into app cache as a plain file the WebView can read. */
export async function localizeVideo(uri: string): Promise<string> {
  if (uri.startsWith("file://")) return uri;
  const dest = `${FileSystem.cacheDirectory}gaitai-input-${Date.now()}.mp4`;
  await FileSystem.copyAsync({ from: uri, to: dest });
  return dest;
}

export const AnalysisEngine = forwardRef<EngineHandle, { source: number }>(function AnalysisEngine({ source }, ref) {
  const web = useRef<{ postMessage(m: string): void } | null>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const pending = useRef<Pending | null>(null);

  useEffect(() => {
    let live = true;
    (async () => {
      const asset = Asset.fromModule(source);
      await asset.downloadAsync();
      // Serve from cache with file:// so the page and the video share a scheme.
      const dest = `${FileSystem.cacheDirectory}gaitai-engine.html`;
      const info = await FileSystem.getInfoAsync(dest);
      if (!info.exists || (asset.hash && info.exists && (info as { size?: number }).size !== undefined && false)) { /* fallthrough */ }
      await FileSystem.copyAsync({ from: asset.localUri ?? asset.uri, to: dest });
      if (live) setHtml(dest);
    })().catch(() => setReady(false));
    return () => { live = false; };
  }, [source]);

  const onMessage = useCallback((e: WebViewMessageEvent) => {
    let m: Record<string, unknown>;
    try { m = JSON.parse(e.nativeEvent.data); } catch { return; }
    const p = pending.current;
    if (m.type === "ready") { setReady(true); return; }
    if (!p) return;
    if (m.type === "stage") { p.meta = { ...p.meta, runtime: m.runtime as string, model: m.model as string, width: m.width as number, height: m.height as number, duration: m.duration as number }; p.onProgress({ stage: m.stage as EngineStage, fraction: 0.05, detail: m.model as string | undefined }); }
    else if (m.type === "progress") p.onProgress({ stage: "detecting", fraction: 0.05 + 0.85 * ((m.done as number) / (m.total as number)) });
    else if (m.type === "frame") {
      if (p.kind === "pose") {
        const lm = m.landmarks as number[][] | null;
        p.frames.push({ t: m.t as number, landmarks: lm ? lm.map(([x, y, z, visibility]) => ({ x, y, z, visibility } as Landmark)) : null });
      } else p.frames.push({ t: m.t as number, boxes: m.boxes as DetectionFrame["boxes"] });
    }
    else if (m.type === "done") { p.meta = { ...p.meta, frames: m.frames as number, fps: m.fps as number }; pending.current = null; p.resolve(p.kind === "pose" ? { instants: p.frames, meta: p.meta } : { frames: p.frames, meta: p.meta }); }
    else if (m.type === "error") { pending.current = null; p.reject(new Error(String(m.message))); }
  }, []);

  const start = useCallback((kind: "pose" | "detect", uri: string, opts: { sampleFps?: number; maxSeconds?: number }, onProgress: Pending["onProgress"]) =>
    new Promise<unknown>((resolve, reject) => {
      if (!web.current || !ready) { reject(new Error("The analysis engine is still starting. Try again in a moment.")); return; }
      if (pending.current) { reject(new Error("Another analysis is running.")); return; }
      pending.current = { onProgress, frames: [], meta: {}, resolve, reject, kind };
      onProgress({ stage: "preparing", fraction: 0.01 });
      web.current.postMessage(JSON.stringify({ cmd: kind, uri, sampleFps: opts.sampleFps ?? 10, maxSeconds: opts.maxSeconds ?? 20 }));
    }), [ready]);

  useImperativeHandle(ref, () => ({
    ready,
    runPose: (uri, opts, onProgress) => start("pose", uri, opts, onProgress) as Promise<{ instants: PoseInstant[]; meta: EngineMeta }>,
    runDetect: (uri, opts, onProgress) => start("detect", uri, opts, onProgress) as Promise<{ frames: DetectionFrame[]; meta: EngineMeta }>,
  }), [ready, start]);

  if (!html) return null;
  return (
    <View style={{ position: "absolute", width: 1, height: 1, opacity: 0, left: -10, top: -10 }} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <WebView
        ref={web}
        source={{ uri: html }}
        originWhitelist={["*"]}
        allowFileAccess
        allowFileAccessFromFileURLs
        allowUniversalAccessFromFileURLs
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        onMessage={onMessage}
        onError={() => setReady(false)}
        style={{ width: 1, height: 1, backgroundColor: "transparent" }}
      />
    </View>
  );
});
