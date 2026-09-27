import React, { useEffect, useMemo, useState } from "react";
import { Modal, Share, View } from "react-native";
import { useRouter } from "expo-router";
import { analytics, catalogEntry, type AnalysisSession, type Metric } from "@gaitai/core";
import { space } from "@gaitai/design-system";
import { useApp } from "../app-state";
import { Button, Card, Chip, Divider, Row, Screen, SectionTitle, Text } from "../primitives";
import { LockedMetricCard, MetricCard } from "../metrics";
import { ContactTimeline, LineChart } from "../charts";
import { useTheme } from "../theme";

const fmtDate = (iso: string) => new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** Free metrics first, then what Pro adds (names only for free users), then quality and provenance. */
export function ResultScreen({ session }: { session: AnalysisSession }) {
  const t = useTheme(); const app = useApp(); const router = useRouter();
  const view = useMemo(() => app.view(session), [app, session]);
  const entry = catalogEntry(session.analysisProduct);
  const [explain, setExplain] = useState<Metric | null>(null);
  useEffect(() => { analytics.track("result_viewed", { product: app.product, analysis: session.analysisProduct, pro: app.isPro }); }, [app.product, app.isPro, session.analysisProduct]);
  const openPaywall = (label?: string) => { if (label) analytics.track("premium_locked_metric_tapped", { product: app.product, metric: label }); router.push({ pathname: "/paywall", params: { unlocked: String(view.free.length), locked: view.locked.map((l) => l.label).join("|") } } as never); };
  const share = async () => {
    const lines = [`${entry.name} · ${fmtDate(session.createdAt)}`, session.summary, ...view.free.map((m) => `${m.label}: ${m.value ?? "—"}${m.unit ? " " + m.unit : ""}`), ...(view.premium ?? []).map((m) => `${m.label}: ${m.value ?? "—"}${m.unit ? " " + m.unit : ""}`), "", "Measured on device by GaitAI. 2D estimates from one camera; not a diagnosis."];
    await Share.share({ message: lines.join("\n") }); await analytics.track("report_exported", { product: app.product, kind: "text" });
  };
  const timeline = (view.premium ?? []).find((m) => m.id === "contacts");
  const charts = (view.premium ?? []).filter((m) => m.series && m.series.length > 3 && m.id !== "contacts");

  return (
    <Screen footer={!app.isPro && view.locked.length ? <Button kind="premium" label="Unlock full analysis" onPress={() => openPaywall()} /> : <Button label="Share result" kind="secondary" onPress={share} />}>
      <View style={{ paddingTop: space.lg, gap: space.md }}>
        <Row style={{ justifyContent: "space-between" }}><Chip tone="accent" label={entry.name.toUpperCase()} />{session.demo ? <Chip tone="warning" label="DEMO DATA" /> : <Text variant="mute">{fmtDate(session.createdAt)}</Text>}</Row>
        <Text variant="title">Your {entry.name} result is ready.</Text>
        <Text variant="lead">{session.summary}</Text>
        <Text variant="mute">{view.free.length} insight{view.free.length === 1 ? "" : "s"} unlocked{view.locked.length ? ` · ${view.locked.length} more with Pro` : app.isPro ? " · full analysis" : ""}</Text>
      </View>

      <SectionTitle>Movement summary</SectionTitle>
      <View style={{ gap: space.md }}>{view.free.map((m, i) => <MetricCard key={m.id} metric={m} index={i} onExplain={setExplain} />)}</View>

      {view.premium ? <>
        <SectionTitle>Advanced insights</SectionTitle>
        <View style={{ gap: space.md }}>{view.premium.filter((m) => !m.series || m.series.length <= 3).map((m, i) => <MetricCard key={m.id} metric={m} index={i} onExplain={setExplain} />)}</View>
        {timeline?.series ? <><SectionTitle>Contact timeline</SectionTitle><Card><ContactTimeline contacts={timeline.series} duration={session.quality.durationSeconds} /><Text variant="mute" style={{ marginTop: space.sm }}>Left and right foot contacts detected over the clip.</Text></Card></> : null}
        {charts.map((m) => <View key={m.id}><SectionTitle>{m.label}</SectionTitle><Card><LineChart points={m.series!} unit={m.unit} /><Text variant="mute" style={{ marginTop: space.sm }}>{m.description}</Text></Card></View>)}
      </> : view.locked.length ? <>
        <SectionTitle>Advanced insights · Pro</SectionTitle>
        <Text variant="mute" style={{ marginBottom: space.md }}>{view.locked.length} more measurements were computed from this clip. Their values are stored and unlock with Pro.</Text>
        <View style={{ gap: space.md }}>{view.locked.map((m) => <LockedMetricCard key={m.id} metric={m} onPress={() => openPaywall(m.label)} />)}</View>
      </> : null}

      <SectionTitle>Quality &amp; provenance</SectionTitle>
      <Card style={{ gap: space.sm }}>
        <Row gap={6} style={{ flexWrap: "wrap" }}>{session.quality.flags.map((f) => <Chip key={f} small tone={f === "low-visibility" || f === "short-clip" || f === "no-subject-frames" || f === "dense-scene" ? "warning" : "neutral"} label={f.replace(/-/g, " ")} />)}</Row>
        {session.quality.notes.map((n, i) => <Text key={i} variant="small">{n}</Text>)}
        <Divider />
        <Text variant="mute">Model: {session.modelVersion}</Text>
        <Text variant="mute">Engine: on this device · {session.quality.framesAnalysed} frames at {session.quality.sampleFps}/s · {session.quality.durationSeconds}s</Text>
        <Text variant="mute">Movement indicators, not a diagnosis. Discuss health concerns with a clinician.</Text>
      </Card>

      <Modal visible={!!explain} transparent animationType="slide" onRequestClose={() => setExplain(null)}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.35)" }}>
          <View style={{ backgroundColor: t.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: space.xl, gap: space.md, paddingBottom: space.xxl }} accessibilityViewIsModal>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: t.lineStrong, alignSelf: "center" }} />
            <Text variant="heading">{explain?.label}</Text>
            <Text variant="metric">{explain?.value ?? "—"}{explain?.unit ? <Text variant="mute"> {explain.unit}</Text> : null}</Text>
            <Text>{explain?.description}</Text>
            <Text variant="mute">Confidence in this measurement: {Math.round((explain?.confidence ?? 0) * 100)}%. Based on how clearly the body was seen and how long the clip was.</Text>
            <Button kind="secondary" label="Close" onPress={() => setExplain(null)} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
