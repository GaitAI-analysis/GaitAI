import React, { useEffect } from "react";
import { Linking, View } from "react-native";
import { analytics } from "@gaitai/core";
import { SUBSCRIPTIONS, type Plan } from "@gaitai/billing";
import { space } from "@gaitai/design-system";
import { useApp } from "../app-state";
import { Button, Card, Chip, Divider, Row, Screen, Text } from "../primitives";
import { useTheme } from "../theme";

const BENEFITS = ["Complete analysis", "Advanced metrics", "Historical trends", "Comparison reports", "Interactive charts", "Report export", "Premium analysis tools"];

/**
 * The paywall. Appears only after a result has delivered value. Prices are
 * whatever the store returns; when the store is unavailable the screen says
 * so instead of inventing numbers. In development the DEV entitlement is
 * labelled as such and cannot be mistaken for a purchase.
 */
export function PaywallScreen({ onClose, unlockedCount, lockedLabels }: { onClose: () => void; unlockedCount?: number; lockedLabels?: string[] }) {
  const t = useTheme(); const app = useApp();
  const skus = SUBSCRIPTIONS[app.product];
  useEffect(() => { analytics.track("paywall_opened", { product: app.product }); }, [app.product]);
  const price = (plan: Plan) => app.billing.products.find((p) => p.plan === plan);
  const buy = async (plan: Plan) => { await app.purchase(skus[plan]); };

  return (
    <Screen footer={<View style={{ gap: space.sm }}>
      {app.billing.status === "unavailable" ? <Button label="Subscriptions not available in this build" disabled onPress={() => {}} /> : app.isPro ? <Button label="You have Pro" kind="secondary" onPress={onClose} /> : <>
        <Button kind="premium" label={`Continue with yearly${price("yearly") ? ` · ${price("yearly")!.localizedPrice}` : ""}`} onPress={() => buy("yearly")} loading={app.billing.status === "purchasing"} />
        <Button kind="secondary" label={`Monthly${price("monthly") ? ` · ${price("monthly")!.localizedPrice}` : ""}`} onPress={() => buy("monthly")} />
      </>}
      <Button kind="ghost" label="Not now" onPress={onClose} />
    </View>}>
      <View style={{ paddingTop: space.xl, gap: space.lg }}>
        <Chip tone="premium" label="GAITAI PRO" />
        <Text variant="title">Unlock the full movement intelligence layer.</Text>
        {unlockedCount != null ? <Text>{unlockedCount} insights are already yours. {lockedLabels?.length ?? 0} more are ready in this result.</Text> : null}
        {lockedLabels?.length ? <Card tone="premium" style={{ gap: 6 }}>{lockedLabels.map((l) => <Text key={l} variant="small">🔒 {l}</Text>)}</Card> : null}
        <Card style={{ gap: 8 }}>{BENEFITS.map((b) => <Row key={b} gap={10}><Text color={t.premium}>✓</Text><Text>{b}</Text></Row>)}</Card>
        <Card style={{ gap: space.sm }}>
          <Row style={{ justifyContent: "space-between" }}><Text variant="bodyStrong">Yearly</Text><Chip tone="premium" label="BEST VALUE" small /></Row>
          <Text variant="mute">{price("yearly")?.localizedPrice ?? (app.billing.status === "unavailable" ? "Price shown by Google Play once subscriptions are configured." : "Loading price…")}{price("yearly")?.offer ? ` · ${price("yearly")!.offer}` : ""}</Text>
          <Divider />
          <Text variant="bodyStrong">Monthly</Text>
          <Text variant="mute">{price("monthly")?.localizedPrice ?? (app.billing.status === "unavailable" ? "Price shown by Google Play once subscriptions are configured." : "Loading price…")}</Text>
        </Card>
        {app.billing.message ? <Text variant="mute">{app.billing.message}</Text> : null}
        <Row style={{ justifyContent: "space-between" }}>
          <Button kind="ghost" label="Restore purchases" onPress={() => app.restore()} />
          <Button kind="ghost" label="Manage subscription" onPress={() => { const u = app.billingProvider.manageUrl(); if (u) Linking.openURL(u); }} disabled={!app.billingProvider.manageUrl()} />
        </Row>
        <Row style={{ justifyContent: "center" }} gap={space.lg}>
          <Button kind="ghost" label="Terms" onPress={() => Linking.openURL("https://gaitai.in/legal/terms/")} />
          <Button kind="ghost" label="Privacy" onPress={() => Linking.openURL("https://gaitai.in/legal/privacy/")} />
        </Row>
        <Text variant="mute" style={{ textAlign: "center" }}>Safety-relevant messages are never behind Pro. Cancel any time from Google Play.</Text>
      </View>
    </Screen>
  );
}
