/**
 * THE SUBSCRIPTION SCREEN. Everything a person needs to decide, in the order
 * they need it: what the product does, the two plans with the annual saving
 * stated, exactly what will be charged and how often, how to cancel, what
 * happens with tax — then the button. Prices, periods and disclosures come
 * from the billing Worker's catalogue; nothing here invents a number.
 *
 * Deep navy, warm off-white, graphite and restrained gold. No countdowns, no
 * "only today", no fake scarcity.
 */
import React, { useEffect, useMemo, useState } from "react";
import { Linking, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { analytics } from "@gaitai/core";
import { describeEntitlement, type StoreProduct } from "@gaitai/billing";
import { PRIVACY_URL, TERMS_URL, SUPPORT_EMAIL } from "@gaitai/api";
import { productMeta, radius, space } from "@gaitai/design-system";
import { useApp } from "../app-state";
import { Button, Card, Chip, Divider, Row, Screen, Text } from "../primitives";
import { useTheme } from "../theme";

type PlanKey = "monthly" | "yearly";

export function PaywallScreen({ onClose }: { onClose: () => void; unlockedCount?: number; lockedLabels?: string[] }) {
  const t = useTheme(); const app = useApp(); const router = useRouter(); const insets = useSafeAreaInsets();
  const b = app.billing;
  const server = app.server;
  const catalog = server?.catalog ?? null;
  const productInfo = catalog?.products.find((p) => p.product === app.product);
  const [plan, setPlan] = useState<PlanKey>("yearly");
  const [busy, setBusy] = useState(false);
  useEffect(() => { analytics.track("paywall_opened", { product: app.product }); }, [app.product]);

  const yearly = useMemo(() => b.products.find((p) => p.plan === "yearly"), [b.products]);
  const monthly = useMemo(() => b.products.find((p) => p.plan === "monthly"), [b.products]);
  const selected = plan === "yearly" ? yearly : monthly;
  const user = app.auth.user;
  const signedIn = !!user || !app.accountRequired;
  const paymentsActive = catalog ? catalog.paymentsActive : true;
  const sandbox = catalog?.mode === "sandbox";
  // Email verification is enforced by the Worker (always, in production). The
  // local check only shapes the button; the sandbox Worker relaxes it for QA
  // accounts that have no inbox, so the screen follows the Worker's mode.
  const verified = !app.accountRequired || sandbox || !!user?.emailVerified;
  const loadingPlans = b.status === "loading";
  const noPlans = !loadingPlans && b.products.length === 0;
  const pending = app.entitlementStatus === "PENDING" || b.status === "pending";

  const subscribe = async () => {
    if (!selected || busy) return;
    if (!signedIn) { router.push("/auth/sign-in" as never); return; }
    setBusy(true);
    try {
      if (server) {
        const url = await app.startCheckout(selected.productId);
        if (url) router.push({ pathname: "/checkout", params: { url } } as never);
      } else {
        await app.purchase(selected.productId);
      }
    } finally { setBusy(false); }
  };

  const chargeLine = selected ? `${selected.localizedPrice} ${plan === "yearly" ? "every 12 months" : "every month"}` : "";
  const cta = app.isPro ? "You are subscribed"
    : !signedIn ? "Sign in to subscribe"
    : !verified ? "Verify your email to subscribe"
    : !paymentsActive ? "Subscriptions open soon"
    : pending ? "Payment being confirmed"
    : loadingPlans ? "Loading plans"
    : noPlans ? "Plans unavailable"
    : `Continue · ${chargeLine}`;
  const ctaDisabled = app.isPro || !verified || !paymentsActive || pending || loadingPlans || noPlans || busy || b.status === "purchasing";

  const footer = (
    <View style={{ gap: space.sm }}>
      {app.isPro ? <Button label="Manage subscription" kind="secondary" onPress={() => router.push("/account/manage" as never)} />
        : !signedIn ? <Button label="Sign in to subscribe" onPress={() => router.push("/auth/sign-in" as never)} />
        : <Button label={cta} onPress={subscribe} disabled={ctaDisabled} loading={busy || b.status === "purchasing"} />}
      {selected && !app.isPro && signedIn ? <Text variant="small" color={t.mute} style={{ textAlign: "center" }}>Recurring. Cancel any time; access continues to the end of the paid period.</Text> : null}
      <Button kind="ghost" label={app.isPro ? "Done" : "Not now"} onPress={onClose} />
    </View>
  );

  return (
    <Screen footer={footer}>
      <View style={{ paddingTop: insets.top + space.lg, gap: space.lg }}>
        <Row style={{ justifyContent: "space-between" }}>
          <Chip tone="premium" label={`${productMeta[app.product].short.toUpperCase()} SUBSCRIPTION`} />
          {sandbox ? <Chip tone="warning" label="SANDBOX · NO REAL CHARGES" small /> : null}
        </Row>
        <Text variant="title">{productMeta[app.product].name}</Text>
        <Text variant="lead">{app.product === "mobilitycare" ? "Gait analysis from a phone video, with the full metric set, your history and shareable reports." : "Crowd and zone analysis from video, with the full metric set, activity history and shareable reports."}</Text>

        <Card style={{ gap: 8 }}>
          {(productInfo?.features ?? ["Full analysis and every metric", "History and trends", "Shareable reports"]).map((f) => <Row key={f} gap={10}><Text color={t.gold}>✓</Text><Text style={{ flex: 1 }}>{f}</Text></Row>)}
          <Text variant="small" color={t.mute} style={{ marginTop: 4 }}>Video is analysed on this phone and never uploaded. The subscription is checked with GaitAI before each analysis.</Text>
        </Card>

        {yearly || monthly ? (
          <View style={{ gap: space.sm }}>
            <PlanCard name="Annual" product={yearly} selected={plan === "yearly"} onPress={() => setPlan("yearly")} badge={yearly?.offer ? `SAVE ${catalog?.annualDiscountPercent ?? 20}%` : undefined} sub={yearly ? `${perMonth(yearly)} per month, billed once a year` : undefined} />
            <PlanCard name="Monthly" product={monthly} selected={plan === "monthly"} onPress={() => setPlan("monthly")} sub={monthly ? "Billed every month" : undefined} />
          </View>
        ) : (
          <Card tone="flat" style={{ gap: space.xs }}>
            <Text variant="bodyStrong">{loadingPlans ? "Loading plans…" : "Plans are not available right now"}</Text>
            <Text variant="mute">{loadingPlans ? "Prices and billing periods come from GaitAI." : (b.message ?? "GaitAI did not return any subscription plans. Try again shortly.")}</Text>
          </Card>
        )}

        <Card tone="flat" style={{ gap: 6, borderColor: t.line, borderWidth: 1 }}>
          <Text variant="label">Before you subscribe</Text>
          <Text variant="small">{catalog?.disclosures.recurring ?? "Subscriptions renew automatically at the end of each billing period until cancelled."}</Text>
          <Text variant="small">{catalog?.disclosures.cancellation ?? "Cancel any time from Manage subscription. Access continues until the end of the period already paid for."}</Text>
          <Text variant="small">{catalog?.tax.text ?? "Applicable taxes are shown before you pay."}</Text>
          <Text variant="small">{catalog?.disclosures.separate ?? "Each product is a separate subscription."}</Text>
          <Text variant="small">{catalog?.disclosures.refunds ?? `Refund requests go to ${SUPPORT_EMAIL}.`}</Text>
        </Card>

        {!signedIn ? <Card tone="accent"><Text variant="bodyStrong">Sign in first</Text><Text variant="mute">Your subscription is tied to your GaitAI account so it follows you to any phone.</Text></Card> : null}
        {signedIn && !verified ? <Card tone="flat" style={{ borderColor: t.warning, borderWidth: 1, gap: 6 }}><Chip tone="warning" label="EMAIL NOT VERIFIED" small /><Text>Verify {user?.email} before subscribing. Tap the link in the email we sent.</Text><Row gap={space.sm}><Button kind="secondary" label="Resend link" onPress={() => app.auth.sendVerification().catch(() => {})} style={{ minHeight: 40 }} /><Button kind="ghost" label="I verified it" onPress={() => app.auth.refreshUser().then(() => app.refreshBilling())} style={{ minHeight: 40 }} /></Row></Card> : null}
        {!paymentsActive ? <Card tone="flat" style={{ borderColor: t.warning, borderWidth: 1 }}><Text variant="bodyStrong">Subscriptions open soon</Text><Text variant="mute">Payments for GaitAI subscriptions are not yet switched on. The plans above are the announced prices.</Text></Card> : null}
        {b.status === "cancelled" ? <Text variant="mute">{b.message ?? "Checkout closed. Nothing was charged."}</Text> : null}
        {b.status === "failed" ? <Card tone="flat" style={{ borderColor: t.danger, borderWidth: 1 }}><Text color={t.danger}>{b.message ?? "The payment could not be completed. Nothing was charged."}</Text></Card> : null}
        {pending && !app.isPro ? <Card tone="flat" style={{ borderColor: t.warning, borderWidth: 1, gap: 4 }}><Chip tone="warning" label="PENDING" small /><Text>{b.message ?? describeEntitlement(app.entitlement).body}</Text></Card> : null}
        {b.status === "restored" || (b.status === "purchased" && b.message) ? <Text color={t.success}>{b.message}</Text> : null}
        {app.entitlementStatus === "EXPIRED" || app.entitlementStatus === "UNKNOWN" ? <Text variant="mute">{describeEntitlement(app.entitlement).body}</Text> : null}

        <Row style={{ justifyContent: "space-between" }}>
          <Button kind="ghost" label="Restore subscription" onPress={() => app.restore()} disabled={busy || !signedIn} />
          <Button kind="ghost" label="Manage" onPress={() => router.push("/account/manage" as never)} disabled={!signedIn} />
        </Row>
        <Row style={{ justifyContent: "center" }} gap={space.lg}>
          <Button kind="ghost" label="Terms" onPress={() => Linking.openURL(TERMS_URL)} />
          <Button kind="ghost" label="Privacy" onPress={() => Linking.openURL(PRIVACY_URL)} />
          <Button kind="ghost" label="Support" onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`${productMeta[app.product].name} subscription`)}`)} />
        </Row>
      </View>
    </Screen>
  );
}

const perMonth = (p: StoreProduct) => {
  const paise = Math.round(p.priceMicros / 10_000 / 12);
  const rupees = Math.floor(paise / 100); const rest = paise % 100;
  return `₹${rupees.toLocaleString("en-IN")}.${String(rest).padStart(2, "0")}`;
};

function PlanCard({ name, product, selected, onPress, badge, sub }: { name: string; product?: StoreProduct; selected: boolean; onPress: () => void; badge?: string; sub?: string }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} disabled={!product} accessibilityRole="radio" accessibilityState={{ checked: selected, disabled: !product }} accessibilityLabel={product ? `${name} plan, ${product.localizedPrice}` : `${name} plan unavailable`}
      style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
      <View style={{ borderRadius: radius.lg, padding: space.lg, gap: 6, backgroundColor: selected ? t.surface : t.surface2, borderWidth: selected ? 2 : 1, borderColor: selected ? t.gold : t.line }}>
        <Row style={{ justifyContent: "space-between" }}>
          <Row gap={10}><View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: selected ? t.gold : t.lineStrong, alignItems: "center", justifyContent: "center" }}>{selected ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.gold }} /> : null}</View><Text variant="bodyStrong">{name}</Text></Row>
          {badge && product ? <Chip tone="premium" label={badge} small /> : null}
        </Row>
        {product ? <Text variant="heading">{product.localizedPrice} <Text variant="mute">/ {product.plan === "yearly" ? "year" : "month"}</Text></Text> : <Text variant="mute">Not available right now.</Text>}
        {sub && product ? <Text variant="mute">{sub}</Text> : null}
      </View>
    </Pressable>
  );
}

export { Divider };
