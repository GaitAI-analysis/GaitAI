"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ArrowRight, Play, X } from "lucide-react";
import { GAIT_PHASES, type Pt } from "@/components/visuals/gait-phases";
import { PoseFrame } from "@/components/research/PoseFrame";
import { analyticsProducts } from "@/data/analytics";
import styles from "./try.module.css";

/**
 * TRY GAITAI — the homepage's 30-second interactive demo.
 *
 * A button in the hero and a modal, not a section: the homepage does not get
 * longer, and nothing is loaded until somebody asks for it. Five stages, each
 * drawing what that stage actually produces:
 *
 *   01 Capture   frames arriving
 *   02 Pose      landmarks on one of those frames
 *   03 Measure   the stride segmented, features read off it
 *   04 Interpret the same walk against its own earlier baseline
 *   05 Act       the structured output somebody reviews
 *
 * IT IS A TEASER, NOT THE LAB. The Movement Studio at /movement-lab is the
 * full instrument — two families, layer toggles, per-stage explainability. This
 * shows one path through one family and then hands over, which is why the last
 * stage's only action is the link there.
 *
 * EVERY VALUE IS AN EXAMPLE AND SAYS SO. The stage names are the platform's own
 * documented pipeline stages from `data/lab-demo.ts`, the poses are the real
 * canonical gait phases, the outputs and audiences on the last stage are
 * WalkScan's own documented ones, and the illustrative marker sits in the
 * modal header where it cannot be scrolled away from. There is no number anywhere that could be
 * mistaken for a measurement of a real person: the readings are relative words
 * ("steady", "even", "narrowing"), never values, and the interpretation stage
 * compares the walk only against itself.
 *
 * IT IS PORTALLED, AND THAT IS NOT OPTIONAL. The trigger lives inside the
 * hero's `max-w-3xl` button row, which is a `motion.div` — and a transform
 * makes an element the containing block for its fixed-position descendants.
 * So `position: fixed` on the scrim resolved against that 768px row instead
 * of the viewport: the overlay was 768px wide on a 1440px screen, centred on
 * the row rather than the page, and the mobile sheet could not reach the
 * screen edges. Rendering into `document.body` is the fix. It only showed up
 * under `prefers-reduced-motion`, where the transform is dropped and the
 * panel suddenly measured its intended 992px.
 *
 * ACCESSIBILITY. A real dialog: `aria-modal`, labelled by its own heading,
 * Escape closes it, focus moves to the panel on open and back to the trigger
 * on close, and the stage rail is a tablist reachable with arrow keys. With
 * reduced motion the stage still changes — only the transition is dropped.
 */

const STAGES = [
  {
    n: "01",
    id: "capture",
    name: "Capture",
    insight: "A few seconds of ordinary walking.",
    note: "No special camera, no markers, no lab.",
  },
  {
    n: "02",
    id: "pose",
    name: "Pose",
    insight: "The body becomes positions, not pixels.",
    note: "Landmarks per frame. Appearance is not kept.",
  },
  {
    n: "03",
    id: "measure",
    name: "Measure",
    insight: "One stride, segmented and read.",
    note: "Every reading is drawn from a specific part of the signal.",
  },
  {
    n: "04",
    id: "interpret",
    name: "Interpret",
    insight: "Features become movement intelligence.",
    note: "Compared against this person's own earlier walks.",
  },
  {
    n: "05",
    id: "act",
    name: "Act",
    insight: "A structured output somebody can act on.",
    note: "Reviewed by a clinician — never a diagnosis.",
  },
] as const;

