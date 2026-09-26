"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Vertical } from "@/data/products";
import {
  CAPTURE_SOURCES,
  FAMILY_LABEL,
  OBJECTIVES,
  analyticsEnvironmentById,
  analyticsEnvironments,
  objectiveById,
  recommendStack,
  type CaptureSource,
} from "@/data/analytics";
import {
  EnvironmentSelect,
  GuidedStep,
  GuidedSteps,
  OptionSelect,
  ResultBody,
  ResultHeader,
  SelectionSummary,
} from "./guided";
import { Eyebrow, familyClass } from "./primitives";
import { StackRecommendation } from "./StackRecommendation";
import { parseOne, useQueryState } from "./useQueryState";
import styles from "./analytics.module.css";

/**
 * FIND YOUR GAITAI STACK — /products
 *
 * Three questions, one deterministic answer. Where will you use it, what do
 * you need to understand, and what can you capture — and the panel below
 * names a primary module, its supporting modules, the signals and
 * capabilities involved, the outputs produced and the environments those
 * modules are documented in.
 *
 * WHY THERE IS NO SCORE
 * The recommendation is a set intersection over documented relationships, not
 * a model. `recommendStack()` in `src/data/analytics.ts` ranks by how many of
 * the three answers a module satisfies and states each reason in words; a
 * percentage would imply a fit measurement this repository does not have. The
 * same three answers always produce the same stack.
 *
 * The steps are progressive but never trap the reader: the environment is
 * enough to get a stack, and the objective and capture filters refine it.
 * Every state change is written to the URL, so a configuration is shareable
 * and Back walks the reader out of it.
 */

const KEYS = ["environment", "goal", "signal"] as const;
const ENVIRONMENT_IDS = analyticsEnvironments.map((item) => item.id);
const OBJECTIVE_IDS = OBJECTIVES.map((item) => item.id);
const SOURCE_IDS = CAPTURE_SOURCES.map((item) => item.id);

