"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { assetPath } from "@/lib/paths";
import {
  GAIT_SIGNAL,
  LAB_PHOTO,
  PHOTO_BONES,
  PHOTO_CAMERAS,
  PHOTO_CAPTURE_ZONE,
  PHOTO_FOOTSTEPS,
  PHOTO_POSE,
  PHOTO_SUBJECT,
  PHOTO_WALK_PATH,
} from "./lab-photo-layout";
import styles from "./labPhoto.module.css";

/**
 * THE REAL ROOM — the photograph, full height, with the intelligence drawn on it.
 *
 * The photograph is shown at the stage's full height and its own aspect, so it
 * stays sharp and complete; where it is wider than the stage the reader pans
 * it by dragging (or a finger), the way one turns to look around a room. The
 * overlay is one SVG in the photograph's pixel space, sized exactly to the
 * rendered image, so every mark stays registered to the picture at any
 * viewport. The camera hotspots are real buttons over the same rectangle, so
 * they are focusable and announced.
 *
 * LAYERS. Cameras (labels for every hotspot), pose (a research-grade
 * skeleton: hairline bones, small landmarks, low opacity), sightlines (each
 * camera to the subject's chest), and the movement signal (the walking line
 * through the capture zone and the stride trace it produces). The capture
 * zone itself is always drawn, faintly: a floor ellipse and a label, nothing
 * more. Selecting a camera brightens it and draws its own sightline.
 */

export interface PhotoLayers {
  cameras: boolean;
  pose: boolean;
  sightlines: boolean;
  movement: boolean;
}

