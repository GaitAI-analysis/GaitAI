"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { HERO_SCENE, type HeroOptionId } from "@/data/home-hero";
import { HERO_GAIT } from "@/data/hero-walk";
import { HERO_MOBILE, HERO_MOBILE_DETAILS, type Crop } from "@/data/home-hero-mobile";
import { subscribeGait } from "@/lib/gaitBus";
import { ThemePicture } from "@/components/ui/ThemePicture";
import { HeroWalker } from "./HeroWalker";
import styles from "./heromobile.module.css";

/**
 * THE PHONE HERO — a composition of its own, not the panorama made smaller.
 * =============================================================================
 * Below 1024px the desktop picture would be 219px tall with its three pills
 * on top of each other, so the hero is recomposed for a thumb (see
 * data/home-hero-mobile.ts for the layout and the crops): the walking engine
 * as the tall tile, SecureVision and MobilityCare beside it, each cut from
 * the approved artwork. At rest it is three pictures and three names —
 * a hero, not a dashboard.
 *
 * ── TAP, NOT HOVER ────────────────────────────────────────────────────────
 * Each tile is one button, and its label bar says so: the name, what it is,
 * and a chevron that turns over when the tile is open — the same accordion
 * grammar as every disclosure on the site. There is no "+": the founder
 * tested one on a real phone and it read as a control that did nothing,
 * because the whole tile was already the control (2026-09-27).
 *
 * A tap opens ONE detail card directly under the composition (kicker, one
 * line, three readings and the way in); tapping the same tile again, the
 * card's close button, Escape, or anywhere outside the hero closes it, and
 * tapping another tile switches the card's contents in place. When the card
 * would open below the fold, the page scrolls just far enough to show it —
 * an open that cannot be seen is the interaction that "makes no difference".
 * It is a disclosure, not a modal: each tile carries `aria-expanded` /
 * `aria-controls`, focus stays put, and nothing covers the page. Opening Pose
 * analysis also brings the walker's own analysis layer forward — his
 * full-body skeleton firms up while the card reads his joints live off the
 * same measured cycle (lib/gaitBus).
 *
 * The desktop hero stays in the DOM and is hidden by CSS below 1024px (and
 * this one above it), so there is one h1, no layout branch to disagree
 * between the server and hydration, and each walker only fetches its frames
 * on the layout that shows it (HeroWalker).
 */

type SceneId = "securevision" | "mobilitycare";
const PLATE = {
  light: HERO_SCENE.width,
  dark: HERO_SCENE.dark.width,
} as const;

/** A scene crop as custom properties, read by the stylesheet per theme. */
function cropVars(id: SceneId): CSSProperties {
  const vars: Record<string, string> = {};
  (["light", "dark"] as const).forEach((th) => {
    const [x, y, w]: Crop = HERO_MOBILE.crops[id][th];
    const t = th === "light" ? "l" : "d";
    vars[`--${t}-x`] = `${x}`;
    vars[`--${t}-y`] = `${y}`;
    vars[`--${t}-w`] = `${w}`;
    vars[`--${t}-pw`] = `${PLATE[th]}`;
  });
  return vars as CSSProperties;
}

/** Only ever this object, so the walker's effects never see a new frame. */
const WALK_FRAME = HERO_MOBILE.walk;

/* Reading and tab order: the two products, then the engine under both. */
const ORDER: readonly HeroOptionId[] = ["securevision", "mobilitycare", "pose"];

/* What each tile is, in two words, under its name. */
const TILE_SUB: Record<HeroOptionId, string> = {
  securevision: "Public spaces",
  mobilitycare: "Clinical care",
  pose: "Shared engine",
};

