"use client";

import { useState } from "react";
import { InteractiveFigure } from "../InteractiveFigure";
import type { FigureProps } from "../registry";
import ui from "../experience.module.css";

/**
 * THE PRIVACY PIPELINE — select a stage, see what exists there and why.
 *
 *   RAW SENSING → PRIVACY TRANSFORMATION → MOVEMENT REPRESENTATION
 *               → ANALYSIS → MINIMISED OUTPUT → HUMAN DECISION
 *
 * For each stage: what exists here, why it exists, what could be removed,
 * and where privacy risk remains. Educational, not marketing: every stage
 * has a "risk remains" line, including the last one.
 */

const STAGES = [
  {
    id: "sensing",
    label: "Raw sensing",
    exists: "Full frames from a camera, or raw samples from a wearable — everything the sensor can see or feel.",
    why: "Nothing downstream can exist without an observation. This is the only stage that has to see the person.",
    remove: "Resolution beyond what pose needs; audio if the task is visual; frames outside the zone of interest.",
    risk: "The highest. Whatever is stored here is identity-rich by definition. Retention, access and encryption decide most of the outcome.",
  },
  {
    id: "transform",
    label: "Privacy transformation",
    exists: "Face redaction, skeleton extraction, short-lived track identifiers, aggregation — applied at or near the edge.",
    why: "So the analytics layer never receives identifying detail in the first place, rather than filtering it out at the end.",
    remove: "Appearance: face, clothing, colour, background. Persistent identifiers where the task needs only continuity within a sequence.",
    risk: "The transformation itself must be trustworthy and applied before storage. A skeleton is not anonymous; pose and gait can carry identity.",
  },
  {
    id: "representation",
    label: "Movement representation",
    exists: "Pose sequences, trajectories, gait descriptors — geometry and timing, not pictures.",
    why: "It is the representation gait features are computed from, and it is far smaller and less identifying than video.",
    remove: "Absolute position where relative movement suffices; the sequence itself once features are computed.",
    risk: "Re-identification from movement is an active research question. Treat this as personal data unless a deployment shows otherwise.",
  },
  {
    id: "analysis",
    label: "Analysis",
    exists: "Models reading the representation for the task: a fall event, a flow, a change against a baseline.",
    why: "This is the intelligence — the reason the system exists.",
    remove: "Any input the task does not use. A model built for flow should not receive per-person history.",
    risk: "Purpose creep: a model trained for one question quietly answering others. Governance, not code, is what prevents it.",
  },
  {
    id: "output",
    label: "Minimised output",
    exists: "Counts, flows, events, a reviewed change — the smallest thing that answers the task.",
    why: "Only this leaves the system, so only this needs to be defended once it has.",
    remove: "Detail that only adds precision the decision does not need; identifiers where the output is about a space, not a person.",
    risk: "Outputs can be joined with other data. A count is safe; a per-person timeline is not, even without a name.",
  },
  {
    id: "decision",
    label: "Human decision",
    exists: "A qualified person reading the output in context — a clinician, a care team, an operator.",
    why: "Decision support is only support if someone decides. The output orders attention; it does not act.",
    remove: "Nothing technical — but the decision-maker's access should be role-based and audited like every other stage.",
    risk: "Over-trust. A confident-looking output can be read as a finding. The presentation has to carry its limitations with it.",
  },
] as const;

const DESCRIPTION = `Six pipeline stages: raw sensing, privacy transformation, movement representation, analysis, minimised output, human decision.
Each stage lists what exists there, why it exists, what could be removed, and where privacy risk remains. Risk is highest at raw sensing and never reaches zero: even a minimised output can be joined with other data, and a human decision can over-trust a confident-looking output.`;

export function PrivacyPipeline({ articleSlug, presentation }: FigureProps) {
  const [index, setIndex] = useState(() =>
    typeof presentation?.stage === "number" ? presentation.stage : 1,
  );
  const stage = STAGES[index];

  return (
    <InteractiveFigure
      id="privacy-pipeline"
      articleSlug={articleSlug}
      eyebrow="Interactive figure"
      title="Where privacy is decided, stage by stage"
      status="conceptual"
      hint="tap"
      wide
      minHeight="380px"
      description={DESCRIPTION}
      caption="Select a stage. Every stage keeps a line for where risk remains, because a pipeline diagram that ends in a green tick is a marketing diagram."
    >
      <ol className="relative grid gap-2 sm:grid-cols-3 lg:grid-cols-6" aria-label="Pipeline stages">
        {STAGES.map((item, i) => {
          const on = i === index;
          return (
            <li key={item.id} className="relative">
              <button
                type="button"
                aria-pressed={on}
                onClick={() => setIndex(i)}
                className={`${ui.chip} w-full justify-start text-left ${on ? ui.chipOn : ""}`}
                style={{ borderRadius: "0.75rem", minHeight: 48, alignItems: "flex-start", flexDirection: "column", gap: 2 }}
              >
                <span className="font-mono text-[9px] uppercase tracking-[0.18em] opacity-70">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-[12px] leading-snug">{item.label}</span>
              </button>
              {i < STAGES.length - 1 && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-1.5 top-1/2 hidden h-px w-3 bg-white/20 lg:block"
                />
              )}
            </li>
          );
        })}
      </ol>

      <div key={stage.id} className={`${ui.storyMoment} mt-4 grid gap-4 rounded-xl border border-white/[0.07] p-4 sm:grid-cols-2`}>
        <Field label="What exists here" text={stage.exists} />
        <Field label="Why it exists" text={stage.why} />
        <Field label="What could be removed" text={stage.remove} />
        <Field label="Where privacy risk remains" text={stage.risk} warn />
      </div>
    </InteractiveFigure>
  );
}

function Field({ label, text, warn = false }: { label: string; text: string; warn?: boolean }) {
  return (
    <div>
      <p className={`font-mono text-[9px] uppercase tracking-[0.18em] ${warn ? "text-[#f0b45a] [.light_&]:text-[#b7791f]" : "text-cyan-300"}`}>
        {label}
      </p>
      <p className="mt-1.5 text-[0.875rem] leading-relaxed text-soft-gray">{text}</p>
    </div>
  );
}
