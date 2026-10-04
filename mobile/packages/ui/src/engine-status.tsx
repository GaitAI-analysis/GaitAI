/**
 * Engine start-up made visible. The steps come from the engine's real state
 * machine (INITIALIZING → LOADING_ASSETS → READY); nothing here animates a
 * percentage or pretends a step is done before the engine reported it.
 */
import React from "react";
import { StyleSheet, View } from "react-native";
import { describeEngineError, type EngineStatus } from "@gaitai/analysis";
import { radius, space, type ProductId } from "@gaitai/design-system";
import { useApp } from "./app-state";
import { MotionDots } from "./metrics";
import { Button, Card, Chip, Row, Text } from "./primitives";
import { useTheme } from "./theme";

export const ENGINE_TITLE = "Preparing GaitAI Movement Engine";

export type EngineStepState = "done" | "active" | "todo" | "failed";
export interface EngineStep { id: string; label: string; state: EngineStepState }

/** The three visible preparation steps, derived from the engine state. */
export function engineSteps(status: EngineStatus, product: ProductId): EngineStep[] {
  const model = product === "securevision" ? "Loading person detector" : "Loading movement model";
  const order = ["runtime", "model", "ready"] as const;
  const labels = { runtime: "Starting analysis runtime", model, ready: "Ready to analyze" };
  const activeIdx = status.state === "INITIALIZING" || status.state === "UNINITIALIZED" ? 0
    : status.state === "LOADING_ASSETS" ? (status.detail === "Loading analysis runtime" ? 0 : 1)
    : status.state === "ERROR" ? (status.error?.code === "MODEL_ASSET_MISSING" ? 1 : status.since ? 0 : 0)
    : 3;
  return order.map((id, i) => ({ id, label: labels[id], state: status.state === "ERROR" ? (i < activeIdx ? "done" : i === activeIdx ? "failed" : "todo") : i < activeIdx ? "done" : i === activeIdx ? "active" : i === 2 && activeIdx === 3 ? "done" : "todo" }));
}

/** Convenience for screens that start analyses. */
export function useEngineGate() {
  const app = useApp();
  const s = app.engineStatus;
  return {
    status: s,
    ready: s.state === "READY" || s.state === "ANALYZING",
    preparing: s.state === "UNINITIALIZED" || s.state === "INITIALIZING" || s.state === "LOADING_ASSETS",
    failed: s.state === "ERROR",
    retry: app.retryEngine,
  };
}

function StepDot({ state }: { state: EngineStepState }) {
  const t = useTheme();
  const bg = state === "done" || state === "active" ? t.accent : state === "failed" ? t.danger : t.surface2;
  return <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: bg, opacity: state === "done" ? 0.7 : 1, borderWidth: state === "todo" ? StyleSheet.hairlineWidth : 0, borderColor: t.lineStrong }} />;
}

/**
 * The start-up card shown above the actions on an analysis screen. Preparing:
 * title + live steps. Ready: one quiet line. Error: the specific problem and a
 * Retry that really re-initialises the engine.
 */
export function EnginePreparing({ product, retrying }: { product: ProductId; retrying?: boolean }) {
  const t = useTheme();
  const { status, ready, failed, retry } = useEngineGate();
  const [busy, setBusy] = React.useState(false);
  if (ready) {
    return (
      <Row gap={space.sm} accessibilityLiveRegion="polite">
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.success }} />
        <Text variant="mute">Movement engine ready. Analysis runs on this phone.</Text>
      </Row>
    );
  }
  const steps = engineSteps(status, product);
  if (failed) {
    const copy = status.error ? describeEngineError(status.error.code) : null;
    return (
      <Card style={{ gap: space.md, borderColor: t.danger, borderWidth: 1 }} accessibilityLabel={`Engine not started. ${status.detail}`}>
        <Chip tone="danger" label="ENGINE NOT STARTED" />
        <Text variant="heading">{copy?.title ?? "The movement engine could not start"}</Text>
        <Text>{copy?.body ?? status.detail}</Text>
        {status.error ? <Text variant="mute">Code: {status.error.code}</Text> : null}
        <Button kind="secondary" label="Retry initialization" loading={busy || retrying} onPress={async () => { setBusy(true); try { await retry(); } catch { /* status card shows the new error */ } finally { setBusy(false); } }} style={{ alignSelf: "flex-start" }} />
      </Card>
    );
  }
  return (
    <Card style={{ gap: space.md }} accessibilityLabel={`${ENGINE_TITLE}. ${status.detail}.`}>
      <Row style={{ justifyContent: "space-between" }}>
        <Chip tone="accent" label="ON THIS PHONE" />
        <MotionDots color={t.accent} />
      </Row>
      <Text variant="heading">{ENGINE_TITLE}</Text>
      <View style={{ gap: space.sm }}>
        {steps.map((s) => (
          <Row key={s.id} gap={space.md}>
            <StepDot state={s.state} />
            <Text variant={s.state === "active" ? "bodyStrong" : "body"} color={s.state === "todo" ? t.mute : undefined}>{s.label}</Text>
          </Row>
        ))}
      </View>
      <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.line }} />
      <Text variant="mute">{status.detail}. Record and upload unlock when the engine is ready; nothing is uploaded at any point.</Text>
    </Card>
  );
}

/** Small inline status for a footer: tells the user why the buttons are disabled. */
export function EngineFooterNote() {
  const t = useTheme();
  const { ready, failed, status } = useEngineGate();
  if (ready) return null;
  return <Text variant="small" color={failed ? t.danger : t.mute} style={{ textAlign: "center", borderRadius: radius.sm }}>{failed ? "Engine not started. Retry above." : `${status.detail}…`}</Text>;
}
