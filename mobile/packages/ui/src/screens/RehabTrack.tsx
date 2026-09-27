import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { analytics, type AnalysisSession } from "@gaitai/core";
import { buildRehabSession } from "@gaitai/analysis";
import { space, radius } from "@gaitai/design-system";
import { useApp } from "../app-state";
import { Button, Card, Chip, EmptyState, Row, Screen, SectionTitle, Text } from "../primitives";
import { useTheme } from "../theme";
import { DemoBanner } from "../dev";

const fmt = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });

/** Pick a baseline and a newer scan; the comparison is stored as its own session. */
export function RehabTrackScreen() {
  const t = useTheme(); const app = useApp(); const router = useRouter();
  const scans = app.sessions.filter((s) => s.analysisProduct === "walkscan");
  const [base, setBase] = useState<string | null>(scans[scans.length - 1]?.id ?? null);
  const [latest, setLatest] = useState<string | null>(scans[0]?.id ?? null);
  const [busy, setBusy] = useState(false);
  const pickList = (sel: string | null, set: (id: string) => void, label: string) => (
    <View style={{ gap: space.sm }}>{scans.map((s) => <Pressable key={s.id} onPress={() => set(s.id)} accessibilityRole="radio" accessibilityState={{ checked: sel === s.id }} accessibilityLabel={`${label}: scan from ${fmt(s.createdAt)}`} style={{ padding: space.md, borderRadius: radius.md, backgroundColor: sel === s.id ? t.accentSoft : t.surface, borderWidth: 1, borderColor: sel === s.id ? t.accent : t.line }}><Row style={{ justifyContent: "space-between" }}><Text variant="bodyStrong">{fmt(s.createdAt)}</Text><Text variant="mute">{s.freeMetrics[0]?.value ?? "—"} {s.freeMetrics[0]?.unit}</Text></Row><Text variant="mute" numberOfLines={1}>{s.summary}</Text></Pressable>)}</View>
  );
  const compare = async () => {
    const a = scans.find((s) => s.id === base), b = scans.find((s) => s.id === latest); if (!a || !b) return;
    setBusy(true); await analytics.track("analysis_started", { product: "mobilitycare", analysis: "rehabtrack" });
    const [older, newer] = new Date(a.createdAt) <= new Date(b.createdAt) ? [a, b] : [b, a];
    const s: AnalysisSession = buildRehabSession(older, newer, { userId: app.profile?.id ?? "local", demo: older.demo || newer.demo });
    await app.saveSession(s); await analytics.track("analysis_completed", { product: "mobilitycare", analysis: "rehabtrack" }); setBusy(false);
    router.replace(`/result/${s.id}` as never);
  };
  return (
    <Screen footer={scans.length >= 2 ? <Button label="Compare" onPress={compare} loading={busy} disabled={!base || !latest || base === latest} /> : <Button label="Run a WalkScan" onPress={() => router.push("/analyze/walkscan" as never)} />}>
      <View style={{ paddingTop: space.lg, gap: space.lg }}>
        <DemoBanner />
        <Chip tone="accent" label="REHABTRACK" />
        <Text variant="title">Compare a new scan with your baseline.</Text>
        <Text variant="lead">Changes are differences between two of your own WalkScans, in the units they were measured in.</Text>
        {scans.length < 2 ? <EmptyState title={scans.length === 0 ? "No WalkScans yet" : "One more scan needed"} body="RehabTrack compares two WalkScan sessions. Record a baseline, then a follow-up." /> : <>
          <SectionTitle>Baseline</SectionTitle>{pickList(base, setBase, "Baseline")}
          <SectionTitle>New assessment</SectionTitle>{pickList(latest, setLatest, "New assessment")}
          <Card tone="flat"><Text variant="mute">Free: cadence change and balance change. Pro: every metric compared, trend graph, side-by-side timelines and the report.</Text></Card>
        </>}
      </View>
    </Screen>
  );
}
