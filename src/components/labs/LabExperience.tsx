"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { assetPath } from "@/lib/paths";
import { LAB_EXPERIENCE_EVENT } from "./lab-experience-event";
import { CAPTURE_CAMERA_COUNT } from "./scene/lab-layout";
import type { LabQuality, LabView } from "./scene/LabScene";
import styles from "./labExperience.module.css";

/* The whole Three.js bundle loads only when the room is opened. */
const LabScene = dynamic(() => import("./scene/LabScene"), { ssr: false, loading: () => null });

const ROOM_PHOTO = "/assets/images/labs/lab-room.jpg";
const FOCUS_SELECTOR = 'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])';

/**
 * THE INTERACTIVE LAB — a fullscreen viewer over /labs.
 *
 * Opened by the cover's "Enter the Lab" (through `LAB_EXPERIENCE_EVENT`, the
 * same pattern as the Atlas), it draws the biometrics capture room in three
 * dimensions and lets a reader orbit it: drag to look around, wheel or pinch
 * to move closer, and a set of controls to stand where each of the fourteen
 * capture cameras stands. The page underneath keeps its scroll position;
 * Escape or the close control returns to it with focus back on the button
 * that opened the room.
 *
 * QUALITY IS DECIDED ONCE, ON OPEN. A desktop with a fine pointer and a few
 * cores gets the reflective floor, soft contact shadows and a higher pixel
 * ratio; a phone gets the same room with a matte floor and a lighter shadow
 * map. Reduced motion stops the slow auto-orbit, the fans and the figure's
 * idle presence — the room still turns under the reader's hand.
 *
 * NOTHING IS DUPLICATED. The camera count and positions come from
 * `scene/lab-layout.ts`, the same file the scene builds from, so the
 * "Camera 07 / 14" control can never name a tripod that is not there.
 */
