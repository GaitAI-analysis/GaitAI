"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LAB_EXPERIENCE_EVENT, LAB_PROGRESS_EVENT, type EnterLabDetail, type LabProgress } from "./lab-experience-event";
import { LabPhotoStage, type PhotoLayers } from "./photo/LabPhotoStage";
import { PHOTO_CAMERAS } from "./photo/lab-photo-layout";
import { CAPTURE_CAMERA_COUNT } from "./scene/lab-layout";
import type { LabQuality, LabView } from "./scene/LabScene";
import styles from "./labExperience.module.css";

/* The three-dimensional twin is a separate chunk, fetched only when a reader
   chooses DIGITAL TWIN. The real room needs nothing but the photograph. */
const LabScene = dynamic(() => import("./scene/LabScene"), { ssr: false, loading: () => null });

const FOCUS_SELECTOR = 'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])';

type Mode = "photo" | "twin";

/**
 * THE INTERACTIVE LAB — the real room, explored.
 *
 * Opened by the cover's "Enter the Lab", the viewer expands the same
 * photograph to full height and lets a reader explore it: pan the room,
 * hover or focus a capture camera for its number, select one for where it
 * stands, what it sees and its line to the subject, and switch on the layers
 * — the pose a model would read, the sightlines of the whole camera ring,
 * the movement signal that a walk through the capture zone produces.
 *
 * REALITY IS THE PICTURE; THE TWIN IS SECONDARY. The photograph is the
 * default and the premium visual. The three-dimensional reconstruction is a
 * mode a reader may choose, labelled plainly as an approximate interactive
 * reconstruction; its chunk and its assets load only when chosen, so a phone
 * never pays for it unasked. Escape or the close control returns to the page
 * with focus back on the button that opened the room.
 */
