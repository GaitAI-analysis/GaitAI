"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { atlasTrail } from "@/data/site-map";
import { ATLAS_EVENT } from "./atlas-event";
import styles from "./atlas.module.css";

/**
 * "YOU ARE HERE" — the persistent half of the Atlas.
 *
 * A 26px strip under the header answering the one question a first-time
 * visitor on a seventy-page site cannot otherwise answer: what contains this
 * page, and what is above it.
 *
 *   ○ GaitAI ── ○ Products ── ○ MobilityCare ── ● WalkScan   YOU ARE HERE
 *
 * NOT A BREADCRUMB, VISUALLY. Nodes and a hairline rather than slashes: a
 * ring for a place you can go, a filled disc for the place you are, and the
 * connector into the current node carrying the only colour in the strip.
 *
 * A BREADCRUMB, MACHINE-READABLY. The same trail is emitted as
 * BreadcrumbList JSON-LD, which the site had nowhere before, so the path a
 * reader sees and the path a crawler reads come from one source and cannot
 * disagree.
 *
 * "YOU ARE HERE" IS A GREETING, NOT A LABEL. It fades in a fifth of a second
 * after a new route lands, holds for about a second, and then hands its place
 * to the Atlas button — which is what stays. Permanent words would be a
 * caption on a strip that is already only 26px tall, and by the second page a
 * reader has learned what a filled disc means; the transient version teaches
 * the same thing once and then gets out of the way.
 *
 * ONE SLOT, TWO OCCUPANTS. The words and the button are stacked in a single
 * fixed-width box, both absolutely positioned, so the swap is a cross-fade in
 * place rather than a reflow. Nothing in the strip or the hero below it moves
 * by a pixel, which is the whole reason the box has a reserved width instead
 * of letting content size it.
 *
 * IT REPLAYS ON ROUTES, NOT ON INTERACTIONS. The effect keys on
 * `usePathname()`, which in the App Router excludes the query and the hash —
 * so scrolling, opening a disclosure, switching a filter, changing the theme
 * and jumping to #section all leave it alone. A genuine navigation, forward
 * or back, plays it once.
 *
 * THE BUTTON NEVER LEAVES THE ACCESSIBILITY TREE. It is in the DOM and
 * focusable for the whole 1.2s, only transparent — and `:focus-visible`
 * overrides the phase, so a keyboard user who tabs there during the greeting
 * sees the control they just landed on rather than an invisible one.
 *
 * WHY CLIENT-SIDE. `usePathname` is the only way one component in the layout
 * can serve every route, including the ~50 generated ones, without each page
 * having to declare its own position — which is exactly the drift this
 * feature exists to prevent. The tree itself is static data, so this costs a
 * hook and no fetch.
 */
/**
 * THE TIMELINE. Read it here; the stylesheet only holds the durations.
 *
 *   0.06s  the words begin to arrive (0.42s fade)
 *   0.48s  fully visible
 *   2.00s  the words begin to leave (2s fade)
 *   4.00s  gone
 *   4.00s  the map icon arrives (0.3s fade, 0.92 -> 1)
 *
 * IT WAS TOO FAST TO READ. The first version held for about half a second
 * between a 0.3s fade in and a 0.3s fade out, which is enough to notice
 * something happened and not enough to read three words — it flashed. The
 * hold is the whole point of the greeting, so it is now measured in seconds,
 * and the exit is slow enough to read as a handover rather than a disappear.
 *
 * NOTHING IS EVER UNMOUNTED. Both occupants stay in the DOM for the life of
 * the page and only their opacity moves, so there is no timer that can remove
 * the element mid-fade and no state in which a fade is cut short. That is why
 * the numbers below are the whole story: there is no second, shorter clock
 * hiding in a `display: none`.
 *
 * FOUR STATES, NOT A transition-delay. A delayed transition is a promise the
 * browser keeps only while it is still animating the page: once everything
 * settles, a transition that has not started yet can simply never run, and
 * the control stays invisible with no way to recover it. Every visual change
 * is a state flip with no delay attached.
 */
