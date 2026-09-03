"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Play, X } from "lucide-react";
import { GAIT_PHASES, type Pt } from "@/components/visuals/gait-phases";
import { PoseFrame } from "@/components/research/PoseFrame";
import { IllustrativeBadge } from "@/components/ui/IllustrativeBadge";
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
 * canonical gait phases, and the badge sits in the modal header where it
 * cannot be scrolled away from. There is no number anywhere that could be
 * mistaken for a measurement of a real person: the readings are relative words
 * ("steady", "even", "narrowing"), never values, and the interpretation stage
 * compares the walk only against itself.
 *
 * ACCESSIBILITY. A real dialog: `aria-modal`, labelled by its own heading,
 * Escape closes it, focus moves to the panel on open and back to the trigger
 * on close, and the stage rail is a tablist reachable with arrow keys. With
 * reduced motion the stage still changes — only the transition is dropped.
 */

const STAGES = [
  { n: "01", id: "capture", name: "Capture", note: "A short walking clip" },
  { n: "02", id: "pose", name: "Pose", note: "Body landmarks per frame" },
  { n: "03", id: "measure", name: "Measure", note: "Stride segmented, features read" },
  { n: "04", id: "interpret", name: "Interpret", note: "Against this walk's own baseline" },
  { n: "05", id: "act", name: "Act", note: "A structured output for review" },
] as const;

export function TryGaitAI() {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState(0);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const railRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
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

      {open && (
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
            <header className={styles.head}>
              <div className="min-w-0">
                <p className={styles.eyebrow}>Movement intelligence, end to end</p>
                <h2 id="try-gaitai-title" className={styles.title}>
                  How a walk becomes intelligence
                </h2>
              </div>
              <div className={styles.headRight}>
                <IllustrativeBadge />
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
              aria-label="Demo stages"
              onKeyDown={onRailKey}
              className={styles.rail}
            >
              {STAGES.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={i === stage}
                  aria-controls="try-gaitai-stage"
                  tabIndex={i === stage ? 0 : -1}
                  onClick={() => setStage(i)}
                  className={`${styles.step} ${i === stage ? styles.stepOn : ""} ${
                    i < stage ? styles.stepDone : ""
                  }`}
                >
                  <span className={styles.stepN}>{item.n}</span>
                  <span className={styles.stepName}>{item.name}</span>
                </button>
              ))}
            </div>

            {/* ── the stage itself ── */}
            <div
              id="try-gaitai-stage"
              role="tabpanel"
              aria-label={STAGES[stage].name}
              className={styles.stage}
            >
              <div key={stage} className={styles.art}>
                <StageArt stage={stage} />
              </div>
              <p className={styles.note}>{STAGES[stage].note}</p>
            </div>

            <footer className={styles.foot}>
              <div className={styles.footNav}>
                <button
                  type="button"
                  onClick={() => setStage((s) => Math.max(s - 1, 0))}
                  disabled={stage === 0}
                  className={styles.navBtn}
                >
                  Back
                </button>
                {stage < STAGES.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setStage((s) => s + 1)}
                    className={`${styles.navBtn} ${styles.navPrimary}`}
                  >
                    Next stage
                    <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <Link href="/movement-lab/" className={`${styles.navBtn} ${styles.navPrimary}`}>
                    Continue in Movement Studio
                    <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
              <p className={styles.footNote}>
                Example values throughout. Research establishes the methodological
                foundation; product-specific validation establishes fitness for
                a particular use.
              </p>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}

/* ══ The five stages, drawn ══════════════════════════════════════════════
   One 520×260 viewBox each, so the panel never reflows between stages. */

const W = 520;
const H = 260;

function StageArt({ stage }: { stage: number }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} aria-hidden="true">
      {stage === 0 && <Capture />}
      {stage === 1 && <Pose />}
      {stage === 2 && <Measure />}
      {stage === 3 && <Interpret />}
      {stage === 4 && <Act />}
    </svg>
  );
}

/** 01 — frames arriving, the newest sharp. */
function Capture() {
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          className={i === 3 ? styles.frame : styles.frameGhost}
          x={92 + i * 26}
          y={62 + i * 4}
          width={188}
          height={124}
          rx={4}
        />
      ))}
      <g transform="translate(266 168)">
        <PoseFrame
          phase={GAIT_PHASES[2]}
          s={1.05}
          classes={{
            bone: styles.bone,
            boneFar: styles.boneFar,
            joint: styles.joint,
            head: styles.head,
          }}
        />
      </g>
      <line className={styles.axis} x1={92} y1={206} x2={370} y2={206} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line
          key={i}
          className={styles.hair}
          x1={104 + i * 52}
          y1={206}
          x2={104 + i * 52}
          y2={212}
        />
      ))}
      <text className={styles.tiny} x={92} y={50}>
        Frames
      </text>
      <text className={styles.tiny} x={92} y={228}>
        A few seconds of ordinary walking
      </text>
    </>
  );
}

