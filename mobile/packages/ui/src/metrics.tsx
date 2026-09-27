import React, { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { radius, space } from "@gaitai/design-system";
import type { LockedMetricPreview, Metric } from "@gaitai/core";
import { useTheme, useReducedMotion } from "./theme";
import { Card, Chip, Row, Text } from "./primitives";
import { Sparkline } from "./charts";

const fmt = (v: Metric["value"]) => (v == null ? "—" : typeof v === "number" ? (Number.isInteger(v) ? String(v) : v.toFixed(1)) : v);

/** A measured value with its unit, a one-line explanation on tap, and its trend. Reveals with a short fade-up. */
export function MetricCard({ metric, index = 0, onExplain, compact }: { metric: Metric; index?: number; onExplain?: (m: Metric) => void; compact?: boolean }) {
  const t = useTheme(); const reduce = useReducedMotion();
  const a = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  useEffect(() => { if (!reduce) Animated.timing(a, { toValue: 1, duration: 420, delay: 80 * index, useNativeDriver: true }).start(); }, [a, index, reduce]);
  const tr = metric.trend;
  const trendTone = !tr || tr.direction === "flat" ? "neutral" : "accent";
  return (
    <Animated.View style={{ opacity: a, transform: [{ translateY: Animated.multiply(Animated.subtract(1, a), 10) }] }}>
      <Card onPress={onExplain ? () => onExplain(metric) : undefined} accessibilityLabel={`${metric.label}: ${fmt(metric.value)} ${metric.unit ?? ""}. Tap to explain.`} style={compact ? { padding: space.md } : undefined}>
        <Row style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="label">{metric.label}</Text>
            <Row gap={6} style={{ alignItems: "baseline" }}>
              <Text variant={compact ? "heading" : "metric"}>{fmt(metric.value)}</Text>
              {metric.unit && metric.value != null ? <Text variant="mute">{metric.unit}</Text> : null}
            </Row>
            {tr ? <Chip small tone={trendTone} label={`${tr.delta > 0 ? "+" : ""}${tr.delta}${metric.unit ? " " + metric.unit : ""} vs previous`} /> : null}
          </View>
          {metric.series && metric.series.length > 2 ? <Sparkline points={metric.series} /> : null}
        </Row>
        {!compact ? <Text variant="mute" style={{ marginTop: space.sm }} numberOfLines={2}>{metric.description}</Text> : null}
        {metric.confidence < 0.6 && metric.value != null ? <Chip small tone="warning" label="Lower confidence, see quality notes" /> : null}
      </Card>
    </Animated.View>
  );
}

/** A premium metric a free user can see the NAME of. No value, no fake chart: a neutral placeholder line and a lock. */
export function LockedMetricCard({ metric, onPress }: { metric: LockedMetricPreview; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable onPress={() => { Haptics.selectionAsync().catch(() => {}); onPress(); }} accessibilityRole="button" accessibilityLabel={`${metric.label}, included with Pro. ${metric.description}`}>
      <View style={{ backgroundColor: t.surface, borderRadius: radius.lg, padding: space.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: t.line, gap: space.sm }}>
        <Row style={{ justifyContent: "space-between" }}>
          <Text variant="label">{metric.label}</Text>
          <Row gap={6}><Chip small tone="premium" label="Pro" /><Lock color={t.premium} /></Row>
        </Row>
        <Svg width="100%" height={28} accessibilityElementsHidden><Path d="M0 20 C 30 6, 60 26, 90 14 S 150 22, 180 10 S 240 24, 300 12" stroke={t.lineStrong} strokeWidth={2} fill="none" strokeDasharray="4 5" /></Svg>
        <Text variant="mute" numberOfLines={2}>{metric.description}</Text>
      </View>
    </Pressable>
  );
}

export function Lock({ color, size = 16 }: { color: string; size?: number }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden><Path d="M7 11V8a5 5 0 0 1 10 0v3" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" /><Path d="M5 11h14v10H5z" stroke={color} strokeWidth={2} fill="none" strokeLinejoin="round" /></Svg>;
}

/** Truthful stage list for a running analysis: only stages the engine has reported are shown as done. */
export function StageProgress({ stage, fraction, stages }: { stage: string; fraction: number; stages: { id: string; label: string }[] }) {
  const t = useTheme(); const reduce = useReducedMotion();
  const idx = Math.max(0, stages.findIndex((s) => s.id === stage));
  const w = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(w, { toValue: fraction, duration: reduce ? 0 : 300, useNativeDriver: false }).start(); }, [fraction, reduce, w]);
  return (
    <View style={{ gap: space.md }} accessibilityLiveRegion="polite" accessibilityLabel={`${stages[idx]?.label ?? stage}, ${Math.round(fraction * 100)} percent`}>
      <View style={{ height: 6, borderRadius: radius.pill, backgroundColor: t.surface2, overflow: "hidden" }}><Animated.View style={{ height: 6, backgroundColor: t.accent, width: w.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }} /></View>
      {stages.map((s, i) => (
        <Row key={s.id} gap={space.md}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: i < idx ? t.accent : i === idx ? t.accent : t.surface2, opacity: i === idx ? 1 : i < idx ? 0.7 : 1, borderWidth: i > idx ? StyleSheet.hairlineWidth : 0, borderColor: t.lineStrong }} />
          <Text variant={i === idx ? "bodyStrong" : "body"} color={i > idx ? t.mute : undefined}>{s.label}</Text>
          {i === idx ? <MotionDots color={t.accent} /> : null}
        </Row>
      ))}
    </View>
  );
}

/** Three quiet dots stepping like a gait cycle. Static under reduced motion. */
export function MotionDots({ color }: { color: string }) {
  const reduce = useReducedMotion(); const [k, setK] = useState(0);
  useEffect(() => { if (reduce) return; const id = setInterval(() => setK((v) => (v + 1) % 3), 420); return () => clearInterval(id); }, [reduce]);
  return <Row gap={4} accessibilityElementsHidden>{[0, 1, 2].map((i) => <View key={i} style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: color, opacity: reduce ? 0.6 : i === k ? 1 : 0.3 }} />)}</Row>;
}
