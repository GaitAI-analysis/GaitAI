"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { ArrowUpRight } from "lucide-react";
import {
  CAL_EMBED_SCRIPT,
  CAL_ORIGIN,
  calPublicUrl,
  contact,
  mailSubjects,
  mailto,
  meetingTypes,
  type MeetingType,
} from "@/data/contact";
import styles from "./booking.module.css";

/* ─────────────────────────────────────────────────────────────────────────
   Cal.com's official embed, without a package.

   `@calcom/embed-react` is a thin wrapper around the same loader, so the
   page uses the loader directly: no dependency, and the 90 KB script is
   requested only when a visitor picks a meeting — not on page load, and
   never on any other route. The queue function below is Cal.com's published
   snippet, with one change: the script element gets load/error handlers so
   a blocked embed (an ad blocker, a strict network) turns into a visible
   "open on Cal.com" fallback instead of an empty box.
   ───────────────────────────────────────────────────────────────────────── */

type CalApi = ((...args: unknown[]) => void) & {
  loaded?: boolean;
  ns: Record<string, (...args: unknown[]) => void>;
  q: unknown[];
};

declare global {
  interface Window {
    Cal?: CalApi;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadCal(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const w = window;
    const push = (a: { q: unknown[] }, ar: unknown) => {
      a.q.push(ar);
    };
    if (!w.Cal) {
      const cal = function (this: unknown, ...ar: unknown[]) {
        const c = w.Cal as CalApi;
        if (!c.loaded) {
          c.ns = {};
          c.q = c.q || [];
          c.loaded = true;
        }
        if (ar[0] === "init") {
          const api = function (...args: unknown[]) {
            push(api as unknown as { q: unknown[] }, args);
          } as unknown as CalApi;
          const namespace = ar[1];
          api.q = api.q || [];
          if (typeof namespace === "string") {
            c.ns[namespace] = c.ns[namespace] || api;
            push(c.ns[namespace] as unknown as { q: unknown[] }, ar);
            push(c, ["initNamespace", namespace]);
          } else push(c, ar);
          return;
        }
        push(c, ar);
      } as unknown as CalApi;
      cal.q = [];
      cal.ns = {};
      w.Cal = cal;
    }
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${CAL_EMBED_SCRIPT}"]`);
    const script = existing ?? document.createElement("script");
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("Cal.com embed script failed to load")), { once: true });
    if (!existing) {
      script.src = CAL_EMBED_SCRIPT;
      script.async = true;
      document.head.appendChild(script);
    }
  }).catch((e) => {
    scriptPromise = null; // a later attempt may succeed (e.g. after the visitor disables a blocker)
    throw e;
  });
  return scriptPromise;
}

type EmbedState = "idle" | "loading" | "ready" | "failed";

/* The embed's own palette, matched to the site: graphite/off-white surfaces
   come from Cal's light/dark themes; the brand colour (selected day, primary
   button) is navy on light and the logo's gold on dark. */
const CAL_BRAND = { light: { "cal-brand": "#0b1739" }, dark: { "cal-brand": "#c9a44c" } };
const READY_TIMEOUT_MS = 20_000;

