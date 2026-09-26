"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/**
 * A footer link group that folds on a phone and is a plain heading + list
 * everywhere else.
 *
 * Four open columns of links were the longest thing on the mobile page after
 * the hero — 1,265px of footer, most of it links a visitor at the foot of the
 * home page is not looking for. Below 640px each group is a `<details>`:
 * closed by default, 48px summary row, the heading is the control. From 640px
 * the same markup renders open, the marker is hidden and the summary does not
 * toggle, so tablets and desktops see exactly the columns they saw before.
 *
 * HYDRATION. The server does not know the screen width, so it renders every
 * group open (the desktop truth). Before hydration a phone would show the
 * open lists for a frame and then watch them collapse; `footer-group` in
 * mobile.css hides the list until this component has mounted and decided
 * (`data-ready`), so the first paint on a phone is already the folded row.
 */
export function FooterGroup({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  const [phone, setPhone] = useState(false);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 639px)");
    const sync = () => setPhone(query.matches);
    sync();
    setReady(true);
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return (
    <details
      className="footer-group"
      open={!phone || open}
      data-ready={ready ? "true" : undefined}
      onToggle={(event) => {
        if (phone) setOpen((event.currentTarget as HTMLDetailsElement).open);
      }}
    >
      <summary
        className="footer-group__summary"
        onClick={(event) => {
          /* From 640px the group is not a control. */
          if (!phone) event.preventDefault();
        }}
      >
        {/* h2, not h4: these sit at the same level as the page's own
            sections, and jumping h1 → h4 leaves a gap for anyone navigating
            by headings. */}
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-soft-white">
          {heading}
        </h2>
        <ChevronDown aria-hidden="true" className="footer-group__chevron" />
      </summary>
      {children}
    </details>
  );
}
