import React, { useEffect } from "react";
import { Linking, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { analytics } from "@gaitai/core";
import { SUBSCRIPTIONS, describeEntitlement, periodLabel, yearlySavingsPercent, type Plan, type StoreProduct } from "@gaitai/billing";
import { space } from "@gaitai/design-system";
import { useApp } from "../app-state";
import { Button, Card, Chip, Divider, Row, Screen, Text } from "../primitives";
import { useTheme } from "../theme";

const BENEFITS = ["Complete analysis", "Advanced metrics", "Historical trends", "Comparison reports", "Interactive charts", "Report export", "Premium analysis tools"];

/**
 * The paywall. Appears only after a result has delivered value. Every price,
 * currency, billing period and offer is whatever Google Play returned for this
 * account and country; when the store has no plans yet the screen says so
 * instead of inventing numbers. In development the DEV entitlement is labelled
 * as such and cannot be mistaken for a purchase.
 */
export function PaywallScreen({ onClose, unlockedCount, lockedLabels }: { onClose: () => void; unlockedCount?: number; lockedLabels?: string[] }) {
  const t = useTheme(); const app = useApp(); const insets = useSafeAreaInsets();
  const skus = SUBSCRIPTIONS[app.product];
  const b = app.billing;
  useEffect(() => { analytics.track("paywall_opened", { product: app.product }); }, [app.product]);

  const product = (plan: Plan) => b.products.find((p) => p.plan === plan);
  const yearly = product("yearly"); const monthly = product("monthly");
  const savings = yearlySavingsPercent(monthly, yearly);
  const busy = b.status === "purchasing";
  const loadingPlans = b.status === "loading";
  const noPlans = !loadingPlans && b.products.length === 0;
  const pending = app.entitlementStatus === "PENDING" || b.status === "pending";
  const priceLine = (p: StoreProduct) => `${p.localizedPrice} / ${periodLabel(p.billingPeriod)}`;
  const buy = async (plan: Plan) => { if (busy) return; await app.purchase(skus[plan]); };

  const footer = (
    <View style={{ gap: space.sm }}>
      {app.isPro ? <Button label="You have Pro" kind="secondary" onPress={onClose} />
        : pending ? <Button label="Purchase pending with Google Play" disabled onPress={() => {}} />
        : loadingPlans ? <Button label="Loading plans from Google Play" disabled loading onPress={() => {}} />
        : noPlans ? <Button label="Subscriptions not available" disabled onPress={() => {}} />
        : <>
          {yearly ? <Button kind="premium" label={`Continue with yearly · ${priceLine(yearly)}`} onPress={() => buy("yearly")} loading={busy} /> : null}
          {monthly ? <Button kind="secondary" label={`Monthly · ${priceLine(monthly)}`} onPress={() => buy("monthly")} disabled={busy} /> : null}
        </>}
      <Button kind="ghost" label="Not now" onPress={onClose} />
    </View>
  );

  return (
    <Screen footer={footer}>
      <View style={{ paddingTop: insets.top + space.lg, gap: space.lg }}>
        <Chip tone="premium" label="GAITAI PRO" />
        <Text variant="title">Unlock the full movement intelligence layer.</Text>
        {unlockedCount != null ? <Text>{unlockedCount} insights are already yours. {lockedLabels?.length ?? 0} more are ready in this result.</Text> : null}
        {lockedLabels?.length ? <Card tone="premium" style={{ gap: 6 }}>{lockedLabels.map((l) => <Text key={l} variant="small">🔒 {l}</Text>)}</Card> : null}
        <Card style={{ gap: 8 }}>{BENEFITS.map((bn) => <Row key={bn} gap={10}><Text color={t.premium}>✓</Text><Text>{bn}</Text></Row>)}</Card>

        {yearly || monthly ? (
          <Card style={{ gap: space.md }} accessibilityLabel="Plans and prices from Google Play">
            <PlanRow name="Yearly" product={yearly} badge={savings ? `BEST VALUE · SAVE ${savings}%` : "BEST VALUE"} />
            <Divider />
            <PlanRow name="Monthly" product={monthly} />
            <Text variant="small" color={t.mute}>Prices, currency and billing period are set by Google Play for your country and shown exactly as Play reports them.</Text>
          </Card>
        ) : (
          <Card tone="flat" style={{ gap: space.xs }}>
            <Text variant="bodyStrong">{loadingPlans ? "Loading plans from Google Play…" : "Plans are not available right now"}</Text>
            <Text variant="mute">{loadingPlans ? "Prices and billing periods come from Google Play; nothing is set in the app." : b.message ?? "Google Play did not return any subscription plans for this app."}</Text>
          </Card>
        )}

        {b.status === "cancelled" ? <Text variant="mute">{b.message ?? "Purchase cancelled. Nothing was charged."}</Text> : null}
        {b.status === "failed" ? <Card tone="flat" style={{ borderColor: t.danger, borderWidth: 1 }}><Text color={t.danger}>{b.message ?? "The purchase could not be completed. Nothing was charged."}</Text></Card> : null}
        {pending && !app.isPro ? <Card tone="flat" style={{ borderColor: t.warning, borderWidth: 1, gap: 4 }}><Chip tone="warning" label="PENDING" small /><Text>{b.message ?? describeEntitlement(app.entitlement).body}</Text></Card> : null}
        {b.status === "restored" || (b.status === "purchased" && b.message) ? <Text color={t.success}>{b.message}</Text> : null}
        {app.entitlementStatus === "EXPIRED" ? <Text variant="mute">{describeEntitlement(app.entitlement).body}</Text> : null}
        {app.entitlementStatus === "UNKNOWN" ? <Text variant="mute">{describeEntitlement(app.entitlement).body}</Text> : null}
        {app.billingProvider.name === "dev" && b.message ? <Text variant="mute">{b.message}</Text> : null}

        <Row style={{ justifyContent: "space-between" }}>
          <Button kind="ghost" label="Restore purchases" onPress={() => app.restore()} disabled={busy || (b.status === "unavailable" && app.billingProvider.name === "play")} />
          <Button kind="ghost" label="Manage subscription" onPress={() => app.manageSubscription()} disabled={app.billingProvider.name === "dev"} />
        </Row>
        <Row style={{ justifyContent: "center" }} gap={space.lg}>
          <Button kind="ghost" label="Terms" onPress={() => Linking.openURL("https://gaitai.in/legal/terms/")} />
          <Button kind="ghost" label="Privacy" onPress={() => Linking.openURL("https://gaitai.in/legal/privacy/")} />
        </Row>
        <Text variant="mute" style={{ textAlign: "center" }}>Safety-relevant messages are never behind Pro. Subscriptions renew automatically and can be cancelled any time from Google Play.</Text>
      </View>
    </Screen>
  );
}

function PlanRow({ name, product, badge }: { name: string; product?: StoreProduct; badge?: string }) {
  const t = useTheme();
  return (
    <View style={{ gap: 2 }}>
      <Row style={{ justifyContent: "space-between" }}>
        <Text variant="bodyStrong">{name}</Text>
        {badge && product ? <Chip tone="premium" label={badge} small /> : null}
      </Row>
      {product ? <Text variant="heading">{product.localizedPrice} <Text variant="mute">/ {periodLabel(product.billingPeriod)}</Text></Text> : <Text variant="mute">Not offered by Google Play right now.</Text>}
      {product?.offer ? <Text variant="mute" color={t.premium}>{product.offer}</Text> : null}
    </View>
  );
}
