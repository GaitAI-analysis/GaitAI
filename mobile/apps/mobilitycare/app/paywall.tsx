import React from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { PaywallScreen } from "@gaitai/ui";

export default function Paywall() {
  const r = useRouter();
  const p = useLocalSearchParams<{ unlocked?: string; locked?: string }>();
  return (
    <PaywallScreen
      onClose={() => r.back()}
      unlockedCount={p.unlocked ? Number(p.unlocked) : undefined}
      lockedLabels={p.locked ? String(p.locked).split("|").filter(Boolean) : undefined}
    />
  );
}