const GREET_IN_MS = 60;
const GREET_OUT_MS = 2000;
const ATLAS_IN_MS = 4000;

export function LocationTrail() {
  const pathname = usePathname() || "/";

  /* idle → here → leaving → atlas. Separate states rather than a boolean:
     the entrance, the hold, the exit and the arrival are four different
     moments, and driving them from one flag means fighting the browser over
     whether a freshly-mounted element should animate at all. */
  const [phase, setPhase] = useState<"idle" | "here" | "leaving" | "atlas">(
    "idle",
  );

  useEffect(() => {
    setPhase("idle");
    const enter = setTimeout(() => setPhase("here"), GREET_IN_MS);
    const leave = setTimeout(() => setPhase("leaving"), GREET_OUT_MS);
    const arrive = setTimeout(() => setPhase("atlas"), ATLAS_IN_MS);
    return () => {
      clearTimeout(enter);
      clearTimeout(leave);
      clearTimeout(arrive);
    };
  }, [pathname]);

  /* The two places the strip would be noise rather than orientation: the
     admin console, which is not part of the public site, and a 404, which has
     no location by definition. */
  if (pathname.startsWith("/admin-controlpanel")) return null;

  const trail = atlasTrail(pathname);
  const current = trail[trail.length - 1];

  return (
    <div className={`${styles.scope} container-wide`}>
      <nav aria-label="You are here" className={styles.trail}>
        <ol className={styles.path}>
          {trail.map((node, i) => {
            const isCurrent = i === trail.length - 1;
            const isLead = i === trail.length - 2;
            return (
              <li
                key={node.id}
                data-family={node.family}
                className={`${styles.step} ${
                  /* Ancestors fold away on a phone; the current place stays. */
                  isCurrent ? "" : styles.stepHideMobile
                }`}
              >
                {i > 0 && (
                  <span
                    aria-hidden="true"
                    className={`${styles.link} ${isLead ? styles.linkOn : ""}`}
                  />
                )}
                {node.route && !isCurrent ? (
                  <Link href={node.route} className={styles.node}>
                    <span aria-hidden="true" className={styles.mark} />
                    {node.label}
                  </Link>
                ) : (
                  <span
                    className={`${styles.node} ${
                      isCurrent ? styles.current : ""
                    }`}
                    aria-current={isCurrent ? "page" : undefined}
                  >
                    <span aria-hidden="true" className={styles.mark} />
                    <span className={styles.currentLabel}>{node.label}</span>
                  </span>
                )}
              </li>
            );
          })}
        </ol>

        {/* One reserved box holding both, so the handover cannot move the
            strip. The greeting is decorative — `aria-current` on the node
            above is what actually states the location — and the button is the
            real control that outlives it. */}
        <span
          className={styles.slot}
          data-phase={phase}
          data-family={current.family}
        >
          <span aria-hidden="true" className={styles.here}>
            You are here
          </span>

          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent(ATLAS_EVENT))}
            aria-label="Open GaitAI Atlas"
            title="Explore GaitAI Atlas"
            className={styles.open}
          >
            <MapGlyph />
          </button>
        </span>
      </nav>

      {/* The same path, for machines. Anchors are dropped: a BreadcrumbList
          item has to be a page. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: trail
              .filter((node) => node.route && !node.route.includes("#"))
              .map((node, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: node.label,
                item: `https://gaitai.in${node.route}`,
              })),
          }),
        }}
      />
    </div>
  );
}

/** Three nodes and two edges. The map, at 12px. */
function MapGlyph() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      className={styles.openGlyph}
    >
      <path d="M3 3.6h3.2M6.2 3.6v8.8H3" strokeLinecap="round" />
      <path d="M6.2 8h3.4" strokeLinecap="round" />
      <circle cx="12.2" cy="3.6" r="1.6" />
      <circle cx="12.2" cy="8" r="1.6" />
      <circle cx="12.2" cy="12.4" r="1.6" />
    </svg>
  );
}
