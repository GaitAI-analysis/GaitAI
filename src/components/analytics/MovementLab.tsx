"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  DEMO_LABEL,
  IllustrativeBadge,
} from "@/components/ui/IllustrativeBadge";
import { assetPath } from "@/lib/paths";
import {
  MOBILITY_EXPLAIN,
  MOBILITY_LAYERS,
  MOBILITY_METRICS,
  MOBILITY_REPORT,
  MOBILITY_STAGES,
  MOBILITY_TREND,
  SECURE_EXPLAIN,
  SECURE_LAYERS,
  SECURE_METRICS,
  SECURE_PATHS,
  SECURE_REPORT,
  SECURE_STAGES,
  SECURE_ZONES,
  type MobilityLayer,
  type SecureLayer,
} from "@/data/lab-demo";
import { AnalyticsPipeline } from "./AnalyticsPipeline";
import { ChipScroller, SegmentTabs } from "./controls";
import { ExplainabilityPanel } from "./ExplainabilityPanel";
import {
  FeatureDistribution,
  GaitCycleTimeline,
  MiniTrendChart,
  RiskIndicator,
  SignalMetric,
  TrajectoryCanvas,
} from "./graphics";
import { Eyebrow, ResultColumn, ResultColumns } from "./primitives";
import { parseOne, useQueryState } from "./useQueryState";
import styles from "./analytics.module.css";

/**
 * MOVEMENT STUDIO — /movement-lab
 *
 * The component file and the route both keep their `lab` names: the URL is in
 * the sitemap and linked from five places, a static export cannot redirect,
 * and renaming a file for cosmetic symmetry buys a reader nothing. Only the
 * visible name changed.
 *
 * An interactive technology demonstration, not an instrument. It answers the
 * question the rest of the site can only assert: *what actually happens
 * between a camera and an output?*
 *
 * Two modes, one shape. Each mode is a real pipeline rail — the stages the
 * platform documents — and each stage draws the thing that stage produces:
 * frames, a skeleton, a segmented stride, feature readings, a comparison
 * against a baseline, a structured output. Selecting a stage is the only
 * navigation; the layer toggles decide what is drawn on top.
 *
 * WHAT MAKES THIS HONEST
 *   · every reading comes from `data/lab-demo.ts`, whose header states that
 *     all of it is invented for illustration
 *   · every panel that shows a number carries the illustrative label, and
 *     the badge is repeated per stage rather than once at the top
 *   · the SecureVision mode is identity-free by construction: there is no
 *     identification layer, no face, no name, no watchlist — the toggles are
 *     trajectories, density, flow, zones, candidate events and a
 *     privacy-aware view, and nothing else exists to switch on
 *   · both modes end in an explainability panel that states what the output
 *     is for and, symmetrically, what it is not
 *
 * Performance: the two stage videos are the only heavy assets, they are
 * `preload="none"`, and each is mounted only while its own stage is selected,
 * so opening the lab downloads no video at all.
 */

const KEYS = ["mode", "stage"] as const;

type Mode = "mobility" | "securevision";

