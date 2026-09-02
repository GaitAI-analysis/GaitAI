import Link from "next/link";
import styles from "./observatory.module.css";

/**
 * Where the record ends and the platform begins — five stages on one signal.
 *
 * The stage copy is unchanged from the chain this replaces, including which
 * two ends are emphasised: the research foundation and the output a clinician
 * or operator actually reviews. The middle three are the platform's, not the
 * record's, which is the distinction the whole page is built around.
 *
 * Each stage carries a small glyph of what it operates on — a record, a
 * skeleton and a signal, capability nodes, a compact inference block, a
 * report — so the transformation is visible without a caption.
 */

const chain = [
  {
    label: "Research foundation",
    detail: "Peer-reviewed methods and the granted patent.",
    strong: true,
    glyph: "record" as const,
  },
  {
    label: "Movement representations",
    detail: "Pose, gait features and temporal signals extracted from capture.",
    strong: false,
    glyph: "signal" as const,
  },
  {
    label: "Platform capabilities",
    detail: "The shared capability layer the products draw on.",
    strong: false,
    glyph: "nodes" as const,
  },
  {
    label: "Product-specific models",
    detail: "Tuned per product and per environment.",
    strong: false,
    glyph: "model" as const,
  },
  {
    label: "Reports · dashboards · alerts",
    detail: "What a clinician or operator actually reviews.",
    strong: true,
    glyph: "report" as const,
  },
];

const W = 1000;
const H = 108;
const STAGE_X = [100, 300, 500, 700, 900];
const RAIL_Y = 54;

function Glyph({
  kind,
  x,
  strong,
}: {
  kind: (typeof chain)[number]["glyph"];
  x: number;
  strong: boolean;
}) {
  const cls = strong ? `${styles.fGlyph} ${styles.fGlyphStrong}` : styles.fGlyph;
  return (
    <g className={cls} transform={`translate(${x} ${RAIL_Y})`} stroke="currentColor">
      {kind === "record" && (
        <>
          <rect
            x={-9}
            y={-11}
            width={18}
            height={22}
            rx={1.5}
            fill="none"
            strokeWidth={1.1}
            vectorEffect="non-scaling-stroke"
          />
          {[-5, -1, 3, 7].map((dy) => (
            <line
              key={dy}
              x1={-5}
              y1={dy}
              x2={5}
              y2={dy}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </>
      )}
      {kind === "signal" && (
        <>
          <path
            d="M-12 0 C-7 -11 -2 9 3 -2 C7 -10 10 6 13 0"
            fill="none"
            strokeWidth={1.2}
            vectorEffect="non-scaling-stroke"
          />
          {[-12, -2, 8].map((dx) => (
            <line
              key={dx}
              x1={dx}
              y1={7}
              x2={dx}
              y2={11}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </>
      )}
      {kind === "nodes" && (
        <>
          {[
            [-9, -7],
            [0, 0],
            [-9, 7],
            [9, -5],
            [9, 6],
          ].map(([dx, dy], i) => (
            <circle
              key={i}
              cx={dx}
              cy={dy}
              r={2.1}
              fill="currentColor"
              stroke="none"
            />
          ))}
          <path
            d="M-9 -7 L0 0 L-9 7 M0 0 L9 -5 M0 0 L9 6"
            fill="none"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        </>
      )}
      {kind === "model" && (
        <>
          <rect
            x={-9}
            y={-9}
            width={18}
            height={18}
            rx={2}
            fill="none"
            strokeWidth={1.2}
            vectorEffect="non-scaling-stroke"
          />
          {[-5, 0, 5].map((dy) => (
            <line
              key={`l${dy}`}
              x1={-13}
              y1={dy}
              x2={-9}
              y2={dy}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {[-5, 0, 5].map((dy) => (
            <line
              key={`r${dy}`}
              x1={9}
              y1={dy}
              x2={13}
              y2={dy}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </>
      )}
      {kind === "report" && (
        <>
          <rect
            x={-11}
            y={-9}
            width={22}
            height={18}
            rx={1.5}
            fill="none"
            strokeWidth={1.1}
            vectorEffect="non-scaling-stroke"
          />
          <path
            d="M-7 3 L-3 -3 L1 1 L5 -5"
            fill="none"
            strokeWidth={1.2}
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1={-7}
            y1={6}
            x2={7}
            y2={6}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        </>
      )}
    </g>
  );
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
        {STAGE_X.map((x, i) => (
          <g key={i}>
            <circle
              className={`${styles.fStageNode}${
                chain[i].strong ? ` ${styles.fStageNodeStrong}` : ""
              }`}
              cx={x}
              cy={RAIL_Y}
              r={26}
            />
            <Glyph kind={chain[i].glyph} x={x} strong={chain[i].strong} />
          </g>
        ))}
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
