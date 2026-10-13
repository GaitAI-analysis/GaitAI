/**
 * THE ROUTE GATE. Every functional screen — home dashboard, analysis
 * catalogue and flows, results, progress, reports — renders through
 * `RequireSubscription`. Without a signed-in account it shows the sign-in
 * prompt; without an active, server-confirmed subscription it shows the
 * locked screen. Deep links and internal navigation land here too, because
 * the gate is in the route files, not in the buttons that lead to them.
 *
 * This is the user-experience layer. The security boundary is the billing
 * Worker: `authorizeAnalysis()` asks it for a grant before any analysis, and
 * premium values are gated by the verdict it returned.
 */
import React from "react";
import { Linking, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { PRIVACY_URL, SUPPORT_EMAIL } from "@gaitai/api";
import { describeEntitlement } from "@gaitai/billing";
import { productMeta, space } from "@gaitai/design-system";
import { useApp } from "./app-state";
import { Button, Card, Chip, Row, Screen, Skeleton, Text } from "./primitives";
import { useTheme } from "./theme";

export function RequireSubscription({ children }: { children: React.ReactNode }) {
  const app = useApp();
  if (app.loading || !app.auth.ready || app.billing.status === "loading") {
    return <Screen><Skeleton height={28} width="60%" style={{ marginTop: 48 }} /><Skeleton height={120} radius={20} style={{ marginTop: 16 }} /><Skeleton height={80} radius={20} style={{ marginTop: 12 }} /></Screen>;
  }
  if (app.accountRequired && !app.auth.user) return <LockedScreen reason="signin" />;
  if (!app.isPro) return <LockedScreen reason="subscribe" />;
  return <>{children}</>;
}

export function LockedScreen({ reason }: { reason: "signin" | "subscribe" }) {
  const t = useTheme(); const app = useApp(); const router = useRouter(); const insets = useSafeAreaInsets();
  const meta = productMeta[app.product];
  const ent = app.entitlement; const desc = describeEntitlement(ent);
  const hasSub = !!app.server?.me.entitlement?.subscriptionId;
  const user = app.auth.user;
  return (
    <Screen style={{ paddingTop: insets.top + space.xl }}>
      <Chip tone="premium" label={meta.short.toUpperCase()} />
      <Text variant="title" style={{ marginTop: space.md }}>{reason === "signin" ? "Sign in to continue." : "A subscription unlocks this."}</Text>
      <Text variant="lead" style={{ marginTop: space.sm }}>
        {reason === "signin"
          ? `${meta.name} is a subscription app. Sign in or create a GaitAI account to see your subscription and start analysing.`
          : `Analysis, history and reports in ${meta.name} need an active subscription on your account.`}
      </Text>
      {reason === "subscribe" ? (
        <Card style={{ marginTop: space.lg, gap: 6 }}>
          <Row style={{ justifyContent: "space-between" }}><Text variant="bodyStrong">{desc.title}</Text><Chip tone={ent.status === "PENDING" ? "warning" : ent.status === "EXPIRED" ? "danger" : "neutral"} label={ent.status === "UNKNOWN" ? "UNVERIFIED" : ent.status === "FREE" ? "LOCKED" : ent.status} /></Row>
          <Text variant="mute">{ent.reason ?? desc.body}</Text>
          {user ? <Text variant="small" color={t.mute}>Signed in as {user.email}</Text> : null}
        </Card>
      ) : null}
      <View style={{ gap: space.sm, marginTop: space.xl }}>
        {reason === "signin" ? <>
          <Button label="Sign in" onPress={() => router.push("/auth/sign-in" as never)} />
          <Button kind="secondary" label="Create an account" onPress={() => router.push("/auth/register" as never)} />
        </> : <>
          <Button label="See plans and subscribe" onPress={() => router.push("/paywall" as never)} />
          {hasSub ? <Button kind="secondary" label="Manage subscription" onPress={() => router.push("/account/manage" as never)} /> : null}
          <Button kind="ghost" label="Refresh subscription status" onPress={() => app.refreshBilling()} />
        </>}
      </View>
      <Card tone="flat" style={{ marginTop: space.xl, gap: 6 }}>
        <Text variant="small" color={t.mute}>Video is analysed on this phone and never uploaded. Your account and subscription are checked with GaitAI's servers. Safety-relevant notes are never hidden behind a subscription.</Text>
        <Row gap={space.md} style={{ flexWrap: "wrap" }}>
          <Button kind="ghost" label="Privacy policy" onPress={() => Linking.openURL(PRIVACY_URL)} style={{ minHeight: 36, paddingHorizontal: 0 }} />
          <Button kind="ghost" label="Support" onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)} style={{ minHeight: 36, paddingHorizontal: 0 }} />
          {user ? <Button kind="ghost" label="Sign out" onPress={() => app.auth.signOut()} style={{ minHeight: 36, paddingHorizontal: 0 }} /> : null}
        </Row>
      </Card>
    </Screen>
  );
}