export function LabExperience() {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<LabView>({ kind: "orbit" });
  const [showPose, setShowPose] = useState(true);
  const [showSightlines, setShowSightlines] = useState(true);
  const [showPhoto, setShowPhoto] = useState(false);
  const [quality, setQuality] = useState<LabQuality>("high");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [coarse, setCoarse] = useState(false);

  const openerRef = useRef<HTMLElement | null>(null);
  const shellRef = useRef<HTMLDivElement>(null);

  /* Open on request, remembering what to give focus back to. */
  useEffect(() => {
    const onRequest = () => {
      openerRef.current = document.activeElement as HTMLElement | null;
      const pointerCoarse = window.matchMedia("(pointer: coarse)").matches;
      const cores = navigator.hardwareConcurrency ?? 4;
      setCoarse(pointerCoarse);
      setQuality(!pointerCoarse && cores >= 4 && window.innerWidth >= 900 ? "high" : "low");
      setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
      setOpen(true);
    };
    window.addEventListener(LAB_EXPERIENCE_EVENT, onRequest);
    return () => window.removeEventListener(LAB_EXPERIENCE_EVENT, onRequest);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setReady(false);
    setView({ kind: "orbit" });
    setShowPhoto(false);
  }, []);

  /* Modal behaviour: Escape closes, Tab stays inside, the page does not
     scroll, and focus returns to the opener on the way out. */
  useEffect(() => {
    if (!open) return;
    const shell = shellRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    shell?.querySelector<HTMLElement>("[data-autofocus]")?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab" || !shell) return;
      const focusable = Array.from(shell.querySelectorAll<HTMLElement>(FOCUS_SELECTOR)).filter((node) => node.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    const opener = openerRef.current;
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      opener?.focus?.();
    };
  }, [open, close]);

  if (!open) return null;

  const cameraIndex = view.kind === "camera" ? view.index : -1;
  const stepCamera = (delta: number) => {
    const next = cameraIndex < 0 ? (delta > 0 ? 0 : CAPTURE_CAMERA_COUNT - 1) : (cameraIndex + delta + CAPTURE_CAMERA_COUNT) % CAPTURE_CAMERA_COUNT;
    setView({ kind: "camera", index: next });
  };

  return (
    <div
      ref={shellRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lab-experience-title"
      aria-describedby="lab-experience-desc"
      className={`${styles.shell} ${reducedMotion ? styles.shellStill : ""}`}
    >
      <div className={styles.stage} aria-hidden="true">
        <LabScene
          view={view}
          showPose={showPose}
          showSightlines={showSightlines}
          quality={quality}
          reducedMotion={reducedMotion}
          onReady={() => setReady(true)}
        />
      </div>

      {/* What the room is, for anyone who cannot see it. */}
      <p id="lab-experience-desc" className="sr-only">
        A three-dimensional reconstruction of the GaitAI biometrics capture room: a long hall with louvered windows, a
        polished tiled floor and workstations along one side. The founder stands at the centre of a clear floor, and
        {" "}{CAPTURE_CAMERA_COUNT} camera tripods around the room all point at her. Drag to look around; the controls below
        move the view to each camera&apos;s position.
      </p>

      {/* The veil, until the first frames are drawn. */}
      <div className={`${styles.veil} ${ready ? styles.veilHidden : ""}`} aria-hidden={ready}>
        <span className={styles.veilLine} />
        <span className={styles.veilText}>{ready ? "" : "Preparing the lab…"}</span>
      </div>

      {/* ── Top bar ── */}
      <header className={styles.top}>
        <div className={styles.titleBlock}>
          <span className={styles.eyebrow}>GaitAI Labs · Biometrics capture room</span>
          <h2 id="lab-experience-title" className={styles.title}>
            The lab, in three dimensions
          </h2>
        </div>
        <button type="button" onClick={close} aria-label="Close the lab" className={styles.close} data-autofocus>
          <span aria-hidden="true">✕</span>
        </button>
      </header>

      {/* ── Bottom bar: views and layers ── */}
      <div className={styles.bottom}>
        <div className={styles.group} role="group" aria-label="Viewpoint">
          <button
            type="button"
            className={`${styles.chip} ${view.kind === "orbit" ? styles.chipOn : ""}`}
            aria-pressed={view.kind === "orbit"}
            onClick={() => setView({ kind: "orbit" })}
          >
            Overview
          </button>
          <span className={styles.cameraStep}>
            <button type="button" className={styles.stepBtn} aria-label="Previous capture camera" onClick={() => stepCamera(-1)}>
              <span aria-hidden="true">‹</span>
            </button>
            <button
              type="button"
              className={`${styles.chip} ${view.kind === "camera" ? styles.chipOn : ""}`}
              aria-pressed={view.kind === "camera"}
              onClick={() => (view.kind === "camera" ? setView({ kind: "orbit" }) : setView({ kind: "camera", index: 0 }))}
            >
              {view.kind === "camera"
                ? `Camera ${String(view.index + 1).padStart(2, "0")} / ${CAPTURE_CAMERA_COUNT}`
                : `From a capture camera · ${CAPTURE_CAMERA_COUNT}`}
            </button>
            <button type="button" className={styles.stepBtn} aria-label="Next capture camera" onClick={() => stepCamera(1)}>
              <span aria-hidden="true">›</span>
            </button>
          </span>
        </div>

        <div className={styles.group} role="group" aria-label="Layers">
          <button type="button" className={`${styles.chip} ${showPose ? styles.chipOn : ""}`} aria-pressed={showPose} onClick={() => setShowPose((v) => !v)}>
            <span aria-hidden="true" className={styles.dot} />
            Pose overlay
          </button>
          <button type="button" className={`${styles.chip} ${showSightlines ? styles.chipOn : ""}`} aria-pressed={showSightlines} onClick={() => setShowSightlines((v) => !v)}>
            <span aria-hidden="true" className={styles.dot} />
            Sightlines
          </button>
          <button type="button" className={`${styles.chip} ${showPhoto ? styles.chipOn : ""}`} aria-pressed={showPhoto} onClick={() => setShowPhoto((v) => !v)}>
            The real room
          </button>
        </div>

        <p className={styles.hint}>
          {coarse ? "Drag to look around · Pinch to move closer" : "Drag to look around · Scroll to move closer · Esc to leave"}
        </p>
      </div>

      {/* The photograph the room is built from, on request. */}
      {showPhoto && (
        <figure className={styles.photo}>
          <Image src={assetPath(ROOM_PHOTO)} alt="The GaitAI biometrics lab: workstations, tripods with cameras, louvered windows and a polished floor." width={900} height={507} className={styles.photoImage} />
          <figcaption className={styles.photoCaption}>The room this is built from.</figcaption>
        </figure>
      )}
    </div>
  );
}