export function TryGaitAI() {
  const [open, setOpen] = useState(false);
  /* The portal target only exists in the browser, and this component is
     prerendered by `output: "export"`. */
  const [mounted, setMounted] = useState(false);
  const [stage, setStage] = useState(0);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const railRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  /* Deep link: /#try-gaitai opens the demo on arrival, so it can be linked
     to directly. */
  useEffect(() => {
    setMounted(true);
    if (window.location.hash === "#try-gaitai") setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        return;
      }
      /* Focus trap: Tab cycles inside the panel rather than escaping to the
         page behind it, which is what `aria-modal` promises. */
      if (event.key !== "Tab") return;
      const node = panelRef.current;
      if (!node) return;
      const focusable = node.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const lastEl = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        lastEl.focus();
      } else if (!event.shiftKey && document.activeElement === lastEl) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    /* The page behind a full-screen dialog should not scroll under it. */
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, close]);

  /**
   * Arrow keys along the rail, with focus following selection.
   *
   * The tabs use a roving tabIndex — only the selected one is tabbable — so
   * changing the selection without moving focus left it on a tab that had
   * just become `tabIndex={-1}`: the focus ring stayed behind on a stage that
   * was no longer the current one, and the next Tab left the rail entirely.
   * Home and End are here because a five-tab rail is exactly where they are
   * expected.
   */
  const current = STAGES[stage];
  const nextStage = STAGES[stage + 1];
  const prevStage = STAGES[stage - 1];

  const onRailKey = (event: React.KeyboardEvent) => {
    const last = STAGES.length - 1;
    let next: number | null = null;
    if (event.key === "ArrowRight") next = Math.min(stage + 1, last);
    else if (event.key === "ArrowLeft") next = Math.max(stage - 1, 0);
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    if (next === null) return;

    event.preventDefault();
    setStage(next);
    railRef.current
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      [next]?.focus();
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setStage(0);
          setOpen(true);
        }}
        aria-haspopup="dialog"
        className={styles.trigger}
      >
        <Play aria-hidden="true" className="h-3.5 w-3.5" />
        Try GaitAI
        <ArrowRight aria-hidden="true" className={styles.triggerArrow} />
      </button>

      {open &&
        mounted &&
        createPortal(
          <div className={styles.scrim} onClick={close} role="presentation">
            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="try-gaitai-title"
              tabIndex={-1}
              onClick={(event) => event.stopPropagation()}
              className={styles.panel}
            >
              {/* ── HEADER ─────────────────────────────────────────────── */}
              <header className={styles.head}>
                <div className={styles.headText}>
                  <p className={styles.eyebrow}>
                    Movement intelligence <span aria-hidden="true">·</span> end to
                    end
                  </p>
                  <h2 id="try-gaitai-title" className={styles.title}>
                    How a walk becomes intelligence
                  </h2>
                </div>
                {/* A marker, not a badge: the brief asked for this to be quiet,
                    and a large outlined pill was reading as a warning label. */}
                <div className={styles.headMeta}>
                  {/* One phrase for this everywhere on the site:
                      "Illustrative demo" — see IllustrativeBadge. The second
                      word this marker used to carry said nothing the first
                      does not, and invited the reader to wonder what had been
                      generated. The values in here are examples. */}
                  <p className={styles.status}>
                    <span aria-hidden="true" className={styles.statusDot} />
                    Illustrative
                    <span className={styles.statusThin}> demo</span>
                  </p>
                  <button
                    type="button"
                    onClick={close}
                    aria-label="Close demo"
                    className={styles.close}
                  >
                    <X aria-hidden="true" className="h-4 w-4" />
                  </button>
                </div>
              </header>

              {/* ── the stage rail ── */}
              <div
                ref={railRef}
                role="tablist"
                aria-label="Pipeline stages"
                onKeyDown={onRailKey}
                className={styles.rail}
              >
                {/* One hairline behind the nodes, filled only as far as the
                    current stage — so the row reads as a process with a
                    position in it, not as five tabs. */}
                <div className={styles.railTrack} aria-hidden="true">
                  <span
                    className={styles.railFill}
                    style={{ width: `${(stage / (STAGES.length - 1)) * 100}%` }}
                  />
                </div>
                {STAGES.map((item, i) => (
                  <button
                    key={item.id}
                    role="tab"
                    aria-selected={i === stage}
                    aria-controls="try-gaitai-stage"
                    tabIndex={i === stage ? 0 : -1}
                    onClick={() => setStage(i)}
                    className={`${styles.node} ${i === stage ? styles.nodeOn : ""} ${
                      i < stage ? styles.nodeDone : ""
                    }`}
                  >
                    <span aria-hidden="true" className={styles.nodeMark} />
                    <span className={styles.nodeN}>{item.n}</span>
                    <span className={styles.nodeName}>{item.name}</span>
                  </button>
                ))}
              </div>

              {/* ── the stage itself ── */}
              <div
                id="try-gaitai-stage"
                role="tabpanel"
                aria-label={current.name}
                className={styles.body}
              >
                <p className={styles.insight}>{current.insight}</p>

                <div key={stage} className={styles.stageWrap}>
                  <div className={styles.art}>
                    <StageArt stage={stage} />
                  </div>
                </div>

                <p className={styles.note}>{current.note}</p>
              </div>

              <footer className={styles.foot}>
                <button
                  type="button"
                  onClick={() => setStage((v) => Math.max(v - 1, 0))}
                  disabled={stage === 0}
                  className={styles.prev}
                >
                  <span aria-hidden="true">&larr;</span>
                  {prevStage ? `Previous: ${prevStage.name}` : "Previous"}
                </button>

                {nextStage ? (
                  <button
                    type="button"
                    onClick={() => setStage((v) => v + 1)}
                    className={styles.nextBtn}
                  >
                    Next: {nextStage.name}
                    <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <Link href="/movement-lab/" className={styles.nextBtn}>
                    Continue in Movement Studio
                    <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                  </Link>
                )}
              </footer>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

/* ══ THE FIVE INSTRUMENTS ════════════════════════════════════════════════
   One 720×320 viewBox each, so the panel never reflows between stages, and
   each stage draws a genuinely different instrument rather than the same
   chart relabelled. Every colour comes from a token set on the panel, which
   is what lets the light theme be instrumentation on paper instead of an
   inverted dark screen.

   TWO RULES LEARNED THE HARD WAY, BOTH FROM LOOKING AT THE RENDER:

   1. NEVER DRAW A POSE AT MID-STANCE. `GAIT_PHASES[2]` is the moment both
      legs are vertical and together, so a figure drawn from it collapses
      into a single stick and reads as a mistake. Heel-strike (phase 0) puts
      the near leg forward at x=23 and the far leg back at x=-19 — 51 local
      units of separation — and is unmistakably a walk. Every figure here is
      placed from the phase's own extents, never guessed.

   2. LEADER LINES MUST NOT LOOK LIKE SIGNAL. A diagonal line from a joint to
      a label is indistinguishable from a plotted trace. Every annotation
      here leaves its evidence horizontally, turns once in a shared gutter,
      and is dashed at low opacity — the convention of a technical drawing,
      which the eye reads as "this points at that" rather than as data. */

const W = 720;
const H = 320;
const f1 = (n: number) => Math.round(n * 10) / 10;

function StageArt({ stage }: { stage: number }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} aria-hidden="true">
      <TimingGrid />
      {stage === 0 && <Capture />}
      {stage === 1 && <Pose />}
      {stage === 2 && <Measure />}
      {stage === 3 && <Interpret />}
      {stage === 4 && <Act />}
    </svg>
  );
}

