"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { GAIT_PHASES, GAIT_HEAD, type Pt } from "@/components/visuals/gait-phases";
import { PoseFrame, smoothPath } from "@/components/research/PoseFrame";
import type { CoverConcept } from "@/data/insights";
import { trackInsightEvent } from "@/lib/insight-events";
import { useFigureActive } from "../experience/useFigureActive";
import { useNarrow } from "../experience/useNarrow";
import { StageControl, type Stage } from "../experience/StageControl";
import fig from "../experience/figures.module.css";
import ui from "../experience/experience.module.css";
import styles from "./hub.module.css";

/**
 * THE MINI INTERACTIONS — one per cover concept, each a tiny version of the
 * article's main idea, and each responding to a finger or a pointer:
 *
 *   pipeline    drag across:  video → person → pose → skeleton → trajectory → signal
 *   reduction   drag across:  RGB → redacted → silhouette → skeleton → trajectory
 *   trajectory  drag across:  one reading … five readings become a trend
 *   divergence  hover / tap a branch: the same signal, re-read
 *   fusion      tap a stream: healthy → missing → corrupted → healthy
 *
 * Nothing here is a measurement and no axis carries a number. The bodies are
 * the project's own gait keyframes. The first time a card scrolls into view
 * the interaction plays one slow pass on its own, so a reader learns that the
 * picture moves without having to guess; after that it waits.
 *
 * All five share one coordinate system (320 × 200) and one stroke vocabulary
 * (figures.module.css) so the hub reads as one journal.
 */

