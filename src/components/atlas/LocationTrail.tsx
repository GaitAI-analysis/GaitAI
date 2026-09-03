"use client";

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
 * "YOU ARE HERE" APPEARS ONCE. On the current node, on desktop only. The
 * filled disc already says it; the words are for the reader who has not yet
 * learned that.
 *
 * WHY CLIENT-SIDE. `usePathname` is the only way one component in the layout
 * can serve every route, including the ~50 generated ones, without each page
 * having to declare its own position — which is exactly the drift this
 * feature exists to prevent. The tree itself is static data, so this costs a
 * hook and no fetch.
 */
export function LocationTrail() {
  const pathname = usePathname() || "/";

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

        {/* Said once, beside the node it describes. */}
        <span aria-hidden="true" data-family={current.family} className={styles.here}>
          You are here
        </span>

        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent(ATLAS_EVENT))}
          aria-label="Open the GaitAI Atlas — the whole site as a map"
          title="GaitAI Atlas"
          className={styles.open}
        >
          <MapGlyph />
          <span className={styles.openLabel}>Atlas</span>
        </button>
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
