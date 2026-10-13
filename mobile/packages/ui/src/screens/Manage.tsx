/**
 * Manage subscription: status, next charge, cancel at the end of the paid
 * period, billing history, support. On the sandbox Worker it also exposes
 * the lifecycle simulations (renewal, failed renewal, refund…) used by the
 * end-to-end tests — they do not exist on the production Worker.
 */
import React, { useCallback, useEffect, useState } from "react";
import { Alert, Linking, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { billingApi, SUPPORT_EMAIL, ACCOUNT_URL, type PaymentView, type SubscriptionView } from "@gaitai/api";
import { describeEntitlement } from "@gaitai/billing";
import { productMeta, space } from "@gaitai/design-system";
import { useApp } from "../app-state";
import { Button, Card, Chip, Divider, EmptyState, Row, Screen, SectionTitle, Text } from "../primitives";
import { useTheme } from "../theme";

const fmtDate = (unix: number | null | undefined) => (unix ? new Date(unix * 1000).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" }) : "—");
const fmtAmount = (paise: number, currency = "INR") => (currency === "INR" ? `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `${paise / 100} ${currency}`);

export function ManageSubscriptionScreen() {
  const t = useTheme(); const app = useApp(); const router = useRouter(); const insets = useSafeAreaInsets();
  const [payments, setPayments] = useState<PaymentView[] | null>(null);
  const [busy, setBusy] = useState(false);
  const server = app.server;
  const sub: SubscriptionView | undefined = server?.me.subscriptions.find((s) => s.id === server.me.entitlement?.subscriptionId) ?? server?.me.subscriptions[0];
  const ent = app.entitlement; const desc = describeEntitlement(ent);
  const sandbox = server?.mode === "sandbox";

  const load = useCallback(async () => {
    await app.refreshBilling().catch(() => {});
    if (app.auth.user) setPayments((await billingApi.history().catch(() => ({ payments: [] }))).payments);
  }, [app]);
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cancel = () => Alert.alert(
    "Cancel subscription?",
    sub?.currentEnd ? `No further charges will be taken. You keep access until ${fmtDate(sub.currentEnd)}, the end of the period you have paid for.` : "No further charges will be taken.",
    [{ text: "Keep subscription", style: "cancel" }, { text: "Cancel at period end", style: "destructive", onPress: async () => { setBusy(true); try { await app.cancelSubscription(true); await load(); } catch (e) { Alert.alert("Could not cancel", e instanceof Error ? e.message : String(e)); } finally { setBusy(false); } } }],
  );

  const simulate = async (scenario: string) => {
    if (!sub) return;
    setBusy(true);
    try { await billingApi.simulate(sub.id, scenario); await load(); } catch (e) { Alert.alert("Simulation failed", e instanceof Error ? e.message : String(e)); } finally { setBusy(false); }
  };

  if (!app.auth.user && app.accountRequired) {
    return <Screen style={{ paddingTop: insets.top + space.md }}><Text variant="title">Subscription</Text><EmptyState title="Sign in to manage your subscription" body="Your subscription belongs to your GaitAI account." action={<Button label="Sign in" onPress={() => router.push("/auth/sign-in" as never)} />} /></Screen>;
  }

  const statusTone = ent.status === "PRO" ? (ent.inGracePeriod ? "warning" : "premium") : ent.status === "PENDING" ? "warning" : ent.status === "EXPIRED" ? "danger" : "neutral";
  const statusLabel = ent.status === "PRO" ? (sub?.cancelAtCycleEnd ? "ACTIVE · ENDS AT PERIOD END" : ent.inGracePeriod ? "ACTIVE · PAYMENT RETRYING" : "ACTIVE") : ent.status;

  return (
    <Screen style={{ paddingTop: insets.top + space.md }} refreshing={false} onRefresh={load}>
      <Text variant="title">Subscription</Text>
      <Text style={{ marginTop: 6 }}>{productMeta[app.product].name} · {app.auth.user?.email ?? "this device"}</Text>
      {sandbox ? <View style={{ marginTop: space.md }}><Chip tone="warning" label="SANDBOX · SYNTHETIC PAYMENTS ONLY" small /></View> : null}

      <Card style={{ marginTop: space.lg, gap: space.sm }}>
        <Row style={{ justifyContent: "space-between" }}><Text variant="bodyStrong">{desc.title}</Text><Chip tone={statusTone} label={statusLabel} /></Row>
        <Text variant="mute">{desc.body}</Text>
        {sub ? (
          <>
            <Divider />
            <Row style={{ justifyContent: "space-between" }}><Text variant="mute">Plan</Text><Text variant="bodyStrong">{sub.plan.label} · {sub.plan.amount}</Text></Row>
            <Row style={{ justifyContent: "space-between" }}><Text variant="mute">Current period</Text><Text>{fmtDate(sub.currentStart)} – {fmtDate(sub.currentEnd)}</Text></Row>
            <Row style={{ justifyContent: "space-between" }}><Text variant="mute">{sub.cancelAtCycleEnd ? "Access ends" : "Next charge"}</Text><Text>{sub.cancelAtCycleEnd ? fmtDate(sub.currentEnd) : sub.renewsAt ? `${fmtDate(sub.renewsAt)} · ${sub.plan.amount}` : "—"}</Text></Row>
            <Row style={{ justifyContent: "space-between" }}><Text variant="mute">Payments made</Text><Text>{sub.paidCount}</Text></Row>
            <Text variant="small" color={t.mute}>Subscription {sub.id}</Text>
          </>
        ) : null}
      </Card>

      <View style={{ gap: space.sm, marginTop: space.lg }}>
        {app.isPro && sub && !sub.cancelAtCycleEnd ? <Button kind="secondary" label="Cancel subscription" onPress={cancel} loading={busy} /> : null}
        {!app.isPro ? <Button label="See plans" onPress={() => router.push("/paywall" as never)} /> : null}
        <Button kind="ghost" label="Refresh status" onPress={load} />
      </View>

      <SectionTitle>Billing history</SectionTitle>
      {payments === null ? <Text variant="mute">Loading…</Text> : payments.length === 0 ? <Card tone="flat"><Text variant="mute">No payments yet.</Text></Card> : (
        <View style={{ gap: space.sm }}>
          {payments.map((p) => (
            <Card key={p.id} style={{ paddingVertical: space.md, gap: 4 }}>
              <Row style={{ justifyContent: "space-between" }}><Text variant="bodyStrong">{fmtAmount(p.amount, p.currency)}</Text><Chip small tone={p.status === "captured" ? "success" : p.status === "refunded" ? "warning" : "danger"} label={p.status.toUpperCase()} /></Row>
              <Text variant="mute">{new Date(p.at * 1000).toLocaleString()}{p.method ? ` · ${p.method.toUpperCase()}` : ""}</Text>
              {p.error ? <Text variant="small" color={t.danger}>{p.error}</Text> : null}
              <Text variant="small" color={t.mute}>{p.invoiceId ? `Invoice ${p.invoiceId} · ` : ""}Payment {p.id}</Text>
            </Card>
          ))}
        </View>
      )}

      <SectionTitle>Help</SectionTitle>
      <Card style={{ gap: space.sm }}>
        <Text variant="mute">Cancelling stops future charges; access continues to the end of the period already paid for. Refunds and billing questions: {SUPPORT_EMAIL}. You can also manage your subscription at gaitai.in/account.</Text>
        <Row gap={space.sm} style={{ flexWrap: "wrap" }}>
          <Button kind="ghost" label="Email support" onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`${productMeta[app.product].name} subscription ${sub?.id ?? ""}`)}`)} style={{ minHeight: 40 }} />
          <Button kind="ghost" label="Manage on the web" onPress={() => Linking.openURL(ACCOUNT_URL)} style={{ minHeight: 40 }} />
        </Row>
      </Card>

      {sandbox && sub ? (
        <>
          <SectionTitle>Sandbox lifecycle simulations</SectionTitle>
          <Card tone="flat" style={{ gap: space.sm, borderColor: t.warning, borderWidth: 1 }}>
            <Text variant="mute">These exist only on the sandbox Worker and replay the events the payment gateway would send.</Text>
            {[["renewal_charged", "Renewal charged"], ["renewal_failed", "Renewal failed (grace)"], ["halted", "Retries exhausted (halted)"], ["refund", "Refund last payment"], ["expire", "Period expired, no renewal"], ["cancel_immediate", "Cancel immediately"]].map(([s, l]) => <Button key={s} kind="secondary" label={l} onPress={() => simulate(s)} disabled={busy} style={{ minHeight: 40 }} />)}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
