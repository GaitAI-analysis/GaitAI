"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { HERO_OPTIONS, HERO_SCENE, type HeroOptionId } from "@/data/home-hero";
import { HeroPanelBody } from "./HeroPanelBody";
import { HeroWalker } from "./HeroWalker";
import { PoseRail } from "./PoseRail";
import railStyles from "./poserail.module.css";
import { useHeroTelemetry } from "./useHeroTelemetry";
import styles from "./homehero.module.css";

/**
 * THE THREE PAINTED OPTIONS, MADE INTERACTIVE.
 * =============================================================================
 * The hero picture already shows three pills — SecureVision, MobilityCare,
 * Pose analysis. They are not redrawn: each gets a transparent button laid
 * exactly over its painted pill (boxes in `HERO_OPTIONS`, as fractions of the
 * image), so what the visitor clicks is the artwork itself.
 *
 * Nothing is visible until a pill is pressed. Then one frosted panel opens —
 * under its pill from 1024px, as a bottom sheet below that, where
 * there is no room beside the pills without covering the people. One panel
 * at a time: pressing another pill switches, pressing the same pill again,
 * Escape, or any press outside the pills and panels closes it.
 *
 * It is a disclosure, not a modal: each button carries `aria-expanded` and
 * `aria-controls`, focus stays where the visitor put it, and each panel sits
 * straight after its button in the DOM so Tab walks into the open panel.
 * Closed panels are `visibility: hidden`, so they are out of the tab order
 * and the accessibility tree while still animating out.
 *
 * THE RESTING HERO IS DOT-LED.
 * -----------------------------------------------------------------------------
 * At rest the three options are the gold anchor dots painted at the foot of
 * each arc, softly pulsing. A pill comes out of its dot when the visitor
 * reaches for it — hovering the dot or the pill, focusing the pill from the
 * keyboard — and stays out while its panel is open or folding back into it.
 * Leaving starts a short linger, so the pointer can travel up the arc from
 * the dot to the pill without the pill docking under it.
 *
 * Dot-led needs a real hover and a dot big enough to find: from 1024px, with
 * a fine pointer. On touch, and on anything narrower, the pills come out once
 * and stay out — a painted dot on a phone is three pixels across.
 *
 * THE INTRODUCTION.
 * -----------------------------------------------------------------------------
 * Once per page load: dots only for a second, then all three options emerge
 * from their dots together, hold, and dock back, leaving the dots pulsing.
 * Where the full cards fit (INTRO_CARDS_QUERY) each demonstration holds
 * longer: SecureVision and MobilityCare open their cards, and Pose analysis
 * does not open a card at all -- its rail expands beside the digital human,
 * who walks all the time anyway (HeroWalker; founder, 2026-09-25). The
 * demonstration plays exactly ONCE (founder, 2026-09-26): the hero appears,
 * SecureVision and MobilityCare open, stay fully open only briefly
 * (INTRO_CARDS_HOLD), collapse back, and that is the end of it; the dots
 * then breathe. Touch and narrow screens keep their pills out, so they get
 * the same single pass.
 *
 * It is ONE sequence with one pending timer (`intro`), kept apart from the
 * close timers so ending it never strands a folding card. The visitor always
 * wins: a press or keystroke anywhere ends it on the spot, and reaching for
 * an option (hover, keyboard focus) during a pause cancels the rest and
 * opens that card normally; reaching mid-demonstration lets that one fold
 * away and stops there. `prefers-reduced-motion` gets none of it.
 *
 * `introSpent` is module scope, set only once the LAST demonstration has
 * docked (or the visitor ended it), so a soft navigation back to the
 * homepage lands straight on the resting hero while a refresh plays it
 * again. Scrolling, re-entering the viewport, a card closing, a theme switch
 * or a re-render never restart it. The motion itself is CSS (see "The anchor
 * dots" in the stylesheet); this component only moves the stage.
 */

