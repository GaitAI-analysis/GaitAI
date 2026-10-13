import React from "react";
import { useRouter } from "expo-router";
import { OnboardingScreen, useApp } from "@gaitai/ui";
import { MARK } from "./_layout";

export default function Onboarding() {
  const r = useRouter();
  const app = useApp();
  return <OnboardingScreen mark={MARK} onDone={() => r.replace((app.accountRequired && !app.auth.user ? "/auth/sign-in" : "/(tabs)") as never)} />;
}
