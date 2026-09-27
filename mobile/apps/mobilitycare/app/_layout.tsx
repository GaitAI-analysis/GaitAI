import React, { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider, ThemeProvider, useApp, useTheme } from "@gaitai/ui";

/** The on-device analysis engine page (MediaPipe WebAssembly + models), bundled as an asset. */
const ENGINE = require("@gaitai/analysis/engine/engine.html");
export const MARK = require("../assets/images/icon.png");

function Root() {
  const t = useTheme();
  const app = useApp();
  const router = useRouter();
  const segments = useSegments();
  const onboarded = app.profile?.onboardingComplete;
  useEffect(() => {
    if (!app.loading && onboarded === false && segments[0] !== "onboarding") router.replace("/onboarding" as never);
  }, [app.loading, onboarded, router, segments]);
  const sub = { headerShown: true, title: "", headerStyle: { backgroundColor: t.bg }, headerTintColor: t.ink, headerShadowVisible: false } as const;
  return (
    <>
      <StatusBar style={t.scheme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.bg }, animation: "slide_from_right" }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
        <Stack.Screen name="paywall" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
        <Stack.Screen name="result/[id]" options={{ ...sub, title: "Result" }} />
        <Stack.Screen name="coming-soon/[id]" options={sub} />
        <Stack.Screen name="analyze/walkscan" options={sub} />
        <Stack.Screen name="analyze/rehabtrack" options={sub} />
      </Stack>
    </>
  );
}

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider product="mobilitycare">
          <AppProvider product="mobilitycare" engineSource={ENGINE}>
            <Root />
          </AppProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
