import React, { useState } from "react";
import { Alert, Linking, Switch, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { productMeta, radius, space, type as typeScale } from "@gaitai/design-system";
import { useApp } from "../app-state";
import { Button, Card, Chip, Divider, Row, Screen, SectionTitle, Text } from "../primitives";
import { useTheme } from "../theme";
import { DemoBanner } from "../dev";

export function ProfileScreen() {
  const t = useTheme(); const app = useApp(); const router = useRouter(); const insets = useSafeAreaInsets();
  const [name, setName] = useState(app.profile?.displayName ?? "");
  const p = app.profile;
  const toggle = (path: "notifications" | "privacy", key: string, v: boolean) => app.updateProfile({ [path]: { ...(p?.[path] as object), [key]: v } } as never);
  const deleteAccount = () => Alert.alert("Delete your data on this phone?", "Every analysis, kept video and setting is removed. This cannot be undone.", [{ text: "Cancel", style: "cancel" }, { text: "Delete everything", style: "destructive", onPress: async () => { const { profileStore } = await import("@gaitai/core"); await profileStore.deleteAccount(); await app.reloadSessions(); Alert.alert("Deleted", "Your data has been removed from this phone."); } }]);
  const row = (label: string, value: boolean, onChange: (v: boolean) => void, sub?: string) => <Row style={{ justifyContent: "space-between", minHeight: 48 }}><View style={{ flex: 1 }}><Text>{label}</Text>{sub ? <Text variant="mute">{sub}</Text> : null}</View><Switch value={value} onValueChange={onChange} trackColor={{ true: t.accent }} accessibilityLabel={label} /></Row>;

  return (
    <Screen style={{ paddingTop: insets.top + space.md }}>
      <DemoBanner />
      <Text variant="title">Profile</Text>
      <Card style={{ marginTop: space.lg, gap: space.sm }}>
        <Text variant="label">Your name</Text>
        <TextInput value={name} onChangeText={setName} onEndEditing={() => app.updateProfile({ displayName: name.trim() })} placeholder="How should we greet you?" placeholderTextColor={t.mute} accessibilityLabel="Your name" style={{ ...typeScale.body, color: t.ink, backgroundColor: t.surface2, borderRadius: radius.md, paddingHorizontal: space.md, minHeight: 48 }} />
        <Text variant="mute">Stored on this phone only. Sign-in with Google arrives with account sync; nothing here requires an account.</Text>
      </Card>
      <SectionTitle>Subscription</SectionTitle>
      <Card onPress={() => router.push("/paywall" as never)} style={{ gap: 6 }}>
        <Row style={{ justifyContent: "space-between" }}><Text variant="bodyStrong">{app.isPro ? "GaitAI Pro" : "Free"}</Text><Chip tone={app.isPro ? "premium" : "neutral"} label={app.isPro ? (app.entitlement.source === "dev" ? "PRO · DEV ENTITLEMENT" : "PRO") : "FREE"} /></Row>
        <Text variant="mute">{app.isPro ? (app.entitlement.source === "dev" ? "Development entitlement. Not a purchase." : `Renews via Google Play${app.entitlement.expiresAt ? ` · until ${new Date(app.entitlement.expiresAt).toLocaleDateString()}` : ""}`) : "See what Pro includes, restore a purchase, or manage your subscription."}</Text>
      </Card>
      <SectionTitle>Privacy</SectionTitle>
      <Card style={{ gap: space.sm }}>
        {row("Keep analysed videos", p?.privacy.keepVideos ?? false, (v) => toggle("privacy", "keepVideos", v), "Off: the video is deleted after analysis; only measurements are kept.")}
        <Divider />
        {row("Share anonymous usage events", p?.privacy.analyticsOptIn ?? false, (v) => toggle("privacy", "analyticsOptIn", v), "Event names only, never videos or measurement values. Stored locally in this build.")}
        <Divider />
        <Text variant="mute">All analysis runs on this device. Nothing is uploaded for processing.</Text>
      </Card>
      <SectionTitle>Notifications</SectionTitle>
      <Card style={{ gap: space.sm }}>
        {row("Analysis ready", p?.notifications.analysisReady ?? true, (v) => toggle("notifications", "analysisReady", v))}
        <Divider />
        {row("Weekly summary", p?.notifications.weeklySummary ?? false, (v) => toggle("notifications", "weeklySummary", v))}
        <Divider />
        {row("Scheduled check reminders", p?.notifications.reminders ?? false, (v) => toggle("notifications", "reminders", v))}
      </Card>
      <SectionTitle>Data</SectionTitle>
      <Card style={{ gap: space.sm }}>
        <Button kind="secondary" label="Delete all analyses" onPress={() => Alert.alert("Delete all analyses?", "Results and kept videos are removed from this phone.", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: async () => { const { sessionStore } = await import("@gaitai/core"); await sessionStore.clearAll(); await app.reloadSessions(); } }])} />
        <Button kind="danger" label="Delete account data" onPress={deleteAccount} />
      </Card>
      <SectionTitle>About</SectionTitle>
      <Card style={{ gap: space.sm }}>
        <Button kind="ghost" label="Help & contact" onPress={() => Linking.openURL("https://gaitai.in/#contact")} />
        <Button kind="ghost" label="Terms" onPress={() => Linking.openURL("https://gaitai.in/legal/terms/")} />
        <Button kind="ghost" label="Privacy policy" onPress={() => Linking.openURL("https://gaitai.in/legal/privacy/")} />
        <Text variant="mute" style={{ textAlign: "center" }}>{productMeta[app.product].name} · {productMeta[app.product].packageId} · 0.1.0</Text>
      </Card>
      {__DEV__ ? <>
        <SectionTitle>Developer (development builds only)</SectionTitle>
        <Card tone="flat" style={{ gap: space.sm, borderColor: t.warning }}>
          {row("DEV entitlement (Pro)", app.isPro && app.entitlement.source === "dev", (v) => app.devSetPro(v), "Grants Pro locally. Not a purchase; never present in release builds.")}
          <Divider />
          {row("Demo Data Mode", app.demoMode, (v) => app.setDemoMode(v), "Synthetic sessions in a separate store, watermarked everywhere.")}
        </Card>
      </> : null}
    </Screen>
  );
}
