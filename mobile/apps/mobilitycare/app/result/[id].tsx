import React, { useEffect, useState } from "react";
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
