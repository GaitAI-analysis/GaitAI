"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
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
import styles from "./analytics.module.css";
import fusion from "./fusion.module.css";

/**
 * FUSION SANDBOX — set each input to Available, Missing or Corrupted.
 *
 * THE ONE THING IT EXISTS TO TEACH. Set an input to Missing and its rail stops
 * short of the hub: the read-out counts one channel fewer and the sandbox says
 * what stopped being derivable. Set the same input to Corrupted instead and
 * NOTHING gets shorter — the rail still reaches the hub, the same number of
 * channels arrive, and only a flag changes. That asymmetry is the lesson, and
 * it is why the verdict ranks any corruption above any amount of missing data.
 *
 * WHY THERE IS NO SCORE. A number that rose as inputs were switched on would
 * be a fabricated benchmark, and worse, it would rank the corrupted state
 * ABOVE the missing state — since corrupted inputs still produce values. The
 * read-out is therefore a count of channels and their states. No accuracy, no
 * confidence, no improvement figure.
 *
 * WHY EACH INPUT'S CORRUPTION IS SPELLED OUT. "Corrupted" invites a reader to
 * picture something obvious — a black frame, an error. The failures that
 * matter are the ones that decode cleanly: a swapped left/right landmark, a
 * watch on the wrong wrist, two people's paths joined at a crossing. Those
 * sentences live in the data and surface here the moment an input is set to
 * Corrupted, because without them the whole distinction collapses.
 *
 * HOW THE DIAGRAM IS BUILT. The four input rows are HTML buttons, the hub and
 * the read-out are HTML, and only the rails between them are SVG. The rails
 * column is measured with a ResizeObserver and the paths are computed in
 * pixels, so a row's button and its rail always share a baseline, nothing is
 * scaled, and nothing can clip: the read-out is a block in the grid, not a
 * label past the end of a viewBox. On narrow screens the grid stacks, the rail
 * column is dropped, and each row carries its own short rail instead.
 *
 * Every state is derived — see data/fusion-sandbox.ts. Nothing about a
 * combination is stored, so the sandbox cannot display a reading its own
 * inputs do not support.
 */

/* Row pitch in pixels. Shared with the CSS (`--f-row`), which is why the
   rails line up with the buttons: both sides use the same number. */
const ROW_H = 44;
const ROWS = fusionInputs.length;
const RAIL_H = ROW_H * ROWS;
const HUB_Y = RAIL_H / 2;
/* Server-side guess for the rail column width; replaced by the measured
   width on mount, and stretched (not gapped) by `preserveAspectRatio="none"`
   for the single frame in between. */
const RAIL_W_DEFAULT = 200;
/* A missing rail ends this far along its horizontal run, as a fraction. */
const MISSING_STOP = 0.58;

const CYCLE: Record<InputState, InputState> = {
  available: "missing",
  missing: "corrupted",
  corrupted: "available",
};

const INPUT_STATE_LABEL: Record<InputState, string> = Object.fromEntries(
  INPUT_STATES.map((state) => [state.id, state.label.toUpperCase()]),
) as Record<InputState, string>;

const ROW_CLASS: Record<InputState, string> = {
  available: fusion.rowOn,
  missing: fusion.rowOff,
  corrupted: fusion.rowBad,
};

