import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { catalogFor, catalogEntry, type AnalysisProductId } from "@gaitai/core";
import { space } from "@gaitai/design-system";
import { useApp } from "../app-state";
import { Button, Card, Chip, Row, Screen, SectionTitle, Text } from "../primitives";
import { useTheme } from "../theme";
import { DemoBanner } from "../dev";

export function AnalyzeScreen() {
  const t = useTheme(); const app = useApp(); const router = useRouter(); const insets = useSafeAreaInsets();
  const catalog = catalogFor(app.product);
  const available = catalog.filter((c) => c.availability === "available"), soon = catalog.filter((c) => c.availability !== "available");
  return (
    <Screen style={{ paddingTop: insets.top + space.md }}>
      <DemoBanner />
      <Text variant="title">Analyze</Text>
      <Text style={{ marginTop: 6 }}>Every analysis here runs on this phone. Only products with a working analysis can be started.</Text>
      <SectionTitle>Available</SectionTitle>
      <View style={{ gap: space.md }}>
        {available.map((c) => (
          <Card key={c.id} onPress={() => router.push(c.route as never)} accessibilityLabel={`${c.name}. ${c.promise}`} style={{ gap: space.sm }}>
            <Row style={{ justifyContent: "space-between" }}><Text variant="heading">{c.name}</Text><Text color={t.accent}>→</Text></Row>
            <Text>{c.promise}</Text>
            <Text variant="mute">{c.input}</Text>
            <Row gap={6} style={{ flexWrap: "wrap" }}>{c.freeMetricLabels.map((l) => <Chip key={l} small tone="accent" label={l} />)}{c.premiumMetricLabels.slice(0, 2).map((l) => <Chip key={l} small tone="premium" label={`${l} · Pro`} />)}{c.premiumMetricLabels.length > 2 ? <Chip small tone="premium" label={`+${c.premiumMetricLabels.length - 2} Pro`} /> : null}</Row>
          </Card>
        ))}
      </View>
      {soon.length ? <>
        <SectionTitle>Coming soon</SectionTitle>
        <View style={{ gap: space.sm }}>
          {soon.map((c) => <Card key={c.id} tone="flat" onPress={() => router.push(`/coming-soon/${c.id}` as never)} style={{ paddingVertical: space.md }}><Row style={{ justifyContent: "space-between" }}><View style={{ flex: 1 }}><Text variant="bodyStrong">{c.name}</Text><Text variant="mute" numberOfLines={2}>{c.reason}</Text></View><Chip small label="Soon" /></Row></Card>)}
        </View>
      </> : null}
    </Screen>
  );
}

export function ComingSoonScreen({ id }: { id: AnalysisProductId }) {
  const c = catalogEntry(id); const router = useRouter(); const t = useTheme();
  return (
    <Screen footer={<Button label="Back to Analyze" kind="secondary" onPress={() => router.back()} />}>
      <View style={{ paddingTop: space.xl, gap: space.lg }}>
        <Chip label="COMING SOON" />
        <Text variant="title">{c.name}</Text>
        <Text variant="lead">{c.promise}</Text>
        <Card style={{ gap: space.sm }}><Text variant="label">What it would measure</Text><Text>{c.measures}</Text></Card>
        <Card tone="flat" style={{ gap: space.sm }}><Text variant="label">Why it is not available yet</Text><Text>{c.reason}</Text><Text variant="mute">GaitAI only ships analyses that actually run. This one will appear here when its pipeline exists.</Text></Card>
        <Text variant="mute" color={t.mute}>Input: {c.input}</Text>
      </View>
    </Screen>
  );
}
