"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { PLATE, WALKER_PHASE, plateFit } from "@/components/visuals/capture-plate";
import { PoseFrame } from "@/components/research/PoseFrame";
import { trackInsightEvent } from "@/lib/insight-events";
import { assetPath } from "@/lib/paths";
import { InteractiveFigure } from "../InteractiveFigure";
import { StageControl, type Stage } from "../StageControl";
import { ShareInsight, useSharedFigureState } from "../ShareInsight";
import { useNarrow } from "../useNarrow";
import type { FigureProps } from "../registry";
import {
  ANGLE_BUCKET,
  ANGLE_LABEL,
  AVAILABILITY_LABEL,
  CAMERA_ANGLES,
  SIGNALS,
  availabilityAt,
  isCameraAngle,
  projectPhase,
  type CameraAngle,
} from "./camera-model";
import fig from "../figures.module.css";
import ui from "../experience.module.css";

/**
 * CAMERA ANGLE CHANGES WHAT AI SEES — carry the camera around a walker.
 *
 *            FRONT
 *      ·  ·    ↓    ·  ·
 *   LEFT ←  (walker)  → RIGHT     what the camera sees    which signals
 *      ·  ·    ↑    ·  ·          [ projected walker ]    knee flexion  easier
 *            REAR                                          stride width  unavailable …
 *
 * A plan view: the walker at the centre, walking to the right; the camera on
 * a ring at one of eight positions. Drag the camera round the ring (or use
 * the track and arrow keys) and the middle panel shows the same stride
 * projected from there, while the right-hand panel says what each movement
 * signal becomes — easier, harder or unavailable — in words.
 *
 * ILLUSTRATIVE. The projection is a plan-view sketch, not a camera model; the
 * availability of a signal is an engineering intuition stated in three words.
 */

const W = 640;
const H = 360;
const CX = 150;
const CY = 190;
const R = 108;
const FRAME = { x: 300, y: 44, w: 156, h: 250 };
const PANEL_X = 468;
const PANEL_W = 166;

/**
 * WHAT THE CAMERA SEES IS THE SAME FRAME, RE-PROJECTED.
 * The middle panel used to be a keyframe skeleton on an empty rectangle — a
 * viewpoint represented by a camera icon orbiting a mannequin. It is now the
 * site's capture plate seen from each position: from the side as shot; from
 * the right side mirrored, because the walker is now heading the other way;
 * from front or rear compressed along the walk so the stride foreshortens;
 * from an oblique position compressed and leaned. Over it, that walker's own
 * joints projected the same way (`projectPhase`), so the photograph and the
 * skeleton agree about what the angle does. A plan-view sketch of a
 * projection, not a camera model — the caption says so, as it always did.
 */
const FIT = plateFit("portrait", FRAME);
const FRAME_CX = FRAME.x + FRAME.w / 2;
const FRAME_CY = FRAME.y + FRAME.h / 2;

/** How the frame re-projects for an angle: horizontal scale (signed) and lean. */
function frameView(angle: CameraAngle): { sx: number; skew: number } {
  const theta = (angle * Math.PI) / 180;
  const along = Math.cos(theta);
  /* Never to zero: a front view is narrow, not a line. */
  const sx = Math.sign(along || 1) * Math.max(0.42, Math.abs(along));
  const skew = angle % 90 === 0 ? 0 : (angle < 180 ? -1 : 1) * 7;
  return { sx, skew };
}

const DESCRIPTION = `A plan view of a walker seen from above, walking to the right, with a camera on a ring around them at one of eight positions: side (left), front-left, front, front-right, side (right), rear-right, rear, rear-left.
Dragging the camera round the ring, or moving the eight-step track, shows the same stride projected from the chosen position in a middle panel: from the side the legs swing in one plane and the stride is fully visible; from the front or rear the figure is narrow, the feet are apart and the stride is foreshortened; from an oblique position both are partially visible.
A right-hand panel states what five movement signals become from that angle, in words: knee flexion, stride width, step timing, foot trajectory and body path, each easier, harder or unavailable. Side views make knee flexion and foot trajectory easier and stride width unavailable; front and rear views make stride width easier and knee flexion unavailable; oblique views make most signals harder but body path easier. Illustrative: a sketch of a projection, not a camera model.`;

const CLASSES = { bone: fig.bone, boneFar: fig.boneFar, joint: fig.joint, head: fig.head };

