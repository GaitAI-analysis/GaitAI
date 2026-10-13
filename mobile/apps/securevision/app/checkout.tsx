import React from "react";
import { useLocalSearchParams } from "expo-router";
import { CheckoutScreen } from "@gaitai/ui";

export default function Checkout() {
  const p = useLocalSearchParams<{ url?: string }>();
  return <CheckoutScreen url={p.url ? String(p.url) : ""} />;
}
