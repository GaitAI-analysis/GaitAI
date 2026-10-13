import React from "react";
import { useLocalSearchParams } from "expo-router";
import { ForgotPasswordScreen } from "@gaitai/ui";

export default function Forgot() {
  const p = useLocalSearchParams<{ email?: string }>();
  return <ForgotPasswordScreen initialEmail={p.email ? String(p.email) : ""} />;
}
