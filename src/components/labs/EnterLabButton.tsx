"use client";

import { enterLab } from "./lab-experience-event";

/**
 * "Enter the Lab". A button, not a link: nothing navigates. It asks the
 * viewer on this page to open, handing it the cover photograph's rectangle so
 * the room opens by expanding that same picture, and the viewer returns focus
 * here when it closes.
 *
 * Nothing is prefetched. The real room is the photograph the page already
 * shows; the three-dimensional twin is a separate chunk that loads only when
 * a reader chooses it inside the viewer.
 */
export function EnterLabButton({
  className = "btn-primary",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        const cover = document.querySelector<HTMLImageElement>('main img[src*="lab-cover"]');
        enterLab({ from: cover?.getBoundingClientRect() });
      }}
    >
      {children}
    </button>
  );
}
