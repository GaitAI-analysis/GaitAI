"use client";

import { useCallback, useId, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  BellRing,
  Check,
  ChevronRight,
  EyeOff,
  FileText,
  Gauge,
  HeartPulse,
  PersonStanding,
  Route,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  User,
  Video,
  Watch,
  Waves,
  X,
} from "lucide-react";
import {
  RepresentationFigure,
  type RepresentationDraw,
} from "./RepresentationFigure";
import {
  captureOutcomes,
  captureRepresentations,
  captureStages,
  type RepresentationId,
} from "@/data/capture-representations";
import styles from "./privacypipeline.module.css";

/**
 * CAPTURE MOVEMENT. PROTECT IDENTITY.
 * =============================================================================
 * The platform's privacy argument, drawn as the pipeline it is:
 *
 *   intro
 *   representation selector (five inputs, one rail)
 *   1 CAPTURE → 2 PRIVACY LAYER → 3 REPRESENTATION → 4 ENGINE → 5 OUTCOMES
 *   what we keep / what we reduce  ·  privacy vs utility
 *   one quiet CTA
 *
 * ── WHY IT IS FIVE CARDS AND NOT THREE COLUMNS ───────────────────────────
 * It was three tall panels — figure, privacy layer, engine+outcomes — with
 * the kept/reduced ledger as a fourth block underneath. Every fact was there
 * and the reading was wrong: three panels side by side say "three topics",
 * and the thing being described is one sequence. The outcomes column alone
 * ran taller than the figure it was supposed to follow from, and the section
 * came to about one and a half viewports before the ledger started.
 *
 * Five cards with arrows between them say the one thing the layout has to
 * say before any of the words are read: this happens, then this, then this.
 *
 * ── THE SELECTOR IS THE ONLY CONTROL, AND IT DRIVES THE FLOW ─────────────
 * Choosing an input changes three of the five cards — which device is lit in
 * CAPTURE, what the PRIVACY LAYER is transforming, and what REPRESENTATION
 * draws — plus both lower panels. Stages 4 and 5 are deliberately constant:
 * which representation a task needs is a deployment decision, and lighting
 * different outcomes per representation would be a capability claim this
 * repository cannot support.
 *
 * Camera Video is the exception worth naming: its REPRESENTATION card draws a
 * pose skeleton, captioned as an example view. The card's question is "what
 * does this become", and for a raw frame the answer is one of the privacy-
 * aware representations — showing the frame again would say nothing.
 *
 * ── FIVE REPRESENTATIONS, FIVE DIFFERENT KINDS OF PICTURE ────────────────
 * The drawings live in `RepresentationFigure`, and the reason they are not
 * the site's shared gait keyframes any more is the argument this section is
 * making. Those keyframes are one stick figure; rendered at three opacities
 * the camera frame, the silhouette and the skeleton came out as three
 * versions of the same mannequin, so a visitor could see the label change
 * and not the data change.
 *
 * Each one is now recognisable as the thing it is: a tonal figure inside
 * camera furniture, a flat foreground mask, landmarks and bones at the
 * joints a pose estimator reports, a hip centroid with its history, and —
 * with no body at all — three accelerometer channels. All five are authored
 * from one landmark set, so it is still visibly one walk losing information.
 * See the header of that file, including the note on provenance.
 *
 * ── WHAT IT IS FORBIDDEN FROM CLAIMING ───────────────────────────────────
 * Not anonymity. Not a measurement — the two meters are relative shapes with
 * no scale and no printed figure, asserting only an ordering. Not a product
 * specification. See data/capture-representations.ts, which carries the full
 * reasoning, and note that the OUTCOMES card is captioned with what it
 * produces rather than with "insights without identity".
 *
 * ── ACCESSIBILITY ────────────────────────────────────────────────────────
 * The selector is a real tablist: five `role="tab"` buttons, one tab stop,
 * arrows and Home/End to move, `aria-selected` and `aria-controls` pointing
 * at the ledger panel. Each figure is `role="img"` with a label naming what
 * it draws. The meters are a description list — a term, a word, and a bar
 * that is `aria-hidden` because the word beside it is the accessible value.
 * The arrows between cards are decorative and hidden.
 */

/** The input devices beside the capture frame, one of them live. */
const INPUTS = [
  { id: "camera", Icon: Video, label: "Camera" },
  { id: "wearable", Icon: Watch, label: "Wearable" },
  { id: "phone", Icon: Smartphone, label: "Phone" },
] as const;

/** The selector's icons, in `captureRepresentations` order. */
const REP_ICONS = [Video, User, PersonStanding, Route, Waves] as const;