export function MovementLab() {
  const { values, setQuery, hydrated } = useQueryState(KEYS);

  const [mode, setMode] = useState<Mode>("mobility");
  const [stage, setStage] = useState<string>("video");
  const [mobilityLayers, setMobilityLayers] = useState<MobilityLayer[]>([
    "pose",
    "cycle",
    "cadence",
    "symmetry",
  ]);
  const [secureLayers, setSecureLayers] = useState<SecureLayer[]>([
    "trajectories",
    "zones",
    "candidates",
    "privacy",
  ]);
  const [phase, setPhase] = useState(2);

  const stages = mode === "mobility" ? MOBILITY_STAGES : SECURE_STAGES;

  useEffect(() => {
    if (!hydrated) return;
    const nextMode = parseOne(values.mode, ["mobility", "securevision"]) as
      | Mode
      | undefined;
    if (nextMode) setMode(nextMode);
    const list = nextMode === "securevision" ? SECURE_STAGES : MOBILITY_STAGES;
    const nextStage = parseOne(
      values.stage,
      list.map((item) => item.id),
    );
    if (nextStage) setStage(nextStage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, values]);

  const chooseMode = useCallback(
    (next: string) => {
      const value = next as Mode;
      setMode(value);
      setStage("video");
      setQuery({ mode: value, stage: undefined }, { push: true });
    },
    [setQuery],
  );

  const chooseStage = useCallback(
    (next: string) => {
      setStage(next);
      setQuery({ stage: next });
    },
    [setQuery],
  );

  /**
   * Whichever way a stage was reached — a click on the rail, a shared URL, or
   * Back — the layers that stage is about are switched on, so the rail always
   * shows the thing it names. Layers the reader turned on stay on; this only
   * ever adds, so it settles after one pass.
   */
  useEffect(() => {
    const owned = (mode === "mobility" ? MOBILITY_LAYERS : SECURE_LAYERS)
      .filter((layer) => layer.stage === stage)
      .map((layer) => layer.id);
    if (owned.length === 0) return;

    if (mode === "mobility") {
      setMobilityLayers((prev) =>
        (owned as MobilityLayer[]).every((id) => prev.includes(id))
          ? prev
          : Array.from(new Set([...prev, ...(owned as MobilityLayer[])])),
      );
    } else {
      setSecureLayers((prev) =>
        (owned as SecureLayer[]).every((id) => prev.includes(id))
          ? prev
          : Array.from(new Set([...prev, ...(owned as SecureLayer[])])),
      );
    }
  }, [mode, stage]);

  const toggleMobility = (id: string) =>
    setMobilityLayers((prev) =>
      prev.includes(id as MobilityLayer)
        ? prev.filter((item) => item !== id)
        : [...prev, id as MobilityLayer],
    );

  const toggleSecure = (id: string) =>
    setSecureLayers((prev) =>
      prev.includes(id as SecureLayer)
        ? prev.filter((item) => item !== id)
        : [...prev, id as SecureLayer],
    );

  const on = (id: MobilityLayer) => mobilityLayers.includes(id);
  const secureOn = (id: SecureLayer) => secureLayers.includes(id);

  const secureLayerState = useMemo(
    () => ({
      trajectories: secureOn("trajectories"),
      density: secureOn("density"),
      flow: secureOn("flow"),
      zones: secureOn("zones"),
      candidates: secureOn("candidates"),
      privacy: secureOn("privacy"),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [secureLayers],
  );

  return (
    <div
      className={`${styles.lab} ${
        mode === "mobility" ? styles.famCare : styles.famSecure
      }`}
    >
      {/* ── MODE ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SegmentTabs
          label="Lab mode"
          value={mode}
          onChange={chooseMode}
          options={[
            { id: "mobility", label: "MobilityCare" },
            { id: "securevision", label: "SecureVision" },
          ]}
        />
        <IllustrativeBadge />
      </div>

      {/* ── PIPELINE RAIL ── */}
      <div className="mt-6">
        <AnalyticsPipeline
          stages={stages}
          activeId={stage}
          onSelect={chooseStage}
          label={`${mode === "mobility" ? "MobilityCare" : "SecureVision"} pipeline`}
        />
      </div>

      {/* ── STAGE ── */}
      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <span className={styles.label}>
              {stages.find((item) => item.id === stage)?.name}
            </span>
            <span className={`${styles.label} ml-auto`}>
              {stages.find((item) => item.id === stage)?.note}
            </span>
          </div>

          <div className={styles.panelBody}>
            {mode === "mobility" ? (
              <MobilityStage
                stage={stage}
                on={on}
                phase={phase}
                setPhase={setPhase}
              />
            ) : (
              <SecureStage stage={stage} layers={secureLayerState} />
            )}
          </div>

          <div className={styles.panelRule} />
          <div className={styles.panelBody}>
            <ChipScroller
              label={mode === "mobility" ? "Layers & features" : "Layers"}
              multi
              groupLabel="Analytical layers"
              options={(mode === "mobility" ? MOBILITY_LAYERS : SECURE_LAYERS).map(
                (layer) => ({ id: layer.id, label: layer.label }),
              )}
              selected={mode === "mobility" ? mobilityLayers : secureLayers}
              onSelect={mode === "mobility" ? toggleMobility : toggleSecure}
            />
            <p className={`${styles.note} mt-3`}>
              {mode === "mobility"
                ? "Toggles change what the stage draws and which readings are shown. Every reading is illustrative."
                : "Analytics run on movement, not identity. There is no identification layer in this demonstration to switch on."}
            </p>
          </div>
        </div>

        {/* ── EXPLAINABILITY ── */}
        <div className="grid content-start gap-4">
          <ExplainabilityPanel
            {...(mode === "mobility" ? MOBILITY_EXPLAIN : SECURE_EXPLAIN)}
            usedForLabel="Used for"
            notLabel={mode === "mobility" ? "Not" : "Not"}
          />
          <div className={styles.panel}>
            <div className={styles.panelBody}>
              <span className={styles.label}>What this demonstration is</span>
              <p className={`${styles.note} mt-2`}>
                An interactive illustration of the documented pipeline, running
                with example values. It is not a diagnostic tool, not a live
                system, and none of its readings are product-performance
                figures.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/gaitscape" className={styles.chip}>
                  Ecosystem map →
                </Link>
                <Link href="/products#stack" className={styles.chip}>
                  Configure a stack →
                </Link>
                <Link
                  href={
                    mode === "mobility" ? "/mobilitycare" : "/securevision"
                  }
                  className={styles.chip}
                >
                  {mode === "mobility" ? "MobilityCare" : "SecureVision"} →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   MOBILITYCARE STAGES
   ========================================================================== */

function StageVideo({ src, poster }: { src: string; poster?: string }) {
  return (
    /* `dark-media-island`: this footage is a fixed dark cinematic render with
       no light-mode counterpart, so in light mode it is framed as a
       deliberate visualization panel — a pale mat, a defined edge and a soft
       shadow — rather than left as a dark rectangle with a hairline round it.
       See globals.css. */
    <figure className="dark-media-island relative overflow-hidden rounded-xl border border-white/[0.07]">
      <video
        className="block h-auto w-full"
        src={assetPath(src)}
        poster={poster ? assetPath(poster) : undefined}
        muted
        loop
        playsInline
        autoPlay
        preload="none"
      />
      <IllustrativeBadge
        variant="overlay"
        className="absolute bottom-3 left-3"
      />
    </figure>
  );
}

function MobilityStage({
  stage,
  on,
  phase,
  setPhase,
}: {
  stage: string;
  on: (id: MobilityLayer) => boolean;
  phase: number;
  setPhase: (index: number) => void;
}) {
  if (stage === "video") {
    return (
      <div>
        <StageVideo src="/assets/videos/workflow/stage-01-capture.mp4" />
        <ResultColumns count={2}>
          <ResultColumn
            title="What enters the pipeline"
            items={[
              "A short walking sequence, captured on request",
              "Any standard camera — including a phone",
              "No markers, no treadmill, no lab",
            ]}
          />
          <ResultColumn
            title="What the capture decides"
            tone="mute"
            items={[
              "What is recorded, from where, for how long",
              "Whether the stride is complete enough to segment",
              "Whether features can be computed at all",
            ]}
          />
        </ResultColumns>
      </div>
    );
  }

  if (stage === "pose") {
    return (
      <div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <span className={styles.label}>Frame with landmarks</span>
            <div className="mt-2">
              <GaitCycleTimeline activeIndex={on("pose") ? phase : undefined} onSelect={setPhase} />
            </div>
          </div>
          <div>
            <span className={styles.label}>What pose gives you</span>
            <ul className={`${styles.list} mt-2`}>
              {[
                "Body landmarks per frame, at frame rate",
                "A representation that drops clothing, lighting and background",
                on("joints")
                  ? "Joint positions tracked across frames — the trajectories the next stage segments"
                  : "Joint trajectories are switched off",
              ].map((item) => (
                <li key={item} className={styles.item}>
                  <span aria-hidden="true" className={styles.dot} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className={`${styles.note} mt-3`}>
              Skeleton-only processing is one of the platform&apos;s configurable
              privacy modes: from this point on, the pixels are no longer
              required.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (stage === "cycle") {
    return (
      <div>
        <span className={styles.label}>One stride, segmented</span>
        <div className="mt-2">
          <GaitCycleTimeline activeIndex={on("cycle") ? phase : undefined} onSelect={setPhase} />
        </div>
        <ResultColumns count={2}>
          <ResultColumn
            title="Why segmentation comes first"
            items={[
              "A single frame shows a posture; a stride shows a gait",
              "Stance and swing are only defined across a cycle",
              "Timing, symmetry and variability are all per-stride measures",
            ]}
          />
          <ResultColumn
            title="Stance / swing"
            tone="mute"
            items={[
              `${MOBILITY_METRICS.timing.value}${MOBILITY_METRICS.timing.unit} — ${MOBILITY_METRICS.timing.note}`,
              DEMO_LABEL,
            ]}
          />
        </ResultColumns>
      </div>
    );
  }

  if (stage === "features") {
    return (
      <div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {on("cadence") && (
            <SignalMetric
              label={MOBILITY_METRICS.cadence.label}
              value={MOBILITY_METRICS.cadence.value}
              unit={MOBILITY_METRICS.cadence.unit}
              note={MOBILITY_METRICS.cadence.note}
              illustrative
            >
              <MiniTrendChart
                series={[...MOBILITY_METRICS.cadence.series]}
                summary="Cadence across the captured strides, rising then settling."
              />
            </SignalMetric>
          )}
          {on("symmetry") && (
            <SignalMetric
              label={MOBILITY_METRICS.symmetry.label}
              value={MOBILITY_METRICS.symmetry.value}
              unit={MOBILITY_METRICS.symmetry.unit}
              note={MOBILITY_METRICS.symmetry.note}
              illustrative
            >
              <div className="mt-2.5">
                <FeatureDistribution
                  bins={[...MOBILITY_METRICS.symmetry.bins]}
                  markerIndex={MOBILITY_METRICS.symmetry.markerIndex}
                  summary="Step-symmetry distribution across strides, with this walk's value in the fifth band."
                />
              </div>
            </SignalMetric>
          )}
          {on("timing") && (
            <SignalMetric
              label={MOBILITY_METRICS.variability.label}
              value={MOBILITY_METRICS.variability.value}
              note={MOBILITY_METRICS.variability.note}
              illustrative
            >
              <MiniTrendChart
                series={[...MOBILITY_METRICS.variability.series]}
                tone="mute"
                summary="Step-to-step variability across strides, staying within a narrow band."
              />
            </SignalMetric>
          )}
          {on("posture") && (
            <SignalMetric
              label={MOBILITY_METRICS.posture.label}
              value={MOBILITY_METRICS.posture.value}
              unit={MOBILITY_METRICS.posture.unit}
              note={MOBILITY_METRICS.posture.note}
              illustrative
            />
          )}
          <SignalMetric
            label={MOBILITY_METRICS.speed.label}
            value={MOBILITY_METRICS.speed.value}
            unit={MOBILITY_METRICS.speed.unit}
            note={MOBILITY_METRICS.speed.note}
            illustrative
          >
            <MiniTrendChart
              series={[...MOBILITY_METRICS.speed.series]}
              baseline
              summary="Walking speed across four assessments, declining from the baseline."
            />
          </SignalMetric>
        </div>
        <p className={`${styles.note} mt-4`}>
          Every value above is illustrative. Feature names are the platform&apos;s
          own — walking speed, cadence, step symmetry, posture markers,
          variability — and are what a real capture would produce.
        </p>
      </div>
    );
  }

  if (stage === "analytics") {
    return (
      <div>
        <span className={styles.label}>
          Compared against this person&apos;s own baseline
        </span>
        {on("trend") ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <SignalMetric label="Walking speed" value="↓ from baseline" illustrative>
              <MiniTrendChart
                series={MOBILITY_TREND.speed}
                baseline
                tone="amber"
                summary="Walking speed across four assessments, below the baseline at the fourth."
              />
            </SignalMetric>
            <SignalMetric label="Step symmetry" value="↓ from baseline" illustrative>
              <MiniTrendChart
                series={MOBILITY_TREND.symmetry}
                baseline
                summary="Step symmetry across four assessments, slightly below baseline."
              />
            </SignalMetric>
            <SignalMetric label="Stride variability" value="↑ from baseline" illustrative>
              <MiniTrendChart
                series={MOBILITY_TREND.variability}
                tone="amber"
                summary="Stride variability across four assessments, rising."
              />
            </SignalMetric>
          </div>
        ) : (
          <p className={`${styles.note} mt-3`}>
            Switch on the temporal-trend layer to compare the four example
            assessments.
          </p>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <RiskIndicator
            level="medium"
            label="Screening category"
            note="A category for review, not a probability. Illustrative."
          />
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Why a category, not a score</span>
            <p className={`${styles.note} mt-2`}>
              The platform&apos;s documented output for this workflow is a low /
              medium / high screening category with its contributing factors —
              deliberately not a percentage, because a percentage invites a
              precision the measurement does not carry.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <ResultColumns count={2}>
        <ResultColumn
          title="Report contents"
          count={MOBILITY_REPORT.length}
          items={[...MOBILITY_REPORT]}
        />
        <ResultColumn
          title="Who reads it"
          tone="mute"
          items={[
            "Clinician or therapist, as decision support",
            "The person assessed, as their own record",
            "The next assessment, as the comparison baseline",
          ]}
        />
      </ResultColumns>
      <p className={`${styles.note} mt-4`}>
        GaitAI outputs are AI-generated movement metrics intended as decision
        support — they do not diagnose medical conditions and do not replace
        clinical judgement.
      </p>
    </div>
  );
}

/* ==========================================================================
   SECUREVISION STAGES
   ========================================================================== */

function SecureStage({
  stage,
  layers,
}: {
  stage: string;
  layers: {
    trajectories: boolean;
    density: boolean;
    flow: boolean;
    zones: boolean;
    candidates: boolean;
    privacy: boolean;
  };
}) {
  if (stage === "video") {
    return (
      <div>
        <StageVideo src="/assets/videos/platform/securevision-intelligence.mp4" />
        <ResultColumns count={2}>
          <ResultColumn
            title="What enters the pipeline"
            items={[
              "An existing camera feed in the space",
              "No new hardware required for the core workflow",
              "Movement, not identity — see the privacy-aware layer",
            ]}
          />
          <ResultColumn
            title="What the deployment decides"
            tone="mute"
            items={[
              "Which zones are analysed, and when",
              "What is retained, and for how long",
              "Who may review what, and with what audit trail",
            ]}
          />
        </ResultColumns>
      </div>
    );
  }

  const summary = [
    layers.trajectories ? "movement paths" : null,
    layers.density ? "zone density" : null,
    layers.flow ? "flow direction" : null,
    layers.zones ? "zone outlines" : null,
    layers.candidates ? "one candidate event" : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div>
      <div className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-obsidian-500/40 p-3 text-cyan-300">
        <TrajectoryCanvas
          paths={SECURE_PATHS}
          zones={SECURE_ZONES}
          layers={layers}
          summary={`Plan view of an illustrative space showing ${
            summary || "no layers"
          }. Seven example movement paths; no identities.`}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <IllustrativeBadge />
        {layers.privacy && (
          <span className={styles.reason}>Identity-free view</span>
        )}
      </div>

      {stage === "extract" && (
        <ResultColumns count={2}>
          <ResultColumn
            title="What extraction produces"
            items={[
              "A movement track per person in view",
              "Position over time — not a face, a name or an attribute",
              "Skeleton-only processing where a deployment configures it",
            ]}
          />
          <ResultColumn
            title="What it deliberately does not produce"
            tone="mute"
            items={[
              "Any identification of anyone",
              "Any demographic or biometric attribute",
              "Any assertion about intent",
            ]}
          />
        </ResultColumns>
      )}

      {stage === "trajectories" && (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <SignalMetric
            label={SECURE_METRICS.occupancy.label}
            value={SECURE_METRICS.occupancy.value}
            unit={SECURE_METRICS.occupancy.unit}
            note={SECURE_METRICS.occupancy.note}
            illustrative
          />
          <SignalMetric
            label={SECURE_METRICS.dwell.label}
            value={SECURE_METRICS.dwell.value}
            unit={SECURE_METRICS.dwell.unit}
            note={SECURE_METRICS.dwell.note}
            illustrative
          />
          <SignalMetric
            label="Zones"
            value={String(SECURE_ZONES.length)}
            note={SECURE_ZONES.map((zone) => zone.label).join(" · ")}
            illustrative
          />
        </div>
      )}

      {stage === "density" && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <SignalMetric
            label={SECURE_METRICS.density.label}
            value={SECURE_METRICS.density.value}
            note={SECURE_METRICS.density.note}
            illustrative
          >
            <MiniTrendChart
              series={[...SECURE_METRICS.density.series]}
              fill
              summary="Movement in the busiest zone over the illustrative window, peaking mid-way."
            />
          </SignalMetric>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>What density is for</span>
            <p className={`${styles.note} mt-2`}>
              Density and flow answer operational questions — where a space is
              filling, which way it is moving, where a queue is forming — from
              aggregate movement. None of it requires knowing who anyone is.
            </p>
          </div>
        </div>
      )}

      {stage === "events" && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <SignalMetric
            label={SECURE_METRICS.candidates.label}
            value={SECURE_METRICS.candidates.value}
            note={SECURE_METRICS.candidates.note}
            illustrative
          />
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Why &ldquo;candidate&rdquo;</span>
            <p className={`${styles.note} mt-2`}>
              The word is the boundary. The pipeline surfaces movement worth a
              second look and hands it to a trained operator; it does not
              conclude anything, and it does not act.
            </p>
          </div>
        </div>
      )}

      {stage === "operator" && (
        <>
          <ResultColumns count={2}>
            <ResultColumn
              title="Operator view"
              count={SECURE_REPORT.length}
              items={[...SECURE_REPORT]}
            />
            <ResultColumn
              title="Review requirements"
              tone="mute"
              items={[
                "Operator review required before any action",
                "Role-based access to the underlying footage",
                "Activity logging and configurable retention",
              ]}
            />
          </ResultColumns>
          <p className={`${styles.note} mt-4`}>
            Movement analytics are designed to run without identifying
            individuals unless a deployment lawfully and explicitly requires
            it. Outputs are decision support for trained operators — not
            autonomous enforcement.
          </p>
        </>
      )}
    </div>
  );
}