const W = 320;
const H = 200;
const CLASSES = { bone: fig.bone, boneFar: fig.boneFar, joint: fig.joint, head: fig.head };

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
/** 0 below `a`, 1 above `b`, smooth between. */
const ramp = (p: number, a: number, b: number) => {
  const t = clamp01((p - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const r1 = (n: number) => Math.round(n * 10) / 10;

/** A soft body outline around the mid-stance pose — the person before pose. */
function BodyMass({ x, y, s, className }: { x: number; y: number; s: number; className: string }) {
  const d = [
    `M${x - 9 * s} ${y - 33 * s}`,
    `C${x - 11 * s} ${y - 20 * s} ${x - 8 * s} ${y - 6 * s} ${x - 7 * s} ${y + 4 * s}`,
    `L${x - 10 * s} ${y + 44 * s} L${x - 2 * s} ${y + 46 * s} L${x} ${y + 14 * s}`,
    `L${x + 3 * s} ${y + 46 * s} L${x + 11 * s} ${y + 45 * s} L${x + 7 * s} ${y + 4 * s}`,
    `C${x + 9 * s} ${y - 6 * s} ${x + 12 * s} ${y - 20 * s} ${x + 9 * s} ${y - 33 * s}`,
    `C${x + 6 * s} ${y - 36 * s} ${x - 6 * s} ${y - 36 * s} ${x - 9 * s} ${y - 33 * s} Z`,
  ].join(" ");
  return (
    <g className={className}>
      <path d={d} />
      <circle cx={x + 1 * s} cy={y - 43 * s} r={6.5 * s} />
    </g>
  );
}

/* ── 01 · pipeline ─────────────────────────────────────────────────────── */
function Pipeline({ p }: { p: number }) {
  const cx = 96;
  const cy = 96;
  const s = 1.55;
  const phase = GAIT_PHASES[0];
  const pixels = ramp(p, 0.22, 0.05);
  const mass = ramp(p, 0.42, 0.18);
  const box = ramp(p, 0.14, 0.26) * ramp(p, 0.62, 0.48);
  const joints = ramp(p, 0.3, 0.42);
  const bones = ramp(p, 0.44, 0.56);
  const ghosts = ramp(p, 0.58, 0.72);
  const trails = ramp(p, 0.62, 0.78);
  const signal = ramp(p, 0.78, 0.92);
  const groundY = cy + 48 * s;

  const ankle = smoothPath(
    GAIT_PHASES.map((ph, i) => [cx + (i - 2) * 22 + ph.nearLeg[2][0] * s * 0.6, cy + ph.nearLeg[2][1] * s] as Pt),
  );
  const wrist = smoothPath(
    GAIT_PHASES.map((ph, i) => [cx + (i - 2) * 22 + ph.nearArm[2][0] * s * 0.6, cy + ph.nearArm[2][1] * s] as Pt),
  );
  const wave = (y0: number, amp: number, f: number, ph: number) =>
    smoothPath(
      Array.from({ length: 16 }, (_, i) => {
        const t = i / 15;
        return [212 + t * 96, y0 + Math.sin(t * Math.PI * 2 * f + ph) * amp] as Pt;
      }),
    );

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.mediaSvg} aria-hidden="true">
      {/* pixels */}
      <g style={{ opacity: pixels }}>
        {Array.from({ length: 8 }, (_, row) =>
          Array.from({ length: 12 }, (_, col) => {
            const lit = (row * 7 + col * 3) % 5 === 0;
            return (
              <rect
                key={`${row}-${col}`}
                className={lit ? fig.pixelLit : fig.pixel}
                x={24 + col * 13}
                y={22 + row * 18}
                width={11}
                height={16}
              />
            );
          }),
        )}
      </g>
      {/* frame + ground */}
      <rect className={fig.frame} x={22} y={20} width={158} height={148} rx={3} />
      <line className={fig.ground} x1={30} y1={groundY} x2={172} y2={groundY} />
      {/* body mass */}
      <g style={{ opacity: mass }}>
        <BodyMass x={cx} y={cy} s={s} className={fig.mass} />
      </g>
      {/* detection box */}
      <rect
        className={`${fig.frame} ${fig.frameAccent}`}
        style={{ opacity: box }}
        x={cx - 22}
        y={cy - 54}
        width={50}
        height={108}
        rx={2}
      />
      {/* ghosts + trails */}
      <g style={{ opacity: ghosts }}>
        {GAIT_PHASES.map((ph, i) =>
          i === 0 ? null : (
            <g key={ph.id} className={fig.ghost} transform={`translate(${cx + (i - 2) * 22} ${cy - ph.lift * s})`}>
              <PoseFrame phase={ph} s={s * 0.6} classes={CLASSES} showFar={false} />
            </g>
          ),
        )}
      </g>
      <g style={{ opacity: trails }}>
        <path className={fig.trace} d={ankle} />
        <path className={`${fig.trace} ${fig.traceViolet}`} d={wrist} />
      </g>
      {/* skeleton */}
      <g transform={`translate(${cx} ${cy - phase.lift * s})`} style={{ opacity: Math.max(joints, bones) }}>
        <g style={{ opacity: bones }}>
          <PoseFrame phase={phase} s={s} classes={CLASSES} />
        </g>
        <g style={{ opacity: joints * (1 - bones) }}>
          {[...phase.nearArm, ...phase.nearLeg, GAIT_HEAD].map(([jx, jy], i) => (
            <circle key={i} className={fig.joint} cx={r1(jx * s)} cy={r1(jy * s)} r={2.4} />
          ))}
        </g>
      </g>
      {/* signal */}
      <g style={{ opacity: signal }}>
        {[
          { y: 46, amp: 8, f: 3, ph: 0, cls: fig.trace },
          { y: 84, amp: 6, f: 1.5, ph: 1, cls: `${fig.trace} ${fig.traceViolet}` },
          { y: 122, amp: 5, f: 4, ph: 0.4, cls: `${fig.trace} ${fig.traceTeal}` },
          { y: 156, amp: 7, f: 1, ph: 2, cls: `${fig.trace} ${fig.traceRoyal}` },
        ].map((band) => (
          <path key={band.y} className={band.cls} d={wave(band.y, band.amp, band.f, band.ph)} />
        ))}
        {[46, 84, 122, 156].map((y) => (
          <line key={y} className={fig.hair} x1={212} y1={y} x2={308} y2={y} />
        ))}
      </g>
      {/* the arrow of the pipeline */}
      <line className={fig.dash} x1={186} y1={96} x2={204} y2={96} style={{ opacity: ramp(p, 0.7, 0.85) }} />
    </svg>
  );
}

/* ── 01 · pipeline, at cover size ───────────────────────────────────────────
   HUMAN → POSE → SKELETON → TRAJECTORY → SIGNAL → INTELLIGENCE. The frame
   holds the centre while the body is the subject, then slides left to make
   room for what is read from it: the signals, then the decision-support
   plate. One thing on screen at a time — the cover teaches, it does not
   itemise. */
const COVER_STAGES = ["Human", "Pose", "Skeleton", "Trajectory", "Signal", "Intelligence"] as const;
const COVER_CONTROL: Stage[] = COVER_STAGES.map((name) => ({ id: name.toLowerCase(), label: name, name }));
const CW = 640;
const CH = 400;
function coverStageOf(p: number) {
  return Math.min(5, Math.floor(clamp01(p) * 6));
}
function PipelineCover({ p, narrow = false }: { p: number; narrow?: boolean }) {
  const stage = coverStageOf(p);
  /* On a phone the type is set larger, so the insight lines start further
     left to stay inside the drawing. */
  const tx = narrow ? 330 : 386;
  const lx = narrow ? 318 : 372;
  const s = 2.4;
  const fx = 190;
  const fy = 176;
  const groundY = fy + 48 * s;
  const phase = GAIT_PHASES[0];
  const late = stage >= 4;
  const mass = stage === 0 ? 1 : stage === 1 ? 0.28 : 0;
  const joints = stage === 1 ? 1 : 0;
  /* The walker stays the hero at every stage; what is read from it arrives
     beside it and never outweighs it. */
  const bones = stage >= 2 ? (stage === 4 ? 0.6 : stage === 5 ? 0.8 : 1) : 0;
  const trail = stage === 3 ? 1 : late ? 0.35 : 0;
  const signal = stage === 4 ? 1 : stage === 5 ? 0.18 : 0;
  const decision = stage === 5 ? 1 : 0;

  const trails = {
    ankle: smoothPath(
      GAIT_PHASES.map((ph, i) => [fx - (4 - i) * 34 + ph.nearLeg[2][0] * s * 0.45, fy - ph.lift * s + ph.nearLeg[2][1] * s] as Pt),
    ),
    wrist: smoothPath(
      GAIT_PHASES.map((ph, i) => [fx - (4 - i) * 34 + ph.nearArm[2][0] * s * 0.45, fy - ph.lift * s + ph.nearArm[2][1] * s] as Pt),
    ),
    hip: smoothPath(
      GAIT_PHASES.map((ph, i) => [fx - (4 - i) * 34 + ph.nearLeg[0][0] * s * 0.45, fy - ph.lift * s + ph.nearLeg[0][1] * s] as Pt),
    ),
  };
  const wave = (y0: number, amp: number, f: number, ph: number) =>
    smoothPath(
      Array.from({ length: 22 }, (_, i) => {
        const t = i / 21;
        return [372 + t * 232, y0 + Math.sin(t * Math.PI * 2 * f + ph) * amp] as Pt;
      }),
    );

  return (
    <svg viewBox={`0 0 ${CW} ${CH}`} className={styles.mediaSvg} aria-hidden="true">
      <defs>
        <radialGradient id="cover-field" cx="0.5" cy="0.6" r="0.6">
          <stop offset="0" stopColor="var(--jr-cyan, #4fd1ff)" stopOpacity="0.09" />
          <stop offset="0.65" stopColor="var(--jr-cyan, #4fd1ff)" stopOpacity="0.025" />
          <stop offset="1" stopColor="var(--jr-cyan, #4fd1ff)" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* No frame, no pixel grid: the body stands in a soft field of light, the
          way a subject stands in a photograph, and the stages change what the
          system holds of it. The field slides left when the panel arrives. */}
      <g
        className={fig.move}
        style={{ transform: late ? "translateX(0px)" : "translateX(130px)", transition: "transform 0.7s cubic-bezier(0.16,1,0.3,1)" }}
      >
        <ellipse cx={fx} cy={fy + 24} rx={158} ry={178} fill="url(#cover-field)" />
        <line className={fig.ground} x1={fx - 128} y1={groundY} x2={fx + 128} y2={groundY} />
        <g className={fig.fade} style={{ opacity: mass }}>
          <BodyMass x={fx} y={fy} s={s} className={fig.silhouette} />
        </g>
        <g className={fig.fade} style={{ opacity: trail }}>
          {GAIT_PHASES.map((ph, i) =>
            i === 4 ? null : (
              <g key={ph.id} className={fig.ghost} transform={`translate(${fx - (4 - i) * 34} ${fy - ph.lift * s})`}>
                <PoseFrame phase={ph} s={s * 0.45} classes={CLASSES} showFar={false} />
              </g>
            ),
          )}
          <path className={fig.trace} d={trails.ankle} />
          <path className={`${fig.trace} ${fig.traceViolet}`} d={trails.wrist} />
          <path className={`${fig.trace} ${fig.traceRoyal} ${fig.traceThin}`} d={trails.hip} />
        </g>
        <g transform={`translate(${fx} ${fy - phase.lift * s})`}>
          <g className={fig.fade} style={{ opacity: bones }}>
            <PoseFrame phase={phase} s={s} classes={CLASSES} showContacts={stage === 2 || stage === 3} />
          </g>
          <g className={fig.fade} style={{ opacity: joints }}>
            {[...phase.nearArm, ...phase.nearLeg, ...phase.farLeg.slice(1), GAIT_HEAD].map(([jx, jy], i) => (
              <circle key={i} className={fig.joint} cx={r1(jx * s)} cy={r1(jy * s)} r={3.6} />
            ))}
          </g>
        </g>
      </g>
      {/* One caption, only once the walk has become something read. */}
      <text
        className={`${styles.coverLabel} ${styles.coverLabelAccent} ${fig.fade}`}
        style={{ opacity: late ? 1 : 0 }}
        x={372}
        y={52}
      >
        From motion to meaning
      </text>

      {/* the signals, read from the trail */}
      <g className={fig.fade} style={{ opacity: signal }}>
        {[
          { y: 112, amp: 11, f: 3, ph: 0, cls: fig.trace, name: "Cadence" },
          { y: 196, amp: 9, f: 1.5, ph: 1, cls: `${fig.trace} ${fig.traceRoyal}`, name: "Stride rhythm" },
          { y: 280, amp: 8, f: 2, ph: 0.4, cls: `${fig.trace} ${fig.traceViolet}`, name: "Symmetry" },
        ].map((band) => (
          <g key={band.y}>
            <text className={styles.coverLabel} x={372} y={band.y - 24}>
              {band.name}
            </text>
            <path className={band.cls} d={wave(band.y, band.amp, band.f, band.ph)} />
          </g>
        ))}
      </g>

      {/* the insight: a reading and its boundary, as two lines of type — no
          box, no report chrome. The walk beside it stays the subject. */}
      <g className={fig.fade} style={{ opacity: decision }}>
        <line className={fig.trace} x1={lx} y1={168} x2={lx} y2={232} />
        <text className={`${styles.coverLabel} ${styles.coverLabelInk}`} x={tx} y={184}>
          Stride variability rising
        </text>
        <text className={styles.coverLabel} x={tx} y={206}>
          against this person&apos;s baseline
        </text>
        <text className={`${styles.coverLabel} ${styles.coverLabelWarn}`} x={tx} y={230}>
          Decision support, not a diagnosis
        </text>
      </g>
    </svg>
  );
}

