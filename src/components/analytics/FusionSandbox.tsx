"use client";

import { useId, useMemo, useState } from "react";
import {
  CHANNEL_STATE_LABEL,
  CHANNEL_STATE_NOTE,
  FUSION_BOUNDARY,
  INPUT_STATES,
  channelState,
  channelTitle,
  fusionChannels,
  fusionInputs,
  fusionVerdict,
  type ChannelState,
  type InputState,
} from "@/data/fusion-sandbox";
import { ChipScroller } from "./controls";
import styles from "./analytics.module.css";
import fusion from "./fusion.module.css";

/**
 * FUSION SANDBOX — set each input to Available, Missing or Corrupted.
 *
 * THE ONE THING IT EXISTS TO TEACH. Set an input to Missing and a channel may
 * drop out: the read-out visibly shrinks and the sandbox says what stopped
 * being derivable. Set the same input to Corrupted instead and NOTHING
 * disappears — the same number of channels arrive, at the same size, and only
 * the state label changes. That asymmetry is the lesson, and it is why the
 * verdict ranks any corruption above any amount of missing data.
 *
 * WHY THERE IS NO SCORE. A number that rose as inputs were switched on would
 * be a fabricated benchmark, and worse, it would rank the corrupted state
 * ABOVE the missing state — since corrupted inputs still produce values. The
 * read-out is therefore a list of channels and their states, with counts. No
 * accuracy, no confidence, no improvement figure.
 *
 * WHY EACH INPUT'S CORRUPTION IS SPELLED OUT. "Corrupted" invites a reader to
 * picture something obvious — a black frame, an error. The failures that
 * matter are the ones that decode cleanly: a swapped left/right landmark, a
 * watch on the wrong wrist, two people's paths joined at a crossing. Those
 * sentences live in the data and surface here the moment an input is set to
 * Corrupted, because without them the whole distinction collapses.
 *
 * Every state is derived — see data/fusion-sandbox.ts. Nothing about a
 * combination is stored, so the sandbox cannot display a reading its own
 * inputs do not support.
 */

/* Diagram geometry: four rails converging on one node, then out. */
const W = 520;
const H = 168;
const RAIL_X0 = 92;
const HUB_X = 300;
const HUB_Y = H / 2;
const OUT_X = 486;
const ROW_Y = [30, 66, 102, 138];

const STATE_CLASS: Record<InputState, string> = {
  available: fusion.railOn,
  missing: fusion.railOff,
  corrupted: fusion.railBad,
};

const CHANNEL_CLASS: Record<ChannelState, string> = {
  available: fusion.chOn,
  contaminated: fusion.chBad,
  unverified: fusion.chBad,
  unavailable: fusion.chOff,
};

