"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { ChatLauncher } from "./ChatLauncher";
import { ASK_EVENT, ASSISTANT_ENABLED, type AskEventDetail } from "./config";
import { recordAssistantEvent } from "@/lib/assistant-stats";
import { readPageContext, type PageContext } from "./page-context";
import styles from "./assistant.module.css";

/**
 * The panel is fetched on first open, not on page load.
 *
 * It used to be a static import, and the claim below it — that the panel, the
 * conversation hook and the markdown renderer "sit behind that first click" —
 * was true of RENDERING and false of DOWNLOADING: all of it was bundled into
 * the root layout chunk, so every visitor to every page paid for a panel most
 * of them never open. `ssr: false` because there is nothing to prerender —
 * the panel does not exist until a button is pressed.
 */
const ChatPanel = dynamic(
  () => import("./ChatPanel").then((m) => m.ChatPanel),
  { ssr: false },
);

/**
 * THE PHONE LAUNCHER STEPS ASIDE WHILE THE PAGE IS BEING READ.
 * =============================================================================
 * A fixed circle in the bottom-right corner of a 390px screen sits over the
 * last line of whatever is scrolling past it — a call to action, the end of
 * a paragraph, a card's link. Tested on a real phone, it covered something
 * on nearly every screen of the home page. So below 1024px (phones, and
 * tablets, where the pill has no margin of its own either) it behaves like a
 * well-mannered FAB:
 *
 *   - reading down the page (scrolling down) parks it off the bottom edge;
 *   - a scroll back up, however small, brings it back;
 *   - it stays parked while the demo form or the footer is on screen, which
 *     are the two places where covering a control does the most damage;
 *   - it is parked on the first screen, where the home hero's calls to
 *     action sit in this very corner, and never parked while the panel is
 *     open. The menu sheet carries Ask GaitAI as a row of its own, so the
 *     assistant is always one tap away whatever the launcher is doing.
 *
 * Desktop is untouched: the pill there sits in a margin the layout leaves
 * for it. Returns `false` from 1024px.
 */
function useLauncherParked(open: boolean, pathname: string | null) {
  const [parked, setParked] = useState(false);

  useEffect(() => {
    const phone = window.matchMedia("(max-width: 1023px)");
    setParked(false);
    if (!phone.matches) return;

    let lastY = window.scrollY;
    let down = false;
    let footerNear = false;
    let frame = 0;

    const apply = () => {
      frame = 0;
      const y = window.scrollY;
      const delta = y - lastY;
      /* Ignore sub-pixel jitter and rubber-banding at the very top. */
      if (Math.abs(delta) > 6) {
        down = delta > 0;
        lastY = y;
      }
      /* The first screen is parked too: on the home page the hero's calls
         to action sit exactly in this corner at rest, and every other
         route opens on a heading. The launcher arrives with the first
         scroll back up, wherever that is. */
      const atTop = y < 160;
      setParked(atTop || down || footerNear);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(apply);
    };

    /* The footer and the demo form: while either is in view the launcher
       stays out of the way regardless of scroll direction. */
    const guarded = [
      document.querySelector("footer"),
      document.querySelector("#contact form"),
    ].filter((node): node is Element => Boolean(node));
    const seen = new Set<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) seen.add(entry.target);
          else seen.delete(entry.target);
        }
        footerNear = seen.size > 0;
        onScroll();
      },
      { rootMargin: "0px 0px -20% 0px", threshold: 0 },
    );
    guarded.forEach((node) => observer.observe(node));

    window.addEventListener("scroll", onScroll, { passive: true });
    apply();
    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
    };
    /* Re-bound per route: the form and the footer are found by query, and a
       client-side navigation swaps the page under this root-level mount. */
  }, [pathname]);

  return parked && !open;
}

/**
 * ASK GAITAI — the mount point.
 * =============================================================================
 * One instance, at the app root, over every route. It OVERLAYS the page: it
 * adds nothing to the document flow, changes no layout, and touches no shared
 * chrome, so every existing route renders exactly as it did before.
 *
 * It renders NOTHING until the launcher is pressed, and it DOWNLOADS nothing
 * either: the panel is a dynamic import, so the conversation hook, the answer
 * renderer and the transcript are fetched by the click that needs them. The
 * cost on a page nobody asks a question on is one button.
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
  /* A question handed over from somewhere else — the search palette — to be
     asked as soon as the panel mounts. Cleared once consumed so re-opening
     the panel later does not re-ask it. */
  const [handoff, setHandoff] = useState("");

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

  /* One place records the open, so the count is the same whether the visitor
     pressed the launcher or arrived from the search palette. */
  const pageTypeRef = useRef(page.pageType);
  pageTypeRef.current = page.pageType;

  const openPanel = useCallback((question = "") => {
    setHandoff(question);
    setOpen(true);
    recordAssistantEvent("opens", pageTypeRef.current);
  }, []);

  /* "Ask GaitAI" from the search palette. Listening here rather than exporting
     a setter keeps the two surfaces independent: search does not import the
     assistant, and the assistant does not know search exists. */
  useEffect(() => {
    const onRequest = (event: Event) => {
      const detail = (event as CustomEvent<AskEventDetail>).detail;
      openPanel(detail?.question ?? "");
    };
    window.addEventListener(ASK_EVENT, onRequest);
    return () => window.removeEventListener(ASK_EVENT, onRequest);
  }, [openPanel]);

  const close = useCallback(() => setOpen(false), []);

  /* Following a link the assistant gave should take the reader to the page, so
     the panel steps out of the way — on mobile, where it covers everything,
     always; on desktop it would otherwise sit over the destination. */
  const navigate = useCallback(() => {
    recordAssistantEvent("links", pageTypeRef.current);
    setOpen(false);
  }, []);

  const parked = useLauncherParked(open, pathname);

  if (!ASSISTANT_ENABLED) return null;

  return (
    <div className={styles.root} data-open={open} data-parked={parked}>
      {open ? (
        <ChatPanel
          page={page}
          initialQuestion={handoff}
          onClose={close}
          onNavigate={navigate}
        />
      ) : null}
      <ChatLauncher
        ref={launcherRef}
        hidden={open}
        onOpen={() => openPanel()}
      />
    </div>
  );
}
