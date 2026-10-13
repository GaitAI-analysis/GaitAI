import React, { useState } from "react";
import { Alert, Linking, Switch, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { describeEntitlement, storeLabelFor } from "@gaitai/billing";
import { PRIVACY_URL, TERMS_URL, SUPPORT_EMAIL } from "@gaitai/api";
import { productMeta, radius, space, type as typeScale } from "@gaitai/design-system";
import { useApp } from "../app-state";
import { Button, Card, Chip, Divider, Row, Screen, SectionTitle, Text } from "../primitives";
import { useTheme } from "../theme";
import { DemoBanner } from "../dev";

export function ProfileScreen() {
  const t = useTheme(); const app = useApp(); const router = useRouter(); const insets = useSafeAreaInsets();
  const [name, setName] = useState(app.profile?.displayName ?? "");
  const [busy, setBusy] = useState(false);
  const p = app.profile;
  const user = app.auth.user;
  const toggle = (path: "notifications" | "privacy", key: string, v: boolean) => app.updateProfile({ [path]: { ...(p?.[path] as object), [key]: v } } as never);
  const row = (label: string, value: boolean, onChange: (v: boolean) => void, sub?: string) => <Row style={{ justifyContent: "space-between", minHeight: 48 }}><View style={{ flex: 1 }}><Text>{label}</Text>{sub ? <Text variant="mute">{sub}</Text> : null}</View><Switch value={value} onValueChange={onChange} trackColor={{ true: t.accent }} accessibilityLabel={label} /></Row>;

  const deleteAccount = () => Alert.alert(
    "Delete your GaitAI account?",
    "Any active subscription is cancelled immediately, your account and billing record are anonymised, and every analysis, kept video and setting on this phone is removed. Past invoices are retained for accounting only. This cannot be undone.",
    [{ text: "Cancel", style: "cancel" }, { text: "Delete account", style: "destructive", onPress: async () => { setBusy(true); try { await app.auth.deleteAccount(); Alert.alert("Account deleted", "Your account and data have been removed."); router.replace("/auth/sign-in" as never); } catch (e) { Alert.alert("Could not delete", e instanceof Error ? e.message : String(e)); } finally { setBusy(false); } } }],
  );
  const deleteLocal = () => Alert.alert("Delete all analyses?", "Results and kept videos are removed from this phone.", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: async () => { const { sessionStore } = await import("@gaitai/core"); await sessionStore.clearAll(); await app.reloadSessions(); } }]);

  const st = app.entitlementStatus; const ent = app.entitlement; const sub = describeEntitlement(ent);
  const subChip = st === "PRO" ? (ent.inGracePeriod ? "ACTIVE · RETRYING" : "ACTIVE") : st === "UNKNOWN" ? "UNVERIFIED" : st;
  const subTone = st === "PRO" ? "premium" : st === "PENDING" ? "warning" : st === "EXPIRED" ? "danger" : "neutral";
  const version = Constants.expoConfig?.version ?? "0.2.0";

  return (
    <Screen style={{ paddingTop: insets.top + space.md }}>
      <DemoBanner />
      <Text variant="title">Profile</Text>

      <SectionTitle>Account</SectionTitle>
      {app.accountRequired ? (
        user ? (
          <Card style={{ gap: space.sm }}>
            <Row style={{ justifyContent: "space-between" }}><Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>{user.email}</Text><Chip tone={user.emailVerified ? "success" : "warning"} label={user.emailVerified ? "VERIFIED" : "UNVERIFIED"} small /></Row>
            {!user.emailVerified ? <Text variant="mute">Verify your email to subscribe. Tap the link we sent, then refresh.</Text> : <Text variant="mute">Your subscription and billing history are tied to this account.</Text>}
            <Row gap={space.sm} style={{ flexWrap: "wrap" }}>
              {!user.emailVerified ? <Button kind="secondary" label="Resend verification" onPress={() => app.auth.sendVerification().then(() => Alert.alert("Sent", "Check your inbox.")).catch((e) => Alert.alert("Could not send", e instanceof Error ? e.message : String(e)))} style={{ minHeight: 40 }} /> : null}
              {!user.emailVerified ? <Button kind="ghost" label="Refresh" onPress={() => app.auth.refreshUser().then(() => app.refreshBilling())} style={{ minHeight: 40 }} /> : null}
              <Button kind="ghost" label="Sign out" onPress={() => app.auth.signOut().then(() => router.replace("/auth/sign-in" as never))} style={{ minHeight: 40 }} />
            </Row>
          </Card>
        ) : (
          <Card style={{ gap: space.sm }}>
            <Text variant="bodyStrong">Not signed in</Text>
            <Text variant="mute">Sign in to see your subscription and start analysing.</Text>
            <Row gap={space.sm}><Button label="Sign in" onPress={() => router.push("/auth/sign-in" as never)} style={{ minHeight: 40 }} /><Button kind="secondary" label="Create account" onPress={() => router.push("/auth/register" as never)} style={{ minHeight: 40 }} /></Row>
          </Card>
        )
      ) : null}

      <Card style={{ marginTop: space.md, gap: space.sm }}>
        <Text variant="label">Display name</Text>
        <TextInput value={name} onChangeText={setName} onEndEditing={() => app.updateProfile({ displayName: name.trim() })} placeholder="How should we greet you?" placeholderTextColor={t.mute} accessibilityLabel="Display name" style={{ ...typeScale.body, color: t.ink, backgroundColor: t.surface2, borderRadius: radius.md, paddingHorizontal: space.md, minHeight: 48 }} />
        <Text variant="mute">Stored on this phone only.</Text>
      </Card>

      <SectionTitle>Subscription</SectionTitle>
      <Card onPress={() => router.push((app.isPro ? "/account/manage" : "/paywall") as never)} style={{ gap: 6 }}>
        <Row style={{ justifyContent: "space-between" }}><Text variant="bodyStrong">{sub.title}</Text><Chip tone={subTone} label={subChip} /></Row>
        <Text variant="mute">{st === "FREE" ? "See plans, restore a subscription or manage billing." : sub.body}</Text>
        {ent.checkedAt && ent.source !== "none" ? <Text variant="small" color={t.mute}>Last confirmed by {storeLabelFor(ent.source)} {new Date(ent.checkedAt).toLocaleString()}</Text> : null}
      </Card>

      <SectionTitle>Privacy</SectionTitle>
      <Card style={{ gap: space.sm }}>
        {row("Keep analysed videos", p?.privacy.keepVideos ?? false, (v) => toggle("privacy", "keepVideos", v), "Off: the video is deleted after analysis; only measurements are kept.")}
        <Divider />
        {row("Share anonymous usage events", p?.privacy.analyticsOptIn ?? false, (v) => toggle("privacy", "analyticsOptIn", v), "Event names only, never videos or measurement values. Stored locally in this build.")}
        <Divider />
        <Text variant="mute">Video analysis runs on this device; videos and measurements are never uploaded. Your email, subscription status and payment records are held by GaitAI and its payment provider to run the subscription.</Text>
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
        <Button kind="secondary" label="Delete all analyses on this phone" onPress={deleteLocal} />
        {user ? <Button kind="danger" label="Delete account" onPress={deleteAccount} loading={busy} /> : null}
      </Card>

      <SectionTitle>About</SectionTitle>
      <Card style={{ gap: space.sm }}>
        <Button kind="ghost" label="Help & support" onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)} />
        <Button kind="ghost" label="Terms" onPress={() => Linking.openURL(TERMS_URL)} />
        <Button kind="ghost" label="Privacy policy" onPress={() => Linking.openURL(PRIVACY_URL)} />
        <Text variant="mute" style={{ textAlign: "center" }}>{productMeta[app.product].name} · {productMeta[app.product].packageId} · {version}</Text>
      </Card>
      {__DEV__ ? <>
        <SectionTitle>Developer (development builds only)</SectionTitle>
        <Card tone="flat" style={{ gap: space.sm, borderColor: t.warning }}>
          {row("Demo Data Mode", app.demoMode, (v) => app.setDemoMode(v), "Synthetic sessions in a separate store, watermarked everywhere. Still requires a subscription.")}
        </Card>
      </> : null}
    </Screen>
  );
}
