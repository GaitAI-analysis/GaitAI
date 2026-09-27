import React, { useCallback, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { analytics, type AnalysisSession } from "@gaitai/core";
import { buildWalkScanSession, demoPoseInstants, localizeVideo, type EngineProgress } from "@gaitai/analysis";
import { space, radius } from "@gaitai/design-system";
import { useApp } from "../app-state";
import { Button, Card, Chip, Row, Screen, Text } from "../primitives";
import { useTheme } from "../theme";
import { ProcessingScreen, POSE_STAGES } from "./Processing";
import { DemoBanner } from "../dev";

type Step = "guide" | "record" | "processing";
const GUIDE = [
  ["Prop the phone", "Waist height, landscape or portrait, on a stable surface."],
  ["Whole body in frame", "Head to feet visible for the whole walk, about 3–5 m away."],
  ["Walk naturally", "Back and forth, or across the frame, for 10–20 seconds."],
  ["Good light", "Even light, plain background if you can. Avoid strong backlight."],
];

export function WalkScanScreen() {
  const t = useTheme(); const app = useApp(); const router = useRouter();
  const [step, setStep] = useState<Step>("guide");
  const [progress, setProgress] = useState<EngineProgress>({ stage: "preparing", fraction: 0 });
  const [error, setError] = useState<string | null>(null);
  const [perm, requestPerm] = useCameraPermissions();
  const cam = useRef<CameraView>(null);
  const [recording, setRecording] = useState(false); const [count, setCount] = useState<number | null>(null); const [elapsed, setElapsed] = useState(0);
  const lastUri = useRef<string | null>(null);

  const analyse = useCallback(async (uri: string | null, inputType: AnalysisSession["inputType"]) => {
    setStep("processing"); setError(null); setProgress({ stage: "preparing", fraction: 0.02 });
    await analytics.track("analysis_started", { product: "mobilitycare", analysis: "walkscan", input: inputType, demo: app.demoMode });
    try {
      const previous = app.sessions.find((s) => s.analysisProduct === "walkscan");
      let session: AnalysisSession;
      if (uri == null) {
        if (!(__DEV__ && app.demoMode)) throw new Error("No video was provided.");
        const instants = demoPoseInstants(); setProgress({ stage: "detecting", fraction: 0.6 }); await new Promise((r) => setTimeout(r, 600));
        setProgress({ stage: "computing", fraction: 0.92 });
        session = buildWalkScanSession(instants, { runtime: "demo", model: "synthetic-gait", width: 0, height: 0, duration: 12, frames: instants.length, fps: 10 }, { userId: app.profile?.id ?? "local", inputType, media: null, demo: true }, previous);
      } else {
        const local = await localizeVideo(uri); lastUri.current = local;
        const engine = app.engine.current; if (!engine) throw new Error("The analysis engine is not available.");
        const { instants, meta } = await engine.runPose(local, { sampleFps: 10, maxSeconds: 20 }, setProgress);
        setProgress({ stage: "computing", fraction: 0.92 });
        session = buildWalkScanSession(instants, meta, { userId: app.profile?.id ?? "local", inputType, media: { uri: local, mimeType: "video/mp4", durationSeconds: meta.duration, width: meta.width, height: meta.height, retained: !!app.profile?.privacy.keepVideos }, demo: false }, previous);
        if (!app.profile?.privacy.keepVideos) { try { const FS = await import("expo-file-system/legacy"); await FS.deleteAsync(local, { idempotent: true }); } catch { /* best effort */ } }
      }
      setProgress({ stage: "reporting", fraction: 0.98 });
      await app.saveSession(session);
      await analytics.track("analysis_completed", { product: "mobilitycare", analysis: "walkscan", demo: session.demo });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.replace(`/result/${session.id}` as never);
    } catch (e) { await analytics.track("analysis_failed", { product: "mobilitycare", analysis: "walkscan" }); setError(e instanceof Error ? e.message : String(e)); }
  }, [app, router]);

  const pick = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["videos"], quality: 1, videoMaxDuration: 60 });
    if (r.canceled || !r.assets[0]) return;
    if ((r.assets[0].duration ?? 0) > 60000) { setError("Please choose a clip under 60 seconds; the first 20 seconds are analysed."); setStep("processing"); return; }
    analyse(r.assets[0].uri, "uploaded-video");
  };

  const startRecording = async () => {
    setCount(3); for (let i = 3; i > 0; i--) { setCount(i); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}); await new Promise((r) => setTimeout(r, 900)); } setCount(null);
    setRecording(true); setElapsed(0);
    const timer = setInterval(() => setElapsed((v) => v + 1), 1000);
    try { const v = await cam.current?.recordAsync({ maxDuration: 20 }); clearInterval(timer); setRecording(false); if (v?.uri) analyse(v.uri, "recorded-video"); else setError("Recording did not produce a video."); }
    catch (e) { clearInterval(timer); setRecording(false); setError(e instanceof Error ? e.message : "Recording failed."); setStep("processing"); }
  };
  useEffect(() => () => { if (recording) cam.current?.stopRecording(); }, [recording]);

  if (step === "processing") return <ProcessingScreen title="Analysing your walk" stages={POSE_STAGES} progress={progress} error={error} onCancel={() => { setError(null); setStep("guide"); }} onRetry={lastUri.current ? () => analyse(lastUri.current, "uploaded-video") : undefined} />;

  if (step === "record") {
    if (!perm?.granted) return <Screen footer={<View style={{ gap: space.sm }}><Button label={perm?.canAskAgain === false ? "Open settings" : "Allow camera"} onPress={() => perm?.canAskAgain === false ? import("react-native").then(({ Linking }) => Linking.openSettings()) : requestPerm()} /><Button kind="secondary" label="Upload a video instead" onPress={pick} /><Button kind="ghost" label="Back" onPress={() => setStep("guide")} /></View>}><View style={{ paddingTop: space.xl, gap: space.md }}><Text variant="title">Camera access</Text><Text>WalkScan records a short walking video and analyses it on this phone. The recording is made without sound{app.profile?.privacy.keepVideos ? "." : " and deleted after analysis."}</Text>{perm?.canAskAgain === false ? <Card tone="flat"><Text variant="mute">Camera access was declined. You can allow it in Settings, or upload an existing video.</Text></Card> : null}</View></Screen>;
    return (
      <Screen scroll={false} padded={false} footer={<View style={{ gap: space.sm }}>{recording ? <Button kind="danger" label={`Stop · ${elapsed}s`} onPress={() => cam.current?.stopRecording()} /> : <Button label={count != null ? `Starting in ${count}…` : "Start recording"} onPress={startRecording} disabled={count != null} />}{!recording ? <Button kind="ghost" label="Back" onPress={() => setStep("guide")} /> : null}</View>}>
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          <CameraView ref={cam} style={{ flex: 1 }} facing="back" mode="video" mute videoQuality="720p" />
          <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, alignItems: "center", justifyContent: "space-between", padding: space.lg }}>
            <Chip tone={recording ? "danger" : "neutral"} label={recording ? `RECORDING · ${elapsed}s / 20s` : count != null ? String(count) : "Whole body in frame"} />
            <View style={{ width: "62%", height: "78%", borderWidth: 1.5, borderColor: recording ? t.danger : "rgba(255,255,255,0.7)", borderRadius: radius.xl, borderStyle: "dashed" }} />
            <Text variant="small" color="#fff" style={{ textAlign: "center" }}>{recording ? "Walk naturally. Stops automatically at 20 s." : "Keep head and feet inside the frame. 10–20 seconds."}</Text>
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen footer={<View style={{ gap: space.sm }}><Button label="Record a walking video" onPress={() => setStep("record")} /><Button kind="secondary" label="Upload a walking video" onPress={pick} />{__DEV__ && app.demoMode ? <Button kind="ghost" label="Run with demo data (DEV)" onPress={() => analyse(null, "uploaded-video")} /> : null}</View>}>
      <View style={{ paddingTop: space.lg, gap: space.lg }}>
        <DemoBanner />
        <Chip tone="accent" label="WALKSCAN" />
        <Text variant="title">Read your walk from a short video.</Text>
        <Text variant="lead">Ten to twenty seconds is enough. The analysis runs on this phone and you get cadence and step-time balance straight away.</Text>
        <View style={{ gap: space.sm }}>{GUIDE.map(([h, b], i) => <Card key={h} style={{ paddingVertical: space.md }}><Row gap={space.md}><View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: t.accentSoft, alignItems: "center", justifyContent: "center" }}><Text variant="bodyStrong" color={t.accent}>{i + 1}</Text></View><View style={{ flex: 1 }}><Text variant="bodyStrong">{h}</Text><Text variant="mute">{b}</Text></View></Row></Card>)}</View>
        <Card tone="flat"><Text variant="mute">Free: cadence and step-time balance. Pro adds variability, regularity, trunk sway, the contact timeline and trends. All values are 2D estimates from one camera and are not a diagnosis.</Text></Card>
      </View>
    </Screen>
  );
}