/** Fold → compress → dock. Must match the keyframes in the stylesheet. */
const CLOSE_MS = 780;

/** The pills' introduction, in ms from the hero first being seen. */
const PILLS_OUT_AT = 1000;
const PILLS_BACK_AT = 1800;
/** 250ms after PILLS_BACK_AT: the dock has finished, the dots may breathe. */
const PILLS_DOCKED_AT = 2050;

/** How many times the introduction demonstrates itself: once (founder, 2026-09-26). */
const INTRO_REVEALS = 1;
/** Rest between demonstrations, counted from the previous one fully docking. */
const INTRO_REPEAT_DELAY = 2500;
/** ...shorter where the cards open: their long hold has already been read. */
const INTRO_CARDS_REPEAT_DELAY = 1500;

/**
 * Where the introduction opens the cards, SecureVision and MobilityCare stay
 * fully open only briefly before collapsing (founder, 2026-09-26: "remain
 * fully expanded only very briefly"). Measured from the moment they start to
 * open, so it includes their 200ms arrival. The Pose analysis rail expands
 * alongside for the same beat. The pills-only introduction keeps its short
 * hold.
 */
const INTRO_CARDS_HOLD = 1500;

/**
 * How long an open card waits after the pointer leaves both it and its dot.
 * Short enough to feel like a dismissal, long enough to cross the gap from
 * the dot to the card it just opened — the card is what the pointer is
 * travelling towards, so this must outlast that journey or the card closes
 * under the cursor.
 */
const REACH_LINGER_MS = 220;

/** Where hover can lead: a real pointer, and dots big enough to find. */
const DOT_LED_QUERY =
  "(min-width: 1024px) and (hover: hover) and (pointer: fine)";

/**
 * Where all three cards can be open AT ONCE, which only the introduction
 * asks for. Each card hangs under its own pill, so the room between them is
 * a share of the picture's width: measured on the built page, SecureVision
 * runs into MobilityCare below about 1236px. (Pose used to collide with
 * MobilityCare below about 1247; it opens a slim rail at the picture's right
 * edge now, which stays about 100px clear of MobilityCare at 1280.) 1280 is
 * the first standard width clear of both.
 *
 * Narrower than that, the introduction is the one it was — the pills arrive
 * and the cards wait to be asked for. Three cards in two cards' worth of
 * room is not a reveal, it is a pile.
 */
const INTRO_CARDS_QUERY =
  "(min-width: 1280px) and (hover: hover) and (pointer: fine)";

/** The picture's own proportions, for converting heights to vw. */
const ASPECT = 941 / 1672;
/** ...and the night picture's, which is a different shape. */
const DARK_ASPECT = 894 / 1759;

/**
 * Measure the real distance from a panel to its own pill and hand it to CSS.
 *
 * This is the whole trick. The keyframes describe the SHAPE of the movement —
 * retract, fold, compress, dock — but not where it goes; where it goes is
 * read off the live DOM every time the animation starts, so the panel docks
 * into its own control at 1920, on a laptop, on a tablet and on a phone
 * without a single hard-coded offset, and it survives the panel becoming a
 * bottom sheet below 1024px.
 *
 * The fold is anchored to the panel's top edge at the pill's horizontal
 * centre. That point is both the hinge the panel folds toward and the point
 * that lands on the pill, which is what ties the two halves of the motion
 * together: scaling about it maps the panel's rectangle exactly onto the
 * pill's, so the final frame is the pill's own geometry rather than an
 * approximation of it.
 */