/**
 * The instrument's own ground: a cool timing grid on every stage.
 *
 * Full-bleed on purpose. Inset to the content area it drew a second visible
 * rectangle just inside the stage's border, and box-inside-a-box was one of
 * the things this redesign existed to remove.
 */
function TimingGrid() {
  return (
    <g className={styles.grid}>
      {Array.from({ length: 15 }, (_, i) => (
        <line key={`v${i}`} x1={i * 48} y1={0} x2={i * 48} y2={H} />
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <line key={`h${i}`} x1={0} y1={i * 40} x2={W} y2={i * 40} />
      ))}
    </g>
  );
}

/** A shaft with a solid head — a dashed line and a chevron read as broken. */
function Arrow({ x1, x2, y }: { x1: number; x2: number; y: number }) {
  return (
    <>
      <line className={styles.flow} x1={x1} y1={y} x2={x2 - 7} y2={y} />
      <path
        className={styles.arrowHead}
        d={`M${x2 - 7} ${y - 4.5} L${x2} ${y} L${x2 - 7} ${y + 4.5} Z`}
      />
    </>
  );
}

/**
 * A reading, tied to the exact place in the drawing it was read from.
 *
 * `from` is the evidence. The leader runs horizontally out of it, turns once
 * at the gutter, and arrives at the text — so the number and its source are
 * one object, which is what the old detached right-hand column was not.
 */
