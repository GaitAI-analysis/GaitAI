"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { assetPath } from "@/lib/paths";
import { LAB_EXPERIENCE_EVENT, LAB_PROGRESS_EVENT, type LabProgress } from "./lab-experience-event";
import { LabPhotoStage, type PhotoLayers } from "./photo/LabPhotoStage";
import { LAB_SITTING_PHOTO, PHOTO_CAMERAS } from "./photo/lab-photo-layout";
import { CAPTURE_CAMERA_COUNT } from "./scene/lab-layout";
import type { LabQuality, LabView } from "./scene/LabScene";
import styles from "./labExperience.module.css";

/* The three-dimensional room is a separate chunk, fetched when the lab is entered. */
const LabScene = dynamic(() => import("./scene/LabScene"), { ssr: false, loading: () => null });

const FOCUS_SELECTOR = 'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])';

type Mode = "twin" | "photo";

/**
 * STAGE TWO OF GAITAI LABS — the interactive room.
 *
 * The cover shows the founder SITTING at work in the lab (the approved cover,
 * never changed with the 3D work). "Enter the Lab" opens this: the same room
 * in three dimensions, with her STANDING at the centre of the capture ring,
 * every camera aimed at her. The visitor drags to
 * orbit, zooms, stands at any capture camera, switches on the pose overlay
 * and the sightlines, and can hold the reconstruction against the real
 * photograph (REAL ROOM), which carries its own camera hotspots and layers.
 *
 * ENTERING IS A FADE, NOT A CUT. The cover photograph is carried into the
 * viewer and dissolves — drifting slightly forward — into the room as it
 * loads, so the visitor feels they are walking into the room they were
 * looking at. Escape or the close control returns to the page,
 * cover intact, with focus back on the button. Nothing reloads.
 *
 * The 3D room is labelled for what it is: an approximate reconstruction with
 * a 3D human representation — not a scan, not a 4D capture.
 */
export function LabExperience() {
  const [open, setOpen] = useState(false);
  const [entering, setEntering] = useState(false);
  const [mode, setMode] = useState<Mode>("twin");
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
    const onRequest = () => {
      openerRef.current = document.activeElement as HTMLElement | null;
      const pointerCoarse = window.matchMedia("(pointer: coarse)").matches;
      const cores = navigator.hardwareConcurrency ?? 4;
      const canDraw = supportsWebGL();
      setCoarse(pointerCoarse);
      setQuality(!pointerCoarse && cores >= 4 && window.innerWidth >= 900 ? "high" : "low");
      setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
      setWebgl(canDraw);
      setMode(canDraw ? "twin" : "photo");
      setEntering(true);
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

  /* The entrance dissolve ends on its own; the room may still be loading under it. */
  useEffect(() => {
    if (!entering) return;
    const id = window.setTimeout(() => setEntering(false), reducedMotion ? 50 : 1400);
    return () => window.clearTimeout(id);
  }, [entering, reducedMotion]);

  const close = useCallback(() => {
    setOpen(false);
    setEntering(false);
    setMode("twin");
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
    ? twinView.kind === "camera"
      ? `Standing at capture camera ${String(twinView.index + 1).padStart(2, "0")} of ${CAPTURE_CAMERA_COUNT} · looking at the subject`
      : coarse
        ? "Drag to look around · Pinch to move closer"
        : "Drag to look around · Scroll to move closer · Esc to leave"
    : chosen
      ? `Camera ${chosen.id} · ${chosen.place} · ${chosen.view}`
      : coarse
        ? "The real room · Drag to look around · Tap a camera"
        : "The real room · Drag to look around · Hover a camera, select it for its view";

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
        <LabPhotoStage layers={layers} selected={selected} onSelect={setSelected} reducedMotion={reducedMotion} entering={null} />
      )}

      <p id="lab-experience-desc" className="sr-only">
        An approximate three-dimensional reconstruction of the GaitAI biometrics capture room, with a 3D human
        representation standing at the centre and {CAPTURE_CAMERA_COUNT} capture cameras around the room aimed at her.
        Drag to look around; the controls move the view to each camera, switch on the pose overlay and the sightlines,
        or show the real photograph of the room with its own camera markers.
      </p>

      {/* The twin's veil, until its first frames are drawn — with what is actually arriving. */}
      {twin && (
        <div className={`${styles.veil} ${twinReady ? styles.veilHidden : ""}`} aria-hidden={twinReady}>
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

      {/* The entrance: the cover photograph, carried in and dissolving into the room. */}
      {entering && (
        <div className={styles.enter} aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element -- a transient full-screen dissolve */}
          <img src={assetPath(LAB_SITTING_PHOTO.src)} alt="" className={styles.enterImage} />
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
            <button
              type="button"
              className={`${styles.segBtn} ${twin ? styles.segOn : ""}`}
              aria-pressed={twin}
              disabled={!webgl}
              title={webgl ? "Approximate interactive reconstruction" : "This device cannot draw the reconstruction"}
              onClick={() => {
                setSelected(null);
                setMode("twin");
              }}
            >
              Digital twin
            </button>
            <button type="button" className={`${styles.segBtn} ${!twin ? styles.segOn : ""}`} aria-pressed={!twin} onClick={() => setMode("photo")}>
              Real room
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
          Digital twin · approximate reconstruction · 3D human representation
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
