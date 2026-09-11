"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { EnvironmentScene } from "@/components/visuals/EnvironmentScenes";
import styles from "./environments.module.css";

export interface ExplorerCard {
  /** `industryUseCases` id — also the key `EnvironmentScene` draws from. */
  id: string;
  name: string;
  outcome: string;
  href: string;
}

export interface ExplorerContext {
  id: string;
  name: string;
  href: string;
}

export interface ExplorerCategory {
  id: string;
  label: string;
  blurb: string;
  count: number;
  family: "mobilitycare" | "securevision" | "mixed";
  familyHref: string;
  familyLabel: string;
  cards: ExplorerCard[];
  /**
   * Configurations of a single product, not further environments. Only
   * Defence has them: Army, Navy and Air Force are service modes of
   * DefenceMotion, and rendering them as three more cards would claim three
   * more products. They are chips under the card, all pointing at the one
   * product page that documents them.
   */
  contexts?: ExplorerContext[];
  contextNote?: string;
}

/**
 * WHERE GAITAI IS USED — a category index, not the catalogue.
 * =============================================================================
 * Eighteen environments used to be eighteen panels down two rails: about
 * 2,000px of page whose message was "there are a lot of these". The breadth is
 * real, and a visitor looking for their own environment had to read the whole
 * list to find it.
 *
 * Seven categories now stand in front of the same eighteen records. Choosing
 * one shows the three to five environments in it. Nothing is dropped, nothing
 * is restated by hand — every card renders that environment's own `industry`
 * and `outcome` — and the total is still eighteen, derived, in the heading.
 *
 * THE SEO DECISION, STATED PLAINLY
 *
 * Every panel is in the DOM at every moment. Inactive ones carry `hidden`,
 * which is exactly one attribute away from what was there before: a crawler
 * reads all seven headings, all eighteen environment names, all eighteen
 * outcome lines and all eighteen links, and so does a reader with JavaScript
 * turned off — who gets, without the panel script, a page with every category
 * open rather than a page with none. Hiding content behind a fetch would have
 * been the version that costs crawlability; hiding it behind an attribute does
 * not.
 *
 * The controls are a real `tablist`: `aria-selected` on the tab, `aria-controls`
 * at the panel it governs, `role="tabpanel"` with `aria-labelledby` back at the
 * tab, roving `tabIndex` so the group is one tab stop, and arrows / Home / End
 * inside it. This is the same control the capture-chain selector uses; the
 * vocabulary is shared on purpose.
 *
 * DEEP LINKS. `/#use-cases` opens the section on its first category.
 * `/#use-cases-defence` opens it on Defence — the hash is read once on arrival
 * and again on `hashchange`, so a link pasted into a fresh tab and a link
 * clicked from elsewhere on the page behave identically.
 */
export function EnvironmentExplorerView({
  categories,
  allHref,
  total,
}: {
  categories: ExplorerCategory[];
  allHref: string;
  total: number;
}) {
  const [active, setActive] = useState(categories[0]?.id ?? "");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const baseId = useId();
  const tabId = (id: string) => `${baseId}-tab-${id}`;
  const panelId = (id: string) => `${baseId}-panel-${id}`;

  /**
   * `#use-cases-<category>` selects that category. Read on arrival and on
   * every later hash change, so a pasted URL and an in-page link behave
   * identically.
   *
   * IT ALSO SCROLLS, and that is the one place on this page where script
   * moves the viewport. `#use-cases` is a real element and the browser
   * handles it; `#use-cases-defence` names a STATE of that element, so there
   * is nothing for the browser to scroll to and a pasted link would otherwise
   * open the right category at the top of the page. This finishes a
   * navigation the platform cannot, rather than replacing one it can — and it
   * targets the section element, so where it lands is the same
   * `scroll-margin-top` every other section anchor uses.
   */
  useEffect(() => {
    const apply = (navigated: boolean) => {
      const hash = window.location.hash.replace(/^#use-cases-?/, "");
      if (!hash || !categories.some((category) => category.id === hash)) return;
      setActive(hash);
      if (!navigated) return;
      const section = document.getElementById("use-cases");
      section?.scrollIntoView({
        block: "start",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
    };
    /* On arrival the scroll waits a frame: the browser has already tried and
       failed to resolve the fragment, and scrolling in the same tick as that
       attempt gets overwritten by it. */
    const raf = requestAnimationFrame(() => apply(true));
    const onHashChange = () => apply(true);
    window.addEventListener("hashchange", onHashChange);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, [categories]);

  const move = (from: number, step: number) => {
    const next = (from + step + categories.length) % categories.length;
    setActive(categories[next].id);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className={styles.explorer}>
      <div
        role="tablist"
        aria-label="Environment categories"
        aria-orientation="horizontal"
        className={styles.rail}
      >
        {categories.map((category, i) => {
          const on = category.id === active;
          return (
            <button
              key={category.id}
              ref={(node) => {
                tabRefs.current[i] = node;
              }}
              id={tabId(category.id)}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls={panelId(category.id)}
              tabIndex={on ? 0 : -1}
              onClick={() => setActive(category.id)}
              onKeyDown={(event) => {
                const key = event.key;
                if (key === "ArrowRight" || key === "ArrowDown") {
                  event.preventDefault();
                  move(i, 1);
                } else if (key === "ArrowLeft" || key === "ArrowUp") {
                  event.preventDefault();
                  move(i, -1);
                } else if (key === "Home") {
                  event.preventDefault();
                  move(0, 0);
                } else if (key === "End") {
                  event.preventDefault();
                  move(categories.length - 1, 0);
                }
              }}
              className={styles.tab}
              data-on={on}
            >
              {category.label}
              <span aria-hidden="true" className={styles.tabCount}>
                {category.count}
              </span>
            </button>
          );
        })}
      </div>

      {categories.map((category) => {
        const on = category.id === active;
        return (
          <div
            key={category.id}
            id={panelId(category.id)}
            role="tabpanel"
            aria-labelledby={tabId(category.id)}
            hidden={!on}
            tabIndex={0}
            className={styles.panel}
          >
            <p className={styles.blurb}>{category.blurb}</p>

            <ul className={styles.cards}>
              {category.cards.map((card) => (
                <li key={card.id}>
                  <Link
                    href={card.href}
                    className={`${styles.card} ${
                      category.family === "securevision"
                        ? styles.cardSecure
                        : styles.cardCare
                    }`}
                  >
                    <span aria-hidden="true" className={styles.scene}>
                      <EnvironmentScene id={card.id} />
                    </span>
                    <span className={styles.copy}>
                      <span className={styles.name}>{card.name}</span>
                      <span className={styles.outcome}>{card.outcome}</span>
                    </span>
                    <ArrowUpRight aria-hidden="true" className={styles.arrow} />
                  </Link>
                </li>
              ))}
            </ul>

            {category.contexts && category.contexts.length > 0 && (
              <div className={styles.contexts}>
                <p className={styles.contextsHead}>
                  {category.contextNote}
                </p>
                <ul className={styles.chips}>
                  {category.contexts.map((context) => (
                    <li key={context.id}>
                      <Link href={context.href} className={styles.chip}>
                        {context.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className={styles.panelFoot}>
              <Link href={category.familyHref} className={styles.footLink}>
                {category.familyLabel}
                <ArrowUpRight aria-hidden="true" className={styles.footArrow} />
              </Link>
              <Link href={allHref} className={styles.footLink}>
                Explore all {total} use cases
                <ArrowUpRight aria-hidden="true" className={styles.footArrow} />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
