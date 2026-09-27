import React from "react";
import { useLocalSearchParams } from "expo-router";
import type { AnalysisProductId } from "@gaitai/core";
import { ComingSoonScreen } from "@gaitai/ui";

export default function ComingSoon() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ComingSoonScreen id={id as AnalysisProductId} />;
}