export function FusionSandbox() {
  const [states, setStates] = useState<Record<string, InputState>>(() =>
    Object.fromEntries(
      fusionInputs.map((input) => [input.id, "available" as InputState]),
    ),
  );
  const labelId = useId();

  const verdict = useMemo(() => fusionVerdict(states), [states]);
  const channels = useMemo(
    () =>
      fusionChannels.map((id) => ({
        id,
        title: channelTitle(id),
        state: channelState(id, states),
      })),
    [states],
  );

  /* Only the inputs a reader has actually broken. Printing all four
     corruption sentences at once would turn the lesson into a wall. */
  const corrupted = fusionInputs.filter(
    (input) => states[input.id] === "corrupted",
  );

  return (
    <div className={styles.lab}>
      {/* ── THE DIAGRAM ── */}
      <div className={fusion.scroller}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={fusion.frame}
        role="img"
        aria-labelledby={labelId}
      >
        <title id={labelId}>
          Four inputs — video, pose, wearable and trajectory — converging on a
          fusion node, then out to the movement channels. Each rail is drawn
          solid when its input is available, faint when missing, and dashed
          amber when corrupted.
        </title>

        {fusionInputs.map((input, i) => {
          const state = states[input.id];
          const y = ROW_Y[i];
          return (
            <g key={input.id} className={STATE_CLASS[state]}>
              <text className={fusion.railLabel} x={12} y={y + 3.5}>
                {input.label.toUpperCase()}
              </text>
              {/* Straight out, then a single elbow into the hub — the shape
                  of the brief's diagram, and legible at 390px. */}
              <path
                className={fusion.rail}
                d={`M${RAIL_X0} ${y} H${HUB_X - 74} Q${HUB_X - 52} ${y} ${
                  HUB_X - 52
                } ${y + (HUB_Y - y) * 0.5} V${HUB_Y - 0.5}`}
                fill="none"
              />
              <circle className={fusion.railDot} cx={RAIL_X0} cy={y} r={2.6} />
            </g>
          );
        })}

        {/* The hub. Its ring picks up the verdict tone, which is the only
            colour in the diagram that is not per-rail. */}
        <g
          className={
            verdict.tone === "corrupted"
              ? fusion.hubBad
              : verdict.tone === "none"
                ? fusion.hubOff
                : fusion.hubOn
          }
        >
          <circle className={fusion.hubRing} cx={HUB_X} cy={HUB_Y} r={26} />
          <text className={fusion.hubLabel} x={HUB_X} y={HUB_Y + 3.5}>
            FUSION
          </text>
        </g>

        <path
          className={`${fusion.rail} ${
            verdict.tone === "corrupted"
              ? fusion.railBad
              : verdict.tone === "none"
                ? fusion.railOff
                : fusion.railOn
          }`}
          d={`M${HUB_X + 26} ${HUB_Y} H${OUT_X}`}
          fill="none"
        />
        <text className={fusion.railLabel} x={OUT_X + 6} y={HUB_Y + 3.5}>
          CHANNELS
        </text>
      </svg>
      </div>

      {/* ── THE CONTROLS ──
          One radiogroup per input rather than one control with twelve
          options: the reader is setting four independent things, and the
          three words have to sit next to the input they apply to. */}
      <div className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2">
        {fusionInputs.map((input) => (
          <div key={input.id} className="min-w-0">
            <ChipScroller
              label={input.label}
              groupLabel={`${input.label} input state`}
              options={INPUT_STATES.map((state) => ({
                id: state.id,
                label: state.label,
              }))}
              selected={[states[input.id]]}
              onSelect={(id) =>
                setStates((prev) => ({ ...prev, [input.id]: id as InputState }))
              }
            />
            <p className={`${styles.note} mt-2`}>{input.note}</p>
          </div>
        ))}
      </div>

      {/* ── THE VERDICT ── */}
      <div
        className={`${styles.panel} ${fusion.verdict} ${
          verdict.tone === "corrupted" ? fusion.verdictBad : ""
        } mt-8`}
      >
        <div className={styles.panelHead}>
          <span className={styles.label}>Evidence state</span>
        </div>
        <div className={styles.panelBody}>
          {/* A live region: the whole point is that switching an input to
              Corrupted changes almost nothing visually, so a screen-reader
              user must be told what changed rather than being left to
              re-read a list that looks identical. */}
          <div aria-live="polite">
            <p className="text-[15px] font-medium leading-snug text-soft-white">
              {verdict.headline}
            </p>
            <p className={`${styles.note} mt-2 max-w-2xl`}>{verdict.detail}</p>
          </div>

          {/* Counts, not a score. */}
          <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
            {(
              [
                ["available", "Derivable"],
                ["contaminated", "Contaminated"],
                ["unverified", "Unverifiable"],
                ["unavailable", "Not derivable"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <dd className="font-display text-lg leading-none text-soft-white">
                  {String(verdict.counts[key]).padStart(2, "0")}
                </dd>
                <dt className="mt-1 text-[10px] uppercase tracking-[0.16em] text-soft-mute">
                  {label}
                </dt>
              </div>
            ))}
          </dl>

          <div className={styles.panelRule} />

          {/* The channels. Same list, same order, every time — so a reader
              switching an input from Missing to Corrupted can see for
              themselves that the shape of the output did not change. */}
          <ul className="grid gap-2 sm:grid-cols-2">
            {channels.map((channel) => (
              <li
                key={channel.id}
                className={`${fusion.channel} ${CHANNEL_CLASS[channel.state]}`}
              >
                <span className={fusion.channelName}>{channel.title}</span>
                <span className={fusion.channelState}>
                  {CHANNEL_STATE_LABEL[channel.state]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── WHAT "CORRUPTED" ACTUALLY MEANS ──
          Only for the inputs the reader has broken. This is the sentence that
          stops "corrupted" being read as "obviously broken". */}
      {corrupted.length > 0 && (
        <div className="mt-8">
          <span className={styles.label}>
            What is going wrong, and why nothing reports it
          </span>
          <ul className="mt-4 grid gap-4">
            {corrupted.map((input) => (
              <li key={input.id} className="min-w-0">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-300">
                  {input.label}
                </span>
                <p className={`${styles.note} mt-1 max-w-2xl`}>
                  {input.corruption}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* The state legend, stated once. */}
      <dl className="mt-8 grid gap-x-8 gap-y-3 sm:grid-cols-2">
        {(
          Object.keys(CHANNEL_STATE_LABEL) as ChannelState[]
        ).map((state) => (
          <div key={state} className="min-w-0">
            <dt className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-soft-white">
              {CHANNEL_STATE_LABEL[state]}
            </dt>
            <dd className={`${styles.note} mt-0.5`}>
              {CHANNEL_STATE_NOTE[state]}
            </dd>
          </div>
        ))}
      </dl>

      <p className={`${styles.note} mt-8 max-w-3xl`}>{FUSION_BOUNDARY}</p>
    </div>
  );
}