function measureDock(panel: HTMLElement, pill: HTMLElement) {
  const p = panel.getBoundingClientRect();
  const b = pill.getBoundingClientRect();
  if (!p.width || !p.height || !b.width || !b.height) {
    panel.dataset.dock = "off";
    return;
  }
  const fx = Math.min(
    Math.max((b.left + b.width / 2 - p.left) / p.width, 0),
    1,
  );
  const dx = b.left + fx * b.width - (p.left + fx * p.width);
  const dy = b.top - p.top;
  // If the pill has been scrolled far out of the panel's world, flying the
  // whole way would be a journey, not a gesture. Fall back to the plain fade.
  if (Math.abs(dy) > window.innerHeight * 1.6) {
    panel.dataset.dock = "off";
    return;
  }
  delete panel.dataset.dock;
  panel.style.setProperty("--dock-x", `${dx.toFixed(1)}px`);
  panel.style.setProperty("--dock-y", `${dy.toFixed(1)}px`);
  panel.style.setProperty("--dock-sx", (b.width / p.width).toFixed(4));
  panel.style.setProperty("--dock-sy", (b.height / p.height).toFixed(4));
  panel.style.setProperty("--fold-x", `${(fx * 100).toFixed(2)}%`);
}

/**
 * `dots`  the first second: no pill anywhere.
 * `out`   all three pills out of their dots.
 * `rest`  dot-led: a pill is out only while it is reached for or in use.
 */
type Stage = "dots" | "out" | "rest";

/**
 * Module scope on purpose: once per page load. Deliberately NOT set in the
 * effect's cleanup, so React's development double-mount does not swallow the
 * introduction before anyone sees it.
 */
