"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ChatLauncher } from "./ChatLauncher";
import { ChatPanel } from "./ChatPanel";
import { ASSISTANT_ENABLED } from "./config";
import { readPageContext, type PageContext } from "./page-context";
import styles from "./assistant.module.css";

/**
 * ASK GAITAI — the mount point.
 * =============================================================================
 * One instance, at the app root, over every route. It OVERLAYS the page: it
 * adds nothing to the document flow, changes no layout, and touches no shared
 * chrome, so every existing route renders exactly as it did before.
 *
 * It renders NOTHING until the launcher is pressed — the panel, the conversation
 * hook and the markdown renderer all sit behind that first click, so the cost on
 * a page a visitor never asks a question on is one button.
 *
 * If no endpoint is configured the whole thing is absent rather than broken.
 */
export function AskGaitAI() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState<PageContext>({
    pathname: "/",
    pageType: "home",
    slug: "",
    family: "",
    title: "",
  });
  const launcherRef = useRef<HTMLButtonElement>(null);

  /*
   * Read the route AFTER paint. `document.title` is what gives the panel the
   * record's display name ("Questions about FallRisk?"), and Next writes it
   * during the commit — reading it in the same tick as the pathname change
   * yields the PREVIOUS page's title on every client-side navigation.
   */
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setPage(readPageContext(pathname ?? "/"));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  /*
   * Focus returns to the launcher when the panel closes — but only once the
   * launcher is back on screen. Calling focus() inside the close handler aims
   * at the element as it is BEFORE the re-render, when it is still hidden, and
   * the browser drops the call; the keyboard user is then left at the top of
   * the document. An effect on the flag runs after commit, which is when the
   * target actually exists to be focused.
   */
  const wasOpen = useRef(false);
  useEffect(() => {
    if (wasOpen.current && !open) launcherRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  /* Following a link the assistant gave should take the reader to the page, so
     the panel steps out of the way — on mobile, where it covers everything,
     always; on desktop it would otherwise sit over the destination. */
  const navigate = useCallback(() => setOpen(false), []);

  if (!ASSISTANT_ENABLED) return null;

  return (
    <div className={styles.root} data-open={open}>
      {open ? (
        <ChatPanel page={page} onClose={close} onNavigate={navigate} />
      ) : null}
      <ChatLauncher
        ref={launcherRef}
        hidden={open}
        onOpen={() => setOpen(true)}
      />
    </div>
  );
}
