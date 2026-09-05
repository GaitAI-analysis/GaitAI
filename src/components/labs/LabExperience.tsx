"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useProgress } from "@react-three/drei";
import { assetPath } from "@/lib/paths";
import { LAB_EXPERIENCE_EVENT } from "./lab-experience-event";
import { CAPTURE_CAMERA_COUNT, LAB_PHOTOS } from "./scene/lab-layout";
import type { LabQuality, LabView } from "./scene/LabScene";
import styles from "./labExperience.module.css";

/* The whole Three.js scene is a separate chunk, fetched on entry (or warmed
   when the cover's button nears the viewport). */
const LabScene = dynamic(() => import("./scene/LabScene"), { ssr: false, loading: () => null });

const FOCUS_SELECTOR = 'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])';

/**
 * THE INTERACTIVE LAB — a fullscreen viewer over /labs.
 *
 * Opened by the cover's "Enter the Lab" (through `LAB_EXPERIENCE_EVENT`, the
 * same pattern as the Atlas), it draws the biometrics capture room as a
 * digital twin and lets a reader walk it: drag to look around, wheel or pinch
 * to move closer, stand where any of the fourteen capture cameras stands,
 * switch the pose overlay and the sightlines, and hold the reconstruction
 * against the photographs it was built from. The page underneath keeps its
 * scroll position; Escape or the close control returns to it with focus back
 * on the button that opened the room.
 *
 * QUALITY IS DECIDED ONCE, ON OPEN. A desktop with a fine pointer and a few
 * cores gets the reflective floor, 2048px shadows and a higher pixel ratio; a
 * phone gets the same room with a matte floor, 1024px shadows and a lower
 * cap. A device without WebGL is shown the photographs instead. Reduced
 * motion stills the auto-orbit, the fans and the figure's idle presence — the
 * room still turns under the reader's hand.
 *
 * THE LOADER IS REAL. `useProgress` reports the assets actually fetched —
 * textures, the HDRI, the fixtures, the avatar — and the veil lifts only when
 * the first frames have been drawn. Nothing counts to a hundred on a timer.
 */
