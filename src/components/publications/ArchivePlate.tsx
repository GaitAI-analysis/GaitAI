import styles from "./plate.module.css";

/**
 * The /publications hero art: the record itself, drawn as a plate.
 *
 * The reference puts a luminous open book on a field of plots. A book is the
 * wrong object for this archive — nine of these are journal articles and one
 * is a granted patent, and none of them is a book — so this draws what they
 * actually are: three stacked record plates in perspective, the top one open,
 * with the figures a paper carries rising off it. Signal traces, a scatter, a
 * histogram and a small confusion-style lattice: the four figure types this
 * record's own papers contain.
 *
 * It is a picture of a research artifact, not a chart. There are no axis
 * values, no legends and no numbers, because the drawing depicts the *form* of
 * published work rather than any result in it.
 *
 * Geometry is fixed data, so the hero is identical on the server, in the
 * browser and in a screenshot.
 */

const W = 760;
const H = 520;

const r1 = (n: number) => Math.round(n * 10) / 10;

const rnd = (n: number) => {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/** The three plates, back to front, each skewed into the same perspective. */
const PLATES = [
  { x: 118, y: 322, w: 470, h: 118, o: 0.35 },
  { x: 104, y: 300, w: 500, h: 122, o: 0.55 },
  { x: 88, y: 274, w: 532, h: 128, o: 1 },
];

/** A trace for the figure rising off the open plate. */
function trace(seed: number, x0: number, w: number, y0: number, amp: number) {
  const pts: string[] = [];
  for (let i = 0; i <= 44; i += 1) {
    const t = i / 44;
    const y =
      y0 +
      Math.sin(t * 8.4 + seed) * amp +
      Math.sin(t * 19.7 + seed * 1.9) * (amp * 0.3);
    pts.push(`${r1(x0 + t * w)},${r1(y)}`);
  }
  return `M ${pts.join(" L ")}`;
}

const SCATTER = Array.from({ length: 46 }, (_, i) => ({
  x: r1(430 + rnd(i * 3 + 1) * 150),
  y: r1(60 + rnd(i * 7 + 2) * 108),
  r: r1(1 + rnd(i * 11 + 5) * 1.6),
  tone: rnd(i * 13 + 3),
}));

const BARS = Array.from({ length: 14 }, (_, i) => {
  const h = 8 + Math.abs(Math.sin(i * 0.9 + 1.2)) * 44;
  return { x: r1(120 + i * 15), h: r1(h) };
});

export function ArchivePlate() {
  return (
    <div className={styles.hero}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={styles.heroSvg}
        role="img"
        aria-label="A figure of the research record: stacked publication plates with the signal traces, scatters, distributions and matrices their figures contain rising off them."
      >
        <defs>
          <linearGradient id="pl-plate" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#4FD1FF" stopOpacity="0.16" />
            <stop offset="0.55" stopColor="#2563FF" stopOpacity="0.1" />
            <stop offset="1" stopColor="#7C3AED" stopOpacity="0.14" />
          </linearGradient>
          <radialGradient id="pl-lift">
            <stop offset="0" stopColor="#4FD1FF" stopOpacity="0.2" />
            <stop offset="1" stopColor="#2563FF" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* The light the plates sit in. */}
        <ellipse cx={354} cy={330} rx={300} ry={130} fill="url(#pl-lift)" />

        {/* ── the stack ── */}
        {PLATES.map((plate, i) => (
          <g key={i} opacity={plate.o}>
            <path
              className={styles.heroPlateFill}
              d={`M ${plate.x} ${plate.y} L ${plate.x + plate.w} ${
                plate.y - 34
              } L ${plate.x + plate.w} ${plate.y - 34 + plate.h} L ${plate.x} ${
                plate.y + plate.h
              } Z`}
            />
            <path
              className={styles.heroPlateEdge}
              d={`M ${plate.x} ${plate.y} L ${plate.x + plate.w} ${
                plate.y - 34
              } L ${plate.x + plate.w} ${plate.y - 34 + plate.h} L ${plate.x} ${
                plate.y + plate.h
              } Z`}
            />
            {/* The spine fold down the middle of the top plate. */}
            {i === PLATES.length - 1 && (
              <line
                className={styles.heroFold}
                x1={plate.x + plate.w / 2}
                y1={plate.y - 17}
                x2={plate.x + plate.w / 2}
                y2={plate.y - 17 + plate.h}
              />
            )}
          </g>
        ))}

        {/* ── text lines on the open plate: a page, not a chart ── */}
        <g className={styles.heroLines}>
          {Array.from({ length: 9 }, (_, i) => {
            const y = 300 + i * 11;
            const w = 190 - (i % 4) * 26;
            return (
              <line
                key={`l${i}`}
                x1={104}
                y1={r1(y)}
                x2={r1(104 + w)}
                y2={r1(y - w * 0.064)}
              />
            );
          })}
          {Array.from({ length: 9 }, (_, i) => {
            const y = 282 + i * 11;
            const w = 186 - (i % 3) * 34;
            return (
              <line
                key={`r${i}`}
                x1={366}
                y1={r1(y)}
                x2={r1(366 + w)}
                y2={r1(y - w * 0.064)}
              />
            );
          })}
        </g>

        {/* ── the figures a paper carries, rising off the plate ── */}
        {/* a · signal traces */}
        <g>
          <path className={styles.heroTraceLit} d={trace(1.1, 96, 210, 196, 20)} />
          <path className={styles.heroTrace} d={trace(2.7, 96, 210, 216, 13)} />
          <line className={styles.heroAxis} x1={96} y1={238} x2={306} y2={238} />
        </g>

        {/* b · a distribution */}
        <g>
          {BARS.map((bar, i) => (
            <rect
              key={i}
              className={i === 6 || i === 7 ? styles.heroBarLit : styles.heroBar}
              x={bar.x}
              y={r1(160 - bar.h)}
              width={9}
              height={bar.h}
              rx={1}
            />
          ))}
          <line className={styles.heroAxis} x1={116} y1={160} x2={330} y2={160} />
        </g>

        {/* c · a scatter — the feature space */}
        <g>
          {SCATTER.map((point, i) => (
            <circle
              key={i}
              className={
                point.tone > 0.68
                  ? styles.heroDotLit
                  : point.tone > 0.36
                    ? styles.heroDotWarm
                    : styles.heroDot
              }
              cx={point.x}
              cy={point.y}
              r={point.r}
            />
          ))}
        </g>

        {/* d · a matrix lattice */}
        <g className={styles.heroMatrix}>
          {Array.from({ length: 5 }, (_, row) =>
            Array.from({ length: 5 }, (_, col) => {
              const on = (row * 5 + col) % 6 === 0 || row === col;
              return (
                <rect
                  key={`${row}-${col}`}
                  className={on ? styles.heroCellOn : styles.heroCell}
                  x={r1(342 + col * 15)}
                  y={r1(176 + row * 15)}
                  width={12}
                  height={12}
                  rx={1.5}
                />
              );
            }),
          )}
        </g>

        {/* Hairlines tying the figures back to the plate they came from. */}
        <g className={styles.heroTie}>
          <path d="M 200 246 C 200 266 196 276 190 288" />
          <path d="M 300 168 C 316 200 320 240 318 272" />
          <path d="M 470 176 C 462 216 452 246 444 268" />
        </g>
      </svg>
    </div>
  );
}
