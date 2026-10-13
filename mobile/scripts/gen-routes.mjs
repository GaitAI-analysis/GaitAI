// Generates the thin Expo Router route files for both apps. Screens live in
// packages/ui; each app's app/ folder only wires routes to them and passes
// the product's mark. Re-run after adding a screen: node scripts/gen-routes.mjs
//
// GATING. Every functional route (home, analyze, progress, reports, the
// analysis flows, results) renders inside <RequireSubscription>, so a deep
// link or an internal navigation to any of them lands on the sign-in or the
// locked screen without an account and an active, server-confirmed
// subscription. Account routes (auth/*, paywall, checkout, account/manage,
// the Profile tab) stay reachable, as do onboarding and not-found.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const w = (p, s) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); };

const APPS = [
  { app: "mobilitycare", progress: "Progress", flows: { walkscan: "WalkScanScreen", rehabtrack: "RehabTrackScreen" } },
  { app: "securevision", progress: "Activity", flows: { crowdsense: 'CrowdScreen kind="crowdsense"', zone: 'CrowdScreen kind="zone"' } },
];

const gated = (comp, jsx = `<${comp} />`) => `import React from "react";\nimport { ${comp}, RequireSubscription } from "@gaitai/ui";\n\nexport default function Screen() {\n  return <RequireSubscription>${jsx}</RequireSubscription>;\n}\n`;

