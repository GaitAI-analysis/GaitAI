import Link from "next/link";
import {
  GAIT_NECK,
  GAIT_PHASES,
  type Pt,
} from "@/components/visuals/gait-phases";
import styles from "./observatory.module.css";

/**
 * Where the record ends and the platform begins — five stages on one signal.
 *
 * The stage copy is unchanged from the chain this replaces, including which
 * two ends are emphasised: the research foundation and the output a clinician
 * or operator actually reviews. The middle three are the platform's, not the
 * record's, which is the distinction the whole page is built around.
 *
 * Each stage carries a glyph of the thing it operates on, drawn to be read
 * rather than decoded — a stacked publication with its grant seal, a walking
 * figure over its stride timing, several inputs merging into one intelligence
 * layer, a processor with its signal entering and leaving, a review panel with
 * its chart and status marker. Every glyph is an inline hairline drawing in the
 * page's own language (no icon set, no fills beyond a 1.5px node), sized to the
 * same ±12 unit box, at the same 1.1–1.2 stroke weight, so the row reads as one
 * instrument and the sequence research → signals → fusion → edge AI → outputs
 * is legible before any of the copy below it.
 */

const chain = [
  {
    label: "Research foundation",
    /** The micro-label on the diagram itself: one word for the stage. */
    short: "Research",
    detail: "Peer-reviewed methods and the granted patent.",
    strong: true,
    glyph: "publication" as const,
  },
  {
    label: "Movement representations",
    short: "Signals",
    detail: "Pose, gait features and temporal signals extracted from capture.",
    strong: false,
    glyph: "gait" as const,
  },
  {
    label: "Platform capabilities",
    short: "Fusion",
    detail: "The shared capability layer the products draw on.",
    strong: false,
    glyph: "fusion" as const,
  },
  {
    label: "Product-specific models",
    short: "Edge AI",
    detail: "Tuned per product and per environment.",
    strong: false,
    glyph: "edge" as const,
  },
  {
    label: "Reports · dashboards · alerts",
    short: "Outputs",
    detail: "What a clinician or operator actually reviews.",
    strong: true,
    glyph: "dashboard" as const,
  },
];

const W = 1000;
const H = 116;
const STAGE_X = [100, 300, 500, 700, 900];
const RAIL_Y = 54;
/** Baseline of the micro-label, clear of the r=26 node. */
const LABEL_Y = 99;

/* Every glyph is drawn in the same local ±12 box around the node centre, with
   `stroke="currentColor"` inherited from the group so the stage's tone (mute,
   or cyan on the two emphasised ends) carries the whole drawing. */
const SW = { thin: 1, base: 1.1, bold: 1.2 };

/* The gait glyph is drawn from the site's canonical gait events rather than
   from limbs placed by eye, so the walking figure in this row is the same
   figure — same joint angles, same opposed arm and leg swing — as the ones on
   /products and in the research hero. Heel strike is the pose used: it has the
   widest stride, which is what survives being drawn at 24px.

   The source figure is ~90 units tall with a head 9% of that; scaled into this
   box the head would come out near 1px, so it alone is drawn larger. Icons
   exaggerate heads; anatomy does not. */
const WALK = GAIT_PHASES[0];
/* Scaled so the figure stands ~24 units tall, head to floor: a hairline
   figure needs to run slightly larger than the solid glyph boxes either side
   of it to carry the same visual weight inside a node this size. DX centres
   the stride, whose leading foot reaches further forward than the trailing
   one does back. */
const WALK_S = 0.23;
const WALK_DX = -1.5;
const WALK_DY = 0;
const WALK_HEAD_R = 2.2;
const wpt = ([x, y]: Pt): Pt => [
  x * WALK_S + WALK_DX,
  y * WALK_S + WALK_DY,
];
const wpts = (pts: readonly Pt[]) =>
  pts.map((p) => wpt(p).map((n) => n.toFixed(2)).join(",")).join(" ");
/** Ground plane and the two contact points of this pose. */
const WALK_GROUND = 48 * WALK_S + WALK_DY + 0.8;
const WALK_CONTACTS = WALK.contacts.map((cx) => cx * WALK_S + WALK_DX);

