import React, { useMemo, useState } from "react";
import { Image, View, type ImageSourcePropType } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { catalogFor, type AnalysisSession } from "@gaitai/core";
import { productMeta, space } from "@gaitai/design-system";
import { useApp } from "../app-state";
import { Button, Card, Chip, Row, Screen, SectionTitle, Skeleton, Text } from "../primitives";
import { Sparkline } from "../charts";
import { useTheme } from "../theme";
import { DemoBanner } from "../dev";

const greeting = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; };
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });

export function HomeScreen({ mark }: { mark: ImageSourcePropType }) {
  const t = useTheme(); const app = useApp(); const router = useRouter(); const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const catalog = catalogFor(app.product);
  const primary = catalog.find((c) => c.availability === "available")!;
  const latest = app.sessions[0] as AnalysisSession | undefined;
  const key = app.product === "mobilitycare" ? "cadence" : "average";
  const trend = useMemo(() => app.sessions.filter((s) => s.analysisProduct === primary.id).slice(0, 8).reverse().map((s) => ({ v: Number(s.freeMetrics.find((m) => m.id === key)?.value ?? 0) })), [app.sessions, primary.id, key]);
  const delta = trend.length >= 2 ? +(trend[trend.length - 1].v - trend[trend.length - 2].v).toFixed(1) : null;
  const name = app.profile?.displayName?.trim();

  return (
    <Screen refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await app.reloadSessions(); setRefreshing(false); }} style={{ paddingTop: insets.top + space.md }}>
      <DemoBanner />
      <Row style={{ justifyContent: "space-between" }}>
        <Row gap={10}><Image source={mark} style={{ width: 32, height: 32, borderRadius: 9 }} accessibilityIgnoresInvertColors /><Text variant="label">{productMeta[app.product].short}</Text></Row>
        <Chip tone={app.isPro ? "premium" : "neutral"} label={app.isPro ? (app.entitlement.source === "dev" ? "PRO · DEV" : "PRO") : "FREE"} />
      </Row>
      <Text variant="hero" style={{ marginTop: space.xl }}>{greeting()}{name ? `, ${name}` : ""}.</Text>
      {app.loading ? <View style={{ gap: space.md, marginTop: space.lg }}><Skeleton height={120} radius={20} /><Skeleton height={80} radius={20} /></View> : (
        <>
          <Card tone="accent" style={{ marginTop: space.lg, gap: space.md }}>
            <Text variant="label" color={t.accent}>{latest ? "Recommended" : "Start here"}</Text>
            <Text variant="heading">{primary.name}</Text>
            <Text>{primary.promise} {primary.input}.</Text>
            <Button label={`Start ${primary.name}`} onPress={() => router.push(primary.route as never)} />
          </Card>

          {latest ? <>
            <SectionTitle action={{ label: "History", onPress: () => router.push("/(tabs)/progress" as never) }}>Recent</SectionTitle>
            <Card onPress={() => router.push(`/result/${latest.id}` as never)} accessibilityLabel={`Latest ${latest.analysisProduct} result`}>
              <Row style={{ justifyContent: "space-between" }}><Text variant="label">{catalog.find((c) => c.id === latest.analysisProduct)?.name ?? latest.analysisProduct}</Text><Text variant="mute">{fmtDate(latest.createdAt)}</Text></Row>
              <Text style={{ marginTop: 6 }}>{latest.summary}</Text>
              <Row style={{ marginTop: space.sm }} gap={6}>{latest.freeMetrics.slice(0, 2).map((m) => <Chip key={m.id} small label={`${m.label} ${m.value ?? "—"}${m.unit ? " " + m.unit : ""}`} />)}</Row>
            </Card>
          </> : null}

          {trend.length >= 2 ? <>
            <SectionTitle>Trend</SectionTitle>
            <Card onPress={() => router.push("/(tabs)/progress" as never)}>
              <Row style={{ justifyContent: "space-between" }}>
                <View style={{ flex: 1 }}><Text variant="label">{app.product === "mobilitycare" ? "Cadence" : "Average count"} · last {trend.length} scans</Text><Text style={{ marginTop: 4 }}>{delta == null ? "" : delta === 0 ? "Unchanged since your previous scan." : `${delta > 0 ? "Up" : "Down"} ${Math.abs(delta)} since your previous scan.`}</Text></View>
                <Sparkline points={trend} width={110} height={40} />
              </Row>
            </Card>
          </> : null}

          <SectionTitle action={{ label: "All", onPress: () => router.push("/(tabs)/analyze" as never) }}>Explore</SectionTitle>
          <View style={{ gap: space.sm }}>
            {catalog.filter((c) => c.id !== primary.id).map((c) => (
              <Card key={c.id} onPress={() => (c.availability === "available" ? router.push(c.route as never) : router.push(`/coming-soon/${c.id}` as never))} style={{ paddingVertical: space.md }} accessibilityLabel={`${c.name}. ${c.promise}`}>
                <Row style={{ justifyContent: "space-between" }}><View style={{ flex: 1 }}><Text variant="bodyStrong">{c.name}</Text><Text variant="mute">{c.promise}</Text></View>{c.availability === "coming-soon" ? <Chip small label="Coming soon" /> : <Text color={t.accent}>→</Text>}</Row>
              </Card>
            ))}
          </View>
          {!app.isPro ? <Card tone="premium" style={{ marginTop: space.xl }} onPress={() => router.push("/paywall" as never)}><Text variant="label" color={t.premium}>GaitAI Pro</Text><Text style={{ marginTop: 4 }}>Full metrics, trends, comparisons and reports. See exactly what is included.</Text></Card> : null}
        </>
      )}
    </Screen>
  );
}
