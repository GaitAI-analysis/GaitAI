import React, { useCallback, useRef, useState } from "react";
import { Image, View, PanResponder, type LayoutChangeEvent } from "react-native";
import Svg, { Circle, Polygon, Line } from "react-native-svg";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as VideoThumbnails from "expo-video-thumbnails";
import * as Haptics from "expo-haptics";
import { analytics, type AnalysisSession } from "@gaitai/core";
import { buildCrowdSession, buildZoneSession, demoDetectionFrames, diag, localizeVideo, toEngineError, EngineError, type EngineProgress, type Point } from "@gaitai/analysis";
import { space, radius } from "@gaitai/design-system";
import { useApp } from "../app-state";
import { EngineFooterNote, EnginePreparing, useEngineGate } from "../engine-status";
import { Button, Card, Chip, Row, Screen, Text } from "../primitives";
import { useTheme } from "../theme";
import { ProcessingScreen, DETECT_STAGES } from "./Processing";
import { DemoBanner } from "../dev";

type Kind = "crowdsense" | "zone";
type Step = "intro" | "zone" | "processing";

const COPY = {
  crowdsense: { chip: "CROWDSENSE", title: "How many people, and when.", lead: "Upload footage of a space you are authorised to analyse. A person detector runs on this phone and counts who it can see, frame by frame.", free: "Free: current, average and peak counts. Pro: the density timeline, per-frame counts and export." },
  zone: { chip: "ZONE & OCCUPANCY", title: "Draw a zone. Count what crosses it.", lead: "Upload footage, draw a zone on the first frame, and see entries, occupancy and dwell for that area.", free: "Free: total entries and current occupancy. Pro: the event list with timestamps, occupancy timeline, dwell and export." },
} as const;

async function discard(uri: string | null) {
  if (!uri || !uri.startsWith("file://")) return;
  try { const FS = await import("expo-file-system/legacy"); await FS.deleteAsync(uri, { idempotent: true }); } catch { /* best effort */ }
}