export function HeroMobile() {
  const [open, setOpen] = useState<HeroOptionId | null>(null);
  /* What the card shows while it closes, so it folds away with its words. */
  const [shown, setShown] = useState<HeroOptionId>("pose");
  const root = useRef<HTMLDivElement>(null);
  const tiles = useRef<Partial<Record<HeroOptionId, HTMLButtonElement | null>>>({});
  const uid = useId();
  const cardId = `${uid}-card`;

  const card = useRef<HTMLDivElement | null>(null);
  const toggle = useCallback((id: HeroOptionId) => {
    setOpen((current) => (current === id ? null : id));
    setShown(id);
  }, []);

  /* The card folds open under the tiles; on a short screen that is below
     the fold. Once it has its height (after the fold, ~420ms), scroll the
     least distance that shows it whole. Never on close, never on switch
     (the card is already in view then). */
  const wasOpen = useRef<HeroOptionId | null>(null);
  useEffect(() => {
    const opened = open && !wasOpen.current;
    wasOpen.current = open;
    if (!opened) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => {
      const el = card.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const room = window.innerHeight - 16;
      if (r.bottom <= room) return;
      window.scrollBy({ top: Math.min(r.bottom - room, r.top - 96), behavior: reduced ? "auto" : "smooth" });
    }, reduced ? 0 : 440);
    return () => window.clearTimeout(timer);
  }, [open]);

  /* Outside press and Escape close it. */
  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      tiles.current[open]?.focus();
      setOpen(null);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  /* The Pose card's joints, straight off the walker's clock. Written to the
     DOM directly: a React render per frame would be the heaviest thing on
     the page for three numbers. */
  const hip = useRef<HTMLSpanElement>(null);
  const knee = useRef<HTMLSpanElement>(null);
  const ankle = useRef<HTMLSpanElement>(null);
  const phase = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (open !== "pose") return;
    let last = -1;
    return subscribeGait(({ i }) => {
      if (i === last) return;
      last = i;
      const a = HERO_GAIT.angles[i];
      if (hip.current) hip.current.textContent = `${a[3]}°`;
      if (knee.current) knee.current.textContent = `${a[4]}°`;
      if (ankle.current) ankle.current.textContent = `${a[5]}°`;
      if (phase.current) phase.current.textContent = HERO_GAIT.phases[HERO_GAIT.phase[i][1]];
    });
  }, [open]);

  const detail = HERO_MOBILE_DETAILS[shown];

  return (
    <div ref={root} className={styles.root} data-open={open ?? undefined}>
      <div className={styles.bento}>
        {ORDER.map((id) => {
          const d = HERO_MOBILE_DETAILS[id];
          const selected = open === id;
          return (
            <div
              key={id}
              className={styles.tile}
              data-tile={id}
              data-selected={selected ? "true" : undefined}
            >
              <div className={styles.media} aria-hidden="true">
                {id === "pose" ? (
                  <HeroWalker frame={WALK_FRAME} analysis={selected} />
                ) : (
                  <ThemePicture
                    className={styles.scene}
                    style={cropVars(id)}
                    sources={[
                      {
                        type: "image/webp",
                        media: "(max-width: 1023px)",
                        lightSrcSet: `${HERO_SCENE.src} ${HERO_SCENE.width}w`,
                        darkSrcSet: `${HERO_SCENE.dark.src} ${HERO_SCENE.dark.width}w`,
                      },
                    ]}
                    lightSrc=""
                    darkSrc=""
                    sizes="100vw"
                    alt=""
                    width={HERO_SCENE.width}
                    height={HERO_SCENE.height}
                    priority
                  />
                )}
                <span className={styles.veil} />
              </div>
              <button
                ref={(el) => {
                  tiles.current[id] = el;
                }}
                type="button"
                className={styles.hit}
                aria-expanded={selected}
                aria-controls={cardId}
                aria-label={`${d.label}${d.sub ? ` — ${d.sub.toLowerCase()}` : ""}: ${selected ? "hide" : "show"} details`}
                onClick={() => toggle(id)}
              >
                {id === "pose" ? (
                  <span className={styles.chip} aria-hidden="true">
                    <span className={styles.chipDot} />
                    Cadence 102 spm
                  </span>
                ) : null}
                <span className={styles.bar}>
                  <span className={styles.barText}>
                    <span className={styles.barName}>{d.label}</span>
                    <span className={styles.barSub}>{TILE_SUB[id]}</span>
                  </span>
                  <span className={styles.barMark} aria-hidden="true">
                    <ChevronDown strokeWidth={2} />
                  </span>
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/* The card. Always in the DOM so the tiles' aria-controls resolve; its
          height folds open from zero (grid 0fr → 1fr), and `inert` keeps a
          closed card out of the tab order and the accessibility tree. */}
      <div
        id={cardId}
        role="region"
        aria-label={`${detail.title} details`}
        className={styles.card}
        data-open={open ? "true" : undefined}
        ref={(el) => {
          card.current = el;
          if (el) el.inert = !open;
        }}
      >
        <div className={styles.cardClip}>
          <div className={styles.cardBody} key={shown} data-tone={shown}>
            <div className={styles.cardHead}>
              <p className={styles.kicker}>{detail.kicker}</p>
              <button
                type="button"
                className={styles.close}
                onClick={() => {
                  tiles.current[shown]?.focus();
                  setOpen(null);
                }}
                aria-label={`Close ${detail.title} details`}
              >
                <ChevronDown strokeWidth={2} />
              </button>
            </div>
            <p className={styles.cardTitle}>{detail.title}</p>
            <p className={styles.cardLine}>{detail.line}</p>
            <dl className={styles.readings}>
              {detail.readings.map((r) => (
                <div key={r.label} className={styles.reading}>
                  <dt>{r.label}</dt>
                  <dd>
                    {r.value}
                    {r.unit ? <span className={styles.unit}>{r.unit}</span> : null}
                  </dd>
                </div>
              ))}
            </dl>
            {shown === "pose" ? (
              <p className={styles.joints} aria-live="off">
                <span className={styles.jointsLive} aria-hidden="true" />
                <span>
                  Hip <b ref={hip}>{HERO_GAIT.angles[0][3]}°</b>
                </span>
                <span>
                  Knee <b ref={knee}>{HERO_GAIT.angles[0][4]}°</b>
                </span>
                <span>
                  Ankle <b ref={ankle}>{HERO_GAIT.angles[0][5]}°</b>
                </span>
                <span className={styles.phase} ref={phase}>
                  {HERO_GAIT.phases[HERO_GAIT.phase[0][1]]}
                </span>
              </p>
            ) : null}
            <Link href={detail.link.href} className={styles.cardLink}>
              {detail.link.label}
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>

      <div className={styles.ctas}>
        <Link href={HERO_MOBILE.ctas.primary.href} className={styles.primary}>
          {HERO_MOBILE.ctas.primary.label}
          <ArrowRight aria-hidden="true" />
        </Link>
        <Link href={HERO_MOBILE.ctas.secondary.href} className={styles.secondary}>
          {HERO_MOBILE.ctas.secondary.label}
        </Link>
      </div>
    </div>
  );
}