function Glyph({
  kind,
}: {
  kind: (typeof chain)[number]["glyph"];
}) {
  switch (kind) {
    /* 1 · RESEARCH FOUNDATION — a stacked publication, not a plain sheet: a
       second page behind the first, a title rule over body lines, and the
       grant seal at the corner. */
    case "publication":
      return (
        <>
          <path
            d="M-4.5 -11.5 H8.5 V4"
            fill="none"
            strokeWidth={SW.thin}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          <rect
            x={-9}
            y={-8.5}
            width={15}
            height={19.5}
            rx={1.2}
            fill="none"
            strokeWidth={SW.base}
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1={-6}
            y1={-4.6}
            x2={0.5}
            y2={-4.6}
            strokeWidth={SW.bold}
            vectorEffect="non-scaling-stroke"
          />
          {[-1.2, 1.6, 4.4].map((dy) => (
            <line
              key={dy}
              x1={-6}
              y1={dy}
              x2={3}
              y2={dy}
              strokeWidth={SW.thin}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <circle
            cx={2.6}
            cy={7.6}
            r={2.3}
            fill="none"
            strokeWidth={SW.thin}
            vectorEffect="non-scaling-stroke"
          />
          <circle cx={2.6} cy={7.6} r={0.75} fill="currentColor" stroke="none" />
        </>
      );

    /* 2 · MOVEMENT / GAIT SIGNALS — a walking figure mid-stride standing on
       its own stride timing, so the stage reads as human movement being
       measured rather than as an abstract wave. */
    case "gait": {
      const neck = wpt(GAIT_NECK);
      return (
        <>
          {/* Far side first and thinner, so the pose has depth the way the
              walkers elsewhere on the site do. */}
          <polyline
            points={wpts(WALK.farArm)}
            fill="none"
            strokeWidth={SW.thin}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          <polyline
            points={wpts([...WALK.farLeg, WALK.farFoot[1]])}
            fill="none"
            strokeWidth={SW.thin}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1={wpt([0, 0])[0]}
            y1={wpt([0, 0])[1]}
            x2={neck[0]}
            y2={neck[1]}
            strokeWidth={SW.bold}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          <circle
            cx={neck[0] + 0.2}
            cy={neck[1] - WALK_HEAD_R}
            r={WALK_HEAD_R}
            fill="none"
            strokeWidth={SW.base}
            vectorEffect="non-scaling-stroke"
          />
          <polyline
            points={wpts(WALK.nearArm)}
            fill="none"
            strokeWidth={SW.base}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          <polyline
            points={wpts([...WALK.nearLeg, WALK.nearFoot[1]])}
            fill="none"
            strokeWidth={SW.bold}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          {/* What the stage actually produces: a measured contact under each
              foot. Deliberately two short marks and not one floor line — a
              line under both feet closes the two legs into a triangle at this
              size, and the figure stops reading as a figure. */}
          {WALK_CONTACTS.map((wx) => (
            <line
              key={wx}
              x1={wx - 1.7}
              y1={WALK_GROUND}
              x2={wx + 1.7}
              y2={WALK_GROUND}
              strokeWidth={SW.base}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </>
      );
    }

    /* 3 · MULTIMODAL FUSION — three inputs merging into one layer, with a
       single output leaving it: inputs becoming intelligence. The previous
       glyph fanned outward from a hub, which read as distribution. */
    case "fusion":
      return (
        <>
          {[-7.4, 0, 7.4].map((dy) => (
            <g key={dy}>
              <circle cx={-10} cy={dy} r={1.6} fill="currentColor" stroke="none" />
              <line
                x1={-8.2}
                y1={dy}
                x2={-1.9}
                y2={dy * 0.18}
                strokeWidth={SW.thin}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          ))}
          <circle
            cx={0.6}
            cy={0}
            r={3.4}
            fill="none"
            strokeWidth={SW.bold}
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1={4.4}
            y1={0}
            x2={10.2}
            y2={0}
            strokeWidth={SW.base}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          <polyline
            points="7.6,-2.3 10.4,0 7.6,2.3"
            fill="none"
            strokeWidth={SW.base}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </>
      );

    /* 4 · EDGE INFERENCE — a processor: package, die, and the signal entering
       on one side and leaving on the other, which is the stage's whole claim. */
    case "edge":
      return (
        <>
          <rect
            x={-8}
            y={-8}
            width={16}
            height={16}
            rx={2}
            fill="none"
            strokeWidth={SW.bold}
            vectorEffect="non-scaling-stroke"
          />
          <rect
            x={-3.4}
            y={-3.4}
            width={6.8}
            height={6.8}
            rx={1}
            fill="none"
            strokeWidth={SW.thin}
            vectorEffect="non-scaling-stroke"
          />
          <circle cx={0} cy={0} r={1.1} fill="currentColor" stroke="none" />
          {[-4.4, 0, 4.4].map((dy) => (
            <line
              key={`l${dy}`}
              x1={-11.6}
              y1={dy}
              x2={-8}
              y2={dy}
              strokeWidth={SW.thin}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {[-4.4, 0, 4.4].map((dy) => (
            <line
              key={`r${dy}`}
              x1={8}
              y1={dy}
              x2={11.6}
              y2={dy}
              strokeWidth={SW.thin}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {[-4.4, 4.4].map((dx) => (
            <line
              key={`t${dx}`}
              x1={dx}
              y1={-11.4}
              x2={dx}
              y2={-8}
              strokeWidth={SW.thin}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {[-4.4, 4.4].map((dx) => (
            <line
              key={`b${dx}`}
              x1={dx}
              y1={8}
              x2={dx}
              y2={11.4}
              strokeWidth={SW.thin}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </>
      );

    /* 5 · OUTPUTS — the panel somebody actually reviews: header, a chart, and
       a status marker. */
    case "dashboard":
      return (
        <>
          <rect
            x={-11}
            y={-9.5}
            width={22}
            height={19}
            rx={1.5}
            fill="none"
            strokeWidth={SW.base}
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1={-11}
            y1={-4.6}
            x2={11}
            y2={-4.6}
            strokeWidth={SW.thin}
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1={-8.4}
            y1={-7.1}
            x2={-3.4}
            y2={-7.1}
            strokeWidth={SW.thin}
            vectorEffect="non-scaling-stroke"
          />
          <circle cx={8.2} cy={-7.1} r={1.5} fill="currentColor" stroke="none" />
          {[
            [-7.4, 2.2],
            [-3.9, 0],
            [-0.4, -2.1],
          ].map(([dx, top]) => (
            <line
              key={dx}
              x1={dx}
              y1={5.9}
              x2={dx}
              y2={top}
              strokeWidth={SW.bold}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <polyline
            points="2.8,1.4 5.6,-1.4 8.4,-3.2"
            fill="none"
            strokeWidth={SW.base}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1={-9}
            y1={5.9}
            x2={9}
            y2={5.9}
            strokeWidth={SW.thin}
            vectorEffect="non-scaling-stroke"
          />
        </>
      );
  }
}

export function ResearchToProductFlow() {
  return (
    <div className={styles.flow}>
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${W} ${H}`}
        className={`${styles.flowRail} hidden min-[900px]:block`}
      >
        <line className={styles.fLine} x1={40} y1={RAIL_Y} x2={W - 40} y2={RAIL_Y} />
        <path
          className={styles.fPulse}
          d={`M40 ${RAIL_Y} L${W - 40} ${RAIL_Y}`}
          pathLength={100}
        />
        {STAGE_X.map((x, i) => {
          const stage = chain[i];
          return (
            <g
              key={i}
              className={`${styles.fStageGroup}${
                stage.strong ? ` ${styles.fStageGroupStrong}` : ""
              }`}
            >
              <circle className={styles.fStageNode} cx={x} cy={RAIL_Y} r={26} />
              <g
                className={styles.fGlyph}
                transform={`translate(${x} ${RAIL_Y})`}
                stroke="currentColor"
              >
                <Glyph kind={stage.glyph} />
              </g>
              <text className={styles.fNodeLabel} x={x} y={LABEL_Y}>
                {stage.short}
              </text>
            </g>
          );
        })}
      </svg>

      <ol className={styles.flowStages}>
        {chain.map((stage, i) => (
          <li key={stage.label} className={styles.fStage}>
            <span className={styles.fStageIndex}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3
              className={`${styles.fStageLabel}${
                stage.strong ? ` ${styles.fStageLabelStrong}` : ""
              }`}
            >
              {stage.label}
            </h3>
            <p className={styles.fStageDetail}>{stage.detail}</p>
          </li>
        ))}
      </ol>

      <p className="mt-8 max-w-2xl text-[13.5px] leading-relaxed text-soft-mute">
        Research establishes the methodological foundation. Product-specific
        validation establishes fitness for a particular use.{" "}
        <Link
          href="/products"
          className="text-cyan-300 underline decoration-cyan-300/30 underline-offset-2 transition-colors hover:text-cyan-200"
        >
          Explore the platform
        </Link>
      </p>
    </div>
  );
}
