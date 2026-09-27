import React, { useMemo, useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { catalogEntry, type AnalysisSession } from "@gaitai/core";
import { space } from "@gaitai/design-system";
import { useApp } from "../app-state";
import { Button, Card, Chip, EmptyState, Row, Screen, SectionTitle, Text } from "../primitives";
import { LineChart } from "../charts";
import { useTheme } from "../theme";
import { DemoBanner } from "../dev";

type Range = "7" | "30" | "90" | "all";
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });

/** Longitudinal dashboard (MobilityCare: Progress; SecureVision: Activity) plus the history list. */
export function ProgressScreen({ title }: { title: string }) {
  const t = useTheme(); const app = useApp(); const router = useRouter(); const insets = useSafeAreaInsets();
  const [range, setRange] = useState<Range>("30");
  const since = range === "all" ? 0 : Date.now() - Number(range) * 86400000;
  const inRange = useMemo(() => app.sessions.filter((s) => new Date(s.createdAt).getTime() >= since), [app.sessions, since]);
  const metricIds = app.product === "mobilitycare" ? [["cadence", "Cadence"], ["stepBalance", "Step-time balance"], ["stepCv", "Step-time variability"], ["sway", "Trunk sway"]] : [["average", "Average count"], ["peak", "Peak count"], ["entries", "Zone entries"], ["occupancy", "Zone occupancy"]];
  const series = (id: string) => inRange.slice().reverse().flatMap((s) => { const v = app.view(s); const m = [...v.free, ...(v.premium ?? [])].find((x) => x.id === id); return m && typeof m.value === "number" ? [{ t: new Date(s.createdAt).getTime(), v: m.value, label: fmtDate(s.createdAt), sub: catalogEntry(s.analysisProduct).name }] : []; });
  const premiumOnly = (id: string) => !app.isPro && inRange.some((s) => s.premiumMetrics.some((m) => m.id === id));
  const del = (s: AnalysisSession) => Alert.alert("Delete this analysis?", "The result and any kept video are removed from this phone.", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => app.deleteSession(s.id) }]);

  return (
    <Screen style={{ paddingTop: insets.top + space.md }} refreshing={false} onRefresh={app.reloadSessions}>
      <DemoBanner />
      <Text variant="title">{title}</Text>
      <Row gap={6} style={{ marginTop: space.md }}>{(["7", "30", "90", "all"] as Range[]).map((r) => <Pressable key={r} onPress={() => setRange(r)} accessibilityRole="tab" accessibilityState={{ selected: range === r }} style={{ paddingHorizontal: 14, minHeight: 40, justifyContent: "center", borderRadius: 999, backgroundColor: range === r ? t.accent : t.surface2 }}><Text variant="small" color={range === r ? t.accentInk : t.body}>{r === "all" ? "All" : `${r} days`}</Text></Pressable>)}</Row>
      {app.sessions.length === 0 ? <View style={{ marginTop: space.xl }}><EmptyState title="No analyses yet" body="Your first result will start your history and, from the second one, your trends." action={<Button label="Start an analysis" onPress={() => router.push("/(tabs)/analyze" as never)} />} /></View> : <>
        {metricIds.map(([id, label]) => { const pts = series(id); if (premiumOnly(id)) return <View key={id}><SectionTitle>{label}</SectionTitle><Card tone="premium" onPress={() => router.push("/paywall" as never)}><Text variant="bodyStrong" color={t.premium}>Trend included with Pro</Text><Text variant="mute">{inRange.length} scans in range hold this measurement.</Text></Card></View>; if (pts.length < 2) return null; return <View key={id}><SectionTitle>{label}</SectionTitle><Card><LineChart points={pts} formatX={(x) => fmtDate(new Date(x).toISOString())} unit={undefined} /></Card></View>; })}
        {inRange.length < 2 ? <Card tone="flat" style={{ marginTop: space.lg }}><Text variant="mute">Trends appear once two or more analyses fall in the selected range.</Text></Card> : null}
        <SectionTitle>History</SectionTitle>
        <View style={{ gap: space.sm }}>
          {inRange.map((s) => { const key = s.freeMetrics[0]; return (
            <Card key={s.id} onPress={() => router.push(`/result/${s.id}` as never)} style={{ paddingVertical: space.md }} accessibilityLabel={`${catalogEntry(s.analysisProduct).name} on ${fmtDate(s.createdAt)}`}>
              <Row style={{ justifyContent: "space-between" }}>
                <View style={{ flex: 1 }}><Row gap={8}><Text variant="bodyStrong">{catalogEntry(s.analysisProduct).name}</Text>{s.demo ? <Chip small tone="warning" label="Demo" /> : null}</Row><Text variant="mute" numberOfLines={1}>{s.summary}</Text></View>
                <View style={{ alignItems: "flex-end", gap: 4 }}><Text variant="mute">{fmtDate(s.createdAt)}</Text>{key ? <Text variant="bodyStrong">{key.value ?? "—"}{key.unit ? <Text variant="mute"> {key.unit}</Text> : null}</Text> : null}<Chip small tone={app.isPro ? "premium" : "neutral"} label={app.isPro ? "Full" : "Free"} /></View>
              </Row>
              <Row style={{ marginTop: space.sm, justifyContent: "flex-end" }} gap={space.md}><Pressable onPress={() => del(s)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Delete analysis" style={{ minHeight: 40, justifyContent: "center" }}><Text variant="small" color={t.danger}>Delete</Text></Pressable></Row>
            </Card>
          ); })}
        </View>
      </>}
    </Screen>
  );
}
