"use client";

import { useCallback, useId, useRef, useState } from "react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PoseSilhouette } from "@/components/visuals/PoseSilhouette";
import { PoseFrame, smoothPath } from "@/components/research/PoseFrame";
import { GAIT_PHASES, GAIT_HEAD, type Pt } from "@/components/visuals/gait-phases";
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
 * The platform's privacy argument, made as an instrument rather than a
 * paragraph. One walk, five representations of it, and — for each — what the
 * representation still carries and what it has stopped carrying.
 *
 * ── WHY THIS IS NOT THE WORKFLOW SECTION AGAIN ───────────────────────────
 * The home page already has two pipelines and does not need a third. The
 * workflow section answers "what happens to movement" (capture → understand →
 * report → act) and the capture-chain teaser answers "what can this input
 * tell me" (signal → measurements → intelligence → modules). Neither asks the
 * question this section exists for: HOW MUCH OF THE PERSON DOES ANY OF IT
 * NEED?
 *
 * So the five stage captions are labels on the three areas of ONE diagram,
 * not a second rail a visitor can drive. The only thing that moves here is
 * the representation, because the representation is the whole argument. If
 * this section ever grows its own interactive pipeline, it has become the
 * workflow section and one of the two should go.
 *
 * ── ONE FIGURE, FIVE STATES, NO RELOAD ───────────────────────────────────
 * Every rendering stays mounted over the same body and cross-fades. Watching
 * the SAME person become an outline, then joints, then a line through space
 * is the argument; five pictures side by side would only assert it, and a
 * reflow between them would break it. The poses are the site's shared gait
 * keyframes (`visuals/gait-phases`), so the walker here is anatomically the
 * same walker the research pages and the privacy lens draw — no limb is
 * placed by a transform and nothing is invented for this section.
 *
 * The silhouette and the skeleton are the existing `PoseSilhouette` and
 * `PoseFrame` renderers, given this module's class names. The trajectory's
 * node spacing is the real per-phase stride offset, and the sensor trace is
 * derived from the same keyframes' pelvic lift — so even the waveform is this
 * walk rather than decoration. Both are computed, never random, because a
 * random path would differ between the server and the client render.
 *
 * ── WHAT IT IS FORBIDDEN FROM CLAIMING ───────────────────────────────────
 * Not anonymity. Not a measurement — both meters are relative shapes with no
 * scale and no printed figure, asserting only an ordering. Not a product
 * specification — no module is named as running any representation. See
 * data/capture-representations.ts, which carries the full reasoning.
 *
 * ── THE SECTION ENDS AT THE LEDGER ───────────────────────────────────────
 * It used to close with a principle line, three links out and a boundary
 * paragraph. All three are gone: the links repeated destinations the page
 * already offers above and below this point, and the closing text turned the
 * instrument back into the paragraph it was built to replace. Nothing carried
 * spacing of its own beyond its top margin, so the section now ends on the
 * ledger and the next section follows on the page's normal rhythm.
 *
 * ── ACCESSIBILITY ────────────────────────────────────────────────────────
 * The selector is a real tablist: five `role="tab"` buttons, one tab stop,
 * arrows and Home/End to move, `aria-selected` and `aria-controls` pointing
 * at the panel the ledger lives in. The figure is `role="img"` with a label
 * that names the current representation, so it announces as a picture of
 * something rather than as decorative SVG. The meters are `<meter>`-shaped
 * markup — a term, a word, and a bar that is `aria-hidden` because the word
 * beside it is the accessible value.
 */

/* The figure's box. Taller than it is wide, because the subject is a standing
   human and the panel it sits in is a column — a landscape box left the figure
   stranded in the middle of it at a fraction of the available height. */
const W = 320;
const H = 300;
const FIG_X = 160;
const FIG_Y = 208;
const S = 2.05;

/**
 * HEEL STRIKE, not mid-stance.
 *
 * The privacy lens uses mid-stance because it is the most legible SINGLE
 * pose — the limbs overlap least against a busy stage. Here the figure has to
 * read as somebody WALKING at a glance, and at mid-stance the legs are
 * directly under the pelvis: drawn small, that silhouette is a person
 * standing still. Heel strike is the moment of maximum stride separation, so
 * the walk is legible even in the skeleton's thin strokes.
 */
const PHASE = GAIT_PHASES[0];

