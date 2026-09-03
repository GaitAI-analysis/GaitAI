"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Vertical } from "@/data/products";
import {
  CAPABILITY_COUNT,
  CAPTURE_SOURCES,
  CAPTURE_SOURCE_LABEL,
  ENVIRONMENT_COUNT,
  FAMILY_COUNT,
  FAMILY_LABEL,
  MODULE_COUNT,
  OBJECTIVES,
  PRIVACY_NOTE,
  PRIVACY_POSTURE,
  analyticsEnvironmentById,
  analyticsEnvironments,
  analyticsProductById,
  objectiveById,
  recommendStack,
  responsibleUseFor,
  type CaptureSource,
} from "@/data/analytics";
import {
  EnvironmentSelect,
  FamilyScopeToggle,
  GuidedPair,
  GuidedPairStep,
  GuidedStep,
  GuidedSteps,
  OptionSelect,
  ResultHeader,
  SelectionSummary,
} from "./guided";
import {
  Eyebrow,
  ResultColumn,
  ResultColumns,
  familyClass,
} from "./primitives";
import { ModuleStageMatrix } from "./ModuleStageMatrix";
import { useQueryState, parseOne } from "./useQueryState";
import styles from "./analytics.module.css";

/**
 * ENVIRONMENT INTELLIGENCE EXPLORER — /use-cases
 *
 * The catalogue below it answers "what does GaitAI do in a hospital?" one
 * environment at a time, in prose. This answers the analytical version of the
 * same question — pick an environment, an objective and the capture you
 * actually have, and read the movement signals, the capabilities applied, the
 * outputs produced and the privacy posture as one panel.
 *
 * EVERYTHING SHOWN IS DERIVED. The environment's module mix is its own record
 * in `industryUseCases`; the signals and capabilities are the documented
 * `senses` / `powered-by` relationships of those modules; the outputs are the
 * modules' own output lists and the environment's own output chips. Objectives
 * and capture sources are named views over the same graph — see
 * `src/data/analytics.ts`. No number on this surface is a claim: the four
 * stats are counts of repository records.
 *
 * URL state: ?environment=hospitals&goal=fall-risk&signal=video,wearable
 * &family=mobilitycare — so a configuration can be sent to a colleague, and
 * Back returns to the previous environment.
 */

const KEYS = ["environment", "goal", "signal", "family"] as const;

const ENVIRONMENT_IDS = analyticsEnvironments.map((item) => item.id);
const OBJECTIVE_IDS = OBJECTIVES.map((item) => item.id);
const SOURCE_IDS = CAPTURE_SOURCES.map((item) => item.id);