/* Camera angle → position on the ring (plan view, walker facing right). */
function ringPoint(angle: CameraAngle): [number, number] {
  const a = (angle * Math.PI) / 180;
  /* 0 = beside the left side (below the walker in plan), 90 = in front (to the right). */
  return [CX + R * Math.sin(a) * (angle === 90 || angle === 270 ? 1 : 1), CY + R * Math.cos(a)];
}

export function CameraAngleExplorer({ articleSlug, presentation }: FigureProps) {
  const shared = useSharedFigureState("camera-angle-explorer");
  const [angle, setAngle] = useState<CameraAngle>(() => (isCameraAngle(presentation?.angle) ? presentation.angle : 0));
  const stacked = useNarrow(640);
  const visited = useRef(new Set<string>());
  const dragging = useRef(false);

  useEffect(() => {
    if (shared && isCameraAngle(shared.angle)) setAngle(shared.angle);
  }, [shared]);
  useEffect(() => {
    if (presentation && isCameraAngle(presentation.angle)) setAngle(presentation.angle);
  }, [presentation]);

  const choose = (next: CameraAngle) => {
    setAngle(next);
    if (presentation) return;
    const bucket = ANGLE_BUCKET[next];
    trackInsightEvent("camera_angle_changed", { article_slug: articleSlug, angle_bucket: bucket }, { debounce: "camera" });
    visited.current.add(bucket === "oblique-rear" ? "oblique-front" : bucket === "rear" ? "front" : bucket);
    /* Completion: the reader has stood at a side, at a front/rear and at an
       oblique — the three views the essay contrasts. */
    if (visited.current.size >= 3) {
      trackInsightEvent(
        "interactive_figure_complete",
        { article_slug: articleSlug, figure_id: "camera-angle-explorer" },
        { once: "camera-angle-explorer" },
      );
    }
  };

  /* Drag the camera round the ring: nearest of the eight positions to the pointer. */
  const angleFromPointer = (event: PointerEvent<SVGSVGElement>): CameraAngle => {
    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    const x = vb.x + ((event.clientX - rect.left) / rect.width) * vb.width;
    const y = vb.y + ((event.clientY - rect.top) / rect.height) * vb.height;
    const dx = x - CX;
    const dy = y - CY;
    /* Inverse of ringPoint: sin(a) = dx / R, cos(a) = dy / R. */
    let deg = (Math.atan2(dx, dy) * 180) / Math.PI;
    if (deg < 0) deg += 360;
    const nearest = CAMERA_ANGLES.reduce((best, candidate) => {
      const d = Math.min(Math.abs(candidate - deg), 360 - Math.abs(candidate - deg));
      const bd = Math.min(Math.abs(best - deg), 360 - Math.abs(best - deg));
      return d < bd ? candidate : best;
    }, CAMERA_ANGLES[0]);
    return nearest;
  };
  const onPointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if (presentation) return;
    const [px, py] = [event.clientX, event.clientY];
    const rect = event.currentTarget.getBoundingClientRect();
    const vb = event.currentTarget.viewBox.baseVal;
    const x = vb.x + ((px - rect.left) / rect.width) * vb.width;
    const y = vb.y + ((py - rect.top) / rect.height) * vb.height;
    /* Only the ring is a handle: a press elsewhere is not a camera move. */
    const dist = Math.hypot(x - CX, y - CY);
    if (dist < R - 40 || dist > R + 40) return;
    dragging.current = true;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* fine */
    }
    choose(angleFromPointer(event));
  };
  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (!dragging.current) return;
    const next = angleFromPointer(event);
    if (next !== angle) choose(next);
  };
  const onPointerUp = () => {
    dragging.current = false;
  };

  const phase = WALKER_PHASE;
  const projected = projectPhase(phase, angle);
  const availability = availabilityAt(angle);
  const [camX, camY] = ringPoint(angle);
  const view = frameView(angle);
  /* The projected walker stays on the frame's centre line, as the photograph
     does once it is scaled about that line. */
  const fx = FRAME_CX;
  const fy = FIT.hip[1];
  const s = FIT.poseScale;
  const groundY = fy + 48 * s;

  const stages: Stage[] = CAMERA_ANGLES.map((value) => ({ id: String(value), label: ANGLE_LABEL[value], name: ANGLE_LABEL[value] }));
  const bucket = ANGLE_BUCKET[angle];
  /* Stacked: plan view, then the camera's frame, then the signals, one under
     another down a phone. */
  const viewBox = stacked ? "0 0 322 900" : `0 0 ${W} ${H}`;
  const planTransform = stacked ? "translate(12 -10)" : undefined;
  const frameTransform = stacked ? `translate(${-FRAME.x + 24} 300)` : undefined;
  const panelTransform = stacked ? `translate(${-PANEL_X + 24} 578)` : undefined;

  const svg = (
    <svg
      viewBox={viewBox}
      className={`${fig.svg} ${stacked ? fig.narrow : ""}`}
      aria-hidden="true"
      style={{ maxHeight: stacked ? undefined : 380, margin: "0 auto", cursor: presentation ? undefined : "grab" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* ── the plan view ── */}
      <g transform={planTransform}>
        <text className={`${fig.label} ${fig.labelSmall}`} x={CX} y={CY - R - 30} textAnchor="middle">
          plan view · walking →
        </text>
        <circle className={fig.dash} cx={CX} cy={CY} r={R} />
        {CAMERA_ANGLES.map((value) => {
          const [x, y] = ringPoint(value);
          const on = value === angle;
          return (
            <g key={value}>
              <circle className={on ? fig.nodeFill : fig.nodeMute} cx={x} cy={y} r={on ? 0 : 2.4} />
            </g>
          );
        })}
        {[
          [90, "front", CX + R + 12, CY + 4, "start"],
          [270, "rear", CX - R - 12, CY + 4, "end"],
          [0, "left side", CX, CY + R + 22, "middle"],
          [180, "right side", CX, CY - R - 12, "middle"],
        ].map(([, text, x, y, anchor]) => (
          <text key={String(text)} className={`${fig.label} ${fig.labelSmall}`} x={Number(x)} y={Number(y)} textAnchor={anchor as "start" | "end" | "middle"}>
            {text}
          </text>
        ))}
        {/* the walker, from above: shoulders and head, heading right */}
        <ellipse cx={CX} cy={CY} rx={20} ry={8} className={fig.mass} />
        <circle cx={CX} cy={CY} r={6} className={fig.nodeFill} style={{ fill: "var(--jr-ink)" }} />
        <line className={fig.trace} x1={CX + 26} y1={CY} x2={CX + 52} y2={CY} />
        <polyline className={fig.trace} points={`${CX + 44},${CY - 6} ${CX + 54},${CY} ${CX + 44},${CY + 6}`} />
        {/* the camera and its line of sight */}
        <line className={fig.dash} x1={camX} y1={camY} x2={CX} y2={CY} style={{ stroke: "var(--jr-cyan)" }} />
        <g className={fig.move} transform={`translate(${camX} ${camY})`}>
          <circle className={fig.halo} r={16} />
          <rect x={-11} y={-8} width={22} height={16} rx={3} fill="rgb(var(--c-obsidian-400))" stroke="var(--jr-cyan)" strokeWidth={1.4} />
          <circle className={fig.nodeFill} r={3.5} />
        </g>
        <text className={`${fig.label} ${fig.labelKey} ${fig.labelAccent}`} x={CX} y={CY + R + 44} textAnchor="middle">
          {ANGLE_LABEL[angle]}
        </text>
      </g>

      {/* ── what the camera sees ── */}
      <g transform={frameTransform}>
        <rect className={fig.frame} x={FRAME.x} y={FRAME.y} width={FRAME.w} height={FRAME.h} rx={3} />
        <text className={`${fig.label} ${fig.labelInk}`} x={FRAME.x + 10} y={FRAME.y + 16}>
          What the camera sees
        </text>
        <defs>
          <clipPath id="cam-frame">
            <rect x={FRAME.x} y={FRAME.y} width={FRAME.w} height={FRAME.h} rx={3} />
          </clipPath>
        </defs>
        <g clipPath="url(#cam-frame)">
          {/* the frame as this camera would resolve it */}
          <g
            className={fig.move}
            transform={`translate(${FRAME_CX} ${FRAME_CY}) scale(${view.sx} 1) skewX(${view.skew}) translate(${-FRAME_CX} ${-FRAME_CY})`}
          >
            <image
              href={assetPath(PLATE.portrait.src)}
              x={FRAME.x}
              y={FRAME.y}
              width={FRAME.w}
              height={FRAME.h}
              preserveAspectRatio="xMidYMid slice"
              className={fig.photo}
              style={{ opacity: 0.82 }}
            />
          </g>
          <line className={fig.ground} x1={FRAME.x + 12} y1={groundY} x2={FRAME.x + FRAME.w - 12} y2={groundY} />
          <g className={fig.move} transform={`translate(${fx} ${fy})`}>
            <PoseFrame phase={projected} s={s} classes={CLASSES} />
          </g>
        </g>
        <text className={`${fig.label} ${fig.labelSmall}`} x={FRAME.x + 10} y={FRAME.y + FRAME.h - 10}>
          {bucket === "side" ? "same frame · one plane · full stride" : bucket === "front" || bucket === "rear" ? "same frame · narrow · foreshortened" : "same frame · both planes · partially"}
        </text>
      </g>

      {/* ── which signals ── */}
      <g transform={panelTransform}>
        <text className={`${fig.label} ${fig.labelInk}`} x={PANEL_X} y={FRAME.y + 16}>
          From this angle
        </text>
        <text className={`${fig.label} ${fig.labelSmall}`} x={PANEL_X} y={FRAME.y + 32}>
          {ANGLE_LABEL[angle].toLowerCase()} · illustrative
        </text>
        {SIGNALS.map((signal, i) => {
          const y = FRAME.y + 66 + i * (stacked ? 46 : 40);
          const state = availability[signal.id];
          return (
            <g key={signal.id}>
              <text className={`${fig.label} ${fig.labelKey}`} x={PANEL_X} y={y}>
                {signal.label}
              </text>
              <line className={fig.hair} x1={PANEL_X} y1={y + (stacked ? 24 : 8)} x2={PANEL_X + PANEL_W} y2={y + (stacked ? 24 : 8)} />
              <text
                className={`${fig.label} ${fig.labelSmall} ${state === "easier" ? fig.labelTeal : state === "harder" ? fig.labelWarn : ""}`}
                x={stacked ? PANEL_X : PANEL_X + PANEL_W}
                y={stacked ? y + 16 : y}
                textAnchor={stacked ? "start" : "end"}
                style={state === "unavailable" ? { opacity: 0.7 } : undefined}
              >
                {AVAILABILITY_LABEL[state].toLowerCase()}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );

  if (presentation) return <div>{svg}</div>;

  return (
    <InteractiveFigure
      id="camera-angle-explorer"
      articleSlug={articleSlug}
      eyebrow="Interactive hero"
      title="Carry the camera around a walker"
      status="illustrative"
      hint="drag"
      hero
      minHeight="420px"
      description={DESCRIPTION}
      caption={
        <>
          <strong>{ANGLE_LABEL[angle]}.</strong>{" "}
          {bucket === "side"
            ? "The camera looks across the plane the legs swing in: joint angles, stride length and heel-strike timing are laid out in the image, and stride width collapses to nothing."
            : bucket === "front" || bucket === "rear"
              ? "The camera looks along the walk: width, sway and foot placement are visible, knee flexion is nearly invisible, and the figure changes size every frame."
              : "The common mounted view. Both planes are partially visible, every angle is compressed, and the scale changes as the person walks — but the room, and the path through it, come into view."}
        </>
      }
      actions={<ShareInsight figureId="camera-angle-explorer" state={{ angle }} label="Share this angle" articleSlug={articleSlug} />}
    >
      {svg}
      <StageControl
        stages={stages}
        value={CAMERA_ANGLES.indexOf(angle)}
        onChange={(next) => choose(CAMERA_ANGLES[Math.max(0, Math.min(7, next))])}
        ariaLabel="Camera position"
        labels={[0, 2, 4, 6]}
        hint="Drag the camera round the ring, drag the track, or use ← →"
        dense={false}
      />
      <div className={`${ui.chips} mt-3`} role="group" aria-label="Camera position">
        {CAMERA_ANGLES.map((value) => (
          <button key={value} type="button" aria-pressed={angle === value} onClick={() => choose(value)} className={`${ui.chip} ${angle === value ? ui.chipOn : ""}`}>
            {ANGLE_LABEL[value]}
          </button>
        ))}
      </div>
    </InteractiveFigure>
  );
}
