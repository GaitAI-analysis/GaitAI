"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "next-themes";
import {
  CAL_EMBED_SCRIPT,
  CAL_ORIGIN,
  calBookingUrl,
  calPublicUrl,
  calRescheduleUrl,
  contact,
  mailSubjects,
  mailto,
  meetingTypes,
  type MeetingType,
} from "@/data/contact";
import styles from "./booking.module.css";

/* ─────────────────────────────────────────────────────────────────────────
   GaitAI meeting booking — shared by the home contact section ("section")
   and the /book-demo route ("page").

   The calendar is Cal.com's official inline embed. Its loader is fetched only
   when a visitor picks a meeting. Cal.com reports what happens inside the
   iframe as window events named `CAL:<namespace>:<action>` (this is what the
   embed's own `on()` API subscribes to); this component listens to them
   directly:
     linkReady / linkFailed       the calendar finished loading, or could not
     bookingSuccessfulV2 (and v1) Cal.com created the booking
   The GaitAI confirmation panel is rendered ONLY from a booking event Cal.com
   sent, with the uid, times and status it reported. Nothing here invents a
   confirmation, and nothing reaches into the iframe.
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

/** Cal.com's published embed snippet, plus load/error handling on the script element. */
function loadCal(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const w = window;
    const push = (a: { q: unknown[] }, ar: unknown) => {
      a.q.push(ar);
    };
    if (!w.Cal) {
      const cal = function (...ar: unknown[]) {
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
    if (existing && (existing as HTMLScriptElement & { dataset: DOMStringMap }).dataset.loaded === "1") {
      resolve();
      return;
    }
    const script = existing ?? document.createElement("script");
    script.addEventListener("load", () => { script.dataset.loaded = "1"; resolve(); }, { once: true });
    script.addEventListener("error", () => reject(new Error("Cal.com embed script failed to load")), { once: true });
    if (!existing) {
      script.src = CAL_EMBED_SCRIPT;
      script.async = true;
      document.head.appendChild(script);
    }
  }).catch((e) => {
    scriptPromise = null; // a later attempt may succeed (e.g. after a blocker is disabled)
    throw e;
  });
  return scriptPromise;
}

let namespaceSeq = 0;

type EmbedState = "idle" | "loading" | "ready" | "failed";

export interface ConfirmedBooking {
  uid: string | null;
  title: string;
  start: Date | null;
  end: Date | null;
  status: string | null;
  joinUrl: string | null;
}

/* Cal.com's booking events, defensively read: v2 sends the booking fields at
   the top level; v1 nests them under `booking`. */
function readBooking(data: unknown, fallbackTitle: string): ConfirmedBooking | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  const b = (d.booking && typeof d.booking === "object" ? d.booking : d) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" && v ? v : null);
  const date = (v: unknown) => { const s = str(v); const t = s ? new Date(s) : null; return t && !Number.isNaN(t.getTime()) ? t : null; };
  const meta = (b.metadata && typeof b.metadata === "object" ? b.metadata : {}) as Record<string, unknown>;
  const eventType = (d.eventType && typeof d.eventType === "object" ? d.eventType : {}) as Record<string, unknown>;
  const loc = str(b.location);
  return {
    uid: str(b.uid),
    title: str(b.title) ?? str(eventType.title) ?? fallbackTitle,
    start: date(b.startTime) ?? date(d.date),
    end: date(b.endTime),
    status: str(b.status),
    joinUrl: str(d.videoCallUrl) ?? str(b.videoCallUrl) ?? str(meta.videoCallUrl) ?? (loc && /^https:\/\//.test(loc) ? loc : null),
  };
}

const CAL_BRAND = { light: { "cal-brand": "#0b1739" }, dark: { "cal-brand": "#c9a44c" } };
const READY_TIMEOUT_MS = 20_000;

/**
 * `calendarHost`: where the calendar (and the confirmation) opens. The
 * contact section passes a full-width slot under its two columns, so Cal.com
 * gets room for its side-by-side layout instead of the stacked phone layout a
 * single column forces; without a host the calendar opens under the options.
 */