function Reading({
  from,
  gutter,
  x,
  y,
  label,
  value,
  hint,
}: {
  from: readonly [number, number];
  gutter: number;
  x: number;
  y: number;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <g>
      <path
        className={styles.leader}
        d={`M${f1(from[0])} ${f1(from[1])} L${gutter} ${f1(from[1])} L${gutter} ${y} L${x - 4} ${y}`}
      />
      <circle className={styles.leaderDot} cx={f1(from[0])} cy={f1(from[1])} r={3} />
      <text className={styles.readingLabel} x={x} y={y - 9}>
        {label}
      </text>
      <text className={styles.readingValue} x={x} y={y + 13}>
        {value}
      </text>
      <text className={styles.annoDim} x={x} y={y + 29}>
        {hint}
      </text>
    </g>
  );
}

/* Every figure is drawn from heel-strike — see rule 1 above. */
const STRIDE = GAIT_PHASES[0];

/** 01 CAPTURE — an ordinary frame on the left, the signal it yields on the right. */
function Capture() {
  const S = 1.3;
  const px = 176;
  const py = 182;

  /* Three strides, not four. At four the wave was steeper than it was wide
     and read as a zigzag; a walking signal is not a sawtooth. */
  const sig = (t: number) =>
    150 - Math.sin(t * Math.PI * 6) * 30 - Math.sin(t * Math.PI * 12) * 3;
  const trace = Array.from({ length: 96 }, (_, i) => {
    const t = i / 95;
    return `${i ? "L" : "M"}${f1(452 + t * 232)} ${f1(sig(t))}`;
  }).join(" ");

  return (
    <>
      {/* Frames arriving: one dimmer one behind, the current one in front.
          Two ghosts read as a misaligned box rather than as a stack. */}
      <rect className={styles.frameGhost} x={54} y={56} width={230} height={178} rx={2} />
      <rect className={styles.frameLive} x={64} y={66} width={230} height={178} rx={2} />

      <g transform={`translate(${px} ${py})`}>
        <PoseFrame
          phase={STRIDE}
          s={S}
          classes={{
            bone: styles.bone,
            boneFar: styles.boneFar,
            joint: styles.joint,
            head: styles.figHead,
          }}
        />
      </g>

      <text className={styles.anno} x={64} y={42}>
        Source frame
      </text>
      <text className={styles.annoDim} x={64} y={262}>
        standard camera · a few seconds of walking
      </text>

      <Arrow x1={306} x2={434} y={155} />

      <text className={styles.anno} x={452} y={42}>
        Movement signal
      </text>
      <path className={styles.trace} d={trace} />
      {/* One dot per sampled frame — the link back to the frame stack. */}
      {Array.from({ length: 13 }, (_, i) => {
        const t = i / 12;
        return (
          <circle
            key={i}
            className={styles.sample}
            cx={f1(452 + t * 232)}
            cy={f1(sig(t))}
            r={2.2}
          />
        );
      })}
      <line className={styles.axis} x1={452} y1={222} x2={684} y2={222} />
      {Array.from({ length: 9 }, (_, i) => (
        <line
          key={i}
          className={styles.tick}
          x1={452 + i * 29}
          y1={222}
          x2={452 + i * 29}
          y2={i % 2 ? 227 : 231}
        />
      ))}
      <text className={styles.annoDim} x={452} y={248}>
        time →
      </text>
      <text className={styles.annoDim} x={452} y={262}>
        one sample per frame
      </text>
    </>
  );
}

/**
 * 02 POSE — three consecutive frames, the current one lit, with hip / knee /
 * ankle called out on it.
 *
 * The earlier frames are the point: "landmarks per frame" is a claim about a
 * sequence, and one figure could not make it. They are real successive gait
 * events (toe-off → swing → heel-strike), advanced along x the way a walker
 * actually advances.
 */
