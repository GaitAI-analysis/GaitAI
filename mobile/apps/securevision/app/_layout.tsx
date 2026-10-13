import React, { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts, Georama_400Regular, Georama_500Medium, Georama_600SemiBold, Georama_700Bold } from "@expo-google-fonts/georama";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider, ThemeProvider, useApp, useTheme } from "@gaitai/ui";

export const MARK = require("../assets/images/icon.png");

SplashScreen.preventAutoHideAsync().catch(() => {});

/** Routes a signed-out person may see. Everything else needs an account on this platform. */
const PUBLIC_SEGMENTS = new Set(["onboarding", "auth", "paywall", "+not-found"]);

function Root() {
  const t = useTheme();
  const app = useApp();
  const router = useRouter();
  const segments = useSegments();
  const onboarded = app.profile?.onboardingComplete;
  const first = segments[0] ?? "";
  useEffect(() => {
    if (app.loading || !app.auth.ready) return;
    if (onboarded === false && first !== "onboarding") { router.replace("/onboarding" as never); return; }
    if (onboarded && app.accountRequired && !app.auth.user && !PUBLIC_SEGMENTS.has(first)) router.replace("/auth/sign-in" as never);
  }, [app.loading, app.auth.ready, app.auth.user, app.accountRequired, onboarded, router, first]);
  const sub = { headerShown: true, title: "", headerStyle: { backgroundColor: t.bg }, headerTintColor: t.ink, headerShadowVisible: false } as const;
  return (
    <>
      <StatusBar style={t.scheme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.bg }, animation: "slide_from_right" }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
        <Stack.Screen name="auth/sign-in" options={{ animation: "fade" }} />
        <Stack.Screen name="auth/register" options={sub} />
        <Stack.Screen name="auth/forgot" options={sub} />
        <Stack.Screen name="paywall" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
        <Stack.Screen name="checkout" options={{ presentation: "fullScreenModal", animation: "slide_from_bottom", gestureEnabled: false }} />
        <Stack.Screen name="account/manage" options={{ ...sub, title: "Subscription" }} />
        <Stack.Screen name="result/[id]" options={{ ...sub, title: "Result" }} />
        <Stack.Screen name="coming-soon/[id]" options={sub} />
        <Stack.Screen name="analyze/crowdsense" options={sub} />
        <Stack.Screen name="analyze/zone" options={sub} />
      </Stack>
    </>
  );
}

export default function Layout() {
  const [fontsLoaded, fontError] = useFonts({ Georama_400Regular, Georama_500Medium, Georama_600SemiBold, Georama_700Bold });
  const ready = fontsLoaded || !!fontError;
  useEffect(() => { if (ready) SplashScreen.hideAsync().catch(() => {}); }, [ready]);
  if (!ready) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider product="securevision" fontsReady={!!fontsLoaded}>
          <AppProvider product="securevision">
            <Root />
          </AppProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