/** The engine's layers, outermost first. Named processes, not products. */
const ENGINE_LAYERS = [
  "Feature extraction",
  "Temporal modelling",
  "Multi-task inference",
  "Privacy-aware analytics",
];

/** One icon per outcome, in `captureOutcomes` order. */
const OUTCOME_ICONS = [TrendingUp, Gauge, FileText, HeartPulse, BellRing, EyeOff];

/** Which illustration the REPRESENTATION card draws for a given selection. */
const REPRESENTATION_DRAW: Record<RepresentationId, { draw: RepresentationDraw; caption: string }> = {
  /* A raw frame's representation is one of the privacy-aware forms, not the
     frame again — so Camera Video shows the pose skeleton as an example. */
  capture: { draw: "pose", caption: "Pose skeleton (example view)" },
  silhouette: { draw: "silhouette", caption: "Body outline (silhouette)" },
  pose: { draw: "pose", caption: "Pose skeleton (keypoints)" },
  trajectory: { draw: "trajectory", caption: "Path through space" },
  sensor: { draw: "sensor", caption: "Wearable motion signal" },
};

export function PrivacyPipeline() {
  const [active, setActive] = useState<RepresentationId>("pose");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const baseId = useId();
  const tabId = (id: RepresentationId) => `${baseId}-tab-${id}`;
  const panelId = `${baseId}-ledger`;

  /*
   * THE LOWER ROW IS BEHIND ONE DISCLOSURE, closed on arrival.
   *
   * The figure, the five stages and the outcomes are the section's argument;
   * the ledger and the two meters are the detail behind it, and they cost a
   * screen. Closed, the section ends on a compact header that names what is
   * inside it.
   *
   * CHOOSING A REPRESENTATION OPENS IT. The ledger is the tablist's
   * `tabpanel`: a selected tab whose panel is collapsed is a control that
   * appears to do nothing and, to a screen reader, points `aria-controls` at
   * something not being presented. So a tab press opens the row. The default
   * is still closed, because on arrival nothing has been chosen.
   */
  const [detailOpen, setDetailOpen] = useState(false);
  const detailHeadId = `${baseId}-detail-head`;
  const detailRegionId = `${baseId}-detail`;

  const index = captureRepresentations.findIndex((r) => r.id === active);
  const rep = captureRepresentations[index] ?? captureRepresentations[0];
  /* A wearable signal does not come from a camera, so the capture card stops
     drawing one the moment that is the selected input. */
  const fromSensor = active === "sensor";
  const representation = REPRESENTATION_DRAW[active];

  const move = useCallback((from: number, step: number) => {
    const next =
      (from + step + captureRepresentations.length) % captureRepresentations.length;
    setActive(captureRepresentations[next].id);
    setDetailOpen(true);
    tabRefs.current[next]?.focus();
  }, []);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent, at: number) => {
      const key = event.key;
      if (key === "ArrowRight" || key === "ArrowDown") {
        event.preventDefault();
        move(at, 1);
      } else if (key === "ArrowLeft" || key === "ArrowUp") {
        event.preventDefault();
        move(at, -1);
      } else if (key === "Home") {
        event.preventDefault();
        move(0, 0);
      } else if (key === "End") {
        event.preventDefault();
        move(captureRepresentations.length - 1, 0);
      }
    },
    [move],
  );

  const stage = (i: number) => captureStages[i];

  /** A card, so the five share one shape and one set of spacings. */
  const Stage = ({
    at,
    live = false,
    draw,
    children,
    foot,
  }: {
    at: number;
    live?: boolean;
    draw?: string;
    children: ReactNode;
    foot?: string;
  }) => (
    <div className={styles.stage} data-live={live} data-draw={draw}>
      <div className={styles.stageHead}>
        <span className={styles.stageStep}>{stage(at).step}.</span>
        <span className={styles.stageLabel}>{stage(at).label}</span>
      </div>
      <p className={styles.stageNote}>{stage(at).note}</p>
      <div className={styles.stageBody}>{children}</div>
      {foot ? <p className={styles.stageFoot}>{foot}</p> : null}
    </div>
  );

  const Arrow = () => (
    <span aria-hidden="true" className={styles.arrow}>
      <ChevronRight size={22} strokeWidth={2.5} />
    </span>
  );

  return (
    <section
      id="privacy"
      aria-labelledby={`${baseId}-title`}
      className={`home-section section ${styles.section}`}
    >
      <div className="container-wide">
        {/* ═══ 1 · INTRO ═══════════════════════════════════════════════ */}
        <div className={styles.intro}>
          <p className={styles.eyebrow}>
            <span aria-hidden="true" className={styles.eyebrowRule} />
            Privacy-preserving movement intelligence
          </p>
          <h2 id={`${baseId}-title`} className={styles.title}>
            Capture movement.{" "}
            <span className="text-gradient">Protect identity.</span>
          </h2>
          <p className={styles.lead}>
            GaitAI does not always need the full visual identity of a person.
            Depending on the task, movement can be interpreted through
            privacy-aware representations such as silhouettes, pose structure,
            trajectories or wearable signals — preserving what the system needs
            while reducing what it does not.
          </p>
        </div>

        {/* ═══ 2 · THE SELECTOR ════════════════════════════════════════ */}
        <div className={styles.selectorRow}>
          <div
            role="tablist"
            aria-label="Movement representation"
            className={styles.selector}
          >
            {captureRepresentations.map((option, i) => {
              const on = option.id === active;
              const Icon = REP_ICONS[i];
              return (
                <button
                  key={option.id}
                  ref={(node) => {
                    tabRefs.current[i] = node;
                  }}
                  type="button"
                  role="tab"
                  id={tabId(option.id)}
                  aria-selected={on}
                  aria-controls={panelId}
                  tabIndex={on ? 0 : -1}
                  onClick={() => {
                    setActive(option.id);
                    setDetailOpen(true);
                  }}
                  onKeyDown={(event) => onKeyDown(event, i)}
                  data-on={on}
                  className={styles.option}
                >
                  <Icon aria-hidden="true" size={17} className={styles.optionIcon} />
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
          <p className={styles.selectorHint}>
            Select an input type to see how we protect identity and extract
            movement intelligence.
          </p>
        </div>

        {/* ═══ 3 · THE FIVE STAGES ═════════════════════════════════════ */}
        <div className={styles.flow} data-rep={active}>
          {/* 1 · CAPTURE */}
          <Stage
            at={0}
            foot={
              fromSensor
                ? "Wearable motion stream (for illustration)"
                : "Raw video frame (for illustration)"
            }
          >
            <span aria-hidden="true" className={styles.inputs}>
              {INPUTS.map(({ id, Icon }) => (
                <span
                  key={id}
                  className={styles.input}
                  data-on={fromSensor ? id === "wearable" : id === "camera"}
                >
                  <Icon size={15} />
                </span>
              ))}
            </span>
            <RepresentationFigure className={styles.figureWrap}
              draw={fromSensor ? "sensor" : "frame"}
              label={
                fromSensor
                  ? "A wearable motion signal, as captured."
                  : "A walking person in a room, as a camera records them."
              }
            />
          </Stage>

          <Arrow />

          {/* 2 · PRIVACY LAYER */}
          <Stage
            at={1}
            draw="privacy"
            foot="Identity detail reduced. Task-relevant motion retained."
          >
            <RepresentationFigure className={styles.figureWrap}
              draw={fromSensor ? "sensor" : "silhouette"}
              label={
                fromSensor
                  ? "The same signal, carrying no camera image."
                  : "The same walk with facial and clothing detail gone."
              }
            />
            <span aria-hidden="true" className={styles.shieldMark}>
              <ShieldCheck size={18} />
            </span>
          </Stage>

          <Arrow />

          {/* 3 · REPRESENTATION — the card the selector drives. */}
          <Stage at={2} live foot={representation.caption}>
            <RepresentationFigure className={styles.figureWrap}
              draw={representation.draw}
              label={`The same walk drawn as: ${rep.label}. ${rep.lead}`}
            />
          </Stage>

          <Arrow />

          {/* 4 · MOVEMENT ENGINE */}
          <Stage at={3}>
            <div aria-hidden="true" className={styles.engineStack}>
              {ENGINE_LAYERS.map((layer) => (
                <span key={layer} className={styles.engineLayer}>
                  {layer}
                </span>
              ))}
            </div>
            <span className="sr-only">
              Feature extraction, temporal modelling, multi-task inference and
              privacy-aware analytics.
            </span>
          </Stage>

          <Arrow />

          {/* 5 · OUTCOMES */}
          <Stage at={4}>
            <ul className={styles.outcomes}>
              {captureOutcomes.map((outcome, i) => {
                const Icon = OUTCOME_ICONS[i] ?? BarChart3;
                return (
                  <li key={outcome.title} className={styles.outcome}>
                    <Icon aria-hidden="true" size={14} className={styles.outcomeIcon} />
                    {outcome.title}
                  </li>
                );
              })}
            </ul>
          </Stage>
        </div>

        {/* ═══ 4 · THE LOWER ROW, BEHIND ONE DISCLOSURE ════════════════ */}
        <div className={styles.detail}>
          <button
            type="button"
            id={detailHeadId}
            aria-expanded={detailOpen}
            aria-controls={detailRegionId}
            onClick={() => setDetailOpen((value) => !value)}
            data-open={detailOpen}
            className={styles.detailHead}
          >
            <span className={styles.detailCopy}>
              {/* Named after the representation on screen, not hardcoded to
                  the raw frame: the row's contents change with the selector,
                  and a header that always said RAW FRAME would be wrong in
                  four states out of five. */}
              <span className={styles.detailTitle}>
                {/* The spaces are written out because the dot is hidden from
                    the accessibility tree, and without them the button's
                    accessible name runs the two halves together. */}
                {rep.label}{" "}
                <span aria-hidden="true" className={styles.detailDot}>
                  ·
                </span>{" "}
                Privacy &amp; utility
              </span>
              <span className={styles.detailSub}>
                What this representation keeps, and what it reduces
              </span>
            </span>
            <span aria-hidden="true" className={styles.detailMark} />
          </button>

          <div
            id={detailRegionId}
            role="region"
            aria-labelledby={detailHeadId}
            data-open={detailOpen}
            className={styles.collapse}
          >
            <div className={styles.collapseInner}>
        <div className={styles.lower}>
          {/* The ledger. The panel the tablist controls — and the home of the
              lead sentence that used to be a full-width block of its own. */}
          <div
            id={panelId}
            role="tabpanel"
            aria-labelledby={tabId(rep.id)}
            className={styles.panel}
          >
            <p className={styles.ledgerLead}>{rep.lead}</p>
            <div className={styles.columns}>
              <section className={styles.column} data-kind="kept">
                <h3 className={styles.columnHead}>
                  <Check aria-hidden="true" size={15} className={styles.tick} />
                  What we keep
                </h3>
                <ul>
                  {rep.kept.map((item) => (
                    <li key={item}>
                      <Check aria-hidden="true" size={13} className={styles.tick} />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              <section className={styles.column} data-kind="reduced">
                <h3 className={styles.columnHead}>
                  <X aria-hidden="true" size={15} className={styles.cross} />
                  What we reduce or remove
                </h3>
                {rep.reduced.length > 0 ? (
                  <ul>
                    {rep.reduced.map((item) => (
                      <li key={item}>
                        <X aria-hidden="true" size={13} className={styles.cross} />
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.columnEmpty}>
                    Nothing yet — this is the frame before any reduction.
                  </p>
                )}
              </section>
            </div>
          </div>

          {/* Privacy vs utility. Qualitative by design: the words are the
              value and the bars carry no scale, no axis and no figure,
              because no such measurement exists. */}
          <div className={styles.panel}>
            <p className={styles.pvuHead}>
              <BarChart3 aria-hidden="true" size={16} className={styles.outcomeIcon} />
              Privacy vs. utility
            </p>
            <div className={styles.pvu}>
              <dl className={styles.meters}>
                <div className={styles.meter}>
                  <dt>Identity detail</dt>
                  <dd>
                    <span className={styles.meterWord}>{rep.identityLabel}</span>
                    <span aria-hidden="true" className={styles.meterTrack}>
                      <span
                        className={`${styles.meterFill} ${styles.meterFillIdentity}`}
                        style={{ transform: `scaleX(${rep.retainedIdentity})` }}
                      />
                    </span>
                  </dd>
                </div>
                <div className={styles.meter}>
                  <dt>Movement detail</dt>
                  <dd>
                    <span className={styles.meterWord}>{rep.movementLabel}</span>
                    <span aria-hidden="true" className={styles.meterTrack}>
                      <span
                        className={`${styles.meterFill} ${styles.meterFillMotion}`}
                        style={{ transform: `scaleX(${rep.movementDetail})` }}
                      />
                    </span>
                  </dd>
                </div>
              </dl>

              <p className={styles.principle}>
                The task decides the representation. Privacy is designed into
                the pipeline.
              </p>
            </div>
          </div>
        </div>

            </div>
          </div>
        </div>

        {/* ═══ 5 · THE CTA ═════════════════════════════════════════════ */}
        <div className={styles.foot}>
          <Link href="/movement-lab/" className={styles.cta}>
            Explore how GaitAI works
            <ArrowUpRight aria-hidden="true" size={16} />
          </Link>
          <span className={styles.strap}>
            From movement to a safer, healthier, more inclusive world.
          </span>
        </div>
      </div>
    </section>
  );
}
