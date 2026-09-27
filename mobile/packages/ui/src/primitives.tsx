import React from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text as RNText, View, type PressableProps, type TextProps, type ViewProps, type ViewStyle, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { hit, radius, space, type as typeScale } from "@gaitai/design-system";
import { useTheme } from "./theme";

type Variant = keyof typeof typeScale | "mute" | "bodyStrong";

export function Text({ variant = "body", color, style, ...rest }: TextProps & { variant?: Variant; color?: string }) {
  const t = useTheme();
  const base = variant === "mute" ? { ...typeScale.small, color: t.mute } : variant === "bodyStrong" ? { ...typeScale.body, fontWeight: "600" as const, color: t.ink } : { ...typeScale[variant], color: ["hero", "title", "heading", "metric", "bodyStrong"].includes(variant) ? t.ink : variant === "label" ? t.mute : t.body };
  return <RNText allowFontScaling maxFontSizeMultiplier={1.6} {...rest} style={[base, variant === "label" && { textTransform: "uppercase" }, color ? { color } : null, style]} />;
}

export function Screen({ children, scroll = true, padded = true, refreshing, onRefresh, style, footer }: { children: React.ReactNode; scroll?: boolean; padded?: boolean; refreshing?: boolean; onRefresh?: () => void; style?: ViewStyle; footer?: React.ReactNode }) {
  const t = useTheme(); const insets = useSafeAreaInsets();
  const inner = [padded && { paddingHorizontal: space.lg }, { paddingBottom: space.xxl + (footer ? 72 : 0) }, style];
  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      {scroll ? (
        <ScrollView contentContainerStyle={inner} keyboardShouldPersistTaps="handled" refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={t.accent} /> : undefined} contentInsetAdjustmentBehavior="automatic">{children}</ScrollView>
      ) : <View style={[{ flex: 1 }, inner]}>{children}</View>}
      {footer ? <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: space.lg, paddingBottom: Math.max(insets.bottom, space.md) + space.sm, backgroundColor: t.bg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.line }}>{footer}</View> : null}
    </View>
  );
}

export function Card({ children, style, tone = "surface", onPress, accessibilityLabel }: { children: React.ReactNode; style?: ViewStyle; tone?: "surface" | "accent" | "premium" | "flat"; onPress?: () => void; accessibilityLabel?: string }) {
  const t = useTheme();
  const bg = tone === "accent" ? t.accentSoft : tone === "premium" ? t.premiumSoft : tone === "flat" ? "transparent" : t.surface;
  const body = <View style={[{ backgroundColor: bg, borderRadius: radius.lg, padding: space.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: t.line }, style]}>{children}</View>;
  if (!onPress) return body;
  return <Pressable onPress={() => { Haptics.selectionAsync().catch(() => {}); onPress(); }} accessibilityRole="button" accessibilityLabel={accessibilityLabel} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] })}>{body}</Pressable>;
}

export function Button({ label, kind = "primary", onPress, disabled, loading, icon, style, ...rest }: Omit<PressableProps, "style"> & { label: string; kind?: "primary" | "secondary" | "ghost" | "premium" | "danger"; loading?: boolean; icon?: React.ReactNode; style?: ViewStyle }) {
  const t = useTheme();
  const bg = kind === "primary" ? t.accent : kind === "premium" ? t.premium : kind === "danger" ? t.danger : kind === "secondary" ? t.surface : "transparent";
  const fg = kind === "primary" ? t.accentInk : kind === "premium" || kind === "danger" ? "#fff" : kind === "secondary" ? t.ink : t.accent;
  return (
    <Pressable
      accessibilityRole="button" accessibilityState={{ disabled: !!disabled || !!loading }} disabled={disabled || loading}
      onPress={(e) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); onPress?.(e); }}
      style={({ pressed }) => [{ minHeight: hit + 4, borderRadius: radius.pill, paddingHorizontal: space.xl, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: space.sm, backgroundColor: bg, borderWidth: kind === "secondary" ? StyleSheet.hairlineWidth : 0, borderColor: t.lineStrong, opacity: disabled ? 0.5 : pressed ? 0.88 : 1 }, style]}
      {...rest}
    >
      {loading ? <ActivityIndicator color={fg} /> : icon}
      <RNText style={{ ...typeScale.body, fontWeight: "600", color: fg }} maxFontSizeMultiplier={1.4}>{label}</RNText>
    </Pressable>
  );
}

export function Chip({ label, tone = "neutral", small }: { label: string; tone?: "neutral" | "accent" | "premium" | "warning" | "success" | "danger"; small?: boolean }) {
  const t = useTheme();
  const map = { neutral: [t.surface2, t.body], accent: [t.accentSoft, t.accent], premium: [t.premiumSoft, t.premium], warning: ["rgba(217,164,65,0.16)", t.warning], success: ["rgba(47,163,107,0.16)", t.success], danger: ["rgba(229,72,77,0.14)", t.danger] } as const;
  const [bg, fg] = map[tone];
  return <View style={{ backgroundColor: bg, borderRadius: radius.pill, paddingHorizontal: small ? 8 : 10, paddingVertical: small ? 3 : 5, alignSelf: "flex-start" }}><RNText style={{ fontSize: small ? 11 : 12, fontWeight: "600", color: fg, letterSpacing: 0.3 }}>{label}</RNText></View>;
}

export function Row({ children, style, gap = space.md, ...rest }: ViewProps & { gap?: number }) {
  return <View {...rest} style={[{ flexDirection: "row", alignItems: "center", gap }, style]}>{children}</View>;
}

export function Divider() { const t = useTheme(); return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.line, marginVertical: space.md }} />; }

export function SectionTitle({ children, action }: { children: string; action?: { label: string; onPress: () => void } }) {
  const t = useTheme();
  return (
    <Row style={{ justifyContent: "space-between", marginTop: space.xl, marginBottom: space.md }}>
      <Text variant="label">{children}</Text>
      {action ? <Pressable onPress={action.onPress} accessibilityRole="button" hitSlop={12}><RNText style={{ ...typeScale.small, fontWeight: "600", color: t.accent }}>{action.label}</RNText></Pressable> : null}
    </Row>
  );
}

export function Skeleton({ height = 16, width = "100%", radius: r = 8, style }: { height?: number; width?: number | `${number}%`; radius?: number; style?: ViewStyle }) {
  const t = useTheme();
  return <View accessibilityElementsHidden style={[{ height, width, borderRadius: r, backgroundColor: t.surface2 }, style]} />;
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return <Card tone="flat" style={{ alignItems: "center", paddingVertical: space.xxl, gap: space.sm, borderStyle: "dashed" }}><Text variant="heading" style={{ textAlign: "center" }}>{title}</Text><Text style={{ textAlign: "center" }}>{body}</Text>{action ? <View style={{ marginTop: space.md }}>{action}</View> : null}</Card>;
}

export function ErrorState({ title = "Something went wrong", body, retry }: { title?: string; body: string; retry?: () => void }) {
  return <Card style={{ gap: space.sm }}><Text variant="heading">{title}</Text><Text>{body}</Text>{retry ? <Button label="Try again" kind="secondary" onPress={retry} style={{ alignSelf: "flex-start", marginTop: space.sm }} /> : null}</Card>;
}