/**
 * The path through the space, at the stride spacing this walk actually has.
 *
 * The first version plotted the ankle's own y as well, which is flat by
 * definition — a foot stays on the floor — so the trajectory drew a ruler
 * lying on the ground and read as nothing at all. What a trajectory means
 * here is where somebody went, seen across a room, so the line rises into
 * depth while the SPACING between its nodes stays the real per-phase stride
 * offset. The rhythm is the data; the recession is the drawing.
 */
const TRAIL: Pt[] = GAIT_PHASES.map((phase, i) => {
  const t = i / (GAIT_PHASES.length - 1);
  return [
    44 + t * (W - 118) + phase.nearLeg[2][0] * 0.45,
    FIG_Y - 10 - t * 116 + Math.sin(t * Math.PI) * 18,
  ] as Pt;
});

/**
 * The sensor trace, computed from the keyframes' pelvic lift.
 *
 * A walk's vertical oscillation is what an IMU on the trunk actually reads,
 * so the trace is that curve repeated across the box rather than a decorative
 * squiggle. Deterministic by construction: the same input produces the same
 * path on the server and in the browser.
 */
const SENSOR_PATH = (() => {
  const points: Pt[] = [];
  const cycles = 3;
  const samples = GAIT_PHASES.length * cycles;
  for (let i = 0; i <= samples; i += 1) {
    const phase = GAIT_PHASES[i % GAIT_PHASES.length];
    const x = 30 + (i / samples) * (W - 60);
    /* Lift is a drop below the high point, so it is negated to read as a
       rise; the second term is the step-rate ripple the same data implies. */
    const y =
      FIG_Y -
      62 -
      (1.5 - phase.lift) * 15 -
      Math.sin((i / GAIT_PHASES.length) * Math.PI * 2) * 9;
    points.push([x, y]);
  }
  return smoothPath(points);
})();

const SILHOUETTE_CLASSES = {
  group: styles.mass,
  torso: styles.massTorso,
  limb: styles.massLimb,
  limbLeg: styles.massLimbLeg,
  head: styles.massHead,
};

const POSE_CLASSES = {
  bone: styles.bone,
  boneFar: styles.boneFar,
  joint: styles.joint,
  head: styles.poseHead,
  contact: styles.contact,
};