function Pose() {
  const S = 2.0;
  /* 172, not 196: at 196 the figures sat in the bottom third with 130px of
     dead grid above the title, which is the empty-space problem this stage
     was called out for. */
  const py = 172;
  const ghost = {
    bone: styles.boneFar,
    boneFar: styles.boneFar,
    joint: styles.jointGhost,
    head: styles.figHeadGhost,
  };

  const px = 262;
  const at = ([x, y]: Pt): Pt => [px + x * S, py + y * S];
  const named = [
    { label: "Hip", hint: "pelvis reference", p: at(STRIDE.nearLeg[0]), out: 10, row: 96 },
    { label: "Knee", hint: "flexion through stance", p: at(STRIDE.nearLeg[1]), out: 10, row: 164 },
    { label: "Ankle", hint: "contact and push-off", p: at(STRIDE.nearLeg[2]), out: 10, row: 232 },
  ];

  return (
    <>
      <text className={styles.anno} x={64} y={40}>
        Body landmarks
      </text>

      {[
        { phase: GAIT_PHASES[3], x: 172, t: "t−2" },
        { phase: GAIT_PHASES[4], x: 216, t: "t−1" },
      ].map((g) => (
        <g key={g.t}>
          <g transform={`translate(${g.x} ${py})`}>
            <PoseFrame phase={g.phase} s={S} classes={ghost} />
          </g>
          <text className={styles.annoDim} x={g.x} y={288} textAnchor="middle">
            {g.t}
          </text>
        </g>
      ))}

      <g transform={`translate(${px} ${py})`}>
        <PoseFrame
          phase={STRIDE}
          s={S}
          classes={{
            bone: styles.boneLit,
            boneFar: styles.boneFar,
            joint: styles.joint,
            head: styles.figHead,
          }}
        />
      </g>
      <text className={styles.annoDim} x={px} y={288} textAnchor="middle">
        t
      </text>

      {named.map((item) => (
        <g key={item.label}>
          <circle className={styles.landmark} cx={f1(item.p[0])} cy={f1(item.p[1])} r={7} />
          <circle
            className={styles.landmarkCore}
            cx={f1(item.p[0])}
            cy={f1(item.p[1])}
            r={2.4}
          />
          <path
            className={styles.leader}
            d={`M${f1(item.p[0] + item.out)} ${f1(item.p[1])} L420 ${f1(item.p[1])} L420 ${
              item.row
            } L432 ${item.row}`}
          />
          <text className={styles.readingLabel} x={436} y={item.row - 5}>
            {item.label}
          </text>
          <text className={styles.annoDim} x={436} y={item.row + 12}>
            {item.hint}
          </text>
        </g>
      ))}
    </>
  );
}

/**
 * 03 MEASURE — the instrumentation stage.
 *
 * Layers, in the order they are read: stance shading, the far limb, the near
 * limb, the heel-strike events on the axis, then the dimension lines and
 * reference level that each reading is actually taken from. The second trace
 * is the contralateral limb at half a stride's offset — a real signal, which
 * is what makes "step symmetry" something the drawing can show rather than
 * assert.
 */
