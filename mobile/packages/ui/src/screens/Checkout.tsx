/**
 * The hosted checkout page in a WebView. The page (served by the billing
 * Worker) runs Razorpay's Standard Checkout — or, on the sandbox Worker, two
 * simulate buttons — verifies the signed result with the Worker, and posts
 * `{type:"gaitai-checkout", status}` back here. We then re-read the
 * entitlement from the server. UPI intents open the user's UPI app.
 */
import React, { useRef, useState } from "react";
import { ActivityIndicator, Linking, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { API_BASE_URL } from "@gaitai/api";
import { space } from "@gaitai/design-system";
import { useApp, type CheckoutResult } from "../app-state";
import { Button, Row, Text } from "../primitives";
import { useTheme } from "../theme";

export function CheckoutScreen({ url }: { url: string }) {
  const t = useTheme(); const app = useApp(); const router = useRouter(); const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<CheckoutResult | null>(null);
  const done = useRef(false);
  const allowed = url.startsWith(API_BASE_URL + "/v1/checkout/page");

  const finish = async (r: CheckoutResult) => {
    if (done.current) return;
    done.current = true;
    setResult(r);
    await app.completeCheckout(r);
    if (r === "verified") router.replace("/account/manage" as never); else router.back();
  };

  const onMessage = (e: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data) as { type?: string; status?: CheckoutResult };
      if (msg.type === "gaitai-checkout" && msg.status) finish(msg.status);
    } catch { /* ignore foreign messages */ }
  };

  if (!allowed) {
    return <View style={{ flex: 1, backgroundColor: t.bg, padding: space.lg, paddingTop: insets.top + space.lg, gap: space.md }}><Text variant="heading">This checkout link is not GaitAI's.</Text><Text>Only checkout pages served by GaitAI can be opened here.</Text><Button label="Back" onPress={() => router.back()} /></View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <Row style={{ paddingTop: insets.top + space.sm, paddingHorizontal: space.md, paddingBottom: space.sm, justifyContent: "space-between" }}>
        <Text variant="label">SECURE CHECKOUT</Text>
        <Button kind="ghost" label="Close" onPress={() => finish("cancelled")} style={{ minHeight: 36 }} />
      </Row>
      <WebView
        source={{ uri: url }}
        onMessage={onMessage}
        onLoadEnd={() => setLoading(false)}
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        incognito
        originWhitelist={["https://*", "upi://*", "intent://*"]}
        onShouldStartLoadWithRequest={(req) => {
          // UPI / app intents belong to the UPI app, not the WebView.
          if (/^(upi|intent|tez|phonepe|paytmmp|gpay):/.test(req.url)) { Linking.openURL(req.url).catch(() => {}); return false; }
          return true;
        }}
        style={{ flex: 1, backgroundColor: t.bg }}
      />
      {loading ? <View style={{ position: "absolute", top: insets.top + 60, left: 0, right: 0, alignItems: "center" }}><ActivityIndicator color={t.gold} /></View> : null}
      {result ? <View style={{ padding: space.md, paddingBottom: insets.bottom + space.md }}><Text variant="mute" style={{ textAlign: "center" }}>{result === "verified" ? "Payment verified. Updating your subscription…" : "Returning…"}</Text></View> : null}
    </View>
  );
}