export function EnvironmentIntelligence() {
  const { values, setQuery, hydrated } = useQueryState(KEYS);

  const [family, setFamily] = useState<"all" | Vertical>("all");
  const [environmentId, setEnvironmentId] = useState<string>("hospitals");
  const [objectiveId, setObjectiveId] = useState<string | undefined>("fall-risk");
  const [sources, setSources] = useState<CaptureSource[]>([]);

  /** Apply the URL once hydrated, and again on Back / Forward. */
  useEffect(() => {
    if (!hydrated) return;
    const nextEnvironment = parseOne(values.environment, ENVIRONMENT_IDS);
    const nextFamily = parseOne(values.family, ["mobilitycare", "securevision"]);
    const nextObjective = parseOne(values.goal, OBJECTIVE_IDS);
    const nextSources = (values.signal ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter((item): item is CaptureSource =>
        (SOURCE_IDS as string[]).includes(item),
      );

    if (nextEnvironment) setEnvironmentId(nextEnvironment);
    if (nextFamily) setFamily(nextFamily as Vertical);
    if (values.goal !== undefined) setObjectiveId(nextObjective);
    if (values.signal !== undefined) setSources(nextSources);
  }, [hydrated, values]);

  const environment = analyticsEnvironmentById.get(environmentId);

  /** Environments in the chosen family, which also scopes the objectives. */
  const environments = useMemo(
    () =>
      analyticsEnvironments.filter(
        (item) => family === "all" || item.family === family,
      ),
    [family],
  );

  const chooseFamily = useCallback(
    (next: string) => {
      const value = next as "all" | Vertical;
      setFamily(value);
      // Keep the selected environment when it belongs to the new family;
      // otherwise move to that family's first environment.
      const stillValid =
        value === "all" ||
        analyticsEnvironmentById.get(environmentId)?.family === value;
      const nextEnvironment = stillValid
        ? environmentId
        : (analyticsEnvironments.find((item) => item.family === value)?.id ??
          environmentId);
      setEnvironmentId(nextEnvironment);
      setObjectiveId(undefined);
      setQuery(
        {
          family: value === "all" ? undefined : value,
          environment: nextEnvironment,
          goal: undefined,
        },
        { push: true },
      );
    },
    [environmentId, setQuery],
  );

  const chooseEnvironment = useCallback(
    (id: string) => {
      setEnvironmentId(id);
      // An objective that no module in the new environment covers would show
      // an empty stack, so it is dropped rather than carried over.
      const next = analyticsEnvironmentById.get(id);
      const keep = objectiveId && next?.objectiveIds.includes(objectiveId);
      if (!keep) setObjectiveId(undefined);
      setQuery(
        { environment: id, goal: keep ? objectiveId : undefined },
        { push: true },
      );
    },
    [objectiveId, setQuery],
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

  const stack = useMemo(
    () => recommendStack({ environmentId, objectiveId, sources }),
    [environmentId, objectiveId, sources],
  );

  const objective = objectiveId ? objectiveById.get(objectiveId) : undefined;

  /**
   * The modules the panel describes: the environment's documented mix,
   * narrowed by the objective and the available capture when either is set.
   */
  const modules = useMemo(() => {
    if (!environment) return [];
    return environment.productIds
      .map((id) => analyticsProductById.get(id))
      .filter((product): product is NonNullable<typeof product> =>
        Boolean(product),
      )
      .filter((product) =>
        objectiveId ? product.objectiveIds.includes(objectiveId) : true,
      )
      .filter((product) =>
        sources.length === 0
          ? true
          : sources.some((source) => product.sources.includes(source)),
      );
  }, [environment, objectiveId, sources]);

  /** Ordered unions across the shown modules — the panel's four columns. */
  const shown = useMemo(() => {
    const list = modules.length > 0 ? modules : [];
    const signals: string[] = [];
    const capabilities: string[] = [];
    const outputs: string[] = [];
    for (const product of list) {
      for (const signal of product.signals) {
        if (!signals.includes(signal)) signals.push(signal);
      }
      for (const capability of product.capabilities) {
        if (!capabilities.includes(capability)) capabilities.push(capability);
      }
      for (const output of product.outputs) {
        if (!outputs.includes(output)) outputs.push(output);
      }
    }
    return { signals, capabilities, outputs };
  }, [modules]);

  if (!environment) return null;

  const objectiveOptions = OBJECTIVES.filter(
    (item) => family === "all" || item.family === family,
  ).map((item) => ({
    id: item.id,
    label: item.label,
    // A disabled chip still tells you something: no module in this
    // environment's documented mix reads for that objective.
    disabled: !environment.objectiveIds.includes(item.id),
  }));

  const envGroups = (
    family === "all"
      ? ["mobilitycare", "securevision"]
      : [family]
  ).map((fam) => ({
    family: fam,
    label: FAMILY_LABEL[fam as keyof typeof FAMILY_LABEL],
    options: environments.filter((item) => item.family === fam),
  }));

  const summaryTerms = [
    environment.name,
    objective?.label,
    sources.length
      ? sources.map((src) => CAPTURE_SOURCE_LABEL[src]).join(" + ")
      : undefined,
  ].filter((term): term is string => Boolean(term));

  return (
    <div className={`${styles.lab} ${familyClass(environment.family)}`}>
      <div className="max-w-2xl">
        <Eyebrow>Scenario explorer</Eyebrow>
        <h2 className="mt-5 font-display text-display-md text-balance text-soft-white">
          See how GaitAI fits{" "}
          <span className="text-gradient">your environment.</span>
        </h2>
        <p className="mt-5 text-sm leading-relaxed text-soft-gray">
          Pick a setting, an objective and the capture you have, and read the
          scenario it produces — the problem, the approach, the modules
          involved and what they output.
        </p>
        {/* The same four counters the bordered stat grid carried, as one
            line: the numbers were worth keeping, the box was not. */}
        <p className="mt-4 font-mono text-[10.5px] uppercase tracking-[0.16em] text-soft-mute">
          {ENVIRONMENT_COUNT} environments · {MODULE_COUNT} modules ·{" "}
          {CAPABILITY_COUNT} capabilities · {FAMILY_COUNT} families
        </p>
      </div>

      {/* Scope first, on its own band: this changes which environments exist,
          which is a different kind of control from the filters below it. */}
      <FamilyScopeToggle
        caption="Scope"
        value={family}
        onChange={chooseFamily}
        options={[
          { id: "all", label: "Both families" },
          { id: "mobilitycare", label: FAMILY_LABEL.mobilitycare },
          { id: "securevision", label: FAMILY_LABEL.securevision },
        ]}
        meta={`${environments.length} environments in view`}
      />

      <GuidedSteps>
        <GuidedStep
          index="01"
          lead
          done
          title="Which setting is yours?"
          hint="The scenario below is built from this environment's own documented problem, module mix and outputs."
        >
          <EnvironmentSelect
            groups={envGroups}
            selected={environmentId}
            onSelect={chooseEnvironment}
          />
        </GuidedStep>
      </GuidedSteps>

      {/* Objective and capture share one band: on this page the environment is
          already the subject, so these two refine a scenario rather than
          building one. It also gives this page a different rhythm from the
          product finder's three stacked bands. */}
      <GuidedPair>
        <GuidedPairStep
          index="02"
          title="Objective"
          hint={
            objective
              ? objective.question
              : "Optional — leave clear to see the whole documented mix."
          }
        >
          <OptionSelect
            groupLabel="Objective"
            multi
            options={objectiveOptions}
            selected={objectiveId ? [objectiveId] : []}
            onSelect={chooseObjective}
          />
        </GuidedPairStep>

        <GuidedPairStep
          index="03"
          title="Available capture"
          hint="Optional — narrows the mix to modules that can work from what you have."
        >
          <OptionSelect
            groupLabel="Available capture"
            multi
            options={CAPTURE_SOURCES.map((source) => ({
              id: source.id,
              label: source.label,
              disabled: !environment.sources.includes(source.id),
            }))}
            selected={sources}
            onSelect={toggleSource}
          />
        </GuidedPairStep>
      </GuidedPair>

      <SelectionSummary
        terms={summaryTerms}
        family={FAMILY_LABEL[environment.family]}
        idlePlaceholder="Choose a setting to build a scenario"
      />

      <ResultHeader
        kicker="Application environment"
        title={environment.name}
        forLabel={
          summaryTerms.length > 1
            ? `· ${summaryTerms.slice(1).join(" · ")}`
            : undefined
        }
      />

      {/* ── RESULT PANEL ── */}
      <div className={`${styles.panel} mt-4`} aria-live="polite">
        <div className={styles.panelHead}>
          <span className={styles.label}>
            {environment.name}
            {objective ? ` · ${objective.label}` : ""}
            {sources.length
              ? ` · ${sources.map((s) => CAPTURE_SOURCE_LABEL[s]).join(" + ")}`
              : ""}
          </span>
          <span className={`${styles.label} ml-auto`}>
            {FAMILY_LABEL[environment.family]}
          </span>
        </div>

        <div className={styles.panelBody}>
          <p className="max-w-3xl text-sm leading-relaxed text-soft-gray">
            {environment.problem}
          </p>

          {modules.length === 0 ? (
            <p className={`${styles.note} mt-4`}>
              {stack.emptyReason ??
                "No module in this environment's documented mix matches that combination. Clear the capture filter to see the full mix."}
            </p>
          ) : (
            <div className="mt-5 flex flex-wrap gap-2">
              {modules.map((product) => (
                <Link
                  key={product.id}
                  href={product.href}
                  className={`${styles.chip} ${styles.chipOn}`}
                >
                  {product.short}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className={styles.panelRule} />

        <ResultColumns count={4}>
          <ResultColumn
            title="Recommended modules"
            count={modules.length}
            items={modules.map((product) => `${product.short} — ${product.label}`)}
            empty="Clear a filter to see this environment's documented mix."
          />
          <ResultColumn
            title="Movement signals"
            count={shown.signals.length}
            items={shown.signals}
          />
          <ResultColumn
            title="Analytics"
            count={shown.capabilities.length}
            items={shown.capabilities}
          />
          <ResultColumn
            title="Outputs"
            count={environment.outputs.length}
            items={environment.outputs}
            tone="mute"
          />
        </ResultColumns>

        <div className={styles.panelRule} />

        {/* Privacy posture — the approved architectural wording, verbatim. */}
        <div className="grid gap-px sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div className={styles.column}>
            <div className={styles.columnHead}>
              <span className={styles.label}>Privacy posture</span>
            </div>
            <ul className={styles.list}>
              {PRIVACY_POSTURE.map((item) => (
                <li key={item.label} className={styles.item}>
                  <span aria-hidden="true" className={`${styles.dot} ${styles.dotMute}`} />
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.column}>
            <div className={styles.columnHead}>
              <span className={styles.label}>What that means here</span>
            </div>
            <p className={`${styles.note} mt-3`}>{PRIVACY_NOTE}</p>
            <p className={`${styles.note} mt-2`}>
              {responsibleUseFor(environment.family).replace(PRIVACY_NOTE, "").trim()}
            </p>
          </div>
        </div>

        <div className={styles.panelRule} />

        <div className="flex flex-wrap items-center gap-3 px-[1.1rem] py-4">
          {environment.detailSlug && (
            <Link
              href={`/use-cases/${environment.detailSlug}/`}
              className="btn-ghost !px-5 !py-2.5 text-[13px]"
            >
              How {environment.name} deploys →
            </Link>
          )}
          <Link href="/products#stack" className="btn-ghost !px-5 !py-2.5 text-[13px]">
            Configure a stack →
          </Link>
          <Link href="/gaitscape" className="btn-ghost !px-5 !py-2.5 text-[13px]">
            Open GaitScape →
          </Link>
        </div>
      </div>

      {/* ── ENVIRONMENT VISUAL ANALYTICS ── */}
      <div className="mt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h3 className={styles.stepTitle}>
            What each module does here, stage by stage
          </h3>
          <p className={styles.label}>Input · Processing · Analytics · Output</p>
        </div>
        <div className="mt-4">
          <ModuleStageMatrix
            productIds={
              modules.length > 0
                ? modules.map((product) => product.id)
                : environment.productIds
            }
            family={environment.family}
          />
        </div>
      </div>
    </div>
  );
}