const RAIL_CLASS: Record<InputState, string> = {
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

/* The guided sequence: shown once, when the diagram first scrolls into view,
   and abandoned the moment the reader touches anything. Each step is
   [input id or null to restore everything, state, hold in ms]. */
const GUIDED: [string | null, InputState, number][] = [
  ["wearable", "missing", 2400],
  [null, "available", 1500],
  ["trajectory", "corrupted", 2600],
  [null, "available", 0],
];
const GUIDED_LEAD_IN = 1400;

const allAvailable = (): Record<string, InputState> =>
  Object.fromEntries(
    fusionInputs.map((input) => [input.id, "available" as InputState]),
  );

/**
 * Rail geometry in pixels for one row: a horizontal run, a quarter elbow into
 * a shared vertical bus, and — for the two rows that are not already at hub
 * height — a vertical run down or up to it. The bus then feeds a single stub
 * into the hub. Returns both the visible per-state path and the full path a
 * signal dot travels, which always continues through the bus to the hub.
 */
function railGeometry(row: number, state: InputState, width: number) {
  const y = ROW_H * row + ROW_H / 2;
  const busX = Math.max(40, width - 30);
  const r = Math.min(14, Math.abs(HUB_Y - y), busX / 2);
  const dir = HUB_Y > y ? 1 : HUB_Y < y ? -1 : 0;
  const runEnd = busX - r;

  const full =
    dir === 0
      ? `M0 ${y} H${width}`
      : `M0 ${y} H${runEnd} Q${busX} ${y} ${busX} ${y + r * dir} V${HUB_Y} H${width}`;

  if (state === "missing") {
    return { y, full, visible: `M0 ${y} H${runEnd * MISSING_STOP}`, runEnd };
  }
  /* Available and corrupted both reach the bus; the stub into the hub is
     drawn once, below, so four strokes never pile up on the same segment. */
  const visible =
    dir === 0
      ? `M0 ${y} H${busX}`
      : `M0 ${y} H${runEnd} Q${busX} ${y} ${busX} ${y + r * dir} V${HUB_Y}`;
  return { y, full, visible, runEnd };
}

export function FusionSandbox() {
  const [states, setStates] = useState<Record<string, InputState>>(allAvailable);
  const [railW, setRailW] = useState(RAIL_W_DEFAULT);
  /* `guiding` is true while the once-only demo owns the state. The live
     region is silenced during it, so a screen reader is not read four state
     changes nobody asked for. */
  const [guiding, setGuiding] = useState(false);
  const guideActive = useRef(false);
  const touched = useRef(false);
  const guidedRan = useRef(false);
  const timers = useRef<number[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9_-]/g, "");

  /* ── Measure the rail column ── */
  useEffect(() => {
    const el = railRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const w = Math.round(el.getBoundingClientRect().width);
      if (w > 0) setRailW(w);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, []);

  /* Returns whether a demo was running, so the caller can start the reader
     from a clean slate rather than from whichever step the demo was on. */
  const stopGuide = useCallback(() => {
    touched.current = true;
    clearTimers();
    const was = guideActive.current;
    guideActive.current = false;
    setGuiding(false);
    return was;
  }, [clearTimers]);

  /* ── The guided sequence, once, on first sight ── */
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        if (guidedRan.current || touched.current) return;
        guidedRan.current = true;
        guideActive.current = true;
        setGuiding(true);

        let at = GUIDED_LEAD_IN;
        GUIDED.forEach(([id, state, hold], i) => {
          timers.current.push(
            window.setTimeout(() => {
              if (touched.current) return;
              setStates(
                id === null
                  ? allAvailable()
                  : { ...allAvailable(), [id]: state },
              );
              if (i === GUIDED.length - 1) {
                guideActive.current = false;
                setGuiding(false);
              }
            }, at),
          );
          at += hold;
        });
      },
      { threshold: 0.6 },
    );
    io.observe(root);
    return () => {
      io.disconnect();
      clearTimers();
    };
  }, [clearTimers]);

  const setInput = useCallback(
    (id: string, state: InputState) => {
      const interrupted = stopGuide();
      setStates((prev) => ({
        ...(interrupted ? allAvailable() : prev),
        [id]: state,
      }));
    },
    [stopGuide],
  );

  const onRowKey = (id: string, e: KeyboardEvent<HTMLButtonElement>) => {
    /* Enter and Space come free with <button>; arrows step through the
       three states in either direction so no state is ever two presses away
       in the wrong direction. */
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      setInput(id, CYCLE[states[id]]);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const back = (Object.keys(CYCLE) as InputState[]).find(
        (k) => CYCLE[k] === states[id],
      )!;
      setInput(id, back);
    }
  };

  /* ── Derived ── */
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

  const values = fusionInputs.map((input) => states[input.id]);
  const nMissing = values.filter((s) => s === "missing").length;
  const nCorrupt = values.filter((s) => s === "corrupted").length;
  const nPresent = ROWS - nMissing;

  const tone: "on" | "off" | "bad" =
    nCorrupt > 0 ? "bad" : nPresent === 0 ? "off" : "on";
  const toneClass =
    tone === "bad" ? fusion.railBad : tone === "off" ? fusion.railOff : fusion.railOn;
  const hubClass =
    tone === "bad" ? fusion.hubBad : tone === "off" ? fusion.hubOff : fusion.hubOn;

  const readout = {
    count: `${nPresent} / ${ROWS}`,
    label: nCorrupt > 0 ? "CHANNELS PRESENT" : "CHANNELS AVAILABLE",
    flag: nCorrupt > 0 ? `${nCorrupt} CORRUPTED` : null,
    sentence:
      nCorrupt > 0
        ? "Corrupted channels remain present and must be identified rather than silently removed."
        : nPresent === 0
          ? "With every channel missing, nothing reaches fusion — and that absence is at least known."
          : nMissing > 0
            ? "Missing channels reduce the available input set."
            : "All four channels are available to fusion.",
  };

  /* Under the ring, as short stacked lines: each must stay narrower than
     the hub itself, or it runs out over the rails beside it. */
  const hubLines =
    nCorrupt > 0
      ? [`${nPresent} INPUTS`, `${nCorrupt} FLAGGED`]
      : nMissing > 0
        ? [`${nPresent} ${nPresent === 1 ? "INPUT" : "INPUTS"}`]
        : [];

  /* Only the inputs a reader has actually broken. Printing all four
     corruption sentences at once would turn the lesson into a wall. */
  const corrupted = fusionInputs.filter(
    (input) => states[input.id] === "corrupted",
  );

  const busX = Math.max(40, railW - 30);

  return (
    <div className={styles.lab}>
      {/* ── THE DIAGRAM ── */}
      <div
        ref={rootRef}
        className={fusion.diagram}
        style={{ "--f-row": `${ROW_H}px` } as CSSProperties}
      >
        <p className={fusion.hint} id={`${uid}-hint`}>
          Change any input to see how fusion responds.
        </p>

        {/* Column 1 — the inputs. Real buttons: each row cycles its own
            state, and the state word beside the name is the row's content,
            so the accessible name always says both. */}
        <div className={fusion.inputs} role="group" aria-label="Fusion inputs">
            {fusionInputs.map((input, i) => {
              const state = states[input.id];
              return (
                <button
                  key={input.id}
                  type="button"
                  className={`${fusion.row} ${ROW_CLASS[state]}`}
                  aria-describedby={`${uid}-hint`}
                  aria-label={`${input.label} input: ${INPUT_STATE_LABEL[state].toLowerCase()}. Activate to set ${CYCLE[state]}.`}
                  onClick={() => setInput(input.id, CYCLE[state])}
                  onKeyDown={(e) => onRowKey(input.id, e)}
                  data-row={i}
                >
                  <span className={fusion.rowName}>
                    {input.label.toUpperCase()}
                  </span>
                  <span className={fusion.rowState}>
                    <span className={fusion.ticks} aria-hidden="true">
                      {INPUT_STATES.map((s) => (
                        <i
                          key={s.id}
                          className={s.id === state ? fusion.tickOn : ""}
                        />
                      ))}
                    </span>
                    {INPUT_STATE_LABEL[state]}
                  </span>
                  {/* Narrow screens only: a short rail on the row itself,
                      since the rail column is dropped there. */}
                  <svg
                    className={`${fusion.miniRail} ${RAIL_CLASS[state]}`}
                    viewBox="0 0 48 10"
                    aria-hidden="true"
                  >
                    <path
                      className={fusion.rail}
                      d={state === "missing" ? "M2 5 H26" : "M2 5 H46"}
                      fill="none"
                    />
                    {state === "corrupted" && (
                      <path
                        className={fusion.noise}
                        d="M20 5 l2 -3 l2 6 l2 -6 l2 6 l2 -3"
                        fill="none"
                      />
                    )}
                  </svg>
                </button>
              );
            })}
        </div>

        {/* Column 2 — the rails. Measured, so the geometry is in pixels. */}
        <div ref={railRef} className={fusion.railCol} aria-hidden="true">
          <svg
            className={fusion.rails}
            viewBox={`0 0 ${railW} ${RAIL_H}`}
            preserveAspectRatio="none"
            width="100%"
            height={RAIL_H}
          >
            {/* Motion paths, invisible: a signal dot always travels the whole
                way to the hub, even where the visible rail is drawn shorter. */}
            <defs>
              {fusionInputs.map((input, i) => (
                <path
                  key={input.id}
                  id={`${uid}-motion-${input.id}`}
                  d={railGeometry(i, states[input.id], railW).full}
                />
              ))}
            </defs>

            {/* The shared stub from the bus into the hub, drawn once, in the
                aggregate tone. */}
            <path
              className={`${fusion.rail} ${toneClass}`}
              d={`M${busX} ${HUB_Y} H${railW}`}
              fill="none"
            />

            {fusionInputs.map((input, i) => {
              const state = states[input.id];
              const g = railGeometry(i, state, railW);
              const noiseX = Math.round(g.runEnd * 0.5);
              return (
                <g key={input.id} className={RAIL_CLASS[state]}>
                  <path className={fusion.rail} d={g.visible} fill="none" />
                  <circle className={fusion.railDot} cx={0} cy={g.y} r={2.6} />

                  {/* Missing: the rail ends in an open terminal, short of the
                      bus. An absence, marked as one. */}
                  {state === "missing" && (
                    <circle
                      className={fusion.railEnd}
                      cx={g.runEnd * MISSING_STOP + 5}
                      cy={g.y}
                      r={2.4}
                    />
                  )}

                  {/* Corrupted: the rail is intact, and carries a small
                      disturbance. Present, and not to be trusted. */}
                  {state === "corrupted" && (
                    <path
                      className={fusion.noise}
                      d={`M${noiseX - 9} ${g.y} l3 -4 l3 8 l3 -8 l3 8 l3 -4`}
                      fill="none"
                    />
                  )}

                  {/* Signal motion. Not rendered for a missing rail: there
                      is nothing travelling after the break. Hidden entirely
                      under prefers-reduced-motion, in the CSS. */}
                  {state !== "missing" && (
                    <circle
                      className={`${fusion.signal} ${
                        state === "corrupted" ? fusion.signalBad : ""
                      }`}
                      r={2.2}
                      style={{ animationDelay: `${i * 0.35}s` }}
                    >
                      <animateMotion
                        dur="3.6s"
                        begin={`${i * 0.9}s`}
                        repeatCount="indefinite"
                        calcMode="linear"
                      >
                        <mpath href={`#${uid}-motion-${input.id}`} />
                      </animateMotion>
                    </circle>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Narrow screens only: the bus becomes a vertical drop. */}
        <div className={`${fusion.drop} ${toneClass}`} aria-hidden="true" />

        {/* Column 3 — the hub. Its ring picks up the aggregate tone, which is
            the only colour in the diagram that is not per-rail. */}
        <div className={`${fusion.hub} ${hubClass}`}>
          <div className={fusion.hubRing}>
            <span className={fusion.hubLabel}>FUSION</span>
          </div>
          <span className={fusion.hubStatus}>
            {hubLines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </span>
        </div>

        {/* Column 4 — the output line. Short, and the read-out is a block
            reserved right after it, never a label past the edge. */}
        <svg
          className={`${fusion.outLine} ${toneClass}`}
          viewBox="0 0 64 12"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            id={`${uid}-motion-out`}
            className={fusion.rail}
            d={tone === "off" ? "M0 6 H22" : "M0 6 H64"}
            fill="none"
          />
          {tone !== "off" && (
            <circle
              className={`${fusion.signal} ${tone === "bad" ? fusion.signalBad : ""}`}
              r={2.2}
            >
              <animateMotion dur="2.4s" repeatCount="indefinite" calcMode="linear">
                <mpath href={`#${uid}-motion-out`} />
              </animateMotion>
            </circle>
          )}
        </svg>
        <div className={`${fusion.drop} ${toneClass}`} aria-hidden="true" />

        {/* Column 5 — the read-out. A live region: the whole point is that
            switching an input to Corrupted changes almost nothing visually,
            so a screen-reader user must be told what changed. Off while the
            guided demo is running, so it never narrates its own animation. */}
        <div
          className={`${fusion.output} ${
            tone === "bad" ? fusion.outputBad : tone === "off" ? fusion.outputOff : ""
          }`}
          aria-live={guiding ? "off" : "polite"}
          aria-atomic="true"
        >
          <span className={fusion.outputEyebrow}>Output</span>
          <span className={fusion.outputCount}>{readout.count}</span>
          <span className={fusion.outputLabel}>{readout.label}</span>
          {readout.flag && (
            <span className={fusion.outputFlag}>{readout.flag}</span>
          )}
          <p className={fusion.outputNote}>{readout.sentence}</p>
        </div>
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
          <p className="text-[15px] font-medium leading-snug text-soft-white">
            {verdict.headline}
          </p>
          <p className={`${styles.note} mt-2 max-w-2xl`}>{verdict.detail}</p>

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