/* ── 03 · reduction ────────────────────────────────────────────────────── */
function Reduction({ p, narrow = false }: { p: number; narrow?: boolean }) {
  const cx = 88;
  const cy = 98;
  const s = 1.5;
  const phase = GAIT_PHASES[2];
  const rgb = ramp(p, 0.24, 0.08);
  const redact = ramp(p, 0.12, 0.2) * ramp(p, 0.48, 0.34);
  const silhouette = ramp(p, 0.26, 0.4) * ramp(p, 0.68, 0.54);
  const skeleton = ramp(p, 0.5, 0.64) * ramp(p, 0.92, 0.8);
  const trail = ramp(p, 0.76, 0.9);
  const groundY = cy + 48 * s;
  const ankle = smoothPath(
    GAIT_PHASES.map((ph, i) => [cx + (i - 2) * 24 + ph.nearLeg[2][0] * s * 0.5, cy + ph.nearLeg[2][1] * s * 0.6 - 6] as Pt),
  );
  const movement = p < 0.9 ? 3 : 2;
  const identity = p < 0.2 ? 3 : p < 0.5 ? 2 : 1;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.mediaSvg} aria-hidden="true">
      {/* On a phone the drawing is a fifth as tall, and the head would sit
          under the "Foundations 03" step label; the whole plate drops 12
          units to clear it. */}
      <g transform={narrow ? "translate(0 12)" : undefined}>
        <rect className={fig.frame} x={22} y={30} width={140} height={146} rx={3} />
        <line className={fig.ground} x1={30} y1={groundY} x2={154} y2={groundY} />
        {/* RGB: textured body */}
        <g style={{ opacity: rgb }}>
          <BodyMass x={cx} y={cy} s={s} className={fig.massSolid} />
          {Array.from({ length: 5 }, (_, i) => (
            <line
              key={i}
              className={fig.hair}
              x1={cx - 8 * s}
              y1={cy - 28 * s + i * 8 * s}
              x2={cx + 8 * s}
              y2={cy - 26 * s + i * 8 * s}
            />
          ))}
          <circle cx={cx + 1 * s} cy={cy - 43 * s} r={2.2} className={fig.nodeMute} />
          <circle cx={cx + 3.5 * s} cy={cy - 44 * s} r={1} className={fig.nodeMute} />
      </g>
      {/* redaction: the body stays as it was, and a violet block covers the
          face — the one thing that has changed, and it must be unmissable */}
      <g style={{ opacity: redact }}>
        <BodyMass x={cx} y={cy} s={s} className={fig.massSolid} />
      </g>
      <rect
        className={fig.redact}
        style={{ opacity: redact }}
        x={cx - 10 * s}
        y={cy - 52 * s}
        width={22 * s}
        height={17 * s}
        rx={1}
      />
      {/* silhouette */}
      <g style={{ opacity: silhouette }}>
        <BodyMass x={cx} y={cy} s={s} className={fig.mass} />
      </g>
      {/* skeleton */}
      <g transform={`translate(${cx} ${cy})`} style={{ opacity: skeleton }}>
        <PoseFrame phase={phase} s={s} classes={CLASSES} />
      </g>
      {/* trajectory */}
      <g style={{ opacity: trail }}>
        <path className={`${fig.trace} ${fig.traceViolet}`} d={ankle} />
        {GAIT_PHASES.map((_, i) => (
          <circle key={i} className={fig.nodeViolet} cx={cx + (i - 2) * 24} cy={cy + 22 - (i % 2) * 6} r={1.8} />
        ))}
      </g>
      {/* the two indicators */}
      <g className={`${fig.label} ${fig.labelKey}`}>
        <text x={186} y={58}>
          Movement kept
        </text>
        <text x={186} y={122}>
          Identity kept
        </text>
      </g>
      {[0, 1, 2].map((i) => (
        <rect
          key={`m${i}`}
          className={i < movement ? fig.nodeTeal : fig.nodeMute}
          x={186 + i * 14}
          y={70 - i * 4}
          width={9}
          height={8 + i * 4}
          rx={1}
          style={{ opacity: i < movement ? 1 : 0.4 }}
        />
      ))}
      {[0, 1, 2].map((i) => (
        <rect
          key={`i${i}`}
          className={i < identity ? fig.nodeViolet : fig.nodeMute}
          x={186 + i * 14}
          y={134 - i * 4}
          width={9}
          height={8 + i * 4}
          rx={1}
          style={{ opacity: i < identity ? 1 : 0.4 }}
        />
      ))}
      </g>
    </svg>
  );
}

