"use client";

import Link from "next/link";
import type { ResearchArea } from "@/data/evidence";
import styles from "./research.module.css";

type AreaProduct = ResearchArea["products"][number];

/** Pills shown inside a card before the rest fold into a "+n" count. */
const PILLS_SHOWN = 5;

/**
 * One capability, as a panel rather than a left-border button.
 *
 * The previous treatment put the capability list on the left edge of the
 * column as bordered rows, and the products it carried in a separate section
 * further down the page — so "which products does this capability actually
 * inform?" needed a click and a scroll to answer. The products now sit inside
 * the card that names them, grouped and capped, which is the whole point of
 * the column.
 *
 * The card is a plain container; the selectable part is the heading block, and
 * the pills are ordinary links after it in normal flow. Keeping them in flow
 * rather than overlaying them means a card whose pills wrap to two lines still
 * lays out correctly, and tab order runs title → its products → next card.
 */
export function CapabilityCard({
  title,
  description,
  products,
  isActive,
  isLinked,
  isDimmed,
  onToggle,
  onProductFocus,
  onProductBlur,
}: {
  title: string;
  description: string;
  /** Products documented as built on this capability. */
  products: AreaProduct[];
  isActive: boolean;
  /** True when a hovered product is built on this capability. */
  isLinked: boolean;
  isDimmed: boolean;
  onToggle: () => void;
  onProductFocus: (id: string) => void;
  onProductBlur: () => void;
}) {
  const shown = products.slice(0, PILLS_SHOWN);
  const hidden = products.length - shown.length;

  return (
    <div
      className={[
        styles.capCard,
        isActive ? styles.capCardActive : "",
        isLinked && !isActive ? styles.capCardLinked : "",
        isDimmed ? styles.capCardDimmed : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        type="button"
        aria-pressed={isActive}
        onClick={onToggle}
        className="block w-full rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian-200"
      >
        <span className="flex items-start justify-between gap-4">
          <span className="min-w-0 font-display text-[1.0625rem] leading-snug text-soft-white">
            {title}
          </span>
          <span
            className={`${styles.capCount} shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em]`}
          >
            {products.length}{" "}
            {products.length === 1 ? "product" : "products"}
          </span>
        </span>
        <span className="mt-2 block text-[13px] leading-relaxed text-soft-mute">
          {description}
        </span>
      </button>

      {products.length > 0 && (
        <ul className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-white/[0.07] pt-3.5">
          {shown.map((product) => (
            <li key={product.id}>
              <Link
                href={product.href}
                onMouseEnter={() => onProductFocus(product.id)}
                onMouseLeave={onProductBlur}
                onFocus={() => onProductFocus(product.id)}
                onBlur={onProductBlur}
                className={`${styles.pill} text-[11px] font-medium`}
              >
                {product.short}
              </Link>
            </li>
          ))}
          {hidden > 0 && (
            <li>
              <span className="text-[11px] tabular-nums text-soft-mute">
                +{hidden} more
              </span>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
