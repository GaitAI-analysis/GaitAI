// Generates the thin Expo Router route files for both apps. Screens live in
// packages/ui; each app's app/ folder only wires routes to them and passes
// the product's mark. Re-run after adding a screen: node scripts/gen-routes.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const w = (p, s) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); };

const APPS = [
  { app: "mobilitycare", progress: "Progress", flows: { walkscan: "WalkScanScreen", rehabtrack: "RehabTrackScreen" } },
  { app: "securevision", progress: "Activity", flows: { crowdsense: 'CrowdScreen kind="crowdsense"', zone: 'CrowdScreen kind="zone"' } },
];

for (const { app, progress, flows } of APPS) {
  const A = path.join(root, "apps", app);
  for (const f of ["app/(tabs)/two.tsx", "app/modal.tsx", "app/+html.tsx", "components", "constants"]) fs.rmSync(path.join(A, f), { recursive: true, force: true });

  const stackFlows = Object.keys(flows).map((f) => `        <Stack.Screen name="analyze/${f}" options={sub} />`).join("\n");
  w(path.join(A, "app/_layout.tsx"), `import React, { useEffect } from "react";
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
${stackFlows}
      </Stack>
    </>
  );
}

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider product="${app}">
          <AppProvider product="${app}" engineSource={ENGINE}>
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
import { OnboardingScreen } from "@gaitai/ui";
import { MARK } from "./_layout";

export default function Onboarding() {
  const r = useRouter();
  return <OnboardingScreen mark={MARK} onDone={() => r.replace("/(tabs)" as never)} />;
}
`);
  w(path.join(A, "app/(tabs)/_layout.tsx"), `import React from "react";\nimport { AppTabs } from "@gaitai/ui";\n\nexport default function TabsLayout() {\n  return <AppTabs progressTitle="${progress}" />;\n}\n`);
  w(path.join(A, "app/(tabs)/index.tsx"), `import React from "react";\nimport { HomeScreen } from "@gaitai/ui";\nimport { MARK } from "../_layout";\n\nexport default function Home() {\n  return <HomeScreen mark={MARK} />;\n}\n`);
  w(path.join(A, "app/(tabs)/analyze.tsx"), `import React from "react";\nimport { AnalyzeScreen } from "@gaitai/ui";\n\nexport default function Analyze() {\n  return <AnalyzeScreen />;\n}\n`);
  w(path.join(A, "app/(tabs)/progress.tsx"), `import React from "react";\nimport { ProgressScreen } from "@gaitai/ui";\n\nexport default function Progress() {\n  return <ProgressScreen title="${progress}" />;\n}\n`);
  w(path.join(A, "app/(tabs)/reports.tsx"), `import React from "react";\nimport { ReportsScreen } from "@gaitai/ui";\n\nexport default function Reports() {\n  return <ReportsScreen />;\n}\n`);
  w(path.join(A, "app/(tabs)/profile.tsx"), `import React from "react";\nimport { ProfileScreen } from "@gaitai/ui";\n\nexport default function Profile() {\n  return <ProfileScreen />;\n}\n`);
  w(path.join(A, "app/paywall.tsx"), `import React from "react";
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
`);
  w(path.join(A, "app/result/[id].tsx"), `import React, { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { sessionStore, type AnalysisSession } from "@gaitai/core";
import { ErrorState, ResultScreen, Screen, Skeleton, useApp } from "@gaitai/ui";

export default function Result() {
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
    w(path.join(A, `app/analyze/${route}.tsx`), `import React from "react";\nimport { ${comp} } from "@gaitai/ui";\n\nexport default function Screen() {\n  return <${jsx} />;\n}\n`);
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