function Measure() {
  const x0 = 64;
  const x1 = 412;
  const span = x1 - x0;
  /* Three strides. Four packed 80px of amplitude into an 87px stride and the
     trace came out as a zigzag; three gives the wave room to look like a
     walk. */
  const strides = 3;
  const strideW = span / strides;
  const mid = 152;
  const amp = 34;
  const axisY = 222;
  const crestY = mid - amp;
  const gutter = 428;
  const rx = 444;

  const at = (t: number) => x0 + t * span;
  const y = (t: number) =>
    mid -
    Math.sin(t * Math.PI * 2 * strides) * amp -
    Math.sin(t * Math.PI * 4 * strides) * amp * 0.1;
  const path = (shift: number) =>
    Array.from({ length: 120 }, (_, i) => {
      const t = i / 119;
      return `${i ? "L" : "M"}${f1(at(t))} ${f1(y(t - shift))}`;
    }).join(" ");

  /* Crests sit a quarter-cycle into each stride. */
  const crests = [0, 1, 2].map((i) => (i + 0.25) / strides);

  return (
    <>
      <text className={styles.anno} x={x0} y={44}>
        Stride waveform
      </text>
      <line className={styles.trace} x1={x0} y1={62} x2={x0 + 16} y2={62} />
      <text className={styles.annoDim} x={x0 + 22} y={65}>
        near limb
      </text>
      <line className={styles.traceFaint} x1={x0 + 96} y1={62} x2={x0 + 112} y2={62} />
      <text className={styles.annoDim} x={x0 + 118} y={65}>
        far limb
      </text>

      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          className={styles.stance}
          x={f1(x0 + i * strideW)}
          y={80}
          width={f1(strideW * 0.6)}
          height={axisY - 80}
          rx={1}
        />
      ))}

      <path className={styles.traceFaint} d={path(0.125)} />
      <path className={styles.trace} d={path(0)} />

      {/* The crest level, and a tick at each crest: the evidence behind a
          statement about stride-to-stride consistency. */}
      <line className={styles.refLine} x1={x0} y1={crestY} x2={x1} y2={crestY} />
      {crests.map((t) => (
        <line
          key={t}
          className={styles.tick}
          x1={f1(at(t))}
          y1={crestY - 4}
          x2={f1(at(t))}
          y2={crestY + 4}
        />
      ))}

      <line className={styles.axis} x1={x0} y1={axisY} x2={x1} y2={axisY} />
      {[0, 1, 2, 3].map((i) => (
        <circle
          key={i}
          className={styles.event}
          cx={f1(x0 + i * strideW)}
          cy={axisY}
          r={3.4}
        />
      ))}
      {[0, 1, 2].map((i) => (
        <circle
          key={i}
          className={styles.eventOpen}
          cx={f1(x0 + (i + 0.5) * strideW)}
          cy={axisY}
          r={3}
        />
      ))}
      {[0, 1, 2].map((i) => (
        <text
          key={i}
          className={styles.annoDim}
          x={f1(x0 + i * strideW + 6)}
          y={axisY + 18}
        >
          {`stride 0${i + 1}`}
        </text>
      ))}

      {/* Two measured intervals, each with drop lines back to the events it
          spans — without them a dimension reads as a line floating loose
          under the plot. */}
      <Dimension a={x0 + strideW} b={x0 + strideW * 2} y={256} from={axisY} />
      <Dimension a={x0 + strideW * 2} b={x0 + strideW * 2.5} y={202} from={axisY} />

      <Reading
        from={[at(crests[1]), crestY]}
        gutter={gutter}
        x={rx}
        y={100}
        label="Stride variability"
        value="Narrow"
        hint="crest level, stride to stride"
      />
      <Reading
        from={[x0 + strideW * 2.25, 202]}
        gutter={gutter}
        x={rx}
        y={168}
        label="Step symmetry"
        value="Even"
        hint="near strike to far strike"
      />
      <Reading
        from={[x0 + strideW * 1.5, 256]}
        gutter={gutter}
        x={rx}
        y={236}
        label="Cadence"
        value="Steady"
        hint="heel strike to heel strike"
      />
    </>
  );
}

/**
 * A measured interval, with end ticks and drop lines back to `from` — the
 * drawing's unit of evidence, tied to the events at either end of it.
 */
function Dimension({
  a,
  b,
  y,
  from,
}: {
  a: number;
  b: number;
  y: number;
  from: number;
}) {
  return (
    <g className={styles.dim}>
      <line x1={f1(a)} y1={y} x2={f1(b)} y2={y} />
      <line x1={f1(a)} y1={y - 4} x2={f1(a)} y2={y + 4} />
      <line x1={f1(b)} y1={y - 4} x2={f1(b)} y2={y + 4} />
      <line className={styles.drop} x1={f1(a)} y1={from} x2={f1(a)} y2={y} />
      <line className={styles.drop} x1={f1(b)} y1={from} x2={f1(b)} y2={y} />
    </g>
  );
}

/**
 * 04 INTERPRET — signals → features → intelligence, over this walk's own
 * history.
 *
 * Each column's labels sit on the side that has no edges on it: left of the
 * signals, above the features, right of the outputs. Routing edges past
 * centred labels drew lines straight through the words.
 */