/** 02 — landmarks and their connections on one frame. */
function Pose() {
  const phase = GAIT_PHASES[2];
  const joints: Pt[] = [...phase.nearArm, ...phase.nearLeg, [1.5, -34]];
  return (
    <>
      <rect className={styles.frame} x={150} y={40} width={220} height={168} rx={4} />
      <g transform="translate(258 186)">
        <PoseFrame
          phase={phase}
          s={1.35}
          classes={{
            bone: styles.boneLit,
            boneFar: styles.boneFar,
            joint: styles.jointLit,
            head: styles.head,
          }}
        />
        {/* landmark rings, so the points read as detections */}
        {joints.map(([x, y], i) => (
          <circle
            key={i}
            className={styles.landmark}
            cx={x * 1.35}
            cy={y * 1.35}
            r={5}
          />
        ))}
      </g>
      <text className={styles.tiny} x={150} y={30}>
        Body landmarks
      </text>
      <text className={styles.tiny} x={150} y={228}>
        Positions only — no appearance is kept
      </text>
    </>
  );
}

/** 03 — the stride segmented, with the features read off it. */
function Measure() {
  const pts: Pt[] = Array.from({ length: 60 }, (_, i) => {
    const t = i / 59;
    return [
      40 + t * 300,
      120 - Math.sin(t * Math.PI * 4) * 34 - Math.sin(t * Math.PI * 8 + 0.6) * 9,
    ];
  });
  const d = pts
    .map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");
  return (
    <>
      <path className={styles.trace} d={d} />
      <line className={styles.axis} x1={40} y1={158} x2={340} y2={158} />
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <line
            className={styles.sep}
            x1={40 + i * 75}
            y1={70}
            x2={40 + i * 75}
            y2={158}
          />
          <circle className={styles.event} cx={40 + i * 75} cy={158} r={3.4} />
        </g>
      ))}
      <text className={styles.tiny} x={40} y={182}>
        Strides segmented at heel strike
      </text>

      {/* the features, as words rather than invented numbers */}
      {[
        ["Cadence", "steady"],
        ["Step symmetry", "even"],
        ["Stride variability", "narrow"],
      ].map(([label, reading], i) => (
        <g key={label}>
          <text className={styles.tiny} x={372} y={82 + i * 42}>
            {label}
          </text>
          <text className={styles.reading} x={372} y={100 + i * 42}>
            {reading}
          </text>
        </g>
      ))}
      <text className={styles.tiny} x={40} y={44}>
        One stride, sampled
      </text>
    </>
  );
}

/** 04 — the same walk against its own earlier sessions. */
function Interpret() {
  const sessions = [0, 1, 2, 3, 4];
  return (
    <>
      <text className={styles.tiny} x={40} y={44}>
        This walk, over five sessions
      </text>
      {sessions.map((i) => {
        const ticks = Array.from({ length: 9 }, (_, k) => {
          const t = k / 8;
          const spread = 1 - i * 0.1;
          return 5 + Math.abs(Math.sin(t * Math.PI * 2 + i * 0.6)) * 17 * spread;
        });
        return (
          <g key={i}>
            <rect
              className={styles.sessionPanel}
              x={40 + i * 86}
              y={66}
              width={74}
              height={92}
              rx={3}
            />
            {ticks.map((h, k) => (
              <line
                key={k}
                className={i === 4 ? styles.dnaLit : styles.dna}
                x1={50 + i * 86 + k * 7}
                y1={112 - h / 2}
                x2={50 + i * 86 + k * 7}
                y2={112 + h / 2}
              />
            ))}
            <text className={styles.tiny} x={40 + i * 86} y={174}>
              {`0${i + 1}`}
            </text>
          </g>
        );
      })}
      <line className={styles.baseline} x1={40} y1={196} x2={468} y2={196} />
      <text className={styles.tiny} x={40} y={214}>
        Baseline is this person&apos;s own earlier walk
      </text>
      <text className={styles.reading} x={330} y={214}>
        variability narrowing
      </text>
    </>
  );
}

/** 05 — the structured output. */
function Act() {
  return (
    <>
      <rect className={styles.frame} x={60} y={44} width={400} height={168} rx={5} />
      <line className={styles.sep} x1={60} y1={76} x2={460} y2={76} />
      <text className={styles.tiny} x={76} y={66}>
        Movement report · illustrative
      </text>
      {[
        ["Cadence", "steady"],
        ["Step symmetry", "even"],
        ["Stride variability", "narrowing"],
        ["Trend vs baseline", "improving"],
      ].map(([label, reading], i) => (
        <g key={label}>
          <text className={styles.tiny} x={76} y={104 + i * 28}>
            {label}
          </text>
          <text className={styles.reading} x={300} y={104 + i * 28}>
            {reading}
          </text>
          <line
            className={styles.hair}
            x1={76}
            y1={112 + i * 28}
            x2={444}
            y2={112 + i * 28}
          />
        </g>
      ))}
      <text className={styles.tiny} x={60} y={234}>
        Relative readings, reviewed by a clinician — never a diagnosis
      </text>
    </>
  );
}
