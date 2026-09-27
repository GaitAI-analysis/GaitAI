import React from "react";
import { View } from "react-native";
import { space } from "@gaitai/design-system";
import type { EngineProgress } from "@gaitai/analysis";
import { Button, Card, Screen, Text } from "../primitives";
import { StageProgress } from "../metrics";

export const POSE_STAGES = [
  { id: "preparing", label: "Preparing video" },
  { id: "detecting", label: "Detecting body landmarks" },
  { id: "computing", label: "Computing step timing" },
  { id: "reporting", label: "Building your result" },
];
export const DETECT_STAGES = [
  { id: "preparing", label: "Preparing video" },
  { id: "detecting", label: "Detecting people" },
  { id: "tracking", label: "Tracking across frames" },
  { id: "computing", label: "Computing counts" },
  { id: "reporting", label: "Building your result" },
];

/** The analysis-in-progress screen. Stages come from the engine; none is shown as done before it ran. */
export function ProcessingScreen({ progress, stages, title, onCancel, error, onRetry }: { progress: EngineProgress; stages: { id: string; label: string }[]; title: string; onCancel?: () => void; error?: string | null; onRetry?: () => void }) {
  return (
    <Screen scroll={false} footer={error ? <View style={{ gap: space.sm }}>{onRetry ? <Button label="Try again" onPress={onRetry} /> : null}<Button kind="ghost" label="Back" onPress={onCancel ?? (() => {})} /></View> : onCancel ? <Button kind="ghost" label="Cancel" onPress={onCancel} /> : undefined}>
      <View style={{ flex: 1, justifyContent: "center", gap: space.xl }}>
        <Text variant="title">{error ? "Analysis stopped" : title}</Text>
        {error ? <Card style={{ gap: space.sm }}><Text>{error}</Text><Text variant="mute">Nothing was uploaded. You can try again with a different clip.</Text></Card> : <>
          <StageProgress stage={progress.stage} fraction={progress.fraction} stages={stages} />
          <Text variant="mute">{progress.detail ? `Model: ${progress.detail}` : "Running on this phone. Nothing is uploaded."}</Text>
        </>}
      </View>
    </Screen>
  );
}