let introSpent = false;
export function HeroOptions() {
  const [open, setOpen] = useState<HeroOptionId | null>(null);
  /**
   * Panels that are on their way back into their pill. They stay mounted and
   * visible for the whole 780ms, which is the point: the collapse is the
   * interaction, not the absence of one.
   */
  const [closing, setClosing] = useState<readonly HeroOptionId[]>([]);
  /* First render is `dots` on the server and in hydration alike, so no pill
     can flash before the introduction; a soft navigation back (the module
     already spent) mounts straight into `rest`. */
  const [stage, setStage] = useState<Stage>(() =>
    introSpent ? "rest" : "dots",
  );
  /* Whether the dots may pulse: only once the pills have docked. */
  const [breathing, setBreathing] = useState(() => introSpent);
  /* Whether this screen has room for all three cards at once. Decided when
     the introduction runs and not revisited: it is an entrance, not a
     responsive behaviour, and must not change halfway through. */
  const [introCards, setIntroCards] = useState(false);
  /* False on touch and narrow screens, where a resting pill stays out. Read
     at mount only on a soft navigation back (no hydration to disagree with);
     on the first load `dots` hides every pill until the effect has run. */
  const [dotLed, setDotLed] = useState(() =>
    introSpent && typeof window !== "undefined"
      ? window.matchMedia(DOT_LED_QUERY).matches
      : false,
  );
  /* Options the visitor is reaching for right now (hover, or a press on the
     dot), and the timers that let each one go. */
  const [reach, setReach] = useState<readonly HeroOptionId[]>([]);
  /**
   * A card opened by a PRESS is pinned: it stays when the pointer leaves.
   * A card opened by hover is not, and docks again on the way out. Without
   * the distinction, pressing a dot would open a card that vanished the
   * moment the visitor moved to read it.
   */
  const [pinned, setPinned] = useState<HeroOptionId | null>(null);
  const lingers = useRef<Partial<Record<HeroOptionId, number>>>({});
  /* Whether the introduction still has demonstrations to come. */
  const [introLive, setIntroLive] = useState(() => !introSpent);
  /* Read by the hover handlers, which are built once. */
  const live = useRef({
    open,
    pinned,
    dotLed: false,
    resting: false,
    introLive: !introSpent,
  });
  const buttons = useRef<
    Partial<Record<HeroOptionId, HTMLButtonElement | null>>
  >({});
  const panels = useRef<Partial<Record<HeroOptionId, HTMLDivElement | null>>>(
    {},
  );
  const timers = useRef<number[]>([]);
  /* The introduction's one pending step. Only ever one: each step schedules
     the next, so cancelling is clearing this and nothing can fire late. */
  const intro = useRef<number | null>(null);
  /* Set when the visitor reaches for an option mid-demonstration: that one
     is allowed to fold away, and no further one is scheduled. */
  const introLast = useRef(false);

  /* The readings only move while a panel is actually on screen: one card
     open, or all three during the introduction. See useHeroTelemetry. */
  const introShowing = stage === "out";
  const readings = useHeroTelemetry(open !== null || introShowing);

  /**
   * Start a panel moving, having first measured where its pill actually is.
   * The measurement happens before the state change, while the panel still
   * has its resting geometry: a closed panel is `visibility: hidden`, which
   * keeps its layout, so the rectangle it is about to occupy can be read
   * before it is shown.
   */
  const arm = useCallback((id: HeroOptionId) => {
    const panel = panels.current[id];
    const pill = buttons.current[id];
    if (!panel || !pill) return;
    measureDock(panel, pill);
    panel.dataset.animating = "true";
  }, []);

  const beginOpen = useCallback(
    (id: HeroOptionId) => {
      setOpen((current) => {
        if (current && current !== id) {
          arm(current);
          setClosing((list) =>
            list.includes(current) ? list : [...list, current],
          );
        }
        return id;
      });
      setClosing((list) => list.filter((x) => x !== id));
      arm(id);
    },
    [arm],
  );

  const beginClose = useCallback(
    (id: HeroOptionId | null) => {
      if (!id) return;
      arm(id);
      setClosing((list) => (list.includes(id) ? list : [...list, id]));
      setOpen((current) => (current === id ? null : current));
      // animationend normally ends it. This is the belt: if the animation
      // never fires one — interrupted, or the panel never painted —
      // — the panel would sit there visible and its Close button would stay
      // in the tab order. It must go hidden either way.
      timers.current.push(
        window.setTimeout(() => {
          setClosing((list) => list.filter((x) => x !== id));
          const panel = panels.current[id];
          if (panel) delete panel.dataset.animating;
        }, CLOSE_MS + 140),
      );
      // The pill takes the panel back: a hair of compression as it arrives,
      // and a thread of warm gold along its edge. Both wait for the docking
      // stage — the delay lives in the stylesheet.
      const pill = buttons.current[id];
      if (pill) {
        pill.dataset.absorb = "true";
        timers.current.push(
          window.setTimeout(() => {
            delete pill.dataset.absorb;
          }, CLOSE_MS + 60),
        );
      }
    },
    [arm],
  );

  /** A panel leaves the accessibility tree only once it has finished. */
  const settle = useCallback((id: HeroOptionId) => {
    setClosing((list) => list.filter((x) => x !== id));
    const panel = panels.current[id];
    if (panel) delete panel.dataset.animating;
  }, []);

  /** Straight to the resting hero: the introduction is over or skipped.
      Clears only the introduction's own timer -- a card folding closed keeps
      its fallback timers. */
  const endIntro = useCallback(() => {
    if (intro.current !== null) window.clearTimeout(intro.current);
    intro.current = null;
    introSpent = true;
    live.current.introLive = false;
    setIntroLive(false);
    setStage("rest");
    setBreathing(true);
  }, []);

  /* Dot-led or not follows the device, live: a window dragged across 1024px
     or a tablet gaining a mouse changes what the resting hero can offer. */
  useEffect(() => {
    const query = window.matchMedia(DOT_LED_QUERY);
    const update = () => setDotLed(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (introSpent) return;
    // Read once, on load: this is an entrance, not a responsive behaviour.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      endIntro();
      return;
    }

    /* The one timer. Each step schedules the next; `stopped` guards a step
       that was already queued when the effect was torn down. */
    let stopped = false;
    const step = (fn: () => void, ms: number) => {
      intro.current = window.setTimeout(
        () => {
          intro.current = null;
          if (!stopped) fn();
        },
        Math.max(ms, 0),
      );
    };

    /* The second of dots-only counts from when the hero was first painted,
       not from hydration: the server markup already has every pill docked,
       so the visitor has been looking at dots since first paint. Always at
       least a quarter-second of dots after this runs, so a slow hydration
       never makes the pills burst out the instant it lands. A tab opened in
       the background counts from when it is actually looked at (`fresh`). */
    const run = (fresh: boolean) => {
      const paint = performance.getEntriesByName("first-contentful-paint")[0];
      const seen = fresh || !paint ? 0 : performance.now() - paint.startTime;
      const lead = Math.min(Math.max(seen, 0), PILLS_OUT_AT - 250);
      const docks = window.matchMedia(DOT_LED_QUERY).matches;
      const cards = window.matchMedia(INTRO_CARDS_QUERY).matches;
      /* Without hover the pills stay out, so there is nothing to dock and
         nothing to repeat: `rest` then shows all three, the same frame. */
      const reveals = docks ? INTRO_REVEALS : 1;
      const hold = !docks
        ? 450
        : cards
          ? INTRO_CARDS_HOLD
          : PILLS_BACK_AT - PILLS_OUT_AT;
      /* Until the fold has FINISHED: cards take the full close, pills their
         250ms dock. The repeat delay counts from here, so two
         demonstrations never overlap. */
      const docking = !docks
        ? 0
        : cards
          ? CLOSE_MS
          : PILLS_DOCKED_AT - PILLS_BACK_AT;

      const reveal = (n: number) => {
        /* A card must never be opening and folding at once (both rules set
           the animation, and the fold's wins), so a demonstration starts
           from an empty `closing`. The 2.5s rest has always let the last
           fold settle by now; this makes it a guarantee. */
        setClosing([]);
        /* Cards again, every time: the fold clears it. */
        setIntroCards(cards);
        setStage("out");
        /* A beat after the cards are up, measure each one against its own
           pill -- every demonstration, so a window resized in between docks
           to where the pills are now. Measuring at the moment of folding
           would be too late: the panels must already be laid out. */
        step(() => {
          if (cards) for (const option of HERO_OPTIONS) arm(option.id);
          step(() => {
            /* Every card docks back into its own dot at once -- the same
               fold-compress-dock the close uses, so the introduction ends
               with the gesture the visitor will make themselves. */
            if (docks && cards) setClosing(HERO_OPTIONS.map((o) => o.id));
            setStage("rest");
            setIntroCards(false);
            step(() => {
              /* Docked. The dots breathe in the pause: that resting state
                 is what each demonstration is pointing at. */
              setBreathing(true);
              if (n < reveals && !introLast.current) {
                step(
                  () => reveal(n + 1),
                  cards ? INTRO_CARDS_REPEAT_DELAY : INTRO_REPEAT_DELAY,
                );
              } else {
                introSpent = true;
                live.current.introLive = false;
                setIntroLive(false);
              }
            }, docking);
          }, hold - 60);
        }, 60);
      };

      step(() => reveal(1), PILLS_OUT_AT - lead);
    };

    // A tab opened in the background still gets its introduction, when it is
    // actually looked at rather than while it is hidden.
    let onVisible: (() => void) | undefined;
    if (document.visibilityState === "visible") {
      run(false);
    } else {
      onVisible = () => {
        if (document.visibilityState !== "visible") return;
        document.removeEventListener("visibilitychange", onVisible!);
        onVisible = undefined;
        run(true);
      };
      document.addEventListener("visibilitychange", onVisible);
    }

    return () => {
      stopped = true;
      if (onVisible)
        document.removeEventListener("visibilitychange", onVisible);
      if (intro.current !== null) window.clearTimeout(intro.current);
      intro.current = null;
    };
  }, [endIntro, arm]);

  /* The close fallback timers go with the component. */
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(window.clearTimeout);
  }, []);

  // Any real press or keystroke ends the introduction -- mid-demonstration or
  // in a pause between two. Capture phase, so a press on a dot or a pill ends
  // it and still opens that card normally.
  useEffect(() => {
    if (!introLive) return;
    const stop = () => endIntro();
    document.addEventListener("pointerdown", stop, true);
    document.addEventListener("keydown", stop, true);
    return () => {
      document.removeEventListener("pointerdown", stop, true);
      document.removeEventListener("keydown", stop, true);
    };
  }, [introLive, endIntro]);

  /**
   * The visitor reaches for an option — hovers its dot or its card, or
   * focuses the pill from the keyboard — and the WHOLE card opens, not just
   * the pill. Hover and press are the same gesture here, differing only in
   * whether what they open is pinned.
   *
   * Only where hover can lead: on touch and below 1024px the pills are
   * always out and there is nothing to hover, so a reach there does nothing
   * and a tap does the opening.
   */
  const reachFor = useCallback(
    (id: HeroOptionId) => {
      window.clearTimeout(lingers.current[id]);
      setReach((list) => (list.includes(id) ? list : [...list, id]));
      const now = live.current;
      /* The visitor has found the options: no more demonstrations. In a
         pause the rest are cancelled now and this card opens normally;
         mid-demonstration, that one folds away first and is the last. */
      if (now.introLive) {
        if (now.resting) endIntro();
        else introLast.current = true;
      }
      if (now.dotLed && now.resting && now.open !== id) beginOpen(id);
    },
    [beginOpen, endIntro],
  );

  /**
   * ...and lets go. After a short linger the card docks back into its dot,
   * unless the visitor reached for it again in the meantime, or pressed it,
   * which pins it until it is pressed again, dismissed or escaped.
   */
  const letGo = useCallback(
    (id: HeroOptionId) => {
      window.clearTimeout(lingers.current[id]);
      lingers.current[id] = window.setTimeout(() => {
        setReach((list) => list.filter((x) => x !== id));
        const now = live.current;
        if (now.dotLed && now.open === id && now.pinned !== id) beginClose(id);
      }, REACH_LINGER_MS);
    },
    [beginClose],
  );

  /* The hover handlers are built once, so they read the world through this
     rather than through a closure that was right three renders ago. */
  useEffect(() => {
    live.current = {
      open,
      pinned,
      dotLed,
      resting: stage === "rest",
      introLive,
    };
  }, [open, pinned, dotLed, stage, introLive]);

  useEffect(() => {
    const pending = lingers.current;
    return () => Object.values(pending).forEach(window.clearTimeout);
  }, []);

  /**
   * A press on a dot or on its pill: the same card either way. The dot and
   * the pill are two entry points to one panel, so a single press on the dot
   * opens the full card -- the pill comes out and the card unfolds from it in
   * one movement (the dock geometry is measured from the pill as it emerges)
   * rather than stopping at the pill and waiting for a second press. A press on
   * a card hover opened pins it; a press on a pinned card closes it.
   */
  const toggle = useCallback(
    (id: HeroOptionId) => {
      window.clearTimeout(lingers.current[id]);
      setReach((list) => (list.includes(id) ? list : [...list, id]));
      if (open === id && pinned !== id) {
        /* Hover already opened it, so the press is the visitor choosing it:
           pin it open. Closing here would make a dot press dismiss the very
           card the pointer brought up on the way to it. */
        setPinned(id);
      } else if (open === id) {
        setPinned(null);
        beginClose(id);
      } else {
        setPinned(id);
        beginOpen(id);
      }
    },
    [open, pinned, beginOpen, beginClose],
  );

  /** Whether an option's pill is out of its dot. */
  const pillOut = (id: HeroOptionId) =>
    stage === "out" ||
    (stage === "rest" &&
      (!dotLed || reach.includes(id) || open === id || closing.includes(id)));

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      const button = buttons.current[open];
      setPinned(null);
      beginClose(open);
      button?.focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (!target?.closest?.("[data-hero-option]")) {
        setPinned(null);
        beginClose(open);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, beginClose]);

  return (
    <>
      {/* The digital human in the third panel walks all the time; the dots,
          cards and the Pose rail open and close around him. Opening Pose
          (or the introduction) only brings his analysis layer forward. */}
      <HeroWalker
        analysis={open === "pose" || (introShowing && introCards)}
      />
      {/* THE CONNECTORS.
          One arc per option, from its dot up to where its pill begins. These
          were painted into the photograph until now; they were traced off the
          file, fitted and then removed from the artwork, so the line on screen
          is the line that was always there — it is simply drawable now, which
          means it can thin out, fade, answer a hover and follow a theme.

          The viewBox is the unit square and the arcs are stored as
          fractions, so the same three paths fit BOTH pictures: the day plate
          is 1672x941 and the night one 1759x894, and a unit box stretched by
          the stage lands on whichever is showing without a second set of
          coordinates. `non-scaling-stroke` keeps the line 1.2px at every
          width instead of fattening with the photograph, and it is what
          makes the stretch invisible. */}
      <svg
        aria-hidden="true"
        focusable="false"
        className={styles.connectors}
        viewBox="0 0 1 1"
        preserveAspectRatio="none"
        fill="none"
      >
        {HERO_OPTIONS.map((option) => {
          const [p0, c1, c2, p3] = option.arc;
          const px = ([x, y]: readonly [number, number]) =>
            `${x.toFixed(5)},${y.toFixed(5)}`;
          return (
            <path
              key={option.id}
              className={styles.connector}
              data-live={pillOut(option.id) ? "true" : undefined}
              d={`M${px(p0)} C${px(c1)} ${px(c2)} ${px(p3)}`}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>
      {HERO_OPTIONS.map((option, index) => {
        const [left, top, , height] = option.pill;
        const [dotX, dotY] = option.dot;
        /* During the introduction every card is open at once: the founder
           asked for the whole card, not its name, and for all three
           together. Below the dot-led floor the cards would be three
           stacked bottom sheets in one place, so there the introduction
           stays as it was and the pills simply arrive. */
        const expanded = (introShowing && introCards) || open === option.id;
        const folding = closing.includes(option.id);
        const out = pillOut(option.id);
        const panelId = `hero-option-${option.id}`;
        return (
          <div key={option.id} className={styles.option}>
            {/* The painted anchor, made live: a hover and tap target over the
                dot, and the pulse. Decoration to assistive technology, which
                has the pill button (focus brings a docked pill out). */}
            <span
              aria-hidden="true"
              data-hero-option=""
              className={styles.dot}
              /* Two states, and they are not opposites of the same thing.
                 ACTIVE means this dot's card is up — open, or folding back
                 into it — and then the dot holds a steady, slightly brighter
                 mark: a card visibly docking into a pulsing dot is two
                 animations arguing about one point. Otherwise it BREATHES,
                 including on touch, where there is no hover to find it with
                 and the pulse is the only thing saying it can be pressed. */
              data-active={
                open === option.id || folding || (introShowing && introCards)
                  ? "true"
                  : undefined
              }
              data-rest={
                breathing &&
                !(open === option.id || folding || (introShowing && introCards))
                  ? "true"
                  : undefined
              }
              style={
                {
                  left: `${dotX * 100}%`,
                  top: `${dotY * 100}%`,
                  /* A quarter-second between them. Three dots breathing on
                     the same beat read as a machine; offset, they read as
                     three separate things that happen to be alive. */
                  "--dot-delay": `${index * 0.25}s`,
                } as CSSProperties
              }
              onPointerEnter={() => reachFor(option.id)}
              onPointerLeave={() => letGo(option.id)}
              onClick={() => toggle(option.id)}
            />
            <button
              ref={(el) => {
                buttons.current[option.id] = el;
              }}
              type="button"
              data-hero-option=""
              data-pill={out ? "shown" : "hidden"}
              className={styles.hotspot}
              style={
                {
                  left: `${left * 100}%`,
                  /* The vertical centre of the pill that used to be painted
                     here. The button sizes itself to its own words now, and
                     the stylesheet hangs it from this line, so a smaller pill
                     still sits exactly where the artwork put the old one. */
                  "--pill-cy": `${(top + height / 2) * 100}%`,
                  /* The dot, from the pill's left edge and its centre line,
                     in vw (the picture spans the viewport): the point the pill
                     grows out of and docks back into. */
                  "--dot-ox": `${((dotX - left) * 100).toFixed(3)}`,
                  "--dot-oy": `${((dotY - (top + height / 2)) * ASPECT * 100).toFixed(3)}`,
                  /* The same leg on the night plate, which is a different
                     shape (1759x894 against 1672x941). Emitted alongside
                     rather than branched in the markup: a branch would have
                     to agree between the server and hydration, and the
                     stylesheet can simply pick under `.dark`. */
                  "--dot-oy-dark": `${((dotY - (top + height / 2)) * DARK_ASPECT * 100).toFixed(3)}`,
                } as CSSProperties
              }
              aria-label={`${option.label} — ${expanded ? "hide" : "show"} details`}
              aria-expanded={expanded}
              aria-controls={panelId}
              onPointerEnter={() => reachFor(option.id)}
              onPointerLeave={() => letGo(option.id)}
              onFocus={() => reachFor(option.id)}
              onBlur={() => letGo(option.id)}
              onClick={() => toggle(option.id)}
            >
              <span className={styles.pillLabel}>{option.label}</span>
              <svg
                className={styles.pillArrow}
                viewBox="0 0 8 12"
                fill="none"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  d="M1.6 1.2 6.4 6l-4.8 4.8"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <div
              id={panelId}
              role="region"
              aria-labelledby={`${panelId}-title`}
              data-hero-option=""
              data-option={option.id}
              ref={(el) => {
                panels.current[option.id] = el;
              }}
              data-open={expanded}
              data-closing={folding ? "true" : undefined}
              /* Moving from the dot INTO the card keeps it open; leaving
                 both starts the linger. Without this the card would dock
                 the moment the pointer arrived to read it. */
              onPointerEnter={() => reachFor(option.id)}
              onPointerLeave={() => letGo(option.id)}
              aria-hidden={folding ? true : undefined}
              /* Pose analysis is the analysis layer, not a third product: it
                 lights a slim rail beside the digital human instead of opening
                 a card over it (founder, 2026-09-25). Same wrapper, same open
                 and closing states, so every way in and out still works. */
              className={option.id === "pose" ? railStyles.rail : styles.panel}
              onAnimationEnd={(event) => {
                // Only the panel's own animation, not a child's.
                if (event.target !== event.currentTarget) return;
                if (folding) settle(option.id);
                else if (expanded) delete event.currentTarget.dataset.animating;
              }}
            >
              {option.id === "pose" ? (
                <PoseRail titleId={`${panelId}-title`} />
              ) : (
                <>
                  {/* The content retracts before the shell folds: the
                      readings draw in and settle a few pixels toward the pill
                      while the card is still its full size, so the panel
                      looks like it is putting itself away rather than being
                      switched off. */}
                  <div className={styles.panelContent}>
                    <p id={`${panelId}-title`} className={styles.panelTitle}>
                      {option.label}
                    </p>
                    <HeroPanelBody option={option} readings={readings[option.id]} />
                    {option.footnote ? (
                      <p className={styles.footnote}>{option.footnote}</p>
                    ) : null}
                  </div>
                  {/* Outside the retracting wrapper on purpose: on the sheet
                      layout it is positioned against the panel, and a
                      transformed wrapper would become its containing block
                      and jog it sideways the moment the fold began. */}
                  <button
                    type="button"
                    className={styles.close}
                    onClick={() => beginClose(option.id)}
                  >
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
      {/* The bottom sheet's backdrop (narrow screens only; hidden by CSS on
          the wide layout). Pressing it is a press outside, so it closes. */}
      <div
        aria-hidden="true"
        className={styles.scrim}
        data-open={open !== null}
      />
    </>
  );
}
