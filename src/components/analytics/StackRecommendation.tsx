import Link from "next/link";
import type {
  AnalyticsProduct,
  StackEntry,
  StackRecommendation as Stack,
} from "@/data/analytics";
import {
  CAPTURE_SOURCE_LABEL,
  FAMILY_LABEL,
  PRIVACY_NOTE,
  PRIVACY_POSTURE,
} from "@/data/analytics";
import { ResultColumn, ResultColumns, familyClass } from "./primitives";
import styles from "./analytics.module.css";

/**
 * The recommended stack, rendered from `recommendStack()`.
 *
 * Shared by the /products configurator and the /use-cases explorer, so the
 * two surfaces cannot recommend the same thing in two different shapes.
 *
 * WHAT THIS COMPONENT WILL NOT RENDER
 * No match score, no percentage, no confidence, no ranking number. A module
 * appears because of documented relationships, and the reason chips say which
 * ones — in this environment's documented mix · matches this objective ·
 * works from a source you have. That is the whole justification, stated in
 * words a reader can check against the module's own page.
 */

function ModuleCard({
  entry,
  primary = false,
}: {
  entry: StackEntry;
  primary?: boolean;
}) {
  const { product, reason } = entry;
  return (
    <Link
      href={product.href}
      className={`${styles.module} ${primary ? styles.modulePrimary : ""}`}
    >
      <span className={styles.label}>
        {primary ? "Primary module" : "Supporting module"}
      </span>
      <p className={styles.moduleName}>{product.short}</p>
      <p className={styles.moduleLabel}>{product.label}</p>

      <p className={styles.reasons}>
        {reason.inEnvironment && (
          <span className={`${styles.reason} ${styles.reasonOn}`}>
            In this environment&apos;s mix
          </span>
        )}
        {reason.matchesObjective && (
          <span className={`${styles.reason} ${styles.reasonOn}`}>
            Matches the objective
          </span>
        )}
        <span className={styles.reason}>
          {product.sources.map((source) => CAPTURE_SOURCE_LABEL[source]).join(" · ")}
        </span>
      </p>

      <span className={styles.moduleGo}>
        Explore {product.short}
        <span aria-hidden="true" className={styles.moduleGoArrow}>
          →
        </span>
      </span>
    </Link>
  );
}

export function StackRecommendation({
  stack,
  actions,
}: {
  stack: Stack;
  /** Compare / discuss links, supplied by the call site. */
  actions?: React.ReactNode;
}) {
  if (!stack.primary) {
    return (
      <div className={styles.panel}>
        <div className={styles.panelBody}>
          <p className={styles.note}>
            {stack.emptyReason ??
              "Choose an environment and an objective to see a recommended stack."}
          </p>
        </div>
      </div>
    );
  }

  const modules: AnalyticsProduct[] = [
    stack.primary.product,
    ...stack.supporting.map((entry) => entry.product),
  ];

  return (
    <div className={`${familyClass(stack.family)} ${styles.enter}`}>
      <div className={styles.panel}>
        <div className={styles.panelHead}>
          <span className={styles.label}>Recommended stack</span>
          <span className={`${styles.label} ml-auto`}>
            {stack.family ? FAMILY_LABEL[stack.family] : ""} ·{" "}
            {modules.length} module{modules.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className={styles.panelBody}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ModuleCard entry={stack.primary} primary />
            {stack.supporting.map((entry) => (
              <ModuleCard key={entry.product.id} entry={entry} />
            ))}
          </div>

          {stack.supporting.length === 0 && (
            <p className={`${styles.note} mt-3`}>
              One module covers this combination in the documented mix — the
              others in this environment read different signals or need a
              different capture source.
            </p>
          )}
        </div>

        <div className={styles.panelRule} />

        <ResultColumns count={4}>
          <ResultColumn
            title="Signals"
            count={stack.signals.length}
            items={stack.signals}
          />
          <ResultColumn
            title="Capabilities"
            count={stack.capabilities.length}
            items={stack.capabilities}
          />
          <ResultColumn
            title="Outputs"
            count={stack.outputs.length}
            items={stack.outputs.slice(0, 8)}
          />
          <ResultColumn
            title="Environments"
            count={stack.environments.length}
            items={stack.environments.slice(0, 8)}
            tone="mute"
          />
        </ResultColumns>

        <div className={styles.panelRule} />

        <div className="grid gap-px sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className={styles.column}>
            <div className={styles.columnHead}>
              <span className={styles.label}>Capture</span>
              <span className={styles.label}>
                {String(stack.stackSources.length).padStart(2, "0")}
              </span>
            </div>
            <ul className={styles.list}>
              {stack.stackSources.map((source) => (
                <li key={source} className={styles.item}>
                  <span aria-hidden="true" className={styles.dot} />
                  <span>{CAPTURE_SOURCE_LABEL[source]}</span>
                </li>
              ))}
            </ul>
          </div>

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
            <p className={`${styles.note} mt-3`}>{PRIVACY_NOTE}</p>
          </div>
        </div>

        {actions && (
          <>
            <div className={styles.panelRule} />
            <div className="flex flex-wrap items-center gap-3 px-[1.1rem] py-4">
              {actions}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