export function LabExperience() {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [webgl, setWebgl] = useState(true);
  const [view, setView] = useState<LabView>({ kind: "orbit" });
  const [showPose, setShowPose] = useState(false);
  const [showSightlines, setShowSightlines] = useState(false);
  const [compare, setCompare] = useState<(typeof LAB_PHOTOS)[number]["id"] | null>(null);
  const [compareOpacity, setCompareOpacity] = useState(0.55);
  const [quality, setQuality] = useState<LabQuality>("high");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [coarse, setCoarse] = useState(false);

  const openerRef = useRef<HTMLElement | null>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const progress = useProgress();

  useEffect(() => {
    const onRequest = () => {
      openerRef.current = document.activeElement as HTMLElement | null;
      const pointerCoarse = window.matchMedia("(pointer: coarse)").matches;
      const cores = navigator.hardwareConcurrency ?? 4;
      const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
      setCoarse(pointerCoarse);
      setQuality(!pointerCoarse && cores >= 4 && memory >= 4 && window.innerWidth >= 900 ? "high" : "low");
      setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
      setWebgl(supportsWebGL());
      setOpen(true);
    };
    window.addEventListener(LAB_EXPERIENCE_EVENT, onRequest);
    return () => window.removeEventListener(LAB_EXPERIENCE_EVENT, onRequest);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setReady(false);
    setView({ kind: "orbit" });
    setCompare(null);
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

  /* Which part of the room is arriving, from the asset actually being fetched. */
  const stage = useMemo(() => stageOf(progress.item), [progress.item]);
  const photo = LAB_PHOTOS.find((p) => p.id === compare) ?? null;

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
      {webgl ? (
        <div className={styles.stage} aria-hidden="true">
          <LabScene view={view} showPose={showPose} showSightlines={showSightlines} quality={quality} reducedMotion={reducedMotion} onReady={() => setReady(true)} />
        </div>
      ) : (
        <NoWebGL />
      )}

      <p id="lab-experience-desc" className="sr-only">
        A three-dimensional reconstruction of the GaitAI biometrics capture room: a long hall with louvered windows, a
        polished tiled floor and workstations along one side. The founder stands at the centre of a clear floor, and
        {" "}{CAPTURE_CAMERA_COUNT} camera tripods around the room all point at her. Drag to look around; the controls below
        move the view to each camera&apos;s position.
      </p>

      {/* The photograph the twin is compared against, over the room, at the chosen strength. */}
      {webgl && photo && (
        <div className={styles.compare} aria-hidden="true" style={{ opacity: compareOpacity }}>
          <Image src={assetPath(photo.src)} alt="" fill sizes="100vw" className={styles.compareImage} priority />
        </div>
      )}

      {/* The veil, until the first frames are drawn — with what is actually arriving. */}
      {webgl && (
        <div className={`${styles.veil} ${ready ? styles.veilHidden : ""}`} aria-hidden={ready}>
          <div className={styles.veilBox}>
            <span className={styles.veilTitle}>Preparing the biometrics lab</span>
            <ol className={styles.veilList}>
              {STAGES.map((s) => (
                <li key={s.id} className={`${styles.veilItem} ${stage === s.id ? styles.veilItemOn : ""} ${stageDone(s.id, stage, progress.progress) ? styles.veilItemDone : ""}`}>
                  <span className={styles.veilDot} />
                  {s.label}
                </li>
              ))}
            </ol>
            <span className={styles.veilMeter}>
              <span className={styles.veilBar} style={{ transform: `scaleX(${Math.max(0.02, progress.progress / 100)})` }} />
            </span>
            <span className={styles.veilText}>
              {progress.total > 0 ? `${progress.loaded} of ${progress.total} assets · ${Math.round(progress.progress)}%` : "Fetching the room…"}
            </span>
          </div>
        </div>
      )}

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

      {/* ── Bottom dock: viewpoint, layers, the real room ── */}
      {webgl && (
        <div className={styles.bottom}>
          <div className={styles.group} role="group" aria-label="Viewpoint">
            <button type="button" className={`${styles.chip} ${view.kind === "orbit" ? styles.chipOn : ""}`} aria-pressed={view.kind === "orbit"} onClick={() => setView({ kind: "orbit" })}>
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
                {view.kind === "camera" ? `Camera ${String(view.index + 1).padStart(2, "0")} / ${CAPTURE_CAMERA_COUNT}` : `From a capture camera · ${CAPTURE_CAMERA_COUNT}`}
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
          </div>

          <div className={styles.group} role="group" aria-label="The real room">
            <button type="button" className={`${styles.chip} ${compare ? styles.chipOn : ""}`} aria-pressed={Boolean(compare)} onClick={() => setCompare((c) => (c ? null : LAB_PHOTOS[0].id))}>
              The real room
            </button>
            {compare && (
              <>
                {LAB_PHOTOS.map((p) => (
                  <button key={p.id} type="button" className={`${styles.chip} ${styles.chipSmall} ${compare === p.id ? styles.chipOn : ""}`} aria-pressed={compare === p.id} onClick={() => setCompare(p.id)}>
                    {p.label}
                  </button>
                ))}
                <label className={styles.slider}>
                  <span className={styles.sliderLabel}>Twin</span>
                  <input type="range" min={0} max={100} value={Math.round(compareOpacity * 100)} onChange={(e) => setCompareOpacity(Number(e.target.value) / 100)} aria-label="Blend between the digital twin and the photograph" />
                  <span className={styles.sliderLabel}>Photo</span>
                </label>
              </>
            )}
          </div>

          <p className={styles.hint}>
            {compare
              ? `Photograph over the twin · ${photo?.caption ?? ""}`
              : coarse
                ? "Drag to look around · Pinch to move closer"
                : "Drag to look around · Scroll to move closer · Esc to leave"}
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Helpers ── */

const STAGES = [
  { id: "room", label: "Room" },
  { id: "light", label: "Daylight" },
  { id: "fixtures", label: "Fixtures" },
  { id: "subject", label: "Capture subject" },
] as const;
type StageId = (typeof STAGES)[number]["id"];

function stageOf(item: string): StageId {
  if (/avatar/.test(item)) return "subject";
  if (/\.hdr/.test(item)) return "light";
  if (/models\//.test(item)) return "fixtures";
  return "room";
}

/** A stage reads as done once the loader has moved past it or everything is in. */
function stageDone(id: StageId, current: StageId, percent: number) {
  if (percent >= 100) return true;
  const order = STAGES.map((s) => s.id);
  return order.indexOf(id) < order.indexOf(current);
}

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/** For a device that cannot draw the room: the photographs, and a word why. */
function NoWebGL() {
  return (
    <div className={styles.fallback}>
      <p className={styles.fallbackNote}>This device cannot draw the room in three dimensions. These are the photographs it is built from.</p>
      <div className={styles.fallbackGrid}>
        {LAB_PHOTOS.map((p) => (
          <figure key={p.id} className={styles.fallbackFigure}>
            <Image src={assetPath(p.src)} alt={p.caption} width={900} height={507} className={styles.photoImage} />
            <figcaption className={styles.photoCaption}>{p.caption}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