export function StackConfigurator({
  onCompare,
}: {
  /** Hands the recommended module ids to the compare table above it. */
  onCompare?: (ids: string[]) => void;
}) {
  const { values, setQuery, hydrated } = useQueryState(KEYS);

  const [environmentId, setEnvironmentId] = useState<string | undefined>();
  const [objectiveId, setObjectiveId] = useState<string | undefined>();
  const [sources, setSources] = useState<CaptureSource[]>([]);

  useEffect(() => {
    if (!hydrated) return;
    const environment = parseOne(values.environment, ENVIRONMENT_IDS);
    const objective = parseOne(values.goal, OBJECTIVE_IDS);
    const nextSources = (values.signal ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter((item): item is CaptureSource =>
        (SOURCE_IDS as string[]).includes(item),
      );
    setEnvironmentId(environment);
    setObjectiveId(objective);
    setSources(nextSources);
  }, [hydrated, values]);

  const environment = environmentId
    ? analyticsEnvironmentById.get(environmentId)
    : undefined;
  const family: Vertical | undefined =
    environment?.family ??
    (objectiveId ? objectiveById.get(objectiveId)?.family : undefined);

  const chooseEnvironment = useCallback(
    (id: string) => {
      const next = environmentId === id ? undefined : id;
      setEnvironmentId(next);
      const environmentRecord = next
        ? analyticsEnvironmentById.get(next)
        : undefined;
      const keepObjective =
        objectiveId && environmentRecord?.objectiveIds.includes(objectiveId)
          ? objectiveId
          : undefined;
      setObjectiveId(keepObjective);
      setQuery(
        { environment: next, goal: keepObjective },
        { push: true },
      );
    },
    [environmentId, objectiveId, setQuery],
  );

  const chooseObjective = useCallback(
    (id: string) => {
      const next = objectiveId === id ? undefined : id;
      setObjectiveId(next);
      setQuery({ goal: next }, { push: true });
    },
    [objectiveId, setQuery],
  );

  const toggleSource = useCallback(
    (id: string) => {
      const source = id as CaptureSource;
      const next = sources.includes(source)
        ? sources.filter((item) => item !== source)
        : [...sources, source];
      setSources(next);
      setQuery({ signal: next.length ? next.join(",") : undefined });
    },
    [sources, setQuery],
  );

  const reset = useCallback(() => {
    setEnvironmentId(undefined);
    setObjectiveId(undefined);
    setSources([]);
    setQuery(
      { environment: undefined, goal: undefined, signal: undefined },
      { push: true },
    );
  }, [setQuery]);

  const stack = useMemo(
    () => recommendStack({ environmentId, objectiveId, sources }),
    [environmentId, objectiveId, sources],
  );

  /** Objectives are only offered where a documented module covers them. */
  const objectiveOptions = useMemo(
    () =>
      OBJECTIVES.filter((objective) =>
        environment ? objective.family === environment.family : true,
      ).map((objective) => ({
        id: objective.id,
        label: objective.label,
        disabled: environment
          ? !environment.objectiveIds.includes(objective.id)
          : false,
      })),
    [environment],
  );

  /** Capture options are dimmed where nothing in scope can work from them. */
  const sourceOptions = useMemo(
    () =>
      CAPTURE_SOURCES.map((source) => ({
        id: source.id,
        label: source.label,
        disabled: environment ? !environment.sources.includes(source.id) : false,
      })),
    [environment],
  );

  /**
   * Two starting points, so the panel is never a dead end on arrival. Both
   * are ordinary configurations — the same three answers a reader would pick,
   * pre-filled — not curated results.
   */
  const PRESETS: { label: string; environment: string; goal: string }[] = [
    { label: "Hospitals · fall-risk", environment: "hospitals", goal: "fall-risk" },
    { label: "Airports · crowd flow", environment: "airports", goal: "crowd-flow" },
  ];

  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    setEnvironmentId(preset.environment);
    setObjectiveId(preset.goal);
    setSources([]);
    setQuery(
      { environment: preset.environment, goal: preset.goal, signal: undefined },
      { push: true },
    );
  };

  const recommendedIds = stack.primary
    ? [stack.primary.product.id, ...stack.supporting.map((e) => e.product.id)]
    : [];

  const envGroups = [
    {
      family: "mobilitycare",
      label: FAMILY_LABEL.mobilitycare,
      options: analyticsEnvironments.filter((e) => e.family === "mobilitycare"),
    },
    {
      family: "securevision",
      label: FAMILY_LABEL.securevision,
      options: analyticsEnvironments.filter((e) => e.family === "securevision"),
    },
  ];

  const objective = objectiveId ? objectiveById.get(objectiveId) : undefined;
  const sourceLabels = sources
    .map((id) => CAPTURE_SOURCES.find((c) => c.id === id)?.label)
    .filter((label): label is string => Boolean(label));

  /* The selection, in sequence order, for the summary strip. */
  const summaryTerms = [
    environment?.name,
    objective?.label,
    sourceLabels.length ? sourceLabels.join(" + ") : undefined,
  ].filter((term): term is string => Boolean(term));

  return (
    <div className={`${styles.lab} ${familyClass(family)}`} id="stack">
      <div className="max-w-2xl">
        <Eyebrow>Product finder</Eyebrow>
        <h2 className="mt-5 font-display text-display-md text-balance text-soft-white">
          Find the right{" "}
          <span className="text-gradient">GaitAI product mix.</span>
        </h2>
        <p className="mt-5 text-sm leading-relaxed text-soft-gray">
          Answer three questions — where you will deploy, what you need to
          understand, and what you can capture — and the finder names the
          modules documented for that combination, with the reason for each.
        </p>
      </div>

      <GuidedSteps>
        <GuidedStep
          index="01"
          lead
          done={Boolean(environmentId)}
          title="Where will you deploy?"
          hint={`${analyticsEnvironments.length} documented environments. This choice decides which objectives and capture modes apply below.`}
        >
          <EnvironmentSelect
            groups={envGroups}
            selected={environmentId}
            onSelect={chooseEnvironment}
          />
        </GuidedStep>

        <GuidedStep
          index="02"
          waiting={!environment}
          done={Boolean(objectiveId)}
          title="What do you need to understand?"
          hint={
            environment
              ? `Objectives a module in ${environment.name} is documented for.`
              : "Choose an environment first — objectives are scoped to it."
          }
        >
          <OptionSelect
            groupLabel="Objective"
            options={objectiveOptions}
            selected={objectiveId ? [objectiveId] : []}
            onSelect={chooseObjective}
          />
        </GuidedStep>

        <GuidedStep
          index="03"
          waiting={!environment}
          done={sources.length > 0}
          title="What can you capture?"
          hint="Optional. A module that cannot work from what you have is left out rather than ranked low."
        >
          <OptionSelect
            groupLabel="Available capture"
            multi
            options={sourceOptions}
            selected={sources}
            onSelect={toggleSource}
          />
        </GuidedStep>
      </GuidedSteps>

      <SelectionSummary
        terms={summaryTerms}
        family={family ? `Recommended for ${FAMILY_LABEL[family]}` : undefined}
        onReset={reset}
        idlePlaceholder="Choose an environment to see recommended modules"
      />

      {!stack.primary && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className={styles.label}>Or start from</span>
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => applyPreset(preset)}
              className={styles.chip}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}

      {stack.primary && (
        <ResultHeader
          kicker="Recommended modules"
          title={`${stack.primary.product.short} leads this configuration`}
          forLabel={summaryTerms.length ? `for ${summaryTerms.join(" · ")}` : undefined}
        />
      )}

      <ResultBody reveal={`${environmentId ?? ""}|${objectiveId ?? ""}|${sources.join(",")}`}>
        <StackRecommendation
          stack={stack}
          actions={
            stack.primary ? (
              <>
                <Link
                  href={stack.primary.product.href}
                  className="btn-primary !px-5 !py-2.5 text-[13px]"
                >
                  Explore {stack.primary.product.short} →
                </Link>
                {onCompare && recommendedIds.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onCompare(recommendedIds.slice(0, 3))}
                    className="btn-ghost !px-5 !py-2.5 text-[13px]"
                  >
                    Compare these modules →
                  </button>
                )}
                <Link href="/#contact" className="btn-ghost !px-5 !py-2.5 text-[13px]">
                  Discuss this configuration →
                </Link>
              </>
            ) : undefined
          }
        />
      </ResultBody>
    </div>
  );
}