/* ── 04 · trajectory ───────────────────────────────────────────────────── */
const TREND_Y = [88, 92, 104, 100, 122];
function Trajectory({ p }: { p: number }) {
  const shown = 1 + Math.floor(clamp01(p) * 4.999);
  const xs = [56, 108, 160, 212, 264];
  const path = smoothPath(xs.slice(0, shown).map((x, i) => [x, TREND_Y[i]] as Pt));
  const big = shown === 1;
  const baseline = shown >= 3;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.mediaSvg} aria-hidden="true">
      <g className={fig.grid}>
        {[48, 88, 128].map((y) => (
          <line key={y} x1={40} y1={y} x2={280} y2={y} />
        ))}
      </g>
      <line className={fig.ground} x1={40} y1={160} x2={280} y2={160} />
      {/* the personal baseline, once there is enough to draw one */}
      <line
        className={fig.dash}
        style={{ opacity: baseline ? 1 : 0 }}
        x1={40}
        y1={TREND_Y[0]}
        x2={280}
        y2={TREND_Y[0]}
      />
      <text className={`${fig.label} ${fig.labelKey} ${fig.labelTeal}`} x={44} y={TREND_Y[0] - 8} style={{ opacity: baseline ? 1 : 0 }}>
        Own baseline
      </text>
      <path className={`${fig.trace} ${fig.traceTeal}`} d={path} style={{ opacity: shown > 1 ? 1 : 0 }} />
      {/* Assessments taken are solid points, the latest one haloed; the ones
          still to come are dashed rings on the same line — slots waiting,
          not data missing. */}
      {xs.map((x, i) => {
        const on = i < shown;
        const latest = i === shown - 1;
        const r = i === 0 ? (big ? 16 : 5) : 5;
        return (
          <g key={x} style={{ opacity: on ? 1 : 0.55 }}>
            <line className={fig.dash} x1={x} y1={TREND_Y[i] + 10} x2={x} y2={152} style={{ opacity: on ? 1 : 0 }} />
            {on && latest && !big && <circle className={fig.halo} cx={x} cy={TREND_Y[i]} r={11} />}
            {on ? (
              <circle
                className={fig.node}
                cx={x}
                cy={TREND_Y[i]}
                r={r}
                style={{ transition: "r 0.4s cubic-bezier(0.16,1,0.3,1)" }}
              />
            ) : (
              <circle className={fig.nodeFuture} cx={x} cy={TREND_Y[i]} r={4.5} />
            )}
            {on && <circle className={fig.nodeFill} cx={x} cy={TREND_Y[i]} r={i === 0 && big ? 3 : 2.4} />}
            <text
              className={`${fig.label} ${fig.labelSmall} ${on ? fig.labelInk : ""}`}
              x={x}
              y={174}
              textAnchor="middle"
              style={{ opacity: on ? 1 : 0.8 }}
            >
              {String(i + 1).padStart(2, "0")}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── 02 · divergence ───────────────────────────────────────────────────── */
const BRANCHES = ["Mobility", "Recovery", "Identity", "Risk", "Safety"] as const;
function Divergence({ pick }: { pick: number }) {
  const ox = 96;
  const oy = 100;
  const wave = (amp: number, f: number, x0: number, x1: number, y0: number, phase = 0) =>
    smoothPath(
      Array.from({ length: 18 }, (_, i) => {
        const t = i / 17;
        return [x0 + t * (x1 - x0), y0 + Math.sin(t * Math.PI * 2 * f + phase) * amp] as Pt;
      }),
    );
  const targets = BRANCHES.map((_, i) => [258, 30 + i * 35] as Pt);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.mediaSvg} aria-hidden="true">
      {/* one movement */}
      <path className={`${fig.trace} ${fig.traceBold}`} d={wave(14, 2, 22, ox, oy)} />
      <circle className={fig.nodeFill} cx={ox} cy={oy} r={3.4} />
      <text className={fig.label} x={22} y={oy + 36}>
        One movement
      </text>
      {/* branches */}
      {/* The five readings. At rest all five are legible; once one is chosen
          the others fall back a step and stay quiet — only the active branch
          is bold, lit and haloed. */}
      {targets.map(([tx, ty], i) => {
        const on = pick === i;
        const d = `M${ox} ${oy} C${ox + 50} ${oy} ${tx - 70} ${ty} ${tx - 10} ${ty}`;
        return (
          <g key={BRANCHES[i]} style={{ opacity: pick < 0 || on ? 1 : 0.48 }}>
            <path className={`${fig.trace} ${on ? fig.traceBold : fig.traceSoft}`} d={d} />
            {on && <circle className={fig.halo} cx={tx - 10} cy={ty} r={8} />}
            <circle className={on ? fig.nodeFill : fig.nodeMute} cx={tx - 10} cy={ty} r={on ? 3.2 : 2} />
            <text className={`${fig.label} ${fig.labelKey} ${on ? fig.labelAccent : ""}`} x={tx} y={ty + 3}>
              {BRANCHES[i]}
            </text>
          </g>
        );
      })}
      {/* what each reading emphasises, drawn over the same signal */}
      {pick === 0 && (
        <g>
          {[0, 1, 2, 3].map((i) => (
            <line key={i} className={`${fig.trace} ${fig.traceTeal}`} x1={31 + i * 18.5} y1={oy - 22} x2={31 + i * 18.5} y2={oy - 16} />
          ))}
          <text className={`${fig.label} ${fig.labelTeal} ${fig.labelSmall}`} x={22} y={oy - 28}>
            cadence · stride · symmetry
          </text>
        </g>
      )}
      {pick === 1 && (
        <g>
          <path className={`${fig.trace} ${fig.traceSoft}`} d={wave(11, 2, 22, ox, oy, 0.5)} strokeDasharray="3 3" />
          <text className={`${fig.label} ${fig.labelSmall}`} x={22} y={oy - 28}>
            against an earlier walk
          </text>
        </g>
      )}
      {pick === 2 && (
        <g>
          {[0, 1].map((i) => (
            <rect key={i} className={fig.band} x={24 + i * 37} y={oy - 18} width={34} height={36} rx={2} />
          ))}
          <text className={`${fig.label} ${fig.labelSmall}`} x={22} y={oy - 28}>
            recurring pattern
          </text>
        </g>
      )}
      {pick === 3 && (
        <g>
          <path
            className={`${fig.band} ${fig.bandWarn}`}
            d={`${wave(20, 2, 22, ox, oy)} L${ox} ${oy} ${wave(8, 2, 22, ox, oy).replace("M", "L")}`}
            style={{ fillRule: "evenodd" }}
          />
          <text className={`${fig.label} ${fig.labelWarn} ${fig.labelSmall}`} x={22} y={oy - 28}>
            variability envelope
          </text>
        </g>
      )}
      {pick === 4 && (
        <g>
          <path className={`${fig.trace} ${fig.traceRoyal}`} d="M28 150 C50 140 70 158 96 146 S130 128 150 140" />
          <rect className={fig.frame} x={24} y={126} width={132} height={40} rx={2} />
          <text className={`${fig.label} ${fig.labelSmall}`} x={22} y={oy - 28}>
            trajectory in a space
          </text>
        </g>
      )}
    </svg>
  );
}

/* ── 05 · fusion ───────────────────────────────────────────────────────── */
type StreamState = 0 | 1 | 2; // healthy · missing · corrupted
const STREAMS = ["RGB", "Pose", "IMU", "Audio"] as const;
function Fusion({ states, onToggle }: { states: StreamState[]; onToggle: (i: number) => void }) {
  const ys = [44, 84, 124, 164];
  const nx = 196;
  const ny = 104;
  const missing = states.filter((s) => s === 1).length;
  const corrupt = states.filter((s) => s === 2).length;
  const noiseId = "hub-fusion-noise";
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.mediaSvg} aria-hidden="true">
      <defs>
        <filter id={noiseId} x="-10%" y="-40%" width="120%" height="180%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="3" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="4" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      {STREAMS.map((name, i) => {
        const state = states[i];
        const d = `M40 ${ys[i]} H120 C150 ${ys[i]} 160 ${ny} ${nx - 14} ${ny}`;
        return (
          <g key={name}>
            {/* a generous hit target for a finger */}
            <rect
              x={20}
              y={ys[i] - 18}
              width={124}
              height={36}
              fill="transparent"
              style={{ cursor: "pointer", pointerEvents: "all" }}
              onClick={() => onToggle(i)}
            />
            <text className={`${fig.label} ${state === 1 ? "" : fig.labelInk}`} x={22} y={ys[i] + 3} style={{ opacity: state === 1 ? 0.5 : 1 }}>
              {name}
            </text>
            {state === 1 ? (
              <path className={fig.dash} d={d} />
            ) : (
              <path
                className={`${fig.trace} ${state === 2 ? fig.traceWarn : ""}`}
                d={d}
                style={state === 2 ? { filter: `url(#${noiseId})` } : undefined}
              />
            )}
            <text className={`${fig.label} ${fig.labelSmall} ${state === 2 ? fig.labelWarn : ""}`} x={64} y={ys[i] - 6}>
              {state === 0 ? "healthy" : state === 1 ? "missing" : "corrupted"}
            </text>
          </g>
        );
      })}
      {/* fusion node */}
      <circle className={fig.node} cx={nx} cy={ny} r={11} />
      <text className={`${fig.label} ${fig.labelSmall}`} x={nx} y={ny + 26} textAnchor="middle">
        fusion
      </text>
      {/* result */}
      <line className={fig.trace} x1={nx + 12} y1={ny} x2={236} y2={ny} />
      <rect className={`${fig.plate} ${corrupt > 0 ? "" : fig.plateLit}`} x={238} y={ny - 34} width={62} height={68} rx={4} />
      {[0, 1, 2, 3].map((i) => {
        const state = states[i];
        const w = state === 1 ? 0 : 40 - i * 4;
        return (
          <g key={i}>
            <rect className={fig.hair} x={248} y={ny - 24 + i * 14} width={42} height={6} fill="none" />
            {state === 1 ? (
              <text className={`${fig.label} ${fig.labelSmall}`} x={248} y={ny - 18 + i * 14}>
                gap
              </text>
            ) : (
              <rect
                className={state === 2 ? fig.nodeWarn : fig.nodeFill}
                x={248}
                y={ny - 24 + i * 14}
                width={w}
                height={6}
                style={state === 2 ? { filter: `url(#${noiseId})` } : undefined}
              />
            )}
          </g>
        );
      })}
      <text className={`${fig.label} ${fig.labelSmall}`} x={238} y={ny + 48}>
        {missing > 0 && corrupt === 0
          ? "known gap"
          : corrupt > 0
            ? "looks complete"
            : "result"}
      </text>
    </svg>
  );
}

