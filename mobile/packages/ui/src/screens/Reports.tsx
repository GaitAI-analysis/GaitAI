import React from "react";
import { Share, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { analytics, catalogEntry } from "@gaitai/core";
import { space } from "@gaitai/design-system";
import { useApp } from "../app-state";
import { Button, Card, Chip, EmptyState, Row, Screen, SectionTitle, Text } from "../primitives";
import { useTheme } from "../theme";
import { DemoBanner } from "../dev";

/** Reports: every completed analysis as a shareable text report; PDF export is a Pro item that arrives with the report service. */
export function ReportsScreen() {
  const t = useTheme(); const app = useApp(); const router = useRouter(); const insets = useSafeAreaInsets();
  const share = async (id: string) => {
    const s = app.sessions.find((x) => x.id === id); if (!s) return; const v = app.view(s);
    const lines = [`GaitAI ${catalogEntry(s.analysisProduct).name} report`, new Date(s.createdAt).toLocaleString(), "", s.summary, "", ...v.free.map((m) => `${m.label}: ${m.value ?? "—"}${m.unit ? " " + m.unit : ""} — ${m.description}`), ...(v.premium ?? []).map((m) => `${m.label}: ${m.value ?? "—"}${m.unit ? " " + m.unit : ""} — ${m.description}`), "", "Quality notes:", ...s.quality.notes.map((n) => `• ${n}`), "", `Model: ${s.modelVersion}`, "Measured on device. Movement indicators, not a diagnosis."];
    await Share.share({ message: lines.join("\n") }); await analytics.track("report_exported", { product: app.product, kind: "text" });
  };
  return (
    <Screen style={{ paddingTop: insets.top + space.md }}>
      <DemoBanner />
      <Text variant="title">Reports</Text>
      <Text style={{ marginTop: 6 }}>Each analysis becomes a report you can read, share and compare with your own history.</Text>
      {!app.isPro ? <Card tone="premium" style={{ marginTop: space.lg }} onPress={() => router.push("/paywall" as never)}><Text variant="label" color={t.premium}>Pro reports</Text><Text style={{ marginTop: 4 }}>Full metrics, charts and PDF export in every report. Free reports include the free measurements.</Text></Card> : null}
      <SectionTitle>Your reports</SectionTitle>
      {app.sessions.length === 0 ? <EmptyState title="No reports yet" body="Run an analysis and its report appears here." action={<Button label="Analyze" onPress={() => router.push("/(tabs)/analyze" as never)} />} /> : (
        <View style={{ gap: space.sm }}>{app.sessions.map((s) => (
          <Card key={s.id} onPress={() => router.push(`/result/${s.id}` as never)} style={{ paddingVertical: space.md, gap: space.sm }}>
            <Row style={{ justifyContent: "space-between" }}><Text variant="bodyStrong">{catalogEntry(s.analysisProduct).name}</Text><Text variant="mute">{new Date(s.createdAt).toLocaleDateString()}</Text></Row>
            <Text variant="mute" numberOfLines={2}>{s.summary}</Text>
            <Row gap={space.sm}><Chip small tone={app.isPro ? "premium" : "neutral"} label={app.isPro ? "Full report" : "Free report"} /><Button kind="ghost" label="Share" onPress={() => share(s.id)} style={{ minHeight: 36, paddingHorizontal: 8 }} /></Row>
          </Card>
        ))}</View>
      )}
      <Card tone="flat" style={{ marginTop: space.xl }}><Text variant="mute">PDF export and sharing with a clinician or professional arrive with the report service; reports are shared as text today.</Text></Card>
    </Screen>
  );
}
