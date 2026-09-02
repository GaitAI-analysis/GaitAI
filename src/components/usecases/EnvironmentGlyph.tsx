import styles from "./usecases.module.css";

/**
 * Environment glyphs for the use-case cards.
 *
 * Drawn rather than picked from an icon set. The environments were previously
 * marked with generic Lucide icons (a trophy for sports, a plane for
 * airports), which named the setting but said nothing about what GaitAI reads
 * there. Each glyph here is built from the same three primitives the rest of
 * the site draws movement with — a walking figure, a path, and a measured
 * signal — so a clinic glyph and a stadium glyph are visibly the same system
 * pointed at different rooms.
 *
 * All 48×48, stroked in `currentColor` so the card's accent carries through,
 * and 2–4 elements each: at 44px on the card, more than that is mud.
 */

const V = 48;

/** A minimal walking figure — the shared subject of every glyph. */
function Walker({
  x,
  y,
  s = 1,
  lean = 0,
}: {
  x: number;
  y: number;
  s?: number;
  lean?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(${lean})`}>
      <circle className={styles.gFill} cx={0} cy={-13} r={2.6} />
      <path className={styles.gLine} d="M0 -10.4 L0 -2" />
      <path className={styles.gLine} d="M0 -2 L-3.4 6 M0 -2 L3.8 5.4" />
      <path className={styles.gLine} d="M0 -7.6 L-3.6 -4 M0 -7.6 L3.6 -5" />
    </g>
  );
}

/** A measured signal — ticks of varying height on a baseline. */
function Signal({
  x,
  y,
  w,
  n = 7,
  amp = 5,
}: {
  x: number;
  y: number;
  w: number;
  n?: number;
  amp?: number;
}) {
  return (
    <g>
      <path className={styles.gRule} d={`M${x} ${y} L${x + w} ${y}`} />
      {Array.from({ length: n }, (_, i) => {
        const cx = x + (i * w) / (n - 1);
        const h = 1.6 + amp * Math.abs(Math.sin(i * 1.15));
        return (
          <path
            key={i}
            className={styles.gTick}
            d={`M${cx} ${y} L${cx} ${y - h}`}
          />
        );
      })}
    </g>
  );
}

/** A traversed path with a node at each end. */
function Path({
  d,
  dashed = false,
}: {
  d: string;
  dashed?: boolean;
}) {
  return <path className={dashed ? styles.gPathDash : styles.gPath} d={d} />;
}

/* ── The seventeen environments ─────────────────────────────────────────── */

/* MobilityCare — one person, measured. */

/** Physiotherapy: an assessment walk over a session signal. */
const Physio = () => (
  <>
    <Walker x={17} y={22} s={1.15} />
    <Path d="M8 28 L40 28" />
    <Signal x={12} y={41} w={24} n={6} amp={6} />
  </>
);

/** Hospitals: a ward bed and the mobility chart beside it. */
const Hospitals = () => (
  <>
    <path className={styles.gLine} d="M9 30 L9 21 M9 26 L27 26 M27 26 L27 30" />
    <circle className={styles.gFill} cx={14} cy={21} r={2.4} />
    <path className={styles.gRule} d="M9 34 L27 34" />
    <Path d="M32 34 L34 26 L37 29 L41 15" />
  </>
);

/** Sports: a running figure and its stride trace. */
const Sports = () => (
  <>
    <Walker x={19} y={23} s={1.25} lean={-9} />
    <Path d="M7 33 C15 33 17 27 24 27 C32 27 33 33 41 33" />
    <Signal x={12} y={43} w={24} n={7} amp={4} />
  </>
);

/** Elderly care: an assisted figure with a support line. */
const Elderly = () => (
  <>
    <Walker x={18} y={24} s={1.1} />
    <path className={styles.gLine} d="M27 15 L27 33" />
    <path className={styles.gRule} d="M23 33 L31 33" />
    <Signal x={11} y={42} w={26} n={6} amp={5} />
  </>
);

/** Neurology: a head and the irregular gait trace read from it. */
const Neuro = () => (
  <>
    <path
      className={styles.gLine}
      d="M15 20 A9 9 0 1 1 24 29 L24 33"
    />
    <circle className={styles.gFill} cx={19} cy={19} r={2} />
    <Path d="M8 40 L12 37 L15 41 L19 36 L23 40 L27 34 L31 39 L35 33 L40 37" />
  </>
);

/** Home care: a roof, a figure inside it, a link out. */
const Homecare = () => (
  <>
    <path className={styles.gLine} d="M9 24 L21 14 L33 24 L33 36 L9 36 Z" />
    <Walker x={21} y={32} s={0.82} />
    <Path d="M36 20 C42 20 42 30 38 30" dashed />
    <circle className={styles.gFill} cx={38} cy={30} r={2.2} />
  </>
);

/** Fitness: a screening baseline against a member's own profile. */
const Fitness = () => (
  <>
    <Walker x={16} y={24} s={1.05} />
    <path className={styles.gRule} d="M8 30 L26 30" />
    <path className={styles.gLine} d="M33 16 L33 36 M30 20 L36 20 M30 32 L36 32" />
    <Signal x={10} y={42} w={22} n={5} amp={5} />
  </>
);

/** Schools: a smaller figure, screened term over term. */
const Schools = () => (
  <>
    <Walker x={16} y={26} s={0.86} />
    <Walker x={30} y={24} s={1.02} />
    <path className={styles.gRule} d="M8 32 L40 32" />
    <Path d="M12 41 L20 39 L28 40 L38 36" dashed />
  </>
);

/** Prosthetics: two configurations of one limb, compared. */
const Prosthetics = () => (
  <>
    <Walker x={16} y={24} s={1.05} />
    <path className={styles.gLine} d="M30 18 L30 30 M27 30 L33 30 M30 34 L30 37" />
    <path className={styles.gPathDash} d="M30 18 L36 26 L30 34" />
    <Signal x={10} y={42} w={22} n={5} amp={5} />
  </>
);

/** Insurance: a cohort of members on one trend. */
const Insurance = () => (
  <>
    <Walker x={13} y={24} s={0.8} />
    <Walker x={24} y={24} s={0.8} />
    <Walker x={35} y={24} s={0.8} />
    <path className={styles.gRule} d="M8 29 L40 29" />
    <Path d="M9 41 L18 38 L27 39 L39 34" />
  </>
);

/** Research: a sampled cohort, exported as a structured record. */
const Research = () => (
  <>
    <Walker x={15} y={22} s={0.95} />
    <path className={styles.gLine} d="M27 13 L40 13 L40 35 L27 35 Z" />
    <path className={styles.gRule} d="M30 20 L37 20 M30 24 L37 24 M30 28 L34 28" />
    <Signal x={9} y={41} w={16} n={5} amp={5} />
  </>
);

/* SecureVision — several people, anonymous, in a space. */

/** Airports: gated flow through a concourse. */
const Airports = () => (
  <>
    <path className={styles.gLine} d="M10 12 L10 36 M38 12 L38 36" />
    <Path d="M14 19 C24 19 26 24 34 24" />
    <Path d="M14 29 C24 29 26 24 34 24" />
    <circle className={styles.gFill} cx={34} cy={24} r={2.4} />
    <Signal x={13} y={42} w={22} n={6} amp={4} />
  </>
);

/** Smart cities: blocks of a district with flow between them. */
const SmartCities = () => (
  <>
    <path className={styles.gLine} d="M9 36 L9 22 L17 22 L17 36" />
    <path className={styles.gLine} d="M21 36 L21 14 L29 14 L29 36" />
    <path className={styles.gLine} d="M33 36 L33 25 L41 25 L41 36" />
    <Path d="M7 40 C17 40 23 43 41 40" dashed />
  </>
);

/** Campuses: separate sites, one quiet watch across them. */
const Campuses = () => (
  <>
    <path className={styles.gLine} d="M11 34 L11 20 L20 20 L20 34" />
    <path className={styles.gLine} d="M28 34 L28 23 L37 23 L37 34" />
    <path className={styles.gRule} d="M7 38 L41 38" />
    <Path d="M15 17 C20 10 28 10 32 19" dashed />
    <circle className={styles.gFill} cx={24} cy={13} r={2.2} />
  </>
);

/** Factories: a restricted zone and a worker near its edge. */
const Factories = () => (
  <>
    <path className={styles.gPathDash} d="M24 12 L41 18 L41 36 L24 40 Z" />
    <Walker x={15} y={30} s={1.05} />
    <path className={styles.gRule} d="M7 36 L20 36" />
    <circle className={styles.gAlert} cx={32} cy={26} r={2.8} />
  </>
);

/** Retail: a queue at a counter and the floor it forms on. */
const Retail = () => (
  <>
    <path className={styles.gLine} d="M9 15 L39 15 L37 22 L11 22 Z" />
    <Walker x={16} y={38} s={0.78} />
    <Walker x={25} y={38} s={0.78} />
    <Walker x={34} y={38} s={0.78} />
    <path className={styles.gRule} d="M11 41 L39 41" />
  </>
);

/** Large events: a bowl, gates and density against capacity. */
const Events = () => (
  <>
    <ellipse className={styles.gLine} cx={24} cy={24} rx={16} ry={11} />
    <ellipse className={styles.gRule} cx={24} cy={24} rx={8} ry={5} />
    <path className={styles.gTick} d="M8 24 L4 24 M40 24 L44 24" />
    <Path d="M24 13 C31 13 34 18 34 24" />
    <circle className={styles.gAlert} cx={34} cy={24} r={2.6} />
  </>
);

const GLYPHS: Record<string, () => JSX.Element> = {
  physio: Physio,
  hospitals: Hospitals,
  sports: Sports,
  elderly: Elderly,
  neuro: Neuro,
  homecare: Homecare,
  fitness: Fitness,
  schools: Schools,
  prosthetics: Prosthetics,
  insurance: Insurance,
  trials: Research,
  airports: Airports,
  smartcities: SmartCities,
  campuses: Campuses,
  factories: Factories,
  retail: Retail,
  events: Events,
};

/** Is there a drawn glyph for this environment? */
export const hasGlyph = (caseId: string) => caseId in GLYPHS;

export function EnvironmentGlyph({
  caseId,
  className,
}: {
  caseId: string;
  className?: string;
}) {
  const Glyph = GLYPHS[caseId];
  if (!Glyph) return null;

  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${V} ${V}`}
      className={`${styles.glyph} ${className ?? ""}`}
    >
      <Glyph />
    </svg>
  );
}