export function BookingExperience({ variant = "page", calendarHost = null }: { variant?: "page" | "section"; calendarHost?: HTMLElement | null }) {
  const { resolvedTheme } = useTheme();
  const theme: "light" | "dark" = resolvedTheme === "dark" ? "dark" : "light";
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [selected, setSelected] = useState<MeetingType["id"] | null>(null);
  const [state, setState] = useState<Record<string, EmbedState>>({});
  const [booked, setBooked] = useState<ConfirmedBooking | null>(null);
  /* meeting id → embed namespace; a fresh namespace after "Book another
     meeting" so Cal.com starts a clean calendar in a new element. */
  const [spaces, setSpaces] = useState<Record<string, string>>({});
  const mounted = useRef(new Set<string>());
  const cleanups = useRef<Array<() => void>>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef(theme); themeRef.current = theme;

  useEffect(() => () => cleanups.current.forEach((f) => f()), []);

  // Deep links on the standalone page: /book-demo/#15min and /book-demo/#30min.
  useEffect(() => {
    if (variant !== "page") return;
    const fromHash = () => {
      const id = window.location.hash.replace("#", "");
      if (meetingTypes.some((m) => m.id === id)) setSelected(id as MeetingType["id"]);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [variant]);

  const mountEmbed = useCallback((m: MeetingType, ns: string) => {
    if (mounted.current.has(ns)) return;
    mounted.current.add(ns);
    setState((s) => ({ ...s, [ns]: "loading" }));
    const host = document.getElementById(`cal-${ns}`);
    let timer = 0;
    const settle = (next: EmbedState) => {
      window.clearTimeout(timer);
      observer?.disconnect();
      setState((s) => (s[ns] === next ? s : { ...s, [ns]: next }));
    };
    timer = window.setTimeout(() => setState((s) => (s[ns] === "ready" ? s : { ...s, [ns]: "failed" })), READY_TIMEOUT_MS);
    // embed.js marks its element loading="done" | "failed" — the same moment linkReady/linkFailed fire.
    const observer = host
      ? new MutationObserver(() => {
          const flag = host.querySelector("cal-inline")?.getAttribute("loading");
          if (flag === "done") settle("ready");
          else if (flag === "failed") settle("failed");
        })
      : null;
    observer?.observe(host!, { subtree: true, childList: true, attributes: true, attributeFilter: ["loading"] });

    const on = (action: string, fn: (detail: { data?: unknown }) => void) => {
      const name = `CAL:${ns}:${action}`;
      const handler = (e: Event) => fn(((e as CustomEvent).detail ?? {}) as { data?: unknown });
      window.addEventListener(name, handler);
      cleanups.current.push(() => window.removeEventListener(name, handler));
    };
    on("linkReady", () => settle("ready"));
    on("linkFailed", () => settle("failed"));
    const onBooked = (detail: { data?: unknown }) => {
      const b = readBooking(detail.data, m.title);
      if (b) setBooked(b);
    };
    on("bookingSuccessfulV2", onBooked);
    on("bookingSuccessful", (detail) => setBooked((cur) => cur ?? readBooking(detail.data, m.title)));

    loadCal()
      .then(() => {
        const Cal = window.Cal!;
        Cal("init", ns, { origin: CAL_ORIGIN });
        const api = Cal.ns[ns];
        api("ui", { theme: themeRef.current, hideEventTypeDetails: false, layout: "month_view", cssVarsPerTheme: CAL_BRAND });
        api("inline", {
          elementOrSelector: `#cal-${ns}`,
          calLink: m.calLink,
          layout: "month_view",
          config: { layout: "month_view", theme: themeRef.current },
        });
      })
      .catch(() => {
        mounted.current.delete(ns);
        settle("failed");
      });
  }, []);

  useEffect(() => {
    const m = meetingTypes.find((x) => x.id === selected);
    if (!m) return;
    const ns = spaces[m.id];
    if (!ns) {
      setSpaces((s) => ({ ...s, [m.id]: `g${uid}n${++namespaceSeq}m${m.id}` }));
      return;
    }
    mountEmbed(m, ns);
  }, [selected, spaces, uid, mountEmbed]);

  // Follow the site's theme toggle inside every calendar already on the page.
  useEffect(() => {
    const Cal = window.Cal;
    if (!Cal?.ns) return;
    mounted.current.forEach((ns) => Cal.ns[ns]?.("ui", { theme, cssVarsPerTheme: CAL_BRAND }));
  }, [theme]);

  const choose = (m: MeetingType) => {
    // After a booking, picking a meeting again starts a new booking in a fresh calendar.
    if (booked) {
      setBooked(null);
      setSpaces((s) => ({ ...s, [m.id]: "" }));
    }
    setSelected(m.id);
    if (variant === "page" && window.location.hash !== `#${m.id}`) history.replaceState(null, "", `#${m.id}`);
    window.requestAnimationFrame(() => {
      const el = panelRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top;
      if (top > window.innerHeight * 0.7) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const bookAnother = () => {
    setBooked(null);
    if (selected) setSpaces((s) => ({ ...s, [selected]: "" }));
  };

  const current = meetingTypes.find((m) => m.id === selected) ?? null;
  const headingId = `${uid}-booking-heading`;

  return (
    <div className={styles.experience} data-variant={variant}>
      {variant === "section" ? (
        <header className={styles.sectionHead}>
          <h3 id={headingId} className={styles.sectionTitle}>
            Let&rsquo;s Explore Movement Intelligence <span className={styles.titleAccent}>Together</span>
          </h3>
          <p className={styles.sectionLead}>
            Connect with GaitAI Research Labs to discuss our solutions, research collaborations, and technical opportunities.
          </p>
        </header>
      ) : null}

      {/* The options stay on screen after a booking, so the panel never empties out. */}
      {(
        <div className={styles.options} role="radiogroup" aria-label="Meeting type" data-variant={variant}>
          {meetingTypes.map((m) => {
            const active = !booked && selected === m.id;
            return (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={active}
                aria-controls={`${uid}-calendar`}
                className={styles.option}
                data-active={active || undefined}
                onClick={() => choose(m)}
              >
                <span className={styles.optionTop}>
                  <span className={styles.optionTitle}>{m.title}</span>
                  <span className={styles.duration}>{m.minutes} minutes</span>
                </span>
                <span className={styles.optionBody}>{m.description}</span>
                <span className={styles.optionCue} aria-hidden="true">
                  {active ? "Selected" : "Choose a time"}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {(() => {
        const reveal = (
      <div
        id={`${uid}-calendar`}
        ref={panelRef}
        className={`${styles.reveal} ${calendarHost ? styles.tokens : ""}`}
        data-open={current || booked ? "true" : undefined}
        data-hosted={calendarHost ? "true" : undefined}
      >
        <div className={styles.revealInner}>
          {booked ? (
            <Confirmation booking={booked} onAnother={bookAnother} />
          ) : (
            <div className={styles.panel}>
              {current ? (
                <div className={styles.panelHead}>
                  <p className={styles.panelTitle}>
                    {current.title} <span className={styles.panelDim}>· {current.minutes} minutes</span>
                  </p>
                  <p className={styles.panelNote}>Times appear in your time zone, which you can change in the calendar.</p>
                </div>
              ) : null}
              {meetingTypes.map((m) => {
                const ns = spaces[m.id];
                if (!ns) return null;
                const st = state[ns] ?? "idle";
                return (
                  <div key={ns} hidden={selected !== m.id} className={styles.embedWrap}>
                    {st === "loading" ? (
                      <p className={styles.status} role="status" aria-live="polite">Loading available times…</p>
                    ) : null}
                    {st === "failed" ? (
                      <div className={styles.fallback} role="alert">
                        <p>The calendar could not load here — a content blocker or network filter may be stopping it.</p>
                        <a className={styles.fallbackLink} href={calPublicUrl(m)} target="_blank" rel="noopener noreferrer">
                          Book the {m.minutes}-minute meeting in a new tab
                        </a>
                      </div>
                    ) : null}
                    <div id={`cal-${ns}`} className={styles.embed} data-state={st} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
        );
        return calendarHost ? createPortal(reveal, calendarHost) : reveal;
      })()}

      {variant === "page" ? (
        <p className={styles.footnote}>
          Prefer email?{" "}
          <a href={mailto(contact.demo, mailSubjects.demo)} className={styles.inlineLink}>{contact.demo}</a>
        </p>
      ) : null}
    </div>
  );
}

/* ── Confirmation ─────────────────────────────────────────────────────── */

const pad = (n: number) => String(n).padStart(2, "0");
const icsStamp = (d: Date) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
const icsText = (s: string) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");

function Confirmation({ booking, onAnother }: { booking: ConfirmedBooking; onAnother: () => void }) {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const accepted = !booking.status || /^accepted$/i.test(booking.status);
  const day = booking.start?.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const time = (d: Date | null) => d?.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const minutes = booking.start && booking.end ? Math.round((booking.end.getTime() - booking.start.getTime()) / 60000) : null;
  const manage = booking.uid ? calBookingUrl(booking.uid) : null;
  const details = [`GaitAI Research Labs — ${booking.title}`, booking.joinUrl ? `Join: ${booking.joinUrl}` : "", manage ? `Manage: ${manage}` : ""].filter(Boolean).join("\n");

  const google = booking.start && booking.end
    ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(booking.title)}&dates=${icsStamp(booking.start)}/${icsStamp(booking.end)}&details=${encodeURIComponent(details)}${booking.joinUrl ? `&location=${encodeURIComponent(booking.joinUrl)}` : ""}`
    : null;
  const downloadIcs = () => {
    if (!booking.start || !booking.end) return;
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//GaitAI//Booking//EN", "BEGIN:VEVENT",
      `UID:${booking.uid ?? icsStamp(booking.start)}@gaitai.in`, `DTSTAMP:${icsStamp(new Date())}`,
      `DTSTART:${icsStamp(booking.start)}`, `DTEND:${icsStamp(booking.end)}`,
      `SUMMARY:${icsText(booking.title)}`, `DESCRIPTION:${icsText(details)}`,
      booking.joinUrl ? `LOCATION:${icsText(booking.joinUrl)}` : "",
      "END:VEVENT", "END:VCALENDAR",
    ].filter(Boolean).join("\r\n");
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = "gaitai-meeting.ics"; a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  return (
    <div className={styles.confirm} role="status" aria-live="polite">
      <p className={styles.confirmKicker}>{accepted ? "Meeting confirmed" : "Request received"}</p>
      <h3 className={styles.confirmTitle}>{booking.title}</h3>
      {day ? (
        <dl className={styles.confirmFacts}>
          <div><dt>Date</dt><dd>{day}</dd></div>
          <div><dt>Time</dt><dd>{time(booking.start)}{booking.end ? ` – ${time(booking.end)}` : ""} <span className={styles.panelDim}>({tz})</span></dd></div>
          {minutes ? <div><dt>Duration</dt><dd>{minutes} minutes</dd></div> : null}
          <div><dt>With</dt><dd>GaitAI Research Labs</dd></div>
        </dl>
      ) : null}
      <p className={styles.confirmNote}>
        {accepted
          ? "A calendar invitation with the meeting details has been sent to the email address you entered."
          : "The booking is waiting for GaitAI to confirm it. You will receive an email when it is confirmed."}
      </p>
      <div className={styles.confirmActions}>
        {booking.joinUrl ? <a className={styles.primary} href={booking.joinUrl} target="_blank" rel="noopener noreferrer">Meeting link</a> : null}
        {google ? <a className={styles.secondary} href={google} target="_blank" rel="noopener noreferrer">Add to Google Calendar</a> : null}
        {booking.start && booking.end ? <button type="button" className={styles.secondary} onClick={downloadIcs}>Download .ics</button> : null}
      </div>
      <p className={styles.confirmManage}>
        {booking.uid ? (
          <>
            Need a change?{" "}
            <a className={styles.inlineLink} href={calRescheduleUrl(booking.uid)} target="_blank" rel="noopener noreferrer">Reschedule</a>
            {" · "}
            <a className={styles.inlineLink} href={calBookingUrl(booking.uid)} target="_blank" rel="noopener noreferrer">Cancel</a>
            {" · "}
          </>
        ) : null}
        <button type="button" className={styles.textButton} onClick={onAnother}>Book another meeting</button>
      </p>
    </div>
  );
}
