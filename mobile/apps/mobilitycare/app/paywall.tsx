import React from "react";
import { useRouter } from "expo-router";
import { PaywallScreen } from "@gaitai/ui";

export default function Paywall() {
  const r = useRouter();
  return <PaywallScreen onClose={() => (r.canGoBack() ? r.back() : r.replace("/(tabs)" as never))} />;
}
