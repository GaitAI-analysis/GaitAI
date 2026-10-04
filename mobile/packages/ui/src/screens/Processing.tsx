import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { space } from "@gaitai/design-system";
import { describeEngineError, type EngineError, type EngineProgress } from "@gaitai/analysis";
import { Button, Card, Chip, Screen, Text } from "../primitives";
import { StageProgress } from "../metrics";
import { useTheme } from "../theme";

/** Stage lists. The first stage is the engine itself: it shows as done when the engine was already ready. */
export const POSE_STAGES = [
  { id: "engine", label: "Preparing movement engine" },
  { id: "preparing", label: "Opening your video" },
  { id: "detecting", label: "Detecting body landmarks" },
  { id: "computing", label: "Computing step timing" },
  { id: "reporting", label: "Building your result" },
];
export const DETECT_STAGES = [
  { id: "engine", label: "Preparing detection engine" },
  { id: "preparing", label: "Opening your video" },
  { id: "detecting", label: "Detecting people" },
  { id: "tracking", label: "Tracking across frames" },
  { id: "computing", label: "Computing counts" },
  { id: "reporting", label: "Building your result" },
];

export interface ProcessingActions {
  /** Re-initialise the engine, then re-run the pending clip. */
  onRetryInit?: () => void;
  /** Re-run the same clip. */
  onRetrySame?: () => void;
  /** Pick a different clip. */
  onAnotherVideo?: () => void;
  /** Record a new clip (WalkScan only). */
  onRecordAgain?: () => void;
}

/**
 * The analysis-in-progress screen and, when something fails, the failure screen.
 * Content starts at the top (no empty half-screen above the message); the
 * failure copy names the real cause and offers only the actions that can help.
 */
export function ProcessingScreen({ progress, stages, title, chip, onCancel, error, actions = {} }: { progress: EngineProgress; stages: { id: string; label: string }[]; title: string; chip: string; onCancel?: () => void; error?: EngineError | null; actions?: ProcessingActions }) {
  const t = useTheme(); const insets = useSafeAreaInsets();
  if (error) {
    const copy = describeEngineError(error.code);
    const buttons: React.ReactNode[] = [];
    if (copy.retryInit && actions.onRetryInit) buttons.push(<Button key="init" label="Retry initialization" onPress={actions.onRetryInit} />);
    if (copy.retrySame && actions.onRetrySame) buttons.push(<Button key="same" label="Try again" kind={buttons.length ? "secondary" : "primary"} onPress={actions.onRetrySame} />);
    if (copy.anotherVideo && actions.onRecordAgain) buttons.push(<Button key="rec" label="Record again" kind={buttons.length ? "secondary" : "primary"} onPress={actions.onRecordAgain} />);
    if (copy.anotherVideo && actions.onAnotherVideo) buttons.push(<Button key="pick" label="Try another video" kind={buttons.length ? "secondary" : "primary"} onPress={actions.onAnotherVideo} />);
    buttons.push(<Button key="back" kind="ghost" label="Back" onPress={onCancel ?? (() => {})} />);
    return (
      <Screen footer={<View style={{ gap: space.sm }}>{buttons}</View>}>
        <View style={{ paddingTop: space.lg, gap: space.lg }}>
          <Chip tone="danger" label="ANALYSIS STOPPED" />
          <Text variant="title">{copy.title}</Text>
          <Text variant="lead">{copy.body}</Text>
          <Card tone="flat" style={{ gap: space.xs }}>
            <Text variant="mute">Nothing left this phone. {error.code === "ENGINE_INITIALIZATION_FAILED" || error.code === "MODEL_ASSET_MISSING" ? "Your selected video is kept for the retry." : "Your video was not changed."}</Text>
            <Text variant="small" color={t.mute}>Code: {error.code}</Text>
          </Card>
        </View>
      </Screen>
    );
  }
  const idx = Math.max(0, stages.findIndex((s) => s.id === progress.stage));
  return (
    <Screen scroll={false} footer={onCancel ? <Button kind="ghost" label="Cancel" onPress={onCancel} /> : undefined}>
      <View style={{ paddingTop: Math.max(space.lg, insets.top ? space.md : space.lg), gap: space.xl }}>
        <Chip tone="accent" label={chip} />
        <Text variant="title">{progress.stage === "engine" ? "Preparing GaitAI Movement Engine" : title}</Text>
        <StageProgress stage={progress.stage} fraction={progress.fraction} stages={stages} />
        <Text variant="mute">
          {progress.stage === "engine" ? `${progress.detail ?? "Starting"}. Your video is ready and will be analysed as soon as the engine is.` : progress.detail && idx >= 2 ? `Model: ${progress.detail}` : "Running on this phone. Nothing is uploaded."}
        </Text>
      </View>
    </Screen>
  );
}
