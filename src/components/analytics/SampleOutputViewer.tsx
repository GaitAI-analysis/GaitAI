"use client";

import { useId, useState } from "react";
import type { Vertical } from "@/data/products";
import { IllustrativeBadge } from "@/components/ui/IllustrativeBadge";
import { SegmentTabs } from "./controls";
import { SignalMetric, MiniTrendChart } from "./graphics";
import { Panel, familyClass } from "./primitives";
import { sampleOutputFor, type SampleTab } from "@/data/sample-outputs";
import styles from "./analytics.module.css";
import viewer from "./sample-output.module.css";

/**
 * The reusable sample-output viewer.
 *
 * A product page can describe its deliverable, or it can show one. This shows
 * one: the actual shape of a WalkScan movement report, a FallRisk screening
 * summary, a CrowdSense dashboard, a candidate-event packet. It is the same
 * component for all eight modules that have a sample, so the artefact reads as
 * one product family rather than eight bespoke mockups.
 *
 * EVERY FIGURE IS AN EXAMPLE, and this component is built so it cannot be used
 * otherwise: `SampleOutput.illustrative` is the literal `true`, the badge renders
 * unconditionally at the top of the panel, and each record carries its own
 * boundary sentence — what the artefact is for, and what it is not. There is
 * no prop that suppresses either.
 *
 * It composes the existing primitives (SegmentTabs, SignalMetric,
 * MiniTrendChart, Panel) rather than introducing another chart vocabulary, so
 * a reader who has used Movement Studio already knows how to read this.
 *
 * Collapsed by default: the viewer is an offer, not an interruption on a page
 * someone came to read. Opening it mounts the tab content only then.
 */

/** Hint disclosure — a metric explains itself on demand, not all at once. */
function MetricWithHint({
  label,
  value,
  unit,
  hint,
}: {
  label: string;
  value: string;
  unit?: string;
  hint: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={viewer.metricCell}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        title={hint}
        className={viewer.metricButton}
      >
        <SignalMetric label={label} value={value} unit={unit} />
      </button>
      {open && <p className={viewer.hint}>{hint}</p>}
    </div>
  );
}

function TabBody({ tab }: { tab: SampleTab }) {
  return (
    <div className={viewer.body}>
      <p className={viewer.lead}>{tab.lead}</p>

      {tab.metrics && (
        <div className={viewer.metrics}>
          {tab.metrics.map((m) => (
            <MetricWithHint
              key={m.label}
              label={m.label}
              value={m.value}
              unit={m.unit}
              hint={m.hint}
            />
          ))}
        </div>
      )}

      {tab.phases && (
        <div className={viewer.phases}>
          {/* Proportional bar: each phase's share of one cycle. The share is
              the datum, so it is printed as well as drawn. */}
          <div className={viewer.phaseBar} aria-hidden="true">
            {tab.phases.map((p) => (
              <span
                key={p.label}
                className={viewer.phaseSeg}
                style={{ flexGrow: p.share }}
              />
            ))}
          </div>
          <dl className={viewer.phaseList}>
            {tab.phases.map((p) => (
              <div key={p.label} className={viewer.phaseRow}>
                <dt className={viewer.phaseName}>{p.label}</dt>
                <dd className={viewer.phaseShare}>{p.share}%</dd>
                <dd className={viewer.phaseHint}>{p.hint}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {tab.series && (
        <div className={viewer.seriesGrid}>
          {tab.series.map((s) => (
            <figure key={s.label} className={viewer.series}>
              <figcaption className={viewer.seriesLabel}>{s.label}</figcaption>
              <MiniTrendChart
                series={s.points}
                width={220}
                height={48}
                summary={`${s.label}: ${s.points.length} illustrative points, from ${s.points[0]} to ${s.points[s.points.length - 1]}.`}
              />
              <p className={viewer.hint}>{s.hint}</p>
            </figure>
          ))}
        </div>
      )}

      {tab.rows && (
        <dl className={viewer.rows}>
          {tab.rows.map((r) => (
            <div key={r.label} className={viewer.row}>
              <dt className={viewer.rowLabel}>{r.label}</dt>
              <dd className={viewer.rowValue}>{r.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {tab.notes && (
        <ul className={viewer.notes}>
          {tab.notes.map((n) => (
            <li key={n} className={viewer.note}>
              {n}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SampleOutputViewer({
  productId,
  family,
}: {
  productId: string;
  /** Accent family, so the sample follows the module's own colour. */
  family?: Vertical;
}) {
  const sample = sampleOutputFor(productId);
  const [open, setOpen] = useState(false);
  const [tabId, setTabId] = useState(sample?.tabs[0]?.id ?? "");
  const reactId = useId();
  const panelId = `sample-${productId}-${reactId.replace(/:/g, "")}`;

  if (!sample) return null;
  const tab = sample.tabs.find((t) => t.id === tabId) ?? sample.tabs[0];

  return (
    // styles.lab carries the --an-* tokens the primitives read. The viewer is
    // mounted on product pages, which are outside the analytics subtree, so it
    // scopes them itself rather than depending on its call site.
    <section
      id="sample-output"
      className={`${styles.lab} ${familyClass(family)} ${viewer.wrap}`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className={viewer.trigger}
      >
        <span className={viewer.triggerText}>
          <span className={viewer.triggerLabel}>{sample.kind}</span>
          <span className={viewer.triggerAction}>{sample.action}</span>
        </span>
        <span aria-hidden="true" className={viewer.triggerMark}>
          {open ? "−" : "+"}
        </span>
      </button>

      <div id={panelId} role="region" aria-label={`${sample.kind} — illustrative sample`} hidden={!open}>
        {open && (
          <Panel grid>
            {/* Unconditional. There is no branch that renders the figures
                below without this label. */}
            <IllustrativeBadge />
            <p className={viewer.boundary}>{sample.boundary}</p>

            <div className={viewer.tabsRow}>
              <SegmentTabs
                options={sample.tabs.map((t) => ({ id: t.id, label: t.label }))}
                value={tab.id}
                onChange={setTabId}
                label={`${sample.kind} views`}
              />
            </div>

            <TabBody tab={tab} />

            <p className={`${styles.note} ${viewer.footer}`}>
              Field names and output names come from the module&apos;s
              documented specification. The values are invented for
              illustration.
            </p>
          </Panel>
        )}
      </div>
    </section>
  );
}
