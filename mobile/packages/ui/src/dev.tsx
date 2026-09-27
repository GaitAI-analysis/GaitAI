import React from "react";
import { View } from "react-native";
import { space } from "@gaitai/design-system";
import { useApp } from "./app-state";
import { Text } from "./primitives";
import { useTheme } from "./theme";

/** Watermark shown on every screen while Demo Data Mode is on. Compiled out of release builds. */
export function DemoBanner() {
  const app = useApp(); const t = useTheme();
  if (!__DEV__ || !app.demoMode) return null;
  return <View accessibilityRole="alert" style={{ backgroundColor: t.warning, borderRadius: 8, paddingHorizontal: space.md, paddingVertical: 6, marginBottom: space.md }}><Text variant="label" color="#1a1300">DEMO DATA MODE · synthetic sessions, not real analysis</Text></View>;
}
