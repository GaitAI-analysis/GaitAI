import React from "react";
import { useRouter } from "expo-router";
import { OnboardingScreen } from "@gaitai/ui";
import { MARK } from "./_layout";

export default function Onboarding() {
  const r = useRouter();
  return <OnboardingScreen mark={MARK} onDone={() => r.replace("/(tabs)" as never)} />;
}
