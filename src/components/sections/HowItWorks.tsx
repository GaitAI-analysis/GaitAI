"use client";

import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "framer-motion";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { MovementTeaser } from "@/components/analytics/MovementTeaser";
import { workflowStages } from "@/data/products";
import { allPublications, papers } from "@/data/publications";
import { useAutoDemonstrate } from "@/lib/useAutoDemonstrate";
import { useDisclosureReveal } from "@/lib/useDisclosureReveal";
import { assetPath } from "@/lib/paths";
import { ThemeVideo } from "@/components/ui/ThemeMedia";
import { ThemePicture } from "@/components/ui/ThemePicture";
import {
  themeMedia,
  type ThemeMediaEntry,
  type ThemeMediaKey,
} from "@/lib/theme-media";
import { imagesForProduct } from "@/data/product-images";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import disclosure from "@/components/ui/disclosure.module.css";
import styles from "./howitworks.module.css";

/**
 * THE WORKFLOW - a pipeline you can address, not just scroll past.
 *
 * It was a scroll-driven zigzag: the rail filled as you went by and nothing
 * else ever responded. That communicates progression, which is real, and
 * nothing else - there was no way to ask "what happens at stage 3?" short of
 * scrolling to it.
 *
 * There is now one active index, and four inputs feed it in a fixed order of
 * precedence:
 *
 *   preview  a hover or focus on the rail - look without moving
 *   locked   a click or tap - hold it, and the scroll stops moving it
 *   demo     the one-time demonstration on first view
 *   scroll   the narrative default, which runs whenever nothing is held
 *
 * `preview ?? locked ?? demo ?? scrollStage` is the whole rule, and it is the
 * same shape the movement lenses use. Rail, connector, node, row and video all
 * read that one index, so they cannot drift out of sync with each other.
 *
 * TWO PERMANENT LOOPS REMOVED. A pinging halo on every centre node and a
 * pulsing dot on every video card ran forever, on the home page, on four
 * elements at once, and communicated nothing. The node now states the active
 * stage instead, which is information.
 *
 * ── THE ZIGZAG IS BEHIND ONE CONTROL ──────────────────────────────────────
 * At rest the section is the heading, the sentence and the rail — a summary
 * that costs the home page about a screen. "Explore the full workflow" opens
 * the zigzag below it, unchanged: the same four rows in the same order, the
 * same copy, stage numbers, films and spacing, the same alternating layout
 * and the same scroll-lit centre line. Closed, nothing is lost — the panel is
 * rendered and hidden, not dropped — and open, this is the section exactly as
 * it was built. See the note above the button for why it is one disclosure
 * rather than one per stage.
 *
 * OPENING TRAVELS, for the same reason the research record does: the control
 * sits under a heading, a lead and the rail, so expanding in place unrolls the
 * zigzag below the fold. On open the control moves to the top of the readable
 * viewport and stage 01 begins directly under it; on close the page only moves
 * if the collapse has carried the control off screen. See
 * `lib/useDisclosureReveal`.
 *
 * THE RESEARCH CREDIT UNDER THE CONTROL replaces a section. The home page used
 * to carry a research block of its own, and every version of it retold
 * /research. A reader who has just been shown how the platform works has one
 * research question at that moment — is any of this grounded? — and one line
 * answers it and hands them the door. It is a line of type on purpose: no
 * card, no rule, no background, nothing that reads as a second section.
 *
 * THE TWO COUNTS ARE READ, NEVER TYPED. `papers` is the publication ledger and
 * the patent is the rest of `allPublications`, so the line cannot drift from
 * /publications the way a hand-written "8 papers" would.
 */