function Interpret() {
  const c = [
    { x: 170, items: ["Cadence", "Symmetry", "Variability", "Speed"], gap: 40 },
    { x: 390, items: ["Stride timing", "Left/right balance", "Consistency"], gap: 46 },
    { x: 560, items: ["Mobility profile", "Change vs baseline"], gap: 56 },
  ];
  const ny = (col: number, i: number) =>
    140 + (i - (c[col].items.length - 1) / 2) * c[col].gap;

  /* A documented mapping, not every-to-every: eighteen crossing edges read as
     spaghetti and said nothing. */
  const a2b: [number, number][] = [[0, 0], [1, 1], [2, 2], [3, 0]];
  const b2c: [number, number][] = [[0, 0], [1, 0], [2, 1], [0, 1]];
  const curve = (x1: number, y1: number, x2: number, y2: number) =>
    `M${x1} ${f1(y1)} C${x1 + 70} ${f1(y1)} ${x2 - 70} ${f1(y2)} ${x2} ${f1(y2)}`;

  return (
    <>
      <text className={styles.anno} x={158} y={52} textAnchor="end">
        Signals
      </text>
      <text className={styles.anno} x={390} y={52} textAnchor="middle">
        Features
      </text>
      <text className={styles.anno} x={574} y={52}>
        Intelligence
      </text>

      {a2b.map(([i, j]) => (
        <path
          key={`a${i}${j}`}
          className={styles.edge}
          d={curve(c[0].x + 7, ny(0, i), c[1].x - 7, ny(1, j))}
        />
      ))}
      {b2c.map(([i, j]) => (
        <path
          key={`b${i}${j}`}
          className={styles.edgeLit}
          d={curve(c[1].x + 7, ny(1, i), c[2].x - 7, ny(2, j))}
        />
      ))}

      {c[0].items.map((item, i) => (
        <g key={item}>
          <circle className={styles.mapNode} cx={c[0].x} cy={ny(0, i)} r={3.6} />
          <text
            className={styles.annoDim}
            x={c[0].x - 12}
            y={ny(0, i) + 3.5}
            textAnchor="end"
          >
            {item}
          </text>
        </g>
      ))}
      {c[1].items.map((item, i) => (
        <g key={item}>
          <circle className={styles.mapNode} cx={c[1].x} cy={ny(1, i)} r={3.6} />
          <text
            className={styles.annoDim}
            x={c[1].x}
            y={ny(1, i) - 11}
            textAnchor="middle"
          >
            {item}
          </text>
        </g>
      ))}
      {c[2].items.map((item, i) => (
        <g key={item}>
          <circle className={styles.mapNodeLit} cx={c[2].x} cy={ny(2, i)} r={5} />
          <text className={styles.readingLabel} x={c[2].x + 14} y={ny(2, i) + 4}>
            {item}
          </text>
        </g>
      ))}

      {/* The baseline this is read against is the same person's own history,
          shown as a position in a series rather than as invented values. */}
      <text className={styles.annoDim} x={64} y={278}>
        earlier sessions
      </text>
      <line className={styles.rowRule} x1={196} y1={274} x2={420} y2={274} />
      {[0, 1, 2, 3, 4].map((i) => (
        <circle
          key={i}
          className={i === 4 ? styles.mapNodeLit : styles.mapNode}
          cx={196 + i * 56}
          cy={274}
          r={i === 4 ? 4.5 : 3.2}
        />
      ))}
      <text className={styles.annoDim} x={436} y={278}>
        this walk, against its own history
      </text>
    </>
  );
}

/** 05 ACT — the structured output, using WalkScan's own documented outputs. */
function Act() {
  const walkscan = analyticsProducts.find((p) => p.id === "walkscan");
  const outputs = (walkscan?.outputs ?? []).slice(0, 5);
  /* The audiences are the module's own documented users, not an invented
     list — the same source the product pages read from. */
  const users = (walkscan?.users ?? []).slice(0, 3);

  return (
    <>
      <text className={styles.anno} x={64} y={46}>
        Structured output
      </text>
      {/* A rect, not brackets. Both together doubled every corner. */}
      <rect className={styles.frameLive} x={64} y={52} width={364} height={222} rx={2} />

      <text className={styles.readingLabel} x={82} y={80}>
        MobilityCare · {walkscan?.short ?? "WalkScan"}
      </text>
      <line className={styles.axis} x1={82} y1={92} x2={410} y2={92} />

      {outputs.map((output, i) => (
        <g key={output}>
          <circle className={styles.mapNodeLit} cx={88} cy={118 + i * 29} r={2.6} />
          <text className={styles.outputRow} x={104} y={122 + i * 29}>
            {output}
          </text>
          <line
            className={styles.rowRule}
            x1={82}
            y1={133 + i * 29}
            x2={410}
            y2={133 + i * 29}
          />
        </g>
      ))}

      <Arrow x1={442} x2={504} y={172} />

      <text className={styles.anno} x={520} y={126}>
        Reviewed by
      </text>
      {users.map((who, i) => (
        <text key={who} className={styles.audienceRow} x={520} y={158 + i * 26}>
          {who}
        </text>
      ))}
    </>
  );
}
