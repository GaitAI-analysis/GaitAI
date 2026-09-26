"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { assetPath } from "@/lib/paths";
import { LAB_EXPERIENCE_EVENT } from "./lab-experience-event";
import { LabPhotoStage, type PhotoLayers } from "./photo/LabPhotoStage";
import { PHOTO_CAMERAS } from "./photo/lab-photo-layout";
import { CAPTURE_CAMERA_COUNT } from "./scene/lab-layout";
import type { LabQuality, LabView } from "./scene/LabScene";
import styles from "./labExperience.module.css";

/* The three-dimensional room is a separate chunk, fetched when the lab is entered. */
const LabScene = dynamic(() => import("./scene/LabScene"), { ssr: false, loading: () => null });

const FOCUS_SELECTOR = 'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])';

type Mode = "twin" | "photo";

/* The real door of the biometrics lab — the photograph the visitor walks through. */
const LAB_GATE_PHOTO = "/assets/images/labs/lab-gate.jpg";

/**
 * The entrance, in phases. "closed": the door photograph is on screen, a
 * cinematic beat. "opening": the leaf swings into the room. "open": fully open,
 * held only until the room under it has drawn its first frames. "through": the
 * view moves in through the doorway and the photograph dissolves. "done":
 * nothing left of it.
 */
type GatePhase = "closed" | "opening" | "open" | "through" | "done";

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
 * ENTERING IS WALKING THROUGH THE DOOR. The real door of the lab — the white
 * leaf with the BIOMETRICS LAB sign — appears, swings open into the room, and
 * the view moves in through the doorway onto the room, which has been loading
 * underneath the whole time. There is no loader: if the room is not ready when
 * the door is open, the door simply stands open a moment longer. Escape or the
 * close control returns to the page, cover intact, with focus back on the
 * button. Nothing reloads.
 *
 * The 3D room is labelled for what it is: an approximate reconstruction with
 * a 3D human representation — not a scan, not a 4D capture.
 */
export function LabExperience() {
  const [open, setOpen] = useState(false);
  const [gate, setGate] = useState<GatePhase>("done");
  const [gateShown, setGateShown] = useState(false);
  const [mode, setMode] = useState<Mode>("twin");
  const [layers, setLayers] = useState<PhotoLayers>({ cameras: false, pose: false, sightlines: false, movement: false });
  const [selected, setSelected] = useState<string | null>(null);
  const [twinView, setTwinView] = useState<LabView>({ kind: "orbit" });
  const [twinReady, setTwinReady] = useState(false);
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
      setGateShown(false);
      setGate("closed");
      setOpen(true);
    };
    window.addEventListener(LAB_EXPERIENCE_EVENT, onRequest);
    return () => window.removeEventListener(LAB_EXPERIENCE_EVENT, onRequest);
  }, []);

  /* Warm the door photograph so it is on screen the instant the lab is entered. */
  useEffect(() => {
    const img = new Image();
    img.src = assetPath(LAB_GATE_PHOTO);
  }, []);

  /* The room under the door: the twin says when its first frames are drawn; the photograph is ready at once. */
  const roomReady = mode === "twin" ? twinReady : true;

  /* Closed → opening: a short beat once the door is on screen (and not much longer if the photo is slow). */
  useEffect(() => {
    if (gate !== "closed") return;
    const beat = reducedMotion ? 350 : 650;
    const id = window.setTimeout(() => setGate(reducedMotion ? "open" : "opening"), gateShown ? beat : 1200);
    return () => window.clearTimeout(id);
  }, [gate, gateShown, reducedMotion]);

  /* Opening → open: the swing of the leaf. */
  useEffect(() => {
    if (gate !== "opening") return;
    const id = window.setTimeout(() => setGate("open"), 1100);
    return () => window.clearTimeout(id);
  }, [gate]);

  /* Open → through: the moment the room is ready. The door never holds the visitor indefinitely. */
  useEffect(() => {
    if (gate !== "open") return;
    if (roomReady) {
      setGate("through");
      return;
    }
    const id = window.setTimeout(() => setGate("through"), 15000);
    return () => window.clearTimeout(id);
  }, [gate, roomReady]);

  /* Through → done: the move in through the doorway, then nothing is left of the door. */
  useEffect(() => {
    if (gate !== "through") return;
    const id = window.setTimeout(() => setGate("done"), reducedMotion ? 600 : 1000);
    return () => window.clearTimeout(id);
  }, [gate, reducedMotion]);

  const close = useCallback(() => {
    setOpen(false);
    setGate("done");
    setGateShown(false);
    setMode("twin");
    setSelected(null);
    setTwinView({ kind: "orbit" });
    setTwinReady(false);
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

      {/* The entrance: the lab's real door, opening into the room that is loading beneath it. */}
      {gate !== "done" && (
        <div className={styles.gate} data-phase={gate} data-ready={roomReady} aria-hidden="true">
          <div className={styles.gateFrame}>
            <div className={styles.gateBackdrop} style={{ "--gate-src": `url("${assetPath(LAB_GATE_PHOTO)}")` } as CSSProperties} />
            {/* eslint-disable-next-line @next/next/no-img-element -- transient full-screen entrance layers */}
            <img src={assetPath(LAB_GATE_PHOTO)} alt="" className={styles.gateSurround} onLoad={() => setGateShown(true)} />
            <div className={styles.gateDoorway} />
            <div className={styles.gateLeaf}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={assetPath(LAB_GATE_PHOTO)} alt="" className={styles.gateLeafImage} />
              <span className={styles.gateLeafShade} />
            </div>
          </div>
        </div>
      )}

      {/* ── Chrome: one bar, restrained ── */}
      <header className={`${styles.top} ${gate !== "done" ? styles.chromeWait : ""}`}>
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
        <p className={`${styles.twinTag} ${gate !== "done" ? styles.chromeWait : ""}`}>
          <span className={styles.twinTagMark} aria-hidden="true" />
          Digital twin · approximate reconstruction · 3D human representation
        </p>
      )}
    </div>
  );
}

/* ── Helpers ── */

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}
