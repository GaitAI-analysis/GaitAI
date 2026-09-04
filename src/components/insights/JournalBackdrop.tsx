/**
 * The journal's editorial backdrop — the atmosphere behind the masthead.
 *
 * The archive above the narrative was type on a flat dark field: correct
 * information, no publication. This is the background a journal has, built
 * from the two things this one is actually about rather than from a stock
 * photograph:
 *
 *   · a page — column rules, a baseline grid and two faint text blocks set at
 *     the measure of a printed article, so the surface reads as a publication
 *     before a single word is read
 *   · movement — four trajectories crossing the columns, with sampled points
 *     along them, in the platform's own signal language
 *
 * Everything is drawn, nothing is photographed, and it is one inline SVG with
 * no image request: a hero image heavy enough to carry this would cost more
 * than the whole route currently does.
 *
 * CONTRAST DISCIPLINE. Nothing here exceeds 0.3 alpha, the trajectories are
 * masked away from the left column where the headline sits, and the whole
 * thing sits under a vertical scrim that takes the top to near-black. The
 * masthead's own contrast is therefore unchanged — checked by reading the
 * headline over it at 1440 and 390.
 *
 * ALMOST STILL. A background that animates behind a headline is a background
 * competing with a headline, so the page, the grid, the type blocks and the
 * curves themselves never move. The one exception is five small dots that
 * travel along the trajectories, because a network drawn as a still diagram
 * says "diagram" and the same drawing with signal moving through it says what
 * this platform actually does.
 *
 * The dots ride the EXACT `d` of the curves below — same array, no second
 * copy of the geometry — as stroke caps walked along each path by
 * `stroke-dashoffset`. The whole mechanism, why it is not `offset-path` or
 * SMIL, and its cost are documented in `backdrop.module.css`. No JS runs:
 * this stays a server component, and `prefers-reduced-motion` is honoured in
 * that stylesheet rather than by hydrating to make the decision.
 */
import styles from "./backdrop.module.css";

