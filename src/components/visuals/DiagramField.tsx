import styles from "./field.module.css";

/**
 * The shared background system for /use-cases, /research and /publications.
 *
 * One component, three meanings. The reference's atmosphere is not decoration
 * — it is a drafted survey field with light on it — so this composes the same
 * four layers everywhere (blueprint grid, contour bands, node lattice, depth
 * lights) and varies only what each page's content is about:
 *
 *   ecosystem   contours sweep outward from the lower centre and the lattice
 *               clusters around it: many places, one origin
 *   research    contours run left to right and the lattice thickens toward
 *               the right: a signal becoming a representation
 *   archive     an even, regular lattice on a tighter grid: a catalogue
 *
 * Geometry is generated from a fixed integer seed, so a field renders
 * identically on the server, on the client and in a screenshot — there is no
 * `Math.random()` anywhere in it. Everything is `aria-hidden`, nothing
 * animates, and every layer is masked before it reaches the type.
 */

type Variant = "ecosystem" | "research" | "archive";

/** Deterministic 0–1 pseudo-random from an integer. */
const rnd = (n: number) => {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Contour bands: slow sine ridges, offset per band. */
function contours(variant: Variant, count: number): string[] {
  const out: string[] = [];
  for (let b = 0; b < count; b += 1) {
    const pts: string[] = [];
    const phase = b * 0.7;
    const amp = variant === "research" ? 5 + b * 0.9 : 7 + b * 1.4;
    const base =
      variant === "ecosystem" ? 62 + b * 5.5 : variant === "research" ? 26 + b * 8 : 18 + b * 9;
    for (let x = -4; x <= 104; x += 4) {
      const t = x / 100;
      const y =
        base +
        Math.sin(t * 5.2 + phase) * amp +
        Math.sin(t * 11.3 + phase * 1.7) * (amp * 0.28) +
        (variant === "ecosystem" ? Math.cos(t * 2.1 + b) * 3 : 0);
      pts.push(`${x},${r1(y)}`);
    }
    out.push(`M ${pts.join(" L ")}`);
  }
  return out;
}

/** The node lattice: points plus links to near neighbours. */
function lattice(variant: Variant, count: number) {
  const nodes: { x: number; y: number; r: number; tone: number }[] = [];
  for (let i = 0; i < count; i += 1) {
    const a = rnd(i * 3 + 1);
    const b = rnd(i * 7 + 2);
    const c = rnd(i * 11 + 3);

    let x: number;
    let y: number;
    if (variant === "ecosystem") {
      // Clustered around a lower-centre origin, thinning outward.
      const ang = a * Math.PI * 2;
      const rad = 12 + Math.pow(b, 0.62) * 52;
      x = 50 + Math.cos(ang) * rad * 1.35;
      y = 66 + Math.sin(ang) * rad * 0.78;
    } else if (variant === "research") {
      // Denser to the right: a signal condensing into a representation.
      x = Math.pow(a, 0.55) * 104 - 2;
      y = 8 + b * 84;
    } else {
      // An even catalogue field.
      x = a * 104 - 2;
      y = b * 104 - 2;
    }

    // Positions are scaled to a 1000-unit box: with preserveAspectRatio
    // "slice" a 100-unit box scales by ~14 on a full-width section, which
    // turned a 1-unit dot into a 14px disc.
    nodes.push({
      x: r1(x * 10),
      y: r1(y * 10),
      r: r1(0.9 + c * 1.5),
      tone: c,
    });
  }

  const links: { a: number; b: number }[] = [];
  const reach = variant === "archive" ? 130 : 160;
  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = (nodes[i].y - nodes[j].y) * 1.6;
      if (Math.hypot(dx, dy) < reach) links.push({ a: i, b: j });
    }
  }
  return { nodes, links };
}

const DEPTH: Record<Variant, { x: string; y: string; w: string; h: string; c: string; o: number }[]> = {
  ecosystem: [
    { x: "50%", y: "58%", w: "1100px", h: "700px", c: "79 209 255", o: 0.12 },
    { x: "82%", y: "22%", w: "700px", h: "560px", c: "124 58 237", o: 0.11 },
    { x: "8%", y: "12%", w: "620px", h: "520px", c: "37 99 255", o: 0.08 },
  ],
  research: [
    { x: "72%", y: "26%", w: "980px", h: "700px", c: "37 99 255", o: 0.13 },
    { x: "94%", y: "40%", w: "620px", h: "520px", c: "124 58 237", o: 0.12 },
    { x: "18%", y: "70%", w: "700px", h: "520px", c: "79 209 255", o: 0.07 },
  ],
  archive: [
    { x: "78%", y: "18%", w: "900px", h: "640px", c: "79 209 255", o: 0.1 },
    { x: "96%", y: "58%", w: "620px", h: "520px", c: "124 58 237", o: 0.09 },
  ],
};

export function DiagramField({
  variant = "ecosystem",
  /** Which mask the blueprint grid uses — pick the one that clears the type. */
  gridMask = "maskRight",
  /** Soften the section's top and bottom seams. */
  fade = "none",
  className,
}: {
  variant?: Variant;
  gridMask?: "maskRight" | "maskTop" | "maskCentre" | "maskEdges";
  fade?: "none" | "top" | "bottom" | "both";
  className?: string;
}) {
  const bands = contours(variant, variant === "research" ? 7 : 6);
  const { nodes, links } = lattice(variant, variant === "archive" ? 46 : 54);

  return (
    <span aria-hidden="true" className={`${styles.field} ${className ?? ""}`}>
      {/* depth */}
      {DEPTH[variant].map((light, i) => (
        <span
          key={i}
          className={styles.light}
          style={{
            left: light.x,
            top: light.y,
            width: light.w,
            height: light.h,
            marginLeft: `calc(${light.w} / -2)`,
            marginTop: `calc(${light.h} / -2)`,
            background: `radial-gradient(closest-side, rgb(${light.c} / ${light.o}), transparent 72%)`,
          }}
        />
      ))}

      {/* blueprint */}
      <span className={`${styles.grid} ${styles[gridMask]}`} />

      {/* contour — stretched to the section, which is what a survey band
          does anyway */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className={`${styles.svg} ${styles[gridMask]}`}
      >
        {bands.map((d, i) => (
          <path
            key={d.slice(0, 12) + i}
            className={`${styles.contour} ${
              i % 3 === 2 ? styles.contourWarm : ""
            }`}
            d={d}
            opacity={0.5 + (i % 3) * 0.2}
          />
        ))}
      </svg>

      {/* lattice — its own SVG, cropped rather than stretched, so the nodes
          stay circular at every section aspect ratio */}
      <svg
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid slice"
        className={`${styles.svg} ${styles[gridMask]}`}
      >
        {links.map((link, i) => (
          <line
            key={i}
            className={styles.link}
            x1={nodes[link.a].x}
            y1={nodes[link.a].y}
            x2={nodes[link.b].x}
            y2={nodes[link.b].y}
          />
        ))}
        {nodes.map((node, i) => (
          <circle
            key={i}
            className={
              node.tone > 0.72
                ? styles.node
                : node.tone > 0.4
                  ? styles.nodeWarm
                  : styles.nodeMute
            }
            cx={node.x}
            cy={node.y}
            r={node.r}
          />
        ))}
      </svg>

      {(fade === "top" || fade === "both") && <span className={styles.fadeTop} />}
      {(fade === "bottom" || fade === "both") && (
        <span className={styles.fadeBottom} />
      )}
    </span>
  );
}
