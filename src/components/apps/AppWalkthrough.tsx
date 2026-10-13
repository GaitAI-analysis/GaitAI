"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ThemePicture } from "@/components/ui/ThemePicture";
import { assetPath } from "@/lib/paths";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import {
  APP_SCREEN_HEIGHT,
  APP_SCREEN_WIDTH,
  APP_SCREEN_WIDTHS,
  appScreenSrc,
  type AppScreen,
  type ProductAppId,
} from "@/data/product-apps";
import styles from "./appShowcase.module.css";

/**
 * THE WALKTHROUGH — the app's real screens, one at a time, in the visitor's
 * theme.
 *
 * One phone, a numbered list of steps beside it. Choosing a step shows that
 * screen; "Play" advances every few seconds and stops the moment the visitor
 * touches anything, or never starts under reduced motion; "Full screen" opens
 * the same screen large in a <dialog> with the same controls. Arrow keys move
 * between steps while the list or the dialog has focus.
 *
 * Every image is a ThemePicture: the light capture in light, the dark capture
 * in dark, chosen before paint and fetched once. The captures are the app's
 * own screens from the Android emulator — no device chrome is drawn on top of
 * them because the real status bar is already in the picture.
 */

const PLAY_INTERVAL_MS = 3600;

function srcSet(app: ProductAppId, screen: string, theme: "light" | "dark") {
  return APP_SCREEN_WIDTHS.map((w) => `${assetPath(appScreenSrc(app, screen, theme, w))} ${w}w`).join(", ");
}

function Screen({
  app,
  screen,
  sizes,
  priority = false,
}: {
  app: ProductAppId;
  screen: AppScreen;
  sizes: string;
  priority?: boolean;
}) {
  return (
    <ThemePicture
      sources={[
        {
          type: "image/webp",
          darkSrcSet: srcSet(app, screen.id, "dark"),
          lightSrcSet: srcSet(app, screen.id, "light"),
        },
      ]}
      darkSrc={appScreenSrc(app, screen.id, "dark", 540)}
      lightSrc={appScreenSrc(app, screen.id, "light", 540)}
      sizes={sizes}
      alt={screen.alt}
      width={APP_SCREEN_WIDTH}
      height={APP_SCREEN_HEIGHT}
      priority={priority}
    />
  );
}

function Controls({
  index,
  total,
  playing,
  onPrev,
  onNext,
  onTogglePlay,
  onFullscreen,
  reducedMotion,
}: {
  index: number;
  total: number;
  playing: boolean;
  onPrev: () => void;
  onNext: () => void;
  onTogglePlay: () => void;
  onFullscreen?: () => void;
  reducedMotion: boolean;
}) {
  return (
    <div className={styles.controls}>
      <button type="button" className={styles.control} onClick={onPrev} disabled={index === 0}>
        <span aria-hidden="true">←</span> Previous
      </button>
      <button type="button" className={styles.control} onClick={onNext} disabled={index === total - 1}>
        Next <span aria-hidden="true">→</span>
      </button>
      {!reducedMotion && (
        <button type="button" className={styles.control} aria-pressed={playing} onClick={onTogglePlay}>
          {playing ? "Pause walkthrough" : "Play walkthrough"}
        </button>
      )}
      {onFullscreen && (
        <button type="button" className={styles.control} onClick={onFullscreen}>
          Full screen
        </button>
      )}
    </div>
  );
}

export function AppWalkthrough({
  app,
  name,
  screens,
}: {
  app: ProductAppId;
  name: string;
  screens: readonly AppScreen[];
}) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [open, setOpen] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const listId = useId();
  const current = screens[index];
  const total = screens.length;

  const go = useCallback(
    (next: number, keepPlaying = false) => {
      setIndex(((next % total) + total) % total);
      if (!keepPlaying) setPlaying(false);
    },
    [total],
  );

  /* Autoplay: a plain interval, cleared whenever playing stops, the dialog
     state changes, or reduced motion is requested. */
  useEffect(() => {
    if (!playing || reducedMotion) return;
    const timer = window.setInterval(() => {
      setIndex((i) => (i + 1) % total);
    }, PLAY_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [playing, reducedMotion, total]);

  /* The dialog element owns its own open state; React mirrors it. */
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const onKey = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      go(index + 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      go(index - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      go(0);
    } else if (event.key === "End") {
      event.preventDefault();
      go(total - 1);
    }
  };

  const captionBlock = (
    <>
      <strong>
        {index + 1} of {total} · {current.title}
      </strong>
      {current.caption}
    </>
  );

  return (
    <div className={styles.walk} data-app-walkthrough={app}>
      <div className={styles.stage}>
        <div className={styles.phone}>
          <div className={styles.screen} key={current.id}>
            <Screen app={app} screen={current} sizes="(min-width: 900px) 312px, (min-width: 640px) 280px, 250px" priority={index === 0} />
          </div>
        </div>
        <p className={styles.caption} aria-live="polite">
          {captionBlock}
        </p>
        <Controls
          index={index}
          total={total}
          playing={playing}
          reducedMotion={reducedMotion}
          onPrev={() => go(index - 1)}
          onNext={() => go(index + 1)}
          onTogglePlay={() => setPlaying((p) => !p)}
          onFullscreen={() => setOpen(true)}
        />
        <div className={styles.progress} aria-hidden="true">
          {screens.map((s, i) => (
            <i key={s.id} data-active={i === index} />
          ))}
        </div>
      </div>

      <ol className={styles.steps} aria-label={`${name} walkthrough steps`} id={listId} onKeyDown={onKey}>
        {screens.map((screen, i) => (
          <li key={screen.id} className={styles.step}>
            <button
              type="button"
              className={styles.stepButton}
              aria-current={i === index ? "step" : undefined}
              onClick={() => go(i)}
            >
              <span className={styles.stepNumber}>{String(i + 1).padStart(2, "0")}</span>
              <span>
                <span className={styles.stepTitle}>{screen.title}</span>
                <span className={styles.stepBody}>{screen.caption}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-label={`${name} — full-screen preview`}
        onClose={() => {
          setOpen(false);
          setPlaying(false);
        }}
        onKeyDown={onKey}
      >
        {open && (
          <div className={styles.dialogInner}>
            <div className={styles.dialogBar}>
              <div>
                <span>ACTUAL APP INTERFACE · ANDROID</span>
                <br />
                <strong>{name}</strong>
              </div>
              <button type="button" className={styles.close} onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
            <div className={styles.dialogStage}>
              <div className={styles.phone}>
                <div className={styles.screen} key={`dialog-${current.id}`}>
                  <Screen app={app} screen={current} sizes="(min-height: 900px) 405px, 45vh" />
                </div>
              </div>
            </div>
            <div>
              <p className={styles.dialogCaption}>{captionBlock}</p>
              <div className={styles.dialogControls} style={{ marginTop: 12 }}>
                <Controls
                  index={index}
                  total={total}
                  playing={playing}
                  reducedMotion={reducedMotion}
                  onPrev={() => go(index - 1)}
                  onNext={() => go(index + 1)}
                  onTogglePlay={() => setPlaying((p) => !p)}
                />
              </div>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