/* ── The interactive wrapper ────────────────────────────────────────────── */

const READOUT: Record<CoverConcept, string[]> = {
  pipeline: ["Video", "Person", "Pose", "Skeleton", "Trajectory", "Signal"],
  reduction: ["RGB", "Face redacted", "Silhouette", "Skeleton", "Trajectory"],
  trajectory: ["One reading", "Two", "Three", "Four", "A trend"],
  divergence: ["Mobility", "Recovery", "Identity", "Risk", "Safety"],
  fusion: [],
};

const CUE: Record<CoverConcept, string> = {
  pipeline: "Drag to decode the walk",
  reduction: "Drag to remove identity",
  trajectory: "Drag to add assessments",
  divergence: "Touch a reading",
  fusion: "Tap a stream",
};

export function CardInteraction({
  concept,
  slug,
  large = false,
}: {
  concept: CoverConcept;
  slug: string;
  large?: boolean;
}) {
  const [p, setP] = useState(0);
  const [pick, setPick] = useState(-1);
  const [states, setStates] = useState<StreamState[]>([0, 0, 0, 0]);
  const [used, setUsed] = useState(false);
  const { ref, active, inView, reduced } = useFigureActive<HTMLDivElement>();
  const narrow = useNarrow(640);
  const demoed = useRef(false);
  const raf = useRef(0);

  const markUsed = useCallback(() => {
    if (!used) {
      setUsed(true);
      trackInsightEvent("hub_card_interaction", { article: slug, concept }, { once: slug });
    }
  }, [concept, slug, used]);

  /* One slow demonstration pass when the card first appears. */
  useEffect(() => {
    if (demoed.current || !inView || reduced) return;
    if (!active) return;
    demoed.current = true;
    const start = performance.now();
    const duration = 2600;
    const tick = (now: number) => {
      const t = clamp01((now - start) / duration);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      if (concept === "divergence") setPick(Math.min(4, Math.floor(eased * 5)));
      else if (concept === "fusion") setStates([0, eased < 0.35 ? 0 : eased < 0.7 ? 1 : 2, 0, 0]);
      else setP(eased);
      if (t < 1) raf.current = requestAnimationFrame(tick);
      else if (concept === "fusion") setStates([0, 0, 0, 0]);
      else if (concept === "divergence") setPick(-1);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [active, concept, inView, reduced]);

  /* Reduced motion: rest on the most informative state. */
  useEffect(() => {
    if (!reduced) return;
    if (concept === "trajectory") setP(1);
    else if (concept === "pipeline") setP(0.5);
    else if (concept === "reduction") setP(0.6);
  }, [concept, reduced]);

  const fractionOf = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return clamp01((event.clientX - rect.left) / rect.width);
  };
  const dragging = useRef(false);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (concept === "fusion") return;
    cancelAnimationFrame(raf.current);
    demoed.current = true;
    dragging.current = true;
    markUsed();
    const f = fractionOf(event);
    if (concept === "divergence") setPick(Math.min(4, Math.floor(f * 5)));
    else setP(f);
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* fine */
    }
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (concept === "fusion") return;
    /* A mouse scrubs on hover; a finger scrubs while pressed. */
    if (event.pointerType !== "mouse" && !dragging.current) return;
    if (event.pointerType === "mouse" && !dragging.current) {
      cancelAnimationFrame(raf.current);
      demoed.current = true;
    }
    const f = fractionOf(event);
    if (concept === "divergence") setPick(Math.min(4, Math.floor(f * 5)));
    else setP(f);
  };
  const onPointerUp = () => {
    dragging.current = false;
  };
  const onLeave = () => {
    if (concept === "divergence" && !dragging.current) setPick(-1);
  };

  const toggle = (i: number) => {
    cancelAnimationFrame(raf.current);
    demoed.current = true;
    markUsed();
    setStates((prev) => prev.map((s, j) => (j === i ? (((s + 1) % 3) as StreamState) : s)));
  };

  const coverStage = concept === "pipeline" && large ? coverStageOf(p) : -1;
  const readout =
    coverStage >= 0
      ? ""
      : concept === "divergence"
      ? pick >= 0
        ? READOUT.divergence[pick]
        : "One movement"
      : concept === "fusion"
        ? ""
        : READOUT[concept][Math.min(READOUT[concept].length - 1, Math.floor(p * READOUT[concept].length))];

  return (
    <div
      ref={ref}
      className={`${styles.media} ${concept === "fusion" ? styles.mediaTap : ""} ${large ? styles.mediaCover : ""} ${
        narrow && !large ? fig.narrow : ""
      } h-full w-full`}
      data-used={used ? "true" : undefined}
      data-concept={concept}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={onLeave}
    >
      {concept === "pipeline" && (large ? <PipelineCover p={p} narrow={narrow} /> : <Pipeline p={p} />)}
      {concept === "reduction" && <Reduction p={p} narrow={narrow} />}
      {concept === "trajectory" && <Trajectory p={p} />}
      {concept === "divergence" && <Divergence pick={pick} />}
      {concept === "fusion" && <Fusion states={states} onToggle={toggle} />}
      <span className={`${styles.cue} ${coverStage >= 0 ? styles.cueRight : ""}`}>
        <span className={styles.cueMark} />
        {coverStage >= 0 ? "Drag through the signal →" : CUE[concept]}
      </span>
      {readout && <span className={styles.readout}>{readout}</span>}
      {coverStage >= 0 && (
        <div
          className={`${ui.root} ${styles.coverControl}`}
          onPointerDown={(event) => event.stopPropagation()}
          onPointerMove={(event) => event.stopPropagation()}
          onPointerUp={(event) => event.stopPropagation()}
        >
          <StageControl
            stages={COVER_CONTROL}
            value={coverStage}
            onChange={(next) => {
              cancelAnimationFrame(raf.current);
              demoed.current = true;
              markUsed();
              setP((next + 0.5) / 6);
            }}
            ariaLabel="Pipeline stage"
            dense
          />
        </div>
      )}
    </div>
  );
}