/** The publication record, counted rather than asserted. */
const PAPER_COUNT = papers.length;
const PATENT_COUNT = allPublications.length - papers.length;

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const stageButtons = useRef<(HTMLButtonElement | null)[]>([]);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start center", "end center"],
  });
  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  /* The narrative default, derived from the same progress value that draws
     the rail - so the lit line and the active stage always agree. */
  const [scrollStage, setScrollStage] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const next = Math.min(
      workflowStages.length - 1,
      Math.max(0, Math.floor(p * workflowStages.length)),
    );
    setScrollStage((current) => (current === next ? current : next));
  });

  const [locked, setLocked] = useState<number | null>(null);
  const [preview, setPreview] = useState<number | null>(null);

  /* Which visuals have arrived on screen. The light card's one-time sheen
     (howitworks.module.css, `.visualWrap[data-shine]`) is keyed off this, so
     it plays exactly once, as the card fades in, and never on a re-render. */
  const [shone, setShone] = useState<boolean[]>(() =>
    workflowStages.map(() => false),
  );
  const markShone = useCallback((index: number) => {
    setShone((current) => {
      if (current[index]) return current;
      const next = [...current];
      next[index] = true;
      return next;
    });
  }, []);

  /* The whole zigzag, behind one control. See the note above the button. */
  const [open, setOpen] = useState(false);
  const {
    anchorRef: revealRef,
    panelRef,
    reveal,
  } = useDisclosureReveal<HTMLButtonElement, HTMLDivElement>();
  const panelBase = useId();
  const revealId = `${panelBase}-reveal`;
  const panelId = `${panelBase}-workflow`;

  /* The capture chain, behind its own control and its own state — see the
     note above the second button for why these two never talk to each other. */
  const [chainOpen, setChainOpen] = useState(false);
  const {
    anchorRef: chainRevealRef,
    panelRef: chainPanelRef,
    reveal: chainReveal,
  } = useDisclosureReveal<HTMLButtonElement, HTMLDivElement>();
  const chainRevealId = `${panelBase}-chain-reveal`;
  const chainPanelId = `${panelBase}-chain`;

  const demo = useAutoDemonstrate<HTMLDivElement>({
    steps: workflowStages.length,
    intervalMs: 1000,
    cycles: 1,
    threshold: 0.2,
  });

  const release = demo.stop;
  const active = preview ?? locked ?? demo.index ?? scrollStage;
  /* The entrance choreography below (visual, then copy 100ms later, node
     scaling in) is decorative; under reduced motion every element is simply
     present. `initial={false}` is how framer is told to start at the end. */
  const reduce = usePrefersReducedMotion();

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent, index: number) => {
      release();
      const step =
        event.key === "ArrowRight" || event.key === "ArrowDown"
          ? 1
          : event.key === "ArrowLeft" || event.key === "ArrowUp"
            ? -1
            : 0;
      if (step) {
        event.preventDefault();
        const next =
          (index + step + workflowStages.length) % workflowStages.length;
        stageButtons.current[next]?.focus();
        return;
      }
      if (event.key === "Escape" && locked !== null) {
        event.preventDefault();
        setLocked(null);
      }
    },
    [locked, release],
  );

  return (
    <section
      id="technology"
      className="home-section section bg-obsidian-300/40"
    >
      <div className="container-wide">
        <SectionHeading
          eyebrow="The GaitAI workflow"
          title={
            <>
              Capture movement.{" "}
              <span className="text-gradient">Act on intelligence.</span>
            </>
          }
          description="A four-stage pipeline that turns walking videos, wearable signals and CCTV movement into insight a clinician or operator can review and act on."
        />

        {/* THE RAIL - the control. Real buttons in a tablist, so a keyboard
            and a touch device reach exactly what a pointer does. */}
        <div
          ref={demo.ref}
          className={styles.rail}
          role="tablist"
          aria-label="Workflow stages"
        >
          {workflowStages.map((stage, i) => (
            <button
              key={stage.step}
              ref={(node) => {
                stageButtons.current[i] = node;
              }}
              type="button"
              role="tab"
              aria-selected={active === i}
              data-active={active === i}
              data-passed={i <= active}
              data-locked={locked === i}
              onPointerEnter={() => {
                release();
                setPreview(i);
              }}
              onPointerLeave={() => setPreview(null)}
              onFocus={() => {
                release();
                setPreview(i);
              }}
              onBlur={() => setPreview(null)}
              onClick={() => {
                release();
                setLocked((current) => (current === i ? null : i));
              }}
              onKeyDown={(event) => onKeyDown(event, i)}
              className={styles.stage}
            >
              <span aria-hidden="true" className={styles.node} />
              <span aria-hidden="true" className={styles.stageIndex}>
                {stage.step}
              </span>
              <span className={styles.stageName}>{stage.title}</span>
            </button>
          ))}
        </div>

        {/* ── ONE CONTROL FOR THE WHOLE WORKFLOW ─────────────────────────
            The summary above — the heading, the sentence and the four-stage
            rail — is the section at rest, and that is all the home page has
            to spend on it. Everything below is the full zigzag as it was
            built: same rows, same order, same films, same copy, same
            spacing. It is not cut down and not rewritten; it is simply not
            unrolled until somebody asks for it.

            ONE BUTTON, NOT FOUR. The stages are one story told in sequence
            — a reader who wants stage 3 wants the pipeline it sits in — so
            there is a single disclosure under the rail rather than a row
            per stage, and the zigzag it opens is untouched.

            THE PANEL IS RENDERED, NOT MOUNTED ON OPEN, so the whole
            workflow is in the server-rendered HTML for a crawler and for a
            reader without JavaScript. Closed is a collapsed grid row plus
            `visibility: hidden`, which keeps it out of the tab order and
            the accessibility tree. The four stage films are held too: a
            collapsed panel still intersects their observer, so `StageVisual`
            takes the open state as well and plays nothing behind a closed
            disclosure. */}
        <div className={`${disclosure.center} ${styles.revealRow}`}>
          <button
            ref={revealRef}
            type="button"
            id={revealId}
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => {
              const next = !open;
              setOpen(next);
              reveal(next);
            }}
            data-open={open}
            className={`home-reveal-offset ${disclosure.control}`}
          >
            <span aria-hidden="true" className={disclosure.dot} />
            <span className={disclosure.label}>
              {open ? "Hide full workflow" : "Explore the full workflow"}
            </span>
            <span aria-hidden="true" className={disclosure.mark} />
          </button>
        </div>

        <div
          ref={panelRef}
          id={panelId}
          role="region"
          aria-labelledby={revealId}
          data-open={open}
          className={styles.panel}
        >
          <div className={styles.panelInner}>
            {/* ── THE JOURNEY ──────────────────────────────────────────
                One story in four stages, told down a single line. The
                timeline is continuous — cyan into royal into violet, from
                the first node to the last — and the scroll fills it, so
                where the reader is on the page and where they are in the
                pipeline are the same thing. Each stage sits on the line as
                a node; the node states the active stage and scales in as
                its row arrives. Rows alternate copy and visual around the
                line — an editorial spread rather than four cards — and the
                visual nearly fills its half, because the films ARE the
                stage. On a phone the line moves to the left edge and the
                rows stack. Nothing in the copy or the stage order changed. */}
            <div ref={ref} className={styles.journey}>
              <div aria-hidden="true" className={styles.track} />
              <motion.div
                aria-hidden="true"
                style={{ height: lineHeight }}
                className={styles.trackFill}
              />

              <div className={styles.rows}>
                {workflowStages.map((s, i) => {
                  const isLeft = i % 2 === 0;
                  return (
                    <div
                      key={s.step}
                      data-active={active === i}
                      data-dim={active !== i}
                      className={`${styles.row} ${isLeft ? styles.rowLeft : styles.rowRight}`}
                    >
                      {/* The copy follows the visual in by 100ms, so the eye
                          lands on the picture and then reads the caption. */}
                      <motion.div
                        className={styles.copy}
                        initial={reduce ? false : { opacity: 0, y: 18 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-12% 0px" }}
                        transition={{
                          duration: 0.7,
                          delay: 0.1,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                      >
                        <div className={styles.stageLabel}>Stage {s.step}</div>
                        <h3 className={styles.stageTitle}>{s.title}</h3>
                        <p className={styles.stageBody}>{s.desc}</p>
                      </motion.div>

                      {/* The node on the line. Hollow until its row arrives,
                          filled while it is the stage being read, with the
                          one-word verb of the stage under it — the four
                          together read Capture → Understand → Predict → Act
                          down the timeline. Decorative: the stage title
                          carries the meaning. */}
                      <div aria-hidden="true" className={styles.nodeWrap}>
                        <motion.span
                          className={styles.journeyNode}
                          initial={reduce ? false : { scale: 0.4, opacity: 0 }}
                          whileInView={{ scale: 1, opacity: 1 }}
                          viewport={{ once: true, margin: "-20% 0px" }}
                          transition={{
                            duration: 0.55,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                        />
                        <span className={styles.nodeVerb}>
                          {STAGE_VERBS[i]}
                        </span>
                      </div>

                      {/* Hovering the visual previews the stage on the rail
                          and lights its node — the same preview the rail's
                          own buttons give. One active index, read everywhere. */}
                      <motion.div
                        className={styles.visualWrap}
                        data-shine={shone[i]}
                        initial={reduce ? false : { opacity: 0, y: 28 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-12% 0px" }}
                        onViewportEnter={() => markShone(i)}
                        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                        onPointerEnter={() => {
                          release();
                          setPreview(i);
                        }}
                        onPointerLeave={() => setPreview(null)}
                      >
                        <StageVisual index={i} revealed={open} />
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        {/* The spaces around the separators are written out, because the dots are
            hidden from the accessibility tree and the words either side would
            otherwise run together when the line is read aloud. The space BEFORE
            each dot is non-breaking, so a wrap never leaves a line starting on
            a separator, and each count is glued to its noun so "1 granted
            patent" survives as one unit when the line breaks on a phone. */}
        <p id="research" className={styles.record}>
          Built on a published research record{"\u00a0"}
          <span aria-hidden="true" className={styles.recordDot}>
            ·
          </span>{" "}
          {PAPER_COUNT}
          {"\u00a0"}papers{"\u00a0"}
          <span aria-hidden="true" className={styles.recordDot}>
            ·
          </span>{" "}
          {PATENT_COUNT}
          {"\u00a0"}granted{"\u00a0"}patent{PATENT_COUNT === 1 ? "" : "s"}
          {"\u00a0"}
          <span aria-hidden="true" className={styles.recordDot}>
            ·
          </span>{" "}
          <Link href="/research/" className={styles.recordLink}>
            Explore Research
            <ArrowUpRight aria-hidden="true" className={styles.recordArrow} />
          </Link>
        </p>

        {/* ── AND THE CAPTURE CHAIN, BEHIND ITS OWN CONTROL ──────────────
            "What can movement tell us?" was a section of its own directly
            under this one: a second full-width explanation of the platform
            immediately after the first, which is how a page becomes a
            document again. It is the same component, unchanged and rendered
            once — it simply is not unrolled until somebody asks for it.

            TWO INDEPENDENT DISCLOSURES, not a pair. Opening the workflow does
            not close this and opening this does not close the workflow: they
            answer different questions and a reader may want both open at
            once. The research line sits between them because it belongs to
            neither — it is the page's answer to "is any of this grounded?",
            and it stays visible whatever is open. */}
        <div className={`${disclosure.center} ${styles.chainRow}`}>
          <button
            ref={chainRevealRef}
            type="button"
            id={chainRevealId}
            aria-expanded={chainOpen}
            aria-controls={chainPanelId}
            onClick={() => {
              const next = !chainOpen;
              setChainOpen(next);
              chainReveal(next);
            }}
            data-open={chainOpen}
            className={`home-reveal-offset ${disclosure.control}`}
          >
            <span aria-hidden="true" className={disclosure.dot} />
            <span className={disclosure.label}>
              {chainOpen
                ? "Hide what movement can tell us"
                : "Explore what movement can tell us"}
            </span>
            <span aria-hidden="true" className={disclosure.mark} />
          </button>
        </div>

        <div
          ref={chainPanelRef}
          id={chainPanelId}
          role="region"
          aria-labelledby={chainRevealId}
          data-open={chainOpen}
          className={styles.panel}
        >
          <div className={styles.panelInner}>
            <MovementTeaser />
          </div>
        </div>
      </div>
    </section>
  );
}

/* One animation per workflow stage, from gaitai_poster_animations.zip.
   Order matches workflowStages: capture → analyze → report → act. Each key
   names a dark film and its light companion in `lib/theme-media.ts`. Dark
   plays the film; light shows the still below for stages 02–04 (stage 01 is
   the photograph pair in `CaptureStill`). */
const STAGE_KEYS: ThemeMediaKey[] = [
  "workflowCapture",
  "workflowAnalyze",
  "workflowReport",
  "workflowOutput",
];

/**
 * STAGES 02–04 IN LIGHT ARE STILLS, NOT FILMS.
 * The light companions of the three stage films are re-grades of dark
 * renders, and on the white card they read faded — thin lines, washed
 * accents, a haze where the dark film had bloom. The founder supplied three
 * visuals designed for paper instead (2026-09-22, gaitai-stage-02-03-04-
 * images.zip): the multimodal-input → gait-analysis board, the SecureVision
 * dashboard, and the trusted-action hub. They are shown as supplied — no
 * crop, no grade — and the card takes each one's own aspect
 * (`--wf-aspect-light`), so `cover` is an exact fit.
 *
 * Two encodes per still: the file at its native size, lossless, and a 2x
 * Lanczos upscale for retina cards, where a browser's own bilinear upscale
 * of a ~550px file goes soft. `sizes` is the card's real width, so a phone
 * at 1x fetches the small one. The dark films are untouched, and their light
 * companions stay registered in `lib/theme-media.ts` — they are simply not
 * rendered here any more.
 */
interface StageStill {
  src: string;
  src2x: string;
  width: number;
  height: number;
  alt: string;
}

const STAGE_LIGHT_STILLS: Partial<Record<number, StageStill>> = {
  1: {
    src: "/assets/images/workflow/stage-02-analyze-light.webp",
    src2x: "/assets/images/workflow/stage-02-analyze-light@2x.webp",
    width: 532,
    height: 388,
    alt: "A person walking with pose markers over their joints, between a list of multimodal inputs — video, depth, wearables, thermal, environment — and a panel of gait and activity measures: pose estimation, stride length, cadence and gait symmetry.",
  },
  2: {
    src: "/assets/images/workflow/stage-03-report-light.webp",
    src2x: "/assets/images/workflow/stage-03-report-light@2x.webp",
    width: 591,
    height: 459,
    alt: "A SecureVision operator dashboard: people analysed, risk alerts, cameras online and uptime, a movement-activity trend, a risk-distribution ring, top insights and a downloadable report.",
  },
  3: {
    src: "/assets/images/workflow/stage-04-output-light.webp",
    src2x: "/assets/images/workflow/stage-04-output-light@2x.webp",
    width: 553,
    height: 405,
    alt: "AI signals from movement, wearables, CCTV, sensors and the environment flow into a trusted action hub and out to the doctor, therapist, caregiver and security operator who act on them.",
  },
};

/** The site theme once mounted; null while the server HTML is authoritative. */
function useLightTheme(): boolean | null {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return resolvedTheme === "light";
}

function StageStillImage({ still }: { still: StageStill }) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element -- static export
       with `images.unoptimized`; the two encodes are already what next/image
       would produce, and it cannot be told the theme. */
    <img
      src={assetPath(still.src)}
      srcSet={`${assetPath(still.src)} ${still.width}w, ${assetPath(still.src2x)} ${still.width * 2}w`}
      sizes="(min-width: 1024px) min(46vw, 570px), calc(100vw - 40px)"
      width={still.width}
      height={still.height}
      alt={still.alt}
      loading="lazy"
      decoding="async"
      className={styles.media}
    />
  );
}

/* The one-word verb under each node. Presentation only — the stage titles
   above carry the meaning; these let the timeline be read at a glance as
   Capture → Understand → Predict → Act. */
const STAGE_VERBS = ["Capture", "Understand", "Predict", "Act"];

/**
 * STAGE 01 IS A PHOTOGRAPH, NOT A FILM — AND IT IS A THEME PAIR.
 * The capture stage's render was an infographic — a glowing wireframe walker
 * between three input icons — in the one card whose copy says "a short
 * walking video, CCTV feed or smartwatch signal". A rendered figure cannot
 * stand in for footage there, so this stage shows a real frame instead.
 *
 * Two frames, one per theme, because a photograph cannot be re-lit by CSS:
 * the night-blue CCTV plate (scripts/build-capture-plate.py) belongs to the
 * dark page it was cut for, and on the light page it read as a grey slab in
 * a row of white cards. Light shows the reviewed daylight capture scene from
 * the FallRisk set (product-image-manifest.json): a bright clinic corridor, a
 * person walking, restrained cyan joint markers and a floor trajectory —
 * capture with a hint of tracking, which is what stage 01 says and what
 * stage 02 then develops. It is read from the same registry the product
 * pages use, so the frame is the reviewed one and no file is named by hand.
 */
const CAPTURE_DARK = "/assets/images/capture/capture-walk-wide.jpg";
const CAPTURE_LIGHT = imagesForProduct("fallrisk");

/* The photograph is 16:9 and the card is not, so it is cropped — and the two
   frames are cropped differently, because the people stand in different
   places. Dark keeps the walker centred; light keeps both women, who stand
   right of centre. */
const CAPTURE_ASPECT = 1.25;
const CAPTURE_POSITION = { dark: "50% 42%", light: "60% 50%" };

/* Each card is exactly its film's shape, read from the registry, so `cover`
   is a perfect fit: nothing cropped, nothing letterboxed, no film floating in
   a card of another proportion. */
function stageAspect(index: number): number {
  if (index === 0) return CAPTURE_ASPECT;
  /* The registry is `as const`, so one entry without a size narrows the
     union; the shared entry type says width/height are optional. */
  const entry = themeMedia[STAGE_KEYS[index]] as ThemeMediaEntry;
  return entry.width && entry.height ? entry.width / entry.height : 1.1;
}

function CaptureStill() {
  const light = CAPTURE_LIGHT?.assets.heroLight;
  const lightSrcSet = light
    ? light.variants
        .map(({ src, width }) => `${assetPath(src)} ${width}w`)
        .join(", ")
    : `${assetPath(CAPTURE_DARK)} 1200w`;
  return (
    <ThemePicture
      sources={[
        {
          type: "image/webp",
          darkSrcSet: `${assetPath(CAPTURE_DARK)} 1200w`,
          lightSrcSet,
        },
      ]}
      darkSrc={CAPTURE_DARK}
      lightSrc={CAPTURE_LIGHT?.heroLight ?? CAPTURE_DARK}
      sizes="(min-width: 1024px) 46vw, calc(100vw - 40px)"
      alt="A camera frame of a person walking — the short walking video or CCTV clip the pipeline starts from, with the first pose markers picked out."
      width={light?.width ?? 1200}
      height={light?.height ?? 675}
      className={`${styles.media} ${styles.mediaStill}`}
      style={
        {
          "--wf-still-position": CAPTURE_POSITION.dark,
          "--wf-still-position-light": CAPTURE_POSITION.light,
        } as React.CSSProperties
      }
    />
  );
}

function StageVisual({
  index,
  /** False while the workflow panel is collapsed: play nothing nobody can see. */
  revealed,
}: {
  index: number;
  revealed: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  /**
   * Four looping renders sit in this section. Autoplaying all of them on mount
   * downloaded and decoded every one the moment the home page loaded, whether
   * or not the section was ever reached. They now start when the section comes
   * into view and pause when it leaves, so the cost follows attention.
   */
  const [inView, setInView] = useState(false);
  /* Light stages 02–04 show a still and never fetch the film. The theme is
     only trusted once mounted (see `useLightTheme`); until then the slot is
     empty — the panel is collapsed and invisible at load, so nothing is lost,
     and neither theme's file is requested before the right one is known. */
  const light = useLightTheme();
  const still = STAGE_LIGHT_STILLS[index];

  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => setInView(entries.some((e) => e.isIntersecting)),
      { rootMargin: "200px 0px", threshold: 0.01 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={wrapRef}
      className={styles.visual}
      /* The supplied stills carry their own stage chip (02, 04) or fill the
         corner with content (03): the card's chip is dropped for them. */
      data-still={light === true && still !== undefined ? "true" : undefined}
      style={
        {
          "--wf-aspect": stageAspect(index),
          "--wf-aspect-light": still ? still.width / still.height : undefined,
        } as React.CSSProperties
      }
    >
      {index === 0 ? (
        <CaptureStill />
      ) : light === null ? null : light && still ? (
        <StageStillImage still={still} />
      ) : (
        /* The dark film; reduced-motion visitors get its poster and never
           fetch the clip. A collapsed panel is zero-height but still
           intersects the observer's 200px margin, so "in view" alone would
           autoplay all four films behind a closed disclosure — `revealed` is
           the other half of the gate. */
        <ThemeVideo
          mediaKey={STAGE_KEYS[index]}
          className={styles.media}
          active={inView && revealed}
        />
      )}
      <span aria-hidden="true" className={styles.tag}>
        stage_0{index + 1}
      </span>
    </div>
  );
}
