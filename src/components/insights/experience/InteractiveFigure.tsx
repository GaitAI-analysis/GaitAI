"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";
import { trackInsightEvent } from "@/lib/insight-events";
import styles from "./experience.module.css";

export type FigureStatus = "illustrative" | "conceptual" | "measured";
export type CursorHint = "drag" | "inspect" | "hold" | "tap" | "scrub";

const STATUS_LABEL: Record<FigureStatus, string> = {
  illustrative: "Illustrative",
  conceptual: "Conceptual demonstration",
  measured: "Measured",
};

/**
 * The frame every interactive figure sits in.
 *
 * It carries the things the brief makes mandatory and that no individual
 * figure should have to remember:
 *
 *   STATUS        "Illustrative", "Conceptual demonstration" or "Measured",
 *                 printed on the figure, not in a footnote
 *   DESCRIPTION   a plain-text equivalent of what the interaction shows, in a
 *                 <details> that is always in the DOM — the accessible
 *                 fallback and the no-JS content
 *   TOUCH         `touch-action: pan-y` on the stage, so a vertical finger
 *                 still scrolls the page
 *   CURSOR HINT   a small DRAG / INSPECT / HOLD label riding with a fine
 *                 pointer inside the stage; never on touch, never global
 *   LAYOUT        a min-height so the figure reserves its space before
 *                 hydration and the article does not shift
 *   ANALYTICS     one `interactive_figure_used` per figure per page load,
 *                 fired on the first pointer-down or key press inside it
 *
 * The figure's own controls, the SVG and any share button are children.
 */
export function InteractiveFigure({
  id,
  articleSlug,
  eyebrow,
  title,
  status,
  hint,
  caption,
  description,
  actions,
  minHeight,
  wide = false,
  hero = false,
  dragging = false,
  children,
}: {
  /** Stable anchor id, also the share key. */
  id: string;
  articleSlug?: string;
  eyebrow?: string;
  title?: string;
  status: FigureStatus;
  hint?: CursorHint;
  caption?: ReactNode;
  /** The accessible text equivalent. Line breaks are preserved. */
  description: string;
  actions?: ReactNode;
  /** CSS length reserved for the stage before hydration. */
  minHeight?: string;
  wide?: boolean;
  hero?: boolean;
  /** Let the shell hide the cursor hint while a drag is in progress. */
  dragging?: boolean;
  children: ReactNode;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const descriptionId = useId();
  const [hintOn, setHintOn] = useState(false);
  const used = useRef(false);

  const markUsed = useCallback(() => {
    if (used.current) return;
    used.current = true;
    trackInsightEvent(
      "interactive_figure_used",
      { figure: id, article: articleSlug ?? "" },
      { once: id },
    );
  }, [articleSlug, id]);

  /* The cursor hint follows a fine pointer; it is a CSS-variable write per
     move, no React state, so it costs nothing measurable. */
  const onPointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return;
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    stage.style.setProperty("--cx", `${event.clientX - rect.left}px`);
    stage.style.setProperty("--cy", `${event.clientY - rect.top}px`);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setHintOn(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return (
    <figure
      id={id}
      className={`${styles.root} ${styles.figure} ${wide ? styles.figureWide : ""} ${
        hero ? styles.figureHero : ""
      }`}
      aria-describedby={descriptionId}
    >
      {(eyebrow || title || status) && (
        <div className={styles.figureHead}>
          {eyebrow && <span className={styles.figureEyebrow}>{eyebrow}</span>}
          {title && <span className={styles.figureTitle}>{title}</span>}
          <span
            className={`${styles.figureStatus} ${
              status === "measured"
                ? styles.statusMeasured
                : styles.statusIllustrative
            }`}
          >
            {STATUS_LABEL[status]}
          </span>
        </div>
      )}

      <div
        ref={stageRef}
        className={styles.figureStage}
        style={minHeight ? { minHeight } : undefined}
        data-dragging={dragging ? "true" : undefined}
        onPointerDownCapture={markUsed}
        onKeyDownCapture={markUsed}
        onPointerMove={hint && hintOn ? onPointerMove : undefined}
      >
        {children}
        {hint && hintOn && (
          <span aria-hidden="true" className={styles.cursorHint}>
            {hint}
          </span>
        )}
      </div>

      <div className={styles.figureFoot}>
        {caption && <figcaption className={styles.figureCaption}>{caption}</figcaption>}
        {actions && <div className={styles.figureActions}>{actions}</div>}
        <details className={styles.figureDescription}>
          <summary className={styles.figureDescriptionToggle}>
            Text description
          </summary>
          <p id={descriptionId} className={styles.figureDescriptionBody}>
            {description}
          </p>
        </details>
      </div>
    </figure>
  );
}

/**
 * Mount an expensive figure only when it is about to scroll into view.
 *
 * Article text renders immediately and is never blocked on a figure. The
 * placeholder has the figure's height, so nothing shifts when it arrives, and
 * it carries the figure's text description so a reader who never scrolls it
 * into view (or has JavaScript off) still has the content.
 */
export function LazyFigure({
  minHeight,
  description,
  children,
}: {
  minHeight: string;
  description: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (!("IntersectionObserver" in window)) {
      setReady(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setReady(true);
          observer.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  if (ready) return <>{children}</>;
  return (
    <div
      ref={ref}
      className={`${styles.root} ${styles.figure} ${styles.figurePlaceholder}`}
      style={{ minHeight }}
    >
      <p>{description}</p>
    </div>
  );
}