export function JournalBackdrop() {
  /* Four trajectories over the page, as the platform draws movement: a smooth
     path with sampled points on it. Deterministic — these are fixed curves,
     not generated, so the composition is the same for every reader. */
  const traces = [
    { d: "M-40 132 C180 96 330 168 520 138 C700 110 860 158 1060 128", o: 0.22 },
    { d: "M-40 196 C210 240 360 168 560 206 C740 240 900 196 1060 218", o: 0.17 },
    { d: "M-40 268 C160 300 340 246 540 282 C720 314 880 268 1060 292", o: 0.12 },
    { d: "M-40 344 C220 320 380 372 580 340 C760 312 900 350 1060 330", o: 0.085 },
  ];

  /*
   * The travelling dots. Five on a desktop, three on a phone.
   *
   * `trace` indexes the array above, so a dot cannot be given a curve that
   * does not exist and editing a curve moves its dot with it. Spread across
   * the two upper lines, the central curve and the lowest one, which leaves
   * the baseline grid, the column rules and both type blocks — the large
   * majority of the drawing — completely still.
   *
   * DURATIONS ARE ROUGHLY PROPORTIONAL TO HOW FAR THE DOT TRAVELS, not
   * uniform, so every dot moves at a similar speed rather than the short
   * curves looking hurried. Every delay is NEGATIVE and no two share a
   * factor: each dot is already in flight on the first frame, at a different
   * point, so the backdrop has no visible start and never resynchronises.
   *
   * `rest` is where the dot parks under prefers-reduced-motion — a fraction
   * along its own curve, chosen to sit clear of the headline mask and to keep
   * the five reading as scattered sample points rather than a row.
   */
  const packets = [
    /* upper thin line — cyan */
    { trace: 0, hue: "#9fe4ff", dur: "9s", delay: "-2.5s", rest: "-0.34", mobile: true },
    /* second upper line — blue, the slowest of the pair */
    { trace: 1, hue: "#8ab4ff", dur: "12.5s", delay: "-7s", rest: "-0.62", mobile: true },
    /* central curve — violet, the long one */
    { trace: 2, hue: "#c4b5fd", dur: "14s", delay: "-11s", rest: "-0.45", mobile: true },
    /* second dot on the upper pair, so one line carries two packets at
       different phases — the detail that makes it read as traffic */
    { trace: 1, hue: "#9fe4ff", dur: "7s", delay: "-4s", rest: "-0.2", mobile: false },
    /* second dot on the central curve, trailing far behind the first */
    { trace: 2, hue: "#8ab4ff", dur: "11s", delay: "-9s", rest: "-0.75", mobile: false },
  ];

  /* TRACE 3 CARRIES NOTHING, deliberately. It is the faintest curve and
     leaving it entirely still is what keeps this from being "every line
     moves": three of the four trajectories carry signal, the fourth is
     drawing, and the baseline grid, the column rules and both type blocks —
     some thirty-four more lines, the bulk of the composition — never move at
     all. */

  /* Sample marks along the brightest two, at fixed fractions. */
  const marks = [
    [148, 128], [318, 158], [512, 139], [688, 116], [880, 140],
    [206, 232], [402, 178], [604, 216], [808, 228],
  ];

  return (
    <div
      aria-hidden="true"
      /* Bounded to the masthead band rather than inset-0: the archive section
         runs the full length of the card grid, and a slice-scaled drawing
         stretched over all of it would put trajectories behind every row. */
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[min(620px,78vw)] overflow-hidden"
    >
      <svg
        viewBox="0 0 1020 420"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
      >
        <defs>
          {/* The page's own light, behind the column block. */}
          <radialGradient id="jb-glow" cx="0.62" cy="0.34" r="0.7">
            <stop offset="0" stopColor="#3b82f6" stopOpacity="0.26" />
            <stop offset="0.5" stopColor="#4fd1ff" stopOpacity="0.09" />
            <stop offset="1" stopColor="#4fd1ff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="jb-violet" cx="0.94" cy="0.8" r="0.5">
            <stop offset="0" stopColor="#a78bfa" stopOpacity="0.18" />
            <stop offset="1" stopColor="#a78bfa" stopOpacity="0" />
          </radialGradient>

          {/* The headline sits left, so the drawing fades out of that third
              and the type never competes with a trajectory. */}
          <linearGradient id="jb-clear" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.34" stopColor="#fff" stopOpacity="0.55" />
            <stop offset="0.62" stopColor="#fff" stopOpacity="1" />
            <stop offset="1" stopColor="#fff" stopOpacity="1" />
          </linearGradient>
          <mask id="jb-mask">
            <rect x="0" y="0" width="1020" height="420" fill="url(#jb-clear)" />
          </mask>
        </defs>

        <rect width="1020" height="420" fill="url(#jb-glow)" />
        <rect width="1020" height="420" fill="url(#jb-violet)" />

        <g mask="url(#jb-mask)">
          {/* ── The page: a baseline grid, then column rules ── */}
          <g stroke="rgb(148 163 184 / 0.1)" strokeWidth="1">
            {Array.from({ length: 15 }, (_, i) => (
              <line key={`b${i}`} x1="0" y1={i * 28 + 14} x2="1020" y2={i * 28 + 14} />
            ))}
          </g>
          <g stroke="rgb(148 163 184 / 0.2)" strokeWidth="1">
            {[404, 664, 924].map((x) => (
              <line key={x} x1={x} y1="30" x2={x} y2="390" />
            ))}
          </g>

          {/* ── Two text blocks, set as an article would be. Rules of varying
                length read as prose; a solid block would read as a bar. ── */}
          {[
            { x: 428, y: 62, rows: 9 },
            { x: 688, y: 214, rows: 7 },
          ].map((block) => (
            <g key={`${block.x}`} stroke="rgb(203 213 225 / 0.16)" strokeWidth="2">
              {Array.from({ length: block.rows }, (_, i) => {
                /* Deterministic ragged right edge, so it reads as set type. */
                const w = 208 - ((i * 37) % 58) - (i === block.rows - 1 ? 96 : 0);
                return (
                  <line
                    key={i}
                    x1={block.x}
                    y1={block.y + i * 14}
                    x2={block.x + w}
                    y2={block.y + i * 14}
                  />
                );
              })}
            </g>
          ))}

          {/* ── Movement across the page ── */}
          {traces.map((trace) => (
            <path
              key={trace.d}
              d={trace.d}
              fill="none"
              stroke="#7fd4ff"
              strokeOpacity={trace.o}
              strokeWidth="1.2"
            />
          ))}
          {marks.map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.6" fill="#9fe4ff" fillOpacity="0.3" />
          ))}

          {/* The packets. Inside this masked group deliberately: the mask is
              what keeps the drawing out of the left third, and a bright
              moving dot is the last thing that should cross the headline.

              Two caps each — a faint wide one that also brightens the trace
              directly under it, then the small bright core on top. */}
          {packets.map((packet, index) => {
            const style = {
              "--jb-dur": packet.dur,
              "--jb-delay": packet.delay,
              "--jb-rest": packet.rest,
            } as React.CSSProperties;
            const off = packet.mobile ? "" : ` ${styles.mobileOff}`;
            return (
              <g key={index}>
                <path
                  d={traces[packet.trace].d}
                  pathLength="1"
                  fill="none"
                  stroke={packet.hue}
                  className={`${styles.packet} ${styles.glow}${off}`}
                  style={style}
                />
                <path
                  d={traces[packet.trace].d}
                  pathLength="1"
                  fill="none"
                  stroke={packet.hue}
                  className={`${styles.packet} ${styles.core}${off}`}
                  style={style}
                />
              </g>
            );
          })}
        </g>
      </svg>

      {/* Scrim: the top goes to near-black under the navbar, and the bottom
          hands off to the page ground, so the backdrop has no visible edge. */}
      <div className="absolute inset-0 bg-gradient-to-b from-obsidian-400 via-obsidian-400/10 to-obsidian-400" />
      <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-obsidian-400 to-transparent" />
    </div>
  );
}