export function CrowdScreen({ kind }: { kind: Kind }) {
  const t = useTheme(); const app = useApp(); const router = useRouter();
  const gate = useEngineGate();
  const [step, setStep] = useState<Step>("intro");
  const [progress, setProgress] = useState<EngineProgress>({ stage: "engine", fraction: 0 });
  const [error, setError] = useState<EngineError | null>(null);
  const [uri, setUri] = useState<string | null>(null);
  const [thumb, setThumb] = useState<{ uri: string; w: number; h: number } | null>(null);
  const [points, setPoints] = useState<Point[]>([]); const [zoneName, setZoneName] = useState("Zone 1");
  const [box, setBox] = useState({ w: 0, h: 0 });
  const dragging = useRef<number | null>(null);
  const keepVideos = !!app.profile?.privacy.keepVideos;

  const analyse = useCallback(async (video: string | null) => {
    setStep("processing"); setError(null);
    setProgress(app.engineReady ? { stage: "preparing", fraction: 0.02 } : { stage: "engine", fraction: 0.01, detail: app.engineStatus.detail });
    await analytics.track("analysis_started", { product: "securevision", analysis: kind, demo: app.demoMode });
    try {
      let session: AnalysisSession; const ctx = { userId: app.profile?.id ?? "local", inputType: "uploaded-video" as const };
      const zone = { name: zoneName, points };
      if (video == null) {
        if (!(__DEV__ && app.demoMode)) throw new EngineError("VIDEO_DECODE_FAILED", "No video was provided.");
        const frames = demoDetectionFrames(); setProgress({ stage: "detecting", fraction: 0.5 }); await new Promise((r) => setTimeout(r, 500)); setProgress({ stage: "tracking", fraction: 0.8 });
        const meta = { runtime: "demo", model: "synthetic-detections", width: 0, height: 0, duration: 15, frames: frames.length, fps: 5, withSubject: frames.length };
        session = kind === "zone" ? buildZoneSession(frames, meta, zone, { ...ctx, media: null, demo: true }) : buildCrowdSession(frames, meta, { ...ctx, media: null, demo: true });
      } else {
        diag.log("video selected", { input: "uploaded-video", analysis: kind });
        const engine = app.engine.current; if (!engine) throw new EngineError("ENGINE_INITIALIZATION_FAILED", "The analysis engine is not available.");
        const { frames, meta } = await engine.runDetect(video, { sampleFps: 5, maxSeconds: 20 }, setProgress);
        setProgress({ stage: "tracking", fraction: 0.92 });
        // Real inference ran. A count of zero people is a genuine answer; a clip too short to sample is not.
        if (frames.length < 3) throw new EngineError("INSUFFICIENT_VALID_FRAMES", `Only ${frames.length} frames could be sampled from this clip.`);
        const media = { uri: video, mimeType: "video/mp4", durationSeconds: meta.duration, width: meta.width, height: meta.height, retained: keepVideos };
        session = kind === "zone" ? buildZoneSession(frames, meta, zone, { ...ctx, media, demo: false }) : buildCrowdSession(frames, meta, { ...ctx, media, demo: false });
        diag.log("metrics calculated", { analysis: kind, frames: meta.frames, framesWithPeople: meta.withSubject });
        if (!keepVideos) await discard(video);
      }
      setProgress({ stage: "reporting", fraction: 0.98 }); await app.saveSession(session);
      await analytics.track("analysis_completed", { product: "securevision", analysis: kind, demo: session.demo });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.replace(`/result/${session.id}` as never);
    } catch (e) {
      const err = toEngineError(e);
      if (err.code === "CANCELLED") { setStep("intro"); return; }
      await analytics.track("analysis_failed", { product: "securevision", analysis: kind, code: err.code });
      diag.error(`analysis failed (${kind})`, { code: err.code, message: err.message });
      setError(err);
    }
  }, [app, keepVideos, kind, points, router, zoneName]);

  const pick = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["videos"], quality: 1 });
    if (r.canceled || !r.assets[0]) return;
    if ((r.assets[0].duration ?? 0) > 120000) { setError(new EngineError("VIDEO_TOO_LONG", "Clip over 120 seconds.")); setStep("processing"); return; }
    const local = await localizeVideo(r.assets[0].uri); setUri(local);
    if (kind === "crowdsense") { analyse(local); return; }
    try { const th = await VideoThumbnails.getThumbnailAsync(local, { time: 500 }); setThumb({ uri: th.uri, w: th.width, h: th.height }); } catch { setThumb(null); }
    setPoints([{ x: 0.2, y: 0.3 }, { x: 0.8, y: 0.3 }, { x: 0.8, y: 0.85 }, { x: 0.2, y: 0.85 }]); setStep("zone");
  };

  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true, onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => { const { locationX: x, locationY: y } = e.nativeEvent; let best = -1, bd = 28; points.forEach((p, i) => { const d = Math.hypot(p.x * box.w - x, p.y * box.h - y); if (d < bd) { bd = d; best = i; } }); dragging.current = best >= 0 ? best : null; if (best >= 0) Haptics.selectionAsync().catch(() => {}); },
    onPanResponderMove: (e) => { const i = dragging.current; if (i == null || !box.w) return; const { locationX: x, locationY: y } = e.nativeEvent; setPoints((ps) => ps.map((p, k) => (k === i ? { x: Math.min(1, Math.max(0, x / box.w)), y: Math.min(1, Math.max(0, y / box.h)) } : p))); },
    onPanResponderRelease: () => { dragging.current = null; },
  })).current;
  const addPoint = () => setPoints((ps) => { const a = ps[ps.length - 1], b = ps[0]; return [...ps, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }]; });
  const removePoint = () => setPoints((ps) => (ps.length > 3 ? ps.slice(0, -1) : ps));

  const leaveProcessing = (to: Step) => { app.engine.current?.cancel(); setError(null); if (to === "intro") { if (!keepVideos) discard(uri); setUri(null); } setStep(to); };

  if (step === "processing") return (
    <ProcessingScreen
      title={kind === "zone" ? "Analysing your zone" : "Counting people"} chip={COPY[kind].chip} stages={DETECT_STAGES} progress={progress} error={error}
      onCancel={() => leaveProcessing(kind === "zone" && uri ? "zone" : "intro")}
      actions={{
        onRetryInit: uri ? async () => { setError(null); setProgress({ stage: "engine", fraction: 0.01, detail: "Restarting engine" }); try { await app.retryEngine(); } catch { /* analyse() reports the new engine error */ } analyse(uri); } : undefined,
        onRetrySame: uri ? () => analyse(uri) : undefined,
        onAnotherVideo: () => { if (!keepVideos) discard(uri); setUri(null); setError(null); pick(); },
      }}
    />
  );

  if (step === "zone") {
    const ar = thumb ? thumb.w / thumb.h : 16 / 9;
    return (
      <Screen footer={<View style={{ gap: space.sm }}><EngineFooterNote /><Button label={`Analyse “${zoneName}”`} onPress={() => analyse(uri)} disabled={points.length < 3 || !gate.ready} /><Button kind="ghost" label="Back" onPress={() => setStep("intro")} /></View>}>
        <View style={{ paddingTop: space.lg, gap: space.md }}>
          <Chip tone="accent" label="DRAW YOUR ZONE" />
          <Text variant="heading">Drag the corners. Add or remove points.</Text>
          <View onLayout={(e: LayoutChangeEvent) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.width / ar })} style={{ width: "100%", aspectRatio: ar, borderRadius: radius.lg, overflow: "hidden", backgroundColor: t.surface2 }} {...pan.panHandlers} accessible accessibilityLabel={`Zone with ${points.length} corners over the first frame. Drag corners to reshape.`}>
            {thumb ? <Image source={{ uri: thumb.uri }} style={{ position: "absolute", width: "100%", height: "100%" }} accessibilityIgnoresInvertColors /> : null}
            {box.w ? <Svg width={box.w} height={box.h} style={{ position: "absolute" }}>
              <Polygon points={points.map((p) => `${p.x * box.w},${p.y * box.h}`).join(" ")} fill={t.accent} fillOpacity={0.18} stroke={t.accent} strokeWidth={2} />
              {points.map((p, i) => { const n = points[(i + 1) % points.length]; return <Line key={`l${i}`} x1={p.x * box.w} y1={p.y * box.h} x2={n.x * box.w} y2={n.y * box.h} stroke={t.accent} strokeWidth={2} />; })}
              {points.map((p, i) => <Circle key={i} cx={p.x * box.w} cy={p.y * box.h} r={12} fill={t.bg} stroke={t.accent} strokeWidth={3} />)}
            </Svg> : null}
          </View>
          <Row gap={space.sm}><Button kind="secondary" label="Add point" onPress={addPoint} style={{ flex: 1 }} /><Button kind="secondary" label="Remove point" onPress={removePoint} disabled={points.length <= 3} style={{ flex: 1 }} /></Row>
          <Card style={{ gap: 6 }}><Text variant="label">Zone name</Text><Row gap={space.sm} style={{ flexWrap: "wrap" }}>{["Zone 1", "Entrance", "Checkout", "Platform", "Restricted area"].map((n) => <Button key={n} kind={zoneName === n ? "primary" : "secondary"} label={n} onPress={() => setZoneName(n)} style={{ minHeight: 40, paddingHorizontal: 14 }} />)}</Row></Card>
          <Text variant="mute">A person counts as inside when the bottom-centre of their detection box is within the zone.</Text>
        </View>
      </Screen>
    );
  }

  const c = COPY[kind];
  const locked = !gate.ready;
  return (
    <Screen footer={<View style={{ gap: space.sm }}><EngineFooterNote /><Button label="Upload a video" onPress={pick} disabled={locked} accessibilityHint={locked ? "Available when the detection engine is ready" : undefined} />{__DEV__ && app.demoMode ? <Button kind="ghost" label="Run with demo data (DEV)" onPress={() => { if (kind === "zone") setPoints([{ x: 0.2, y: 0.3 }, { x: 0.8, y: 0.3 }, { x: 0.8, y: 0.85 }, { x: 0.2, y: 0.85 }]); analyse(null); }} /> : null}</View>}>
      <View style={{ paddingTop: space.lg, gap: space.lg }}>
        <DemoBanner />
        <Chip tone="accent" label={c.chip} />
        <Text variant="title">{c.title}</Text>
        <Text variant="lead">{c.lead}</Text>
        <EnginePreparing product="securevision" />
        <Card style={{ gap: space.sm }}><Text variant="bodyStrong">Before you start</Text><Text>Only analyse footage you own or are authorised to analyse. The detector finds people as boxes; it does not identify anyone and no frames leave this phone.</Text></Card>
        <Card tone="flat"><Text variant="mute">{c.free} Counts are people visible to the detector, not a crowd-density estimate.</Text></Card>
      </View>
    </Screen>
  );
}