export function BookDemo() {
  const { resolvedTheme } = useTheme();
  const theme: "light" | "dark" = resolvedTheme === "dark" ? "dark" : "light";
  const [selected, setSelected] = useState<MeetingType["id"] | null>(null);
  const [state, setState] = useState<Record<string, EmbedState>>({});
  const mounted = useRef(new Set<string>());
  const panelRef = useRef<HTMLDivElement>(null);

  // Deep links: /book-demo/#15min and /book-demo/#30min open that calendar directly.
  useEffect(() => {
    const fromHash = () => {
      const id = window.location.hash.replace("#", "");
      if (meetingTypes.some((m) => m.id === id)) setSelected(id as MeetingType["id"]);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  const mountEmbed = useCallback(
    (m: MeetingType) => {
      if (mounted.current.has(m.id)) return;
      mounted.current.add(m.id);
      setState((s) => ({ ...s, [m.id]: "loading" }));
      const timer = window.setTimeout(() => {
        setState((s) => (s[m.id] === "ready" ? s : { ...s, [m.id]: "failed" }));
      }, READY_TIMEOUT_MS);
      /* The source of truth for "the calendar is showing": embed.js sets
         `loading="done"` (or "failed") on its <cal-inline> element when the
         iframe reports in. Watching that attribute does not depend on the
         `on` event API having been registered before the event fired. */
      const host = document.getElementById(`cal-inline-${m.id}`);
      const settle = (next: EmbedState) => {
        window.clearTimeout(timer);
        observer?.disconnect();
        setState((s) => ({ ...s, [m.id]: next }));
      };
      const observer = host
        ? new MutationObserver(() => {
            const flag = host.querySelector("cal-inline")?.getAttribute("loading");
            if (flag === "done") settle("ready");
            else if (flag === "failed") settle("failed");
          })
        : null;
      observer?.observe(host!, { subtree: true, childList: true, attributes: true, attributeFilter: ["loading"] });
      loadCal()
        .then(() => {
          const Cal = window.Cal!;
          Cal("init", m.id, { origin: CAL_ORIGIN });
          const api = Cal.ns[m.id];
          // Listeners first, so an early event is not missed; the observer above is the backstop.
          api("on", { action: "linkReady", callback: () => settle("ready") });
          api("on", { action: "linkFailed", callback: () => settle("failed") });
          api("ui", { theme, hideEventTypeDetails: false, layout: "month_view", cssVarsPerTheme: CAL_BRAND });
          api("inline", {
            elementOrSelector: `#cal-inline-${m.id}`,
            calLink: m.calLink,
            layout: "month_view",
            config: { layout: "month_view", theme },
          });
        })
        .catch(() => {
          mounted.current.delete(m.id);
          settle("failed");
        });
    },
    // The theme at mount time seeds the embed; later changes go through the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    const m = meetingTypes.find((x) => x.id === selected);
    if (m) mountEmbed(m);
  }, [selected, mountEmbed]);

  // Follow the site's theme toggle inside every calendar already on the page.
  useEffect(() => {
    const Cal = window.Cal;
    if (!Cal?.ns) return;
    mounted.current.forEach((id) => Cal.ns[id]?.("ui", { theme, cssVarsPerTheme: CAL_BRAND }));
  }, [theme]);

  const choose = (m: MeetingType) => {
    setSelected(m.id);
    if (window.location.hash !== `#${m.id}`) history.replaceState(null, "", `#${m.id}`);
    // Bring the calendar into view on phones, where it sits under both cards.
    window.requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const current = meetingTypes.find((m) => m.id === selected);

  return (
    <div className="mx-auto mt-12 max-w-5xl sm:mt-14">
      <div className={styles.options} role="group" aria-label="Meeting options">
        {meetingTypes.map((m) => {
          const active = selected === m.id;
          return (
            <article key={m.id} className={styles.option} data-active={active || undefined}>
              <span className={styles.duration}>{m.minutes} minutes</span>
              <h2 className={styles.optionTitle}>
                {m.title} <span className={styles.optionDash}>—</span> {m.minutes} Minutes
              </h2>
              <p className={styles.optionBody}>{m.description}</p>
              <div className={styles.optionActions}>
                <button
                  type="button"
                  className={styles.primary}
                  aria-pressed={active}
                  aria-controls="booking-calendar"
                  onClick={() => choose(m)}
                >
                  {active ? "Calendar open below" : `Book ${m.minutes} minutes`}
                </button>
                <a className={styles.external} href={calPublicUrl(m)} target="_blank" rel="noopener noreferrer">
                  Open on Cal.com
                  <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </div>
            </article>
          );
        })}
      </div>

      <div id="booking-calendar" ref={panelRef} className={styles.panel} hidden={!current}>
        {current ? (
          <div className={styles.panelHead}>
            <div>
              <p className={styles.panelKicker}>Pick a time</p>
              <p className={styles.panelTitle}>
                {current.title} · {current.minutes} minutes
              </p>
            </div>
            <p className={styles.panelNote}>Times are shown in your time zone; you can change it in the calendar.</p>
          </div>
        ) : null}

        {meetingTypes.map((m) => {
          const st = state[m.id] ?? "idle";
          return (
            <div key={m.id} hidden={selected !== m.id} className={styles.embedWrap}>
              {st === "loading" ? (
                <p className={styles.status} role="status" aria-live="polite">
                  Loading the calendar…
                </p>
              ) : null}
              {st === "failed" ? (
                <div className={styles.fallback} role="alert">
                  <p>The booking calendar could not load here — a content blocker or a network filter may be stopping it.</p>
                  <a className={styles.primary} href={calPublicUrl(m)} target="_blank" rel="noopener noreferrer">
                    Book the {m.minutes}-minute meeting on Cal.com
                    <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                  </a>
                </div>
              ) : null}
              <div id={`cal-inline-${m.id}`} className={styles.embed} data-state={st} />
            </div>
          );
        })}
      </div>

      <p className={styles.footnote}>
        Prefer email?{" "}
        <a href={mailto(contact.demo, mailSubjects.demo)} className={styles.inlineLink}>
          {contact.demo}
        </a>
        . Scheduling is handled by Cal.com; your details go to Cal.com and to GaitAI to arrange the meeting.
      </p>
      <noscript>
        <p className={styles.footnote}>
          Book directly on Cal.com:{" "}
          {meetingTypes.map((m, i) => (
            <span key={m.id}>
              {i ? " · " : ""}
              <a href={calPublicUrl(m)} className={styles.inlineLink}>
                {m.minutes}-minute {m.minutes === 15 ? "introduction" : "demo"}
              </a>
            </span>
          ))}
        </p>
      </noscript>
    </div>
  );
}
