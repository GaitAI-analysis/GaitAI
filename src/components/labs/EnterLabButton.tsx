"use client";

import { enterLab } from "./lab-experience-event";

/**
 * "Enter the Lab". A button, not a link: nothing navigates. It asks the
 * viewer on this page to open, and the viewer returns focus here when it
 * closes.
 */
export function EnterLabButton({
  className = "btn-primary",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button type="button" className={className} onClick={() => enterLab()}>
      {children}
    </button>
  );
}
