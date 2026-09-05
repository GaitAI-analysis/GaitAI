"use client";

import type { LabAction } from "@/data/labs";
import { runLabAction } from "./lab-actions";

/**
 * The /labs row for a lab that is an ACTION rather than a place.
 *
 * Visually it is the same row as every other — the page hands it the same
 * class list and the same children — but it is a `<button>`, because a
 * control that does not navigate must not be an anchor: a link with no real
 * destination lies to the address bar, to a screen reader and to anyone who
 * middle-clicks it. A button gives Enter and Space for free, sits in the
 * same tab order, and never causes a navigation to prevent.
 *
 * Focus return is the overlay's job, not this row's: the Atlas records
 * `document.activeElement` when it mounts and refocuses it when it closes,
 * which is this button when the reader came from here.
 */
export function LabActionRow({
  action,
  label,
  className,
  children,
}: {
  action: LabAction;
  /** The accessible name — "Open GaitAI Atlas: …" — matching the link rows. */
  label: string;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => runLabAction(action)}
      /* A button centres its text and shrinks to fit; the row is a full-width
         grid with left-aligned type, so both are said explicitly. */
      className={`${className} w-full text-left`}
    >
      {children}
    </button>
  );
}