export function PrivacyPipeline() {
  const [active, setActive] = useState<RepresentationId>("pose");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const baseId = useId();
  const tabId = (id: RepresentationId) => `${baseId}-tab-${id}`;
  const panelId = `${baseId}-ledger`;

  const index = captureRepresentations.findIndex((r) => r.id === active);
  const rep = captureRepresentations[index] ?? captureRepresentations[0];

  const move = useCallback((from: number, step: number) => {
    const next =
      (from + step + captureRepresentations.length) % captureRepresentations.length;
    setActive(captureRepresentations[next].id);
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

  /* The three areas carry the five stage captions between them. */
  const stage = (i: number) => captureStages[i];

  return (
    <section
      id="privacy"
      aria-labelledby={`${baseId}-title`}
      className={`home-section section ${styles.section}`}
    >
      <div className="container-wide">
        <SectionHeading
          eyebrow="Privacy-aware capture"
          title={
            <span id={`${baseId}-title`}>
              Capture movement.{" "}
              <span className="text-gradient">Protect identity.</span>
            </span>
          }
          description="GaitAI does not always need the full visual identity of a person. Depending on the task, movement can be interpreted through privacy-aware representations such as silhouettes, pose structure, trajectories or wearable signals — preserving what the system needs while reducing what it does not."
          size="lg"
        />

        {/* ── THE SELECTOR ── the one thing in this section that moves. */}
        <div
          role="tablist"
          aria-label="Movement representation"
          className={styles.selector}
        >
          {captureRepresentations.map((option, i) => {
            const on = option.id === active;
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
                onClick={() => setActive(option.id)}
                onKeyDown={(event) => onKeyDown(event, i)}
                data-on={on}
                className={styles.option}
              >
                <span aria-hidden="true" className={styles.optionDot} />
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>

        <div className={styles.diagram} data-rep={active}>
          {/* ── LEFT · 01 CAPTURE ─────────────────────────────────────── */}
          <figure className={styles.capture}>
            <figcaption className={styles.areaHead}>
              <span className={styles.areaStep}>{stage(0).step}</span>
              <span className={styles.areaLabel}>{stage(0).label}</span>
              <span className={styles.areaNote}>{stage(0).note}</span>
            </figcaption>

            <div
              role="img"
              aria-label={`The same walk drawn as: ${rep.label}. ${rep.lead}`}
              className={styles.figureWrap}
            >
              <svg
                viewBox={`0 0 ${W} ${H}`}
                preserveAspectRatio="xMidYMid meet"
                className={styles.figure}
                aria-hidden="true"
              >
                {/* The recording frame — corner ticks only, present for raw
                    capture and gone the moment the image is left behind. */}
                <g className={styles.frameTicks} data-on={active === "capture"}>
                  {[
                    [16, 16, 1, 1],
                    [W - 16, 16, -1, 1],
                    [16, H - 16, 1, -1],
                    [W - 16, H - 16, -1, -1],
                  ].map(([x, y, dx, dy]) => (
                    <path
                      key={`${x}-${y}`}
                      d={`M${x} ${y + dy * 14}L${x} ${y}L${x + dx * 14} ${y}`}
                    />
                  ))}
                </g>

                {/* The scene — a room, stated in four lines: the wall/floor
                    join, two receding floor edges and one doorway. Only raw
                    capture has one; every representation after it has already
                    discarded the background, which is the point. */}
                <g className={styles.scene} data-on={active === "capture"}>
                  <path d={`M28 ${FIG_Y - 74}H${W - 28}`} />
                  <path d={`M28 ${H - 26}L96 ${FIG_Y - 74}`} />
                  <path d={`M${W - 28} ${H - 26}L${W - 96} ${FIG_Y - 74}`} />
                  <path
                    d={`M${W - 92} ${FIG_Y - 74}v-46h34v46`}
                    className={styles.sceneDoor}
                  />
                </g>

                <path className={styles.ground} d={`M28 ${FIG_Y + 5}H${W - 28}`} />

                {/* 01 · FULL CAPTURE and 02 · SILHOUETTE are the same body at
                    two densities: the first with appearance detail sitting on
                    it, the second with the detail gone. */}
                <g
                  className={styles.layer}
                  data-on={active === "capture" || active === "silhouette"}
                  transform={`translate(${FIG_X} ${FIG_Y})`}
                >
                  <PoseSilhouette phase={PHASE} s={S} classes={SILHOUETTE_CLASSES} />
                </g>

                <g
                  className={styles.appearance}
                  data-on={active === "capture"}
                  transform={`translate(${FIG_X} ${FIG_Y})`}
                >
                  {/* Face and clothing detail, stated as marks rather than
                      drawn as a face: the point is that something identifying
                      is present, not what it looks like. */}
                  <circle cx={GAIT_HEAD[0] * S - 2} cy={GAIT_HEAD[1] * S - 1} r={1.5} />
                  <circle cx={GAIT_HEAD[0] * S + 3} cy={GAIT_HEAD[1] * S - 1} r={1.5} />
                  <path d={`M${GAIT_HEAD[0] * S - 3} ${GAIT_HEAD[1] * S + 4}q3 2 6 0`} />
                  <path d={`M${-6 * S} ${-30 * S}h${14 * S}`} />
                  <path d={`M${-5 * S} ${-24 * S}h${11 * S}`} />
                  <path d={`M${-4 * S} ${-18 * S}h${9 * S}`} />
                </g>

                {/* 03 · POSE */}
                <g
                  className={styles.layer}
                  data-on={active === "pose"}
                  transform={`translate(${FIG_X} ${FIG_Y})`}
                >
                  <PoseFrame phase={PHASE} s={S} classes={POSE_CLASSES} showContacts />
                </g>

                {/* 04 · TRAJECTORY — the real ankle path, and the footfalls
                    that produced it. */}
                <g className={styles.layer} data-on={active === "trajectory"}>
                  {/* The floor the path crosses, so the line reads as depth
                      rather than as a graph. */}
                  <path
                    className={styles.trailFloor}
                    d={`M30 ${H - 34}L${W - 116} ${FIG_Y - 126}`}
                  />
                  <path
                    className={styles.trailFloor}
                    d={`M${W - 30} ${H - 60}L${W - 92} ${FIG_Y - 126}`}
                  />
                  <path className={styles.trail} d={smoothPath(TRAIL)} />
                  {TRAIL.map(([x, y], i) => (
                    <g key={x}>
                      {i === 2 && (
                        <circle className={styles.trailDwell} cx={x} cy={y} r={9} />
                      )}
                      <circle
                        className={styles.trailNode}
                        cx={x}
                        cy={y}
                        r={i === 2 ? 4 : 2.8}
                      />
                    </g>
                  ))}
                  <path
                    className={styles.trailArrow}
                    d={`M${TRAIL[4][0] + 11} ${TRAIL[4][1] - 5}l-11 -3 4 9z`}
                  />
                </g>

                {/* 05 · SENSOR — the trunk's vertical oscillation, which is
                    what an IMU on a walking body actually reads. */}
                <g className={styles.layer} data-on={active === "sensor"}>
                  <path className={styles.axis} d={`M28 ${FIG_Y - 28}H${W - 28}`} />
                  <path className={styles.wave} d={SENSOR_PATH} />
                  <g className={styles.device}>
                    <rect x={FIG_X - 13} y={FIG_Y + 18} width={26} height={20} rx={6} />
                    <path d={`M${FIG_X - 5} ${FIG_Y + 28}h10`} />
                  </g>
                </g>
              </svg>
            </div>
          </figure>

          {/* ── CENTRE · 02 REDUCE · 03 REPRESENT ─────────────────────── */}
          <div className={styles.middle}>
            <div className={styles.areaHead}>
              <span className={styles.areaStep}>
                {stage(1).step}–{stage(2).step}
              </span>
              <span className={styles.areaLabel}>
                {stage(1).label} · {stage(2).label}
              </span>
              <span className={styles.areaNote}>{stage(2).note}</span>
            </div>

            {/* Shield and meters travel together as one block, centred in
                whatever height the tallest column gives this one. Pinned to
                the top they left 250px of nothing underneath; pinned to the
                bottom the gap merely moved above them. */}
            <div className={styles.middleBody}>
            {/* The privacy layer: the thing the capture passes through. */}
            <div className={styles.shield}>
              <span aria-hidden="true" className={styles.shieldBeam} />
              <span className={styles.shieldTitle}>
                Minimum necessary representation
              </span>
              <span className={styles.shieldNote}>{stage(1).note}</span>
            </div>

            {/* Two relative meters. No scale, no number — see the data file. */}
            <dl className={styles.meters}>
              <div className={styles.meter}>
                <dt>Visual identity retained</dt>
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
                <dt>Movement detail retained</dt>
                <dd>
                  <span className={styles.meterWord}>
                    {rep.movementDetail >= 0.9
                      ? "High"
                      : rep.movementDetail >= 0.55
                        ? "Substantial"
                        : "Task-scoped"}
                  </span>
                  <span aria-hidden="true" className={styles.meterTrack}>
                    <span
                      className={`${styles.meterFill} ${styles.meterFillMotion}`}
                      style={{ transform: `scaleX(${rep.movementDetail})` }}
                    />
                  </span>
                </dd>
              </div>
            </dl>
            </div>
          </div>

          {/* ── RIGHT · 04 PROCESS · 05 OUTPUT ────────────────────────── */}
          <div className={styles.right}>
            <div className={styles.areaHead}>
              <span className={styles.areaStep}>
                {stage(3).step}–{stage(4).step}
              </span>
              <span className={styles.areaLabel}>
                {stage(3).label} · {stage(4).label}
              </span>
              <span className={styles.areaNote}>{stage(3).note}</span>
            </div>

            <div className={styles.engine}>
              <span aria-hidden="true" className={styles.engineCore} />
              <span className={styles.engineTitle}>Movement engine</span>
              <span className={styles.engineNote}>
                Feature extraction, modelling, inference
              </span>
            </div>

            <ul className={styles.outcomes} aria-label="Outputs">
              {captureOutcomes.map((outcome) => (
                <li key={outcome.title} className={styles.outcome}>
                  <span className={styles.outcomeTitle}>{outcome.title}</span>
                  <span className={styles.outcomeNote}>{outcome.note}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── THE LEDGER ── what this representation keeps, and what it
            has stopped carrying. The panel the tablist controls. */}
        <div
          id={panelId}
          role="tabpanel"
          aria-labelledby={tabId(rep.id)}
          className={styles.ledger}
        >
          <p className={styles.ledgerLead}>{rep.lead}</p>
          <div className={styles.columns}>
            <section className={styles.column} data-kind="kept">
              <h3 className={styles.columnHead}>Kept</h3>
              <ul>
                {rep.kept.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
            <section className={styles.column} data-kind="reduced">
              <h3 className={styles.columnHead}>Reduced or removed</h3>
              {rep.reduced.length > 0 ? (
                <ul>
                  {rep.reduced.map((item) => (
                    <li key={item}>{item}</li>
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
      </div>
    </section>
  );
}