export function LabPhotoStage({
  layers,
  selected,
  onSelect,
  reducedMotion,
  entering,
}: {
  layers: PhotoLayers;
  selected: string | null;
  onSelect: (id: string | null) => void;
  reducedMotion: boolean;
  /** The cover image's rectangle at the moment of entry, for the transition. */
  entering: DOMRect | null;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState({ w: 0, h: 0 });
  const [pan, setPan] = useState(0);
  const [hover, setHover] = useState<string | null>(null);
  const drag = useRef<{ x: number; pan: number; moved: boolean; id: number } | null>(null);

  useLayoutEffect(() => {
    const node = stageRef.current;
    if (!node) return;
    const measure = () => setStage({ w: node.clientWidth, h: node.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  /* The photograph's rendered size: full height, own aspect. */
  const ratio = LAB_PHOTO.width / LAB_PHOTO.height;
  const imgW = stage.h * ratio;
  const maxPan = Math.max(0, (imgW - stage.w) / 2);
  const clampPan = useCallback((value: number) => Math.max(-maxPan, Math.min(maxPan, value)), [maxPan]);
  useEffect(() => setPan((p) => clampPan(p)), [clampPan]);

  /* The pointer is captured only once a drag has actually begun: capturing
     on press would redirect the click to the stage and swallow the hotspots. */
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    drag.current = { x: e.clientX, pan, moved: false, id: e.pointerId };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) > 4) {
      d.moved = true;
      (e.currentTarget as HTMLElement).setPointerCapture(d.id);
    }
    if (d.moved) setPan(clampPan(d.pan + dx));
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  /* Entry: the photograph starts where the cover showed it and settles to full height. */
  const [settled, setSettled] = useState(!entering);
  useEffect(() => {
    if (!entering) return;
    const id = requestAnimationFrame(() => setSettled(true));
    return () => cancelAnimationFrame(id);
  }, [entering]);
  const entryStyle = useMemo(() => {
    if (!entering || settled || !stage.h) return undefined;
    const s = entering.height / stage.h;
    const cx = entering.left + entering.width / 2;
    const cy = entering.top + entering.height / 2;
    return { transform: `translate(${cx - stage.w / 2}px, ${cy - stage.h / 2}px) scale(${s})` };
  }, [entering, settled, stage]);

  const cameraById = useMemo(() => new Map(PHOTO_CAMERAS.map((c) => [c.id, c])), []);
  const chosen = selected ? cameraById.get(selected) ?? null : null;

  /* The stride trace, as an SVG polyline in photograph pixels, bottom right. */
  const signal = useMemo(() => {
    const x0 = 1300, y0 = 640, w = 300, h = 60;
    return GAIT_SIGNAL.map((v, i) => `${(x0 + (i / (GAIT_SIGNAL.length - 1)) * w).toFixed(1)},${(y0 + h - v * h).toFixed(1)}`).join(" ");
  }, []);

  return (
    <div
      ref={stageRef}
      className={`${styles.stage} ${entering && !settled ? "" : styles.stageSettled}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={(e) => {
        /* A click on the photograph itself (not a hotspot) clears the selection. */
        if (drag.current?.moved) return;
        if ((e.target as HTMLElement).closest("button")) return;
        onSelect(null);
      }}
      style={entryStyle}
      role="group"
      aria-label="The GaitAI biometrics capture room, with interactive camera markers"
    >
      <div
        className={styles.frame}
        style={{ width: imgW || undefined, height: stage.h || undefined, transform: `translateX(calc(-50% + ${pan}px))` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- sized by the stage, not by Next */}
        <img src={assetPath(LAB_PHOTO.src)} alt={LAB_PHOTO.alt} draggable={false} className={styles.photo} />

        <svg className={styles.overlay} viewBox={`0 0 ${LAB_PHOTO.width} ${LAB_PHOTO.height}`} preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="lab-signal" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#4fd1ff" />
              <stop offset="0.6" stopColor="#5587ff" />
              <stop offset="1" stopColor="#9c64f1" />
            </linearGradient>
          </defs>

          {/* The capture zone: a floor ellipse and its label, always, faintly. */}
          <ellipse cx={PHOTO_CAPTURE_ZONE.cx} cy={PHOTO_CAPTURE_ZONE.cy} rx={PHOTO_CAPTURE_ZONE.rx} ry={PHOTO_CAPTURE_ZONE.ry} className={styles.zone} />
          <text x={PHOTO_CAPTURE_ZONE.cx + PHOTO_CAPTURE_ZONE.rx + 14} y={PHOTO_CAPTURE_ZONE.cy + 4} className={styles.zoneLabel}>
            CAPTURE ZONE
          </text>

          {/* Sightlines: every camera to her chest; the chosen one brighter. */}
          {(layers.sightlines || chosen) &&
            PHOTO_CAMERAS.filter((c) => layers.sightlines || c.id === selected).map((c) => (
              <line
                key={c.id}
                x1={c.x}
                y1={c.y}
                x2={PHOTO_SUBJECT.x}
                y2={PHOTO_SUBJECT.y}
                className={`${styles.sightline} ${c.id === selected ? styles.sightlineOn : ""}`}
              />
            ))}

          {/* The movement signal: the walking line, its foot-strikes, and the trace. */}
          {layers.movement && (
            <g className={reducedMotion ? styles.still : undefined}>
              <path d={PHOTO_WALK_PATH} className={styles.walk} />
              {PHOTO_FOOTSTEPS.map(([x, y], i) => (
                <ellipse key={i} cx={x} cy={y} rx={9} ry={4} className={styles.footstep} style={{ animationDelay: `${i * 0.28}s` }} />
              ))}
              <line x1={PHOTO_SUBJECT.x + 60} y1={PHOTO_SUBJECT.y + 40} x2={1300} y2={640 + 30} className={styles.leader} />
              <rect x={1288} y={628} width={324} height={84} rx={6} className={styles.signalBox} />
              <polyline points={signal} className={styles.signal} />
              <text x={1300} y={722 + 4} className={styles.signalLabel}>
                MOVEMENT → CAPTURED VIEWS → GAIT SIGNAL
              </text>
            </g>
          )}

          {/* The pose: hairline bones and small landmarks, low opacity. */}
          {layers.pose && (
            <g>
              {PHOTO_BONES.map(([a, b]) => (
                <line key={`${a}-${b}`} x1={PHOTO_POSE[a][0]} y1={PHOTO_POSE[a][1]} x2={PHOTO_POSE[b][0]} y2={PHOTO_POSE[b][1]} className={styles.bone} />
              ))}
              {Object.entries(PHOTO_POSE).map(([k, [x, y]]) => (
                <circle key={k} cx={x} cy={y} r={3.6} className={styles.joint} />
              ))}
            </g>
          )}
        </svg>

        {/* The cameras: real buttons over the photograph. */}
        {PHOTO_CAMERAS.map((c) => {
          const on = c.id === selected;
          const labelled = layers.cameras || on || hover === c.id;
          return (
            <button
              key={c.id}
              type="button"
              className={`${styles.hotspot} ${on ? styles.hotspotOn : ""}`}
              style={{ left: `${(c.x / LAB_PHOTO.width) * 100}%`, top: `${(c.y / LAB_PHOTO.height) * 100}%` }}
              aria-label={`Camera ${c.id}: ${c.place}. ${c.view}.`}
              aria-pressed={on}
              onMouseEnter={() => setHover(c.id)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(c.id)}
              onBlur={() => setHover(null)}
              onClick={(e) => {
                e.stopPropagation();
                if (drag.current?.moved) return;
                onSelect(on ? null : c.id);
              }}
            >
              <span aria-hidden="true" className={styles.ring} />
              <span aria-hidden="true" className={`${styles.tag} ${labelled ? styles.tagOn : ""}`}>
                CAMERA {c.id}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