for (const { app, progress, flows } of APPS) {
  const A = path.join(root, "apps", app);
  for (const f of ["app/(tabs)/two.tsx", "app/modal.tsx", "app/+html.tsx", "components", "constants"]) fs.rmSync(path.join(A, f), { recursive: true, force: true });

  const stackFlows = Object.keys(flows).map((f) => `        <Stack.Screen name="analyze/${f}" options={sub} />`).join("\n");
  w(path.join(A, "app/_layout.tsx"), `import React, { useEffect } from "react";
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
${stackFlows}
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
        <ThemeProvider product="${app}" fontsReady={!!fontsLoaded}>
          <AppProvider product="${app}">
            <Root />
          </AppProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
`);

  w(path.join(A, "app/onboarding.tsx"), `import React from "react";
import { useRouter } from "expo-router";
import { OnboardingScreen, useApp } from "@gaitai/ui";
import { MARK } from "./_layout";

export default function Onboarding() {
  const r = useRouter();
  const app = useApp();
  return <OnboardingScreen mark={MARK} onDone={() => r.replace((app.accountRequired && !app.auth.user ? "/auth/sign-in" : "/(tabs)") as never)} />;
}
`);
  w(path.join(A, "app/auth/sign-in.tsx"), `import React from "react";\nimport { SignInScreen } from "@gaitai/ui";\nimport { MARK } from "../_layout";\n\nexport default function SignIn() {\n  return <SignInScreen mark={MARK} />;\n}\n`);
  w(path.join(A, "app/auth/register.tsx"), `import React from "react";\nimport { RegisterScreen } from "@gaitai/ui";\nimport { MARK } from "../_layout";\n\nexport default function Register() {\n  return <RegisterScreen mark={MARK} />;\n}\n`);
  w(path.join(A, "app/auth/forgot.tsx"), `import React from "react";\nimport { useLocalSearchParams } from "expo-router";\nimport { ForgotPasswordScreen } from "@gaitai/ui";\n\nexport default function Forgot() {\n  const p = useLocalSearchParams<{ email?: string }>();\n  return <ForgotPasswordScreen initialEmail={p.email ? String(p.email) : ""} />;\n}\n`);
  w(path.join(A, "app/checkout.tsx"), `import React from "react";\nimport { useLocalSearchParams } from "expo-router";\nimport { CheckoutScreen } from "@gaitai/ui";\n\nexport default function Checkout() {\n  const p = useLocalSearchParams<{ url?: string }>();\n  return <CheckoutScreen url={p.url ? String(p.url) : ""} />;\n}\n`);
  w(path.join(A, "app/account/manage.tsx"), `import React from "react";\nimport { ManageSubscriptionScreen } from "@gaitai/ui";\n\nexport default function Manage() {\n  return <ManageSubscriptionScreen />;\n}\n`);
  w(path.join(A, "app/(tabs)/_layout.tsx"), `import React from "react";\nimport { AppTabs } from "@gaitai/ui";\n\nexport default function TabsLayout() {\n  return <AppTabs progressTitle="${progress}" />;\n}\n`);
  w(path.join(A, "app/(tabs)/index.tsx"), `import React from "react";\nimport { HomeScreen, RequireSubscription } from "@gaitai/ui";\nimport { MARK } from "../_layout";\n\nexport default function Home() {\n  return <RequireSubscription><HomeScreen mark={MARK} /></RequireSubscription>;\n}\n`);
  w(path.join(A, "app/(tabs)/analyze.tsx"), gated("AnalyzeScreen"));
  w(path.join(A, "app/(tabs)/progress.tsx"), gated("ProgressScreen", `<ProgressScreen title="${progress}" />`));
  w(path.join(A, "app/(tabs)/reports.tsx"), gated("ReportsScreen"));
  w(path.join(A, "app/(tabs)/profile.tsx"), `import React from "react";\nimport { ProfileScreen } from "@gaitai/ui";\n\nexport default function Profile() {\n  return <ProfileScreen />;\n}\n`);
  w(path.join(A, "app/paywall.tsx"), `import React from "react";
import { useRouter } from "expo-router";
import { PaywallScreen } from "@gaitai/ui";

export default function Paywall() {
  const r = useRouter();
  return <PaywallScreen onClose={() => (r.canGoBack() ? r.back() : r.replace("/(tabs)" as never))} />;
}
`);
  w(path.join(A, "app/result/[id].tsx"), `import React, { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { sessionStore, type AnalysisSession } from "@gaitai/core";
import { ErrorState, RequireSubscription, ResultScreen, Screen, Skeleton, useApp } from "@gaitai/ui";

function Body() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const app = useApp();
  const [s, setS] = useState<AnalysisSession | null | undefined>(undefined);
  useEffect(() => {
    const hit = app.sessions.find((x) => x.id === id);
    if (hit) setS(hit); else sessionStore.get(String(id)).then(setS);
  }, [id, app.sessions]);
  if (s === undefined) return <Screen><Skeleton height={28} width="60%" style={{ marginTop: 24 }} /><Skeleton height={120} radius={20} style={{ marginTop: 16 }} /><Skeleton height={120} radius={20} style={{ marginTop: 12 }} /></Screen>;
  if (s === null) return <Screen><ErrorState title="Result not found" body="This analysis is no longer on this phone." /></Screen>;
  return <ResultScreen session={s} />;
}

export default function Result() {
  return <RequireSubscription><Body /></RequireSubscription>;
}
`);
  w(path.join(A, "app/coming-soon/[id].tsx"), `import React from "react";
import { useLocalSearchParams } from "expo-router";
import type { AnalysisProductId } from "@gaitai/core";
import { ComingSoonScreen } from "@gaitai/ui";

export default function ComingSoon() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ComingSoonScreen id={id as AnalysisProductId} />;
}
`);
  for (const [route, jsx] of Object.entries(flows)) {
    const comp = jsx.split(" ")[0];
    w(path.join(A, `app/analyze/${route}.tsx`), gated(comp, `<${jsx} />`));
  }
  w(path.join(A, "app/+not-found.tsx"), `import React from "react";
import { Link } from "expo-router";
import { Button, Screen, Text } from "@gaitai/ui";

export default function NotFound() {
  return (
    <Screen>
      <Text variant="title" style={{ marginTop: 32 }}>That screen does not exist.</Text>
      <Link href="/(tabs)" asChild><Button label="Go home" onPress={() => {}} style={{ marginTop: 16 }} /></Link>
    </Screen>
  );
}
`);
  w(path.join(A, "declarations.d.ts"), `declare module "*.html" {\n  const asset: number;\n  export default asset;\n}\n`);
  const tsPath = path.join(A, "tsconfig.json");
  const ts = JSON.parse(fs.readFileSync(tsPath, "utf8"));
  ts.include = [...new Set([...(ts.include || []), "declarations.d.ts", "../../packages/**/*.ts", "../../packages/**/*.tsx"])];
  ts.compilerOptions = { ...ts.compilerOptions, jsx: "react-jsx" };
  fs.writeFileSync(tsPath, JSON.stringify(ts, null, 2));
}
console.log("routes written for", APPS.map((a) => a.app).join(", "));