export function LabExperience() {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState<DOMRect | null>(null);
  const [mode, setMode] = useState<Mode>("photo");
  const [layers, setLayers] = useState<PhotoLayers>({ cameras: false, pose: false, sightlines: false, movement: false });
  const [selected, setSelected] = useState<string | null>(null);
  const [twinView, setTwinView] = useState<LabView>({ kind: "orbit" });
  const [twinReady, setTwinReady] = useState(false);
  const [progress, setProgress] = useState<LabProgress>({ progress: 0, loaded: 0, total: 0, item: "" });
  const [quality, setQuality] = useState<LabQuality>("high");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [coarse, setCoarse] = useState(false);
  const [webgl, setWebgl] = useState(true);

  const openerRef = useRef<HTMLElement | null>(null);
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onRequest = (event: Event) => {
      openerRef.current = document.activeElement as HTMLElement | null;
      const pointerCoarse = window.matchMedia("(pointer: coarse)").matches;
      const cores = navigator.hardwareConcurrency ?? 4;
      setCoarse(pointerCoarse);
      setQuality(!pointerCoarse && cores >= 4 && window.innerWidth >= 900 ? "high" : "low");
      setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
      setWebgl(supportsWebGL());
      setFrom((event as CustomEvent<EnterLabDetail>).detail?.from ?? null);
      setOpen(true);
    };
    const onProgress = (event: Event) => setProgress((event as CustomEvent<LabProgress>).detail);
    window.addEventListener(LAB_EXPERIENCE_EVENT, onRequest);
    window.addEventListener(LAB_PROGRESS_EVENT, onProgress);
    return () => {
      window.removeEventListener(LAB_EXPERIENCE_EVENT, onRequest);
      window.removeEventListener(LAB_PROGRESS_EVENT, onProgress);
    };
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setMode("photo");
    setSelected(null);
    setTwinView({ kind: "orbit" });
    setTwinReady(false);
    setProgress({ progress: 0, loaded: 0, total: 0, item: "" });
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

  const toggle = (key: keyof PhotoLayers) => setLayers((l) => ({ ...l, [key]: !l[key] }));
  const overview = () => {
    setMode("photo");
    setSelected(null);
    setTwinView({ kind: "orbit" });
  };
  const chosen = useMemo(() => PHOTO_CAMERAS.find((c) => c.id === selected) ?? null, [selected]);
  const stage = useMemo(() => stageOf(progress.item), [progress.item]);

  if (!open) return null;

  const twin = mode === "twin";
  const cameraIndex = twinView.kind === "camera" ? twinView.index : -1;
  const stepCamera = (delta: number) => {
    const next = cameraIndex < 0 ? (delta > 0 ? 0 : CAPTURE_CAMERA_COUNT - 1) : (cameraIndex + delta + CAPTURE_CAMERA_COUNT) % CAPTURE_CAMERA_COUNT;
    setTwinView({ kind: "camera", index: next });
  };

  const caption = twin
    ? "Approximate interactive reconstruction of the room, built from the photographs"
    : chosen
      ? `Camera ${chosen.id} · ${chosen.place} · ${chosen.view}`
      : coarse
        ? "Drag to look around · Tap a camera"
        : "Drag to look around · Hover a camera, select it for its view · Esc to leave";

  return (
    <div
      ref={shellRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lab-experience-title"
      aria-describedby="lab-experience-desc"
      className={`${styles.shell} ${reducedMotion ? styles.shellStill : ""}`}
    >
      {/* ── The room ── */}
      {twin ? (
        <div className={styles.twinStage} aria-hidden="true">
          <LabScene view={twinView} showPose={layers.pose} showSightlines={layers.sightlines} quality={quality} reducedMotion={reducedMotion} onReady={() => setTwinReady(true)} />
        </div>
      ) : (
        <LabPhotoStage layers={layers} selected={selected} onSelect={setSelected} reducedMotion={reducedMotion} entering={from} />
      )}

      <p id="lab-experience-desc" className="sr-only">
        A photograph of the GaitAI biometrics capture room: a long bright hall with louvered windows and a polished tiled
        floor. Anubha Parashar stands at the centre of a clear capture zone, and twelve tripod-mounted cameras around
        the room all point at her. Each camera is a button that names where it stands and what it sees. Controls switch
        on the pose overlay, the cameras&apos; sightlines and the movement signal, or open an approximate
        three-dimensional reconstruction.
      </p>

      {/* The twin's veil, until its first frames are drawn — with what is actually arriving. */}
      {twin && (
        <div className={`${styles.veil} ${twinReady ? styles.veilHidden : ""}`} aria-hidden={twinReady}>
          <div className={styles.veilBox}>
            <span className={styles.veilTitle}>Preparing the digital twin</span>
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
              {progress.total > 0 ? `${progress.loaded} of ${progress.total} assets · ${Math.round(progress.progress)}%` : "Fetching the reconstruction…"}
            </span>
          </div>
        </div>
      )}

      {/* ── Chrome: one bar, restrained ── */}
      <header className={styles.top}>
        <div className={styles.titleBlock}>
          <span className={styles.eyebrow}>GaitAI Labs · Biometrics capture room</span>
          <h2 id="lab-experience-title" className={styles.title}>
            {twin ? "Digital twin" : "The real room"}
          </h2>
          <p className={`${styles.caption} ${chosen && !twin ? styles.captionOn : ""}`} aria-live="polite">
            {caption}
          </p>
        </div>

        <div className={styles.controls} role="toolbar" aria-label="Lab controls">
          <button type="button" className={styles.chip} onClick={overview}>
            Overview
          </button>
          {twin ? (
            <span className={styles.cameraStep}>
              <button type="button" className={styles.stepBtn} aria-label="Previous capture camera" onClick={() => stepCamera(-1)}>
                <span aria-hidden="true">‹</span>
              </button>
              <button
                type="button"
                className={`${styles.chip} ${twinView.kind === "camera" ? styles.chipOn : ""}`}
                aria-pressed={twinView.kind === "camera"}
                onClick={() => (twinView.kind === "camera" ? setTwinView({ kind: "orbit" }) : setTwinView({ kind: "camera", index: 0 }))}
              >
                {twinView.kind === "camera" ? `Camera ${String(twinView.index + 1).padStart(2, "0")} / ${CAPTURE_CAMERA_COUNT}` : "Cameras"}
              </button>
              <button type="button" className={styles.stepBtn} aria-label="Next capture camera" onClick={() => stepCamera(1)}>
                <span aria-hidden="true">›</span>
              </button>
            </span>
          ) : (
            <button type="button" className={`${styles.chip} ${layers.cameras ? styles.chipOn : ""}`} aria-pressed={layers.cameras} onClick={() => toggle("cameras")}>
              Cameras
            </button>
          )}
          <button type="button" className={`${styles.chip} ${layers.pose ? styles.chipOn : ""}`} aria-pressed={layers.pose} onClick={() => toggle("pose")}>
            Pose
          </button>
          <button type="button" className={`${styles.chip} ${layers.sightlines ? styles.chipOn : ""}`} aria-pressed={layers.sightlines} onClick={() => toggle("sightlines")}>
            Sightlines
          </button>
          {!twin && (
            <button type="button" className={`${styles.chip} ${layers.movement ? styles.chipOn : ""}`} aria-pressed={layers.movement} onClick={() => toggle("movement")}>
              Movement
            </button>
          )}
          <span className={styles.seg} role="group" aria-label="Room mode">
            <button type="button" className={`${styles.segBtn} ${!twin ? styles.segOn : ""}`} aria-pressed={!twin} onClick={() => setMode("photo")}>
              Real room
            </button>
            <button
              type="button"
              className={`${styles.segBtn} ${twin ? styles.segOn : ""}`}
              aria-pressed={twin}
              disabled={!webgl}
              title={webgl ? "An approximate interactive reconstruction" : "This device cannot draw the reconstruction"}
              onClick={() => {
                setSelected(null);
                setMode("twin");
              }}
            >
              Digital twin
            </button>
          </span>
          <button type="button" onClick={close} aria-label="Close the lab" className={styles.close} data-autofocus>
            <span aria-hidden="true">✕</span>
          </button>
        </div>
      </header>

      {twin && (
        <p className={styles.twinTag}>
          <span className={styles.twinTagMark} aria-hidden="true" />
          Digital twin · approximate interactive reconstruction
        </p>
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
