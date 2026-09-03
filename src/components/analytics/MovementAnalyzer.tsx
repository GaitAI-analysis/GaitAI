"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { productById } from "@/data/products";
import {
  STAGES,
  primaryPose,
  usePoseAnalysis,
  LM,
  type PoseResult,
  type Suitability,
} from "./usePoseAnalysis";
import { PoseStage } from "./PoseStage";
import { MotionDNA, motionChannels } from "./MotionDNA";
import styles from "./analyzer.module.css";

/**
 * LIVE MOVEMENT INTELLIGENCE WORKBENCH
 *
 * Bring a clip; watch a pose model take it apart. What runs here is real:
 * MediaPipe's BlazePose landmarker, in the tab, on the reader's own file. See
 * `usePoseAnalysis.ts` for what that does and does not yield.
 *
 * The composition is built around one idea — the same instant, twice. Left is
 * the frame as recorded; right is the movement abstraction the model built
 * from it. A single timeline drives the video, the skeleton, the trajectories
 * and the Motion DNA channels together, because they are all indexed by time
 * and a reader learns more from scrubbing than from watching.
 *
 * ON HONESTY, AND WHERE IT LIVES
 * Everything shown is measured. Nothing is scored. There is no cadence, no
 * stride length, no walking speed, no symmetry percentage and no risk rating
 * anywhere in this file, because none of those can be computed from an
 * uncalibrated clip in a browser — and a fabricated clinical number would be
 * worse than an honest trajectory. The limits are stated once, in a status
 * pill and a disclosure, instead of crowding every result with disclaimers.
 */

const MAX_BYTES = 60 * 1024 * 1024;
const ACCEPT = "video/mp4,video/quicktime,video/webm";
/** Length of a camera-recorded clip. Long enough for several movement cycles. */
const CLIP_SECONDS = 6;

/**
 * Bundled sample clips. Empty on purpose.
 *
 * Every video in this repository is a rendered marketing animation with
 * readouts drawn into the picture — cadence figures, mobility scores, identity
 * matches, bounding brackets. Feeding one of those to a pose model would show
 * a reader someone else's fabricated overlay sitting on top of a real
 * analysis, which is precisely the confusion this page exists to avoid. Drop
 * clean footage in `public/assets/videos/samples/` and add it here; the block
 * renders itself as soon as there is something honest to put in it.
 */
const SAMPLES: { id: string; label: string; note: string; src: string }[] = [];

type Mode = "auto" | "mobility" | "secure";

const MODES: { id: Mode; label: string; note: string }[] = [
  { id: "auto", label: "Auto", note: "Pick a lens from what is in the clip" },
  { id: "mobility", label: "MobilityCare", note: "Body movement over time" },
  { id: "secure", label: "SecureVision", note: "Spatial flow, no identity" },
];

type Tab = { id: string; label: string };

const ERRORS: Record<string, string> = {
  "unsupported-type":
    "That file type is not supported. Use an MP4, MOV or WebM video.",
  "too-large": "That file is over 60 MB. Try a shorter or smaller clip.",
  "runtime-failed":
    "The pose runtime could not be loaded, so no landmarks could be detected. Check the connection and try again — the model is fetched once, then cached.",
  "no-duration":
    "The browser could not read a duration from that file — it may be corrupted or use a codec this browser cannot decode.",
  "no-frames":
    "No video frames could be decoded. The file may be audio-only or use an unsupported codec.",
  "no-canvas": "This browser could not provide a canvas to analyse frames on.",
  "too-short":
    "That clip is too short to build a temporal signal from. Try 5 seconds or more.",
  "play-blocked":
    "The browser blocked playback, so the clip could not be sampled. Press play on the video and try again.",
  stalled:
    "Playback stopped advancing, so sampling could not finish. The file may use a codec this browser struggles with — try a different clip.",
  "load-failed":
    "That video could not be loaded. It may use a codec this browser cannot decode.",
  "camera-denied":
    "Camera access was declined, so nothing was recorded. Choosing a file works the same way.",
  "camera-unavailable":
    "No camera is available to this browser. Choose a video file instead.",
  "record-failed":
    "The recording could not be completed. Choose a video file instead.",
  failed: "Analysis could not be completed for that file.",
};

/**
 * Which lens to show. In auto, the clip decides.
 *
 * A clip with no subject in it lands on the spatial lens: there are no
 * landmarks to read, but the motion field still describes where movement was
 * and which way it went, which is what that lens is made of.
 */
function resolveMode(
  mode: Mode,
  suitability: Suitability,
): "mobility" | "secure" {
  if (mode !== "auto") return mode;
  return suitability === "no-person" ? "secure" : "mobility";
}

const PCT = (v: number) => `${(v * 100).toFixed(1)}% of frame`;

/** A product, named from the repository's own taxonomy. */
function ProductLink({ slug, family }: { slug: string; family: string }) {
  const product = productById(slug);
  if (!product) return null;
  return (
    <Link href={`/${family}/${slug}`} className={styles.link}>
      {product.short} →
    </Link>
  );
}

/**
 * Local extrema of a channel — the real turning points in a tracked series.
 *
 * These are NOT gait events. Heel strike and toe-off need foot-contact
 * detection this does not do, so the strip built from them is called a
 * movement sequence and the marks are called what they are: the instants where
 * a tracked series turned around.
 */
function turningPoints(
  values: (number | null)[],
  times: number[],
): { t: number; kind: "low" | "high" }[] {
  const out: { t: number; kind: "low" | "high" }[] = [];
  let lastT = -Infinity;
  for (let i = 1; i < values.length - 1; i += 1) {
    const a = values[i - 1];
    const b = values[i];
    const c = values[i + 1];
    if (a === null || b === null || c === null) continue;
    const kind = b < a && b < c ? "low" : b > a && b > c ? "high" : null;
    if (!kind) continue;
    /* Sampling jitter produces clusters; one mark per 0.18 s is plenty. */
    if (times[i] - lastT < 0.18) continue;
    lastT = times[i];
    out.push({ t: times[i], kind });
  }
  return out;
}

/** The hip midpoint per instant, or null where it was not tracked. */
function hipSeries(result: PoseResult): (number | null)[] {
  return result.samples.map((s) => {
    const pose = primaryPose(s);
    const lh = pose?.[LM.lHip];
    const rh = pose?.[LM.rHip];
    if (!lh || !rh || lh.visibility < 0.5 || rh.visibility < 0.5) return null;
    return (lh.y + rh.y) / 2;
  });
}

/* ── Timeline: one control for every view on screen ───────────────────────── */

function Timeline({
  result,
  time,
  onSeek,
}: {
  result: PoseResult;
  time: number;
  onSeek: (t: number) => void;
}) {
  const W = 1000;
  const H = 46;
  const peak = result.peakEnergy || 1;
  const span = result.duration || 1;
  const x = (t: number) => (t / span) * W;

  return (
    <div className={styles.timeline}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={styles.tlChart}
        aria-hidden="true"
      >
        {/* Measured motion energy per instant — the clip's shape at a glance. */}
        {result.samples.map((s) => (
          <line
            key={`e${s.t}`}
            className={styles.tlBar}
            x1={x(s.t)}
            y1={H - 10}
            x2={x(s.t)}
            y2={H - 10 - (s.energy / peak) * (H - 20)}
          />
        ))}
        {/* Where a body was actually tracked. */}
        {result.samples.map((s) =>
          s.poses.length ? (
            <circle
              key={`p${s.t}`}
              className={styles.tlPosed}
              cx={x(s.t)}
              cy={H - 4}
              r={1.9}
            />
          ) : null,
        )}
        <line
          className={styles.tlCursor}
          x1={x(Math.min(time, span))}
          y1={2}
          x2={x(Math.min(time, span))}
          y2={H - 2}
        />
      </svg>

      <input
        type="range"
        className={styles.tlRange}
        min={0}
        max={span}
        step={0.02}
        value={Math.min(time, span)}
        onChange={(e) => onSeek(Number(e.target.value))}
        aria-label="Scrub the clip — the video, the skeleton, the trajectories and the Motion DNA channels all follow"
      />

      {/* One instruction for the one control that drives every view on
           screen. A reader who does not touch this sees a still frame and a
           still skeleton and concludes the analysis is a picture. */}
      <p className="ix-hint">
        Drag to scrub — video, skeleton, trajectories and channels follow
      </p>

      <p className={styles.tlMeta}>
        <span className={styles.tlTime}>
          {time.toFixed(2)}s / {span.toFixed(2)}s
        </span>
        <span>
          {result.samples.length} instants sampled · {result.posedSamples} with
          a tracked body
        </span>
      </p>
    </div>
  );
}

/* ── Movement sequence: turning points, honestly named ────────────────────── */

function SequenceStrip({ result }: { result: PoseResult }) {
  const times = result.samples.map((s) => s.t);
  const points = turningPoints(hipSeries(result), times);
  if (points.length < 2) return null;

  const W = 1000;
  const span = result.duration || 1;

  return (
    <figure className={styles.figure}>
      <svg
        viewBox={`0 0 ${W} 54`}
        className={styles.seq}
        role="img"
        aria-label={`Movement sequence: ${points.length} instants where the body centre's vertical travel turned around, across ${span.toFixed(1)} seconds.`}
      >
        <line className={styles.seqAxis} x1={0} y1={38} x2={W} y2={38} />
        {points.map((p, i) => (
          <g key={`${p.t}-${i}`} style={{ ["--g" as string]: i }}>
            <line
              className={p.kind === "low" ? styles.seqLow : styles.seqHigh}
              x1={(p.t / span) * W}
              y1={38}
              x2={(p.t / span) * W}
              y2={p.kind === "low" ? 22 : 8}
            />
            <circle
              className={styles.seqDot}
              cx={(p.t / span) * W}
              cy={p.kind === "low" ? 22 : 8}
              r={2.6}
            />
          </g>
        ))}
      </svg>
      <figcaption className={styles.caption}>
        Movement sequence · {points.length} turning points in the body
        centre&apos;s vertical travel. These are measured extrema, not gait
        events: heel strike and toe-off need foot-contact detection this
        analysis does not perform.
      </figcaption>
    </figure>
  );
}

/* ── Suitability: what this clip is good for ──────────────────────────────── */

function SuitabilityBanner({
  result,
  mode,
  setMode,
}: {
  result: PoseResult;
  mode: Mode;
  setMode: (m: Mode) => void;
}) {
  if (result.suitability === "no-person") {
    return (
      <div className={styles.suit} role="status">
        <span className={styles.suitTag}>No body found</span>
        <p>
          The pose model found no person in any sampled instant, so there are no
          landmarks to work from. The motion field is measured from the pixels
          and still describes what moved — but for body movement, this needs a
          clip with a person in frame.
        </p>
      </div>
    );
  }

  if (result.frameWideChange) {
    return (
      <div className={styles.suit} role="status">
        <span className={styles.suitTag}>The camera appears to move</span>
        <p>
          {(result.meanChanged * 100).toFixed(0)}% of the frame changes between
          instants, which is what a pan or a handheld shot looks like — a fixed
          camera watching one subject changes a small share of the picture. The
          body-level ranges will include that camera movement, so the spatial
          lens is the safer read on this clip.
          {mode !== "secure" && (
            <button
              type="button"
              className={styles.suitAction}
              onClick={() => setMode("secure")}
            >
              Analyze with SecureVision →
            </button>
          )}
        </p>
      </div>
    );
  }

  if (result.suitability === "intermittent") {
    return (
      <div className={styles.suit} role="status">
        <span className={styles.suitTag}>Body tracked intermittently</span>
        <p>
          A body was found in {result.posedSamples} of {result.samples.length}{" "}
          instants, so the temporal channels have gaps — and they are drawn with
          those gaps left in. A clip where the whole body stays in frame gives
          continuous signals.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.suit} role="status">
      <span className={styles.suitTag}>Single subject tracked</span>
      <p>
        One body, tracked in {result.posedSamples} of {result.samples.length}{" "}
        sampled instants
        {result.direction !== "in place"
          ? `, travelling ${result.direction} across frame.`
          : ", moving in place."}{" "}
        {result.oscillationSeconds
          ? "The trunk shows a repeating vertical rhythm, which is what walking looks like to this model."
          : "No repeating vertical rhythm was clear enough to report."}
      </p>
    </div>
  );
}

/* ── The workbench ────────────────────────────────────────────────────────── */

export function MovementAnalyzer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const camRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [src, setSrc] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [origin, setOrigin] = useState<"upload" | "sample" | "camera" | null>(
    null,
  );
  const [dragging, setDragging] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("auto");
  const [tab, setTab] = useState("");
  const [time, setTime] = useState(0);
  const [how, setHow] = useState(false);
  const [recording, setRecording] = useState(false);
  const [canRecord, setCanRecord] = useState(false);

  const { phase, stageIndex, progress, error, result, analyse, reset } =
    usePoseAnalysis();

  /* The camera option only appears where it can actually work. */
  useEffect(() => {
    setCanRecord(
      typeof navigator !== "undefined" &&
        !!navigator.mediaDevices?.getUserMedia &&
        typeof MediaRecorder !== "undefined" &&
        MediaRecorder.isTypeSupported("video/webm"),
    );
  }, []);

  const releaseUrl = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(
    () => () => {
      releaseUrl();
      stopStream();
    },
    [releaseUrl, stopStream],
  );

  const clear = useCallback(() => {
    reset();
    releaseUrl();
    stopStream();
    setSrc(null);
    setName("");
    setOrigin(null);
    setTime(0);
    setTab("");
    setInputError(null);
  }, [releaseUrl, reset, stopStream]);

  const take = useCallback(
    (file: File | Blob, label: string, from: "upload" | "camera") => {
      reset();
      releaseUrl();
      const url = URL.createObjectURL(file);
      urlRef.current = url;
      setSrc(url);
      setName(label);
      setOrigin(from);
      setTime(0);
      setTab("");
    },
    [releaseUrl, reset],
  );

  const accept = useCallback(
    (file: File) => {
      setInputError(null);
      if (!/^video\/(mp4|quicktime|webm|x-m4v)$/.test(file.type)) {
        setInputError("unsupported-type");
        return;
      }
      if (file.size > MAX_BYTES) {
        setInputError("too-large");
        return;
      }
      take(file, file.name, "upload");
    },
    [take],
  );

  /** Record a short clip from the camera. It is held in memory, never sent. */
  const record = useCallback(async () => {
    setInputError(null);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 960 }, height: { ideal: 720 } },
        audio: false,
      });
    } catch (e) {
      setInputError(
        e instanceof DOMException && e.name === "NotAllowedError"
          ? "camera-denied"
          : "camera-unavailable",
      );
      return;
    }
    streamRef.current = stream;
    setRecording(true);
    if (camRef.current) {
      camRef.current.srcObject = stream;
      void camRef.current.play().catch(() => undefined);
    }

    try {
      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      const done = new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
      });
      recorder.start();
      await new Promise((r) => window.setTimeout(r, CLIP_SECONDS * 1000));
      recorder.stop();
      await done;
      stopStream();
      setRecording(false);
      if (!chunks.length) {
        setInputError("record-failed");
        return;
      }
      take(
        new Blob(chunks, { type: "video/webm" }),
        `Camera clip · ${CLIP_SECONDS}s`,
        "camera",
      );
    } catch {
      stopStream();
      setRecording(false);
      setInputError("record-failed");
    }
  }, [stopStream, take]);

  /* Analysis begins as soon as a decodable frame exists. */
  const onLoaded = useCallback(() => {
    const video = videoRef.current;
    if (video && phase === "idle") void analyse(video);
  }, [analyse, phase]);

  /* Back to the start once the pass is done, so the reader scrubs a clip that
     is sitting on its first frame rather than its last. */
  useEffect(() => {
    if (phase === "ready" && videoRef.current) {
      videoRef.current.currentTime = 0;
      setTime(0);
    }
  }, [phase]);

  const seek = useCallback((t: number) => {
    const video = videoRef.current;
    if (video) video.currentTime = t;
    setTime(t);
  }, []);

  const channels = useMemo(
    () => (result ? motionChannels(result) : []),
    [result],
  );

  const view = result ? resolveMode(mode, result.suitability) : "mobility";

  const tabs: Tab[] = useMemo(
    () =>
      view === "secure"
        ? [
            { id: "flow", label: "Spatial flow" },
            { id: "presence", label: "Scene" },
            { id: "technical", label: "How it ran" },
          ]
        : [
            { id: "sequence", label: "Movement sequence" },
            { id: "body", label: "Body signals" },
            { id: "technical", label: "How it ran" },
          ],
    [view],
  );

  const activeTab = tabs.some((t) => t.id === tab) ? tab : tabs[0].id;

  const hipTravel = useMemo(() => {
    if (!result) return null;
    const ys = hipSeries(result).filter((v): v is number => v !== null);
    return ys.length >= 6 ? Math.max(...ys) - Math.min(...ys) : null;
  }, [result]);

  const message = inputError ?? error;

  return (
    <div className={styles.lab}>
      {/* ─────────── HEADER: what this is, and which lens ─────────── */}
      <div className={styles.bar}>
        <span className={styles.pill}>
          <span className={styles.pillDot} aria-hidden="true" />
          Browser movement analysis
        </span>

        <div className={styles.modes} role="group" aria-label="Analysis lens">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`${styles.modeBtn} ${mode === m.id ? styles.modeOn : ""}`}
              aria-pressed={mode === m.id}
              title={m.note}
              onClick={() => setMode(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          className={styles.howBtn}
          aria-expanded={how}
          onClick={() => setHow((v) => !v)}
        >
          How this analysis works {how ? "↑" : "→"}
        </button>
      </div>

      {how && (
        <div className={styles.how}>
          <p>
            A pose model runs in this tab on the clip you choose. It is
            MediaPipe&apos;s BlazePose landmarker (Tasks Vision 1.0.1), which
            locates 33 body landmarks per person per sampled instant. The model
            weights come from this site; the clip is read with an object URL and
            never leaves the device. There is no server in this: the site is a
            static export with no API routes, so client-side inference is the
            only kind available here.
          </p>
          <p>
            Everything on screen is derived from those landmarks or from
            luminance differencing between instants — joint trajectories, the
            body centre, travel and reversals, the vertical rhythm of the trunk,
            each ankle&apos;s vertical travel, and the Motion DNA channels.
          </p>
          <p>
            <strong>What this does not compute:</strong> cadence, stride length,
            walking speed, a symmetry percentage, a mobility or balance score,
            fall risk, or anything clinical. Those need calibrated capture,
            known scale and a validated pipeline — the pose landmarker on its
            own cannot produce them, and no number of that kind is shown here.
            Identity is not extracted either: this holds landmark coordinates,
            not faces or appearance.
          </p>
          <p className={styles.howLabels}>
            <span>
              <strong>Browser movement analysis</strong> — what runs on this
              page.
            </span>
            <span>
              <strong>Illustrative demo</strong> — the pipeline walkthroughs
              elsewhere on this page, which run on synthetic data.
            </span>
            <span>
              <strong>GaitAI analysis</strong> — the product pipeline, which is
              not what this is.
            </span>
          </p>
        </div>
      )}

      {/* ─────────── INTAKE ─────────── */}
      {!src && (
        <div className={styles.intake}>
          <div
            className={`${styles.drop} ${dragging ? styles.dropOn : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) accept(file);
            }}
            /* A dashed box reading "drop a clip here" invites a click, and on
               a phone there is no drag to offer instead — so the whole zone
               opens the picker. The label below stays the real, focusable
               control; this only forwards clicks that landed on the ground
               between the words, and never the label's own click. */
            onClick={(e) => {
              if ((e.target as HTMLElement).closest("label")) return;
              fileRef.current?.click();
            }}
          >
            <p className={styles.dropTitle}>Drop in a movement clip</p>
            <p className={styles.dropMeta}>
              MP4 / MOV / WebM · up to 60 MB · 5–20 seconds works best
            </p>

            {/* A real label-wrapped file input: keyboard and screen-reader
                reachable, no click-forwarding trickery. */}
            <label className={styles.browse}>
              <input
                ref={fileRef}
                type="file"
                accept={ACCEPT}
                className={styles.file}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) accept(file);
                  e.target.value = "";
                }}
              />
              <span>Choose a video</span>
            </label>

            <p className={styles.privacy}>
              <strong>Your file · local only.</strong> It is read inside this
              tab and handed to the pose model frame by frame. Nothing is
              uploaded, stored or transmitted.
            </p>
          </div>

          <div className={styles.side}>
            {canRecord && (
              <div className={styles.cam}>
                <p className={styles.sideLabel}>No clip to hand?</p>
                {recording ? (
                  <>
                    <video
                      ref={camRef}
                      className={styles.camView}
                      muted
                      playsInline
                    />
                    <p className={styles.camNote}>
                      Recording {CLIP_SECONDS} seconds · walk across the frame
                      if you have the room
                    </p>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className={styles.camBtn}
                      onClick={() => void record()}
                    >
                      Record {CLIP_SECONDS}s from your camera
                    </button>
                    <p className={styles.camNote}>
                      The recording is held in this tab&apos;s memory, analysed
                      there, and discarded when you leave. It is never uploaded.
                    </p>
                  </>
                )}
              </div>
            )}

            {SAMPLES.length > 0 && (
              <div className={styles.samples}>
                <p className={styles.sideLabel}>Or analyse a sample clip</p>
                {SAMPLES.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    className={styles.sample}
                    onClick={() => {
                      reset();
                      releaseUrl();
                      setSrc(sample.src);
                      setName(sample.label);
                      setOrigin("sample");
                      setTime(0);
                      setTab("");
                      setInputError(null);
                    }}
                  >
                    <span className={styles.sampleName}>{sample.label}</span>
                    <span className={styles.sampleNote}>{sample.note}</span>
                  </button>
                ))}
              </div>
            )}

            <p className={styles.sideNote}>
              A clip with one person walking across the frame, camera held
              still, whole body visible, gives this the most to work with. A
              busy public scene works too — it just answers a different
              question, and the analysis will say which one.
            </p>
          </div>
        </div>
      )}

      {message && (
        <p role="alert" className={styles.error}>
          {ERRORS[message] ?? ERRORS.failed}
          {src && (
            <button
              type="button"
              className={styles.errorAction}
              onClick={clear}
            >
              Try another clip
            </button>
          )}
        </p>
      )}

      {/* ─────────── WORKBENCH ─────────── */}
      {src && (
        <div className={styles.work}>
          {/* The clip stays mounted through the whole run: the analysis samples
              this element, and afterwards the reader scrubs it. */}
          <div className={styles.split}>
            <figure className={styles.viewport}>
              <figcaption className={styles.viewHead}>
                <span className={styles.viewLabel}>What the camera sees</span>
                <span className={styles.viewMeta} title={name}>
                  {origin === "camera"
                    ? "Your camera · local only"
                    : origin === "sample"
                      ? "Sample clip"
                      : "Your file · local only"}
                </span>
              </figcaption>
              <video
                ref={videoRef}
                src={src}
                className={styles.video}
                playsInline
                muted
                controls={phase === "ready"}
                preload="auto"
                onLoadedData={onLoaded}
                onError={() => setInputError("load-failed")}
                onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
              />
            </figure>

            <figure className={styles.viewport}>
              <figcaption className={styles.viewHead}>
                <span className={styles.viewLabel}>What GaitAI sees</span>
                <span className={styles.viewMeta}>
                  {result
                    ? `33 landmarks · ${result.samples.length} instants`
                    : "Building the abstraction"}
                </span>
              </figcaption>
              {result ? (
                <PoseStage result={result} time={time} />
              ) : (
                <div className={styles.viewWait} aria-hidden="true">
                  <span className={styles.viewWaitBar} />
                </div>
              )}
            </figure>
          </div>

          {/* ── Processing ── */}
          {phase === "running" && (
            <div className={styles.run}>
              <div className={styles.progress}>
                <span className={styles.progressLabel}>
                  Analysing · {Math.round(progress * 100)}% of clip
                </span>
                <span className={styles.progressTrack}>
                  <span
                    className={styles.progressFill}
                    style={{ width: `${Math.round(progress * 100)}%` }}
                  />
                </span>
              </div>
              <ol className={styles.stages} aria-live="polite">
                {STAGES.map((s, i) => (
                  <li
                    key={s.id}
                    className={`${styles.stageRow} ${
                      i < stageIndex
                        ? styles.stageDone
                        : i === stageIndex
                          ? styles.stageNow
                          : ""
                    }`}
                  >
                    <span className={styles.stageNo}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {s.label}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* ── Results ── */}
          {phase === "ready" && result && (
            <>
              <p className={styles.complete}>
                <span aria-hidden="true">✓</span> Movement analysis complete
              </p>

              <SuitabilityBanner result={result} mode={mode} setMode={setMode} />

              <Timeline result={result} time={time} onSeek={seek} />

              {/* ── MOTION DNA — the signature module ── */}
              {channels.length > 0 && (
                <section className={styles.dna}>
                  <header className={styles.dnaHead}>
                    <h3 className={styles.dnaTitle}>Motion DNA</h3>
                    <p className={styles.dnaSub}>
                      {channels.length === 1
                        ? "One temporal channel, a real series pulled from this clip and normalised into its own band. Nothing else in it could be measured well enough to plot."
                        : `${channels.length} temporal channels, each one a real series pulled from this clip. Every channel is normalised into its own band, so what you are comparing is shape over time, not amplitude between channels.`}
                    </p>
                  </header>
                  <MotionDNA
                    result={result}
                    channels={channels}
                    time={time}
                    onSeek={seek}
                  />
                  <p className={styles.caption}>
                    Click anywhere in the chart to move the clip there.
                  </p>
                </section>
              )}

              {/* ── Mode readouts ── */}
              <div role="tablist" aria-label="Readouts" className={styles.tabs}>
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === t.id}
                    className={`${styles.tab} ${activeTab === t.id ? styles.tabOn : ""}`}
                    onClick={() => setTab(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
                {mode === "auto" && (
                  <span className={styles.tabAuto}>
                    Auto chose{" "}
                    {view === "secure" ? "SecureVision" : "MobilityCare"}
                  </span>
                )}
              </div>

              {/* ── MOBILITYCARE · movement sequence ── */}
              {activeTab === "sequence" && (
                <div className={styles.body}>
                  <SequenceStrip result={result} />
                  <dl className={styles.facts}>
                    <div className={styles.fact}>
                      <dt className={styles.factKey}>Vertical rhythm</dt>
                      <dd className={styles.factVal}>
                        {result.oscillationSeconds
                          ? `${result.oscillationSeconds.toFixed(2)} s per cycle`
                          : "No clear periodicity"}
                      </dd>
                      <dd className={styles.factNote}>
                        Dominant repeat interval in the trunk&apos;s vertical
                        movement, by autocorrelation. An estimate of a rhythm —
                        not a step count, and not cadence.
                      </dd>
                    </div>
                    <div className={styles.fact}>
                      <dt className={styles.factKey}>Travel across frame</dt>
                      <dd className={styles.factVal}>
                        {result.direction === "in place"
                          ? "In place"
                          : `${result.direction} · ${PCT(Math.abs(result.driftX))}`}
                      </dd>
                      <dd className={styles.factNote}>
                        {result.posedSamples > 0
                          ? "Net movement of the hip midpoint, as a share of frame width. Without known scale it cannot become a distance."
                          : "No body was tracked here, so this is the motion field's centroid rather than a hip midpoint."}
                      </dd>
                    </div>
                    <div className={styles.fact}>
                      <dt className={styles.factKey}>Direction reversals</dt>
                      <dd className={styles.factVal}>{result.reversals}</dd>
                      <dd className={styles.factNote}>
                        How many times the body centre changed horizontal
                        direction — a there-and-back walk shows up here.
                      </dd>
                    </div>
                  </dl>

                  <p className={styles.boundary}>
                    What the MobilityCare pipeline adds and this page does not:
                    walking speed, cadence, stride and step length, asymmetry
                    and posture markers — all of which need calibrated capture
                    and known scale. None of them is estimated here.
                  </p>

                  <div className={styles.links}>
                    <ProductLink slug="walkscan" family="mobilitycare" />
                    <ProductLink slug="fallrisk" family="mobilitycare" />
                    <ProductLink slug="sportsmotion" family="mobilitycare" />
                  </div>
                </div>
              )}

              {/* ── MOBILITYCARE · body signals ── */}
              {activeTab === "body" && (
                <div className={styles.body}>
                  <dl className={styles.facts}>
                    <div className={styles.fact}>
                      <dt className={styles.factKey}>
                        Body centre · vertical travel
                      </dt>
                      <dd className={styles.factVal}>
                        {hipTravel !== null
                          ? PCT(hipTravel)
                          : "Not enough tracked instants"}
                      </dd>
                      <dd className={styles.factNote}>
                        Range of the hip midpoint&apos;s height across the clip,
                        as a share of frame height.
                      </dd>
                    </div>
                    <div className={styles.fact}>
                      <dt className={styles.factKey}>
                        Left ankle · vertical travel
                      </dt>
                      <dd className={styles.factVal}>
                        {result.ankleRange
                          ? PCT(result.ankleRange.left)
                          : "Ankle not tracked long enough"}
                      </dd>
                    </div>
                    <div className={styles.fact}>
                      <dt className={styles.factKey}>
                        Right ankle · vertical travel
                      </dt>
                      <dd className={styles.factVal}>
                        {result.ankleRange
                          ? PCT(result.ankleRange.right)
                          : "Ankle not tracked long enough"}
                      </dd>
                    </div>
                    {result.ankleRange && (
                      <div className={styles.fact}>
                        <dt className={styles.factKey}>
                          Difference between them
                        </dt>
                        <dd className={styles.factVal}>
                          {PCT(
                            Math.abs(
                              result.ankleRange.left - result.ankleRange.right,
                            ),
                          )}
                        </dd>
                        <dd className={styles.factNote}>
                          The gap between two measured ranges, in frame units.
                          Deliberately not called a symmetry score: real
                          asymmetry has to account for viewing angle, limb
                          occlusion and scale, none of which is known here.
                        </dd>
                      </div>
                    )}
                    <div className={styles.fact}>
                      <dt className={styles.factKey}>Landmarks tracked</dt>
                      <dd className={styles.factVal}>
                        33 × {result.posedSamples} instants
                      </dd>
                    </div>
                  </dl>

                  <p className={styles.boundary}>
                    Every figure here is a range or a count measured from the
                    detected landmarks, in frame-relative units. Nothing is
                    converted into metres, seconds per step or a score, because
                    that conversion needs calibration this clip does not carry.
                  </p>

                  <div className={styles.links}>
                    <ProductLink slug="walkscan" family="mobilitycare" />
                    <ProductLink slug="rehabtrack" family="mobilitycare" />
                    <ProductLink slug="neuromotion" family="mobilitycare" />
                  </div>
                </div>
              )}

              {/* ── SECUREVISION · spatial flow ── */}
              {activeTab === "flow" && (
                <div className={styles.body}>
                  <dl className={styles.facts}>
                    <div className={styles.fact}>
                      <dt className={styles.factKey}>Direction of flow</dt>
                      <dd className={styles.factVal}>
                        {result.direction === "in place"
                          ? "No net direction"
                          : result.direction}
                      </dd>
                      <dd className={styles.factNote}>
                        {result.posedSamples > 0
                          ? "Net travel of the tracked body centre across the frame."
                          : "Net travel of the centre of changed pixels. No body was tracked in this clip, so this is the motion field's own centroid, not a person."}
                      </dd>
                    </div>
                    <div className={styles.fact}>
                      <dt className={styles.factKey}>Net displacement</dt>
                      <dd className={styles.factVal}>
                        {`${(result.driftX * 100).toFixed(0)}% x · ${(result.driftY * 100).toFixed(0)}% y`}
                      </dd>
                    </div>
                    <div className={styles.fact}>
                      <dt className={styles.factKey}>Path reversals</dt>
                      <dd className={styles.factVal}>{result.reversals}</dd>
                      <dd className={styles.factNote}>
                        A path that turns back on itself. Loitering and pacing
                        look like this, before any judgement is made about them.
                      </dd>
                    </div>
                    <div className={styles.fact}>
                      <dt className={styles.factKey}>Motion energy</dt>
                      <dd className={styles.factVal}>
                        {`mean ${(result.meanEnergy * 100).toFixed(2)} · peak ${(result.peakEnergy * 100).toFixed(2)}`}
                      </dd>
                      <dd className={styles.factNote}>
                        Mean luminance change between sampled instants, ×100.
                        Measured from pixels, so it works with or without a
                        person in frame.
                      </dd>
                    </div>
                  </dl>

                  <p className={styles.boundary}>
                    This lens holds positions and paths — where movement was,
                    and which way it went. No face, no appearance and no
                    identity is extracted, so none can be shown; and no anomaly
                    or risk is scored, because flagging deviation needs an
                    expected flow for a specific space, which one clip does not
                    define.
                  </p>

                  <div className={styles.links}>
                    <ProductLink slug="crowdsense" family="securevision" />
                    <ProductLink slug="suspiciousmotion" family="securevision" />
                    <ProductLink slug="privacyguard" family="securevision" />
                  </div>
                </div>
              )}

              {/* ── SECUREVISION · presence ── */}
              {activeTab === "presence" && (
                <div className={styles.body}>
                  <dl className={styles.facts}>
                    <div className={styles.fact}>
                      <dt className={styles.factKey}>Bodies tracked</dt>
                      <dd className={styles.factVal}>
                        {result.posedSamples === 0
                          ? "None"
                          : "One subject at a time"}
                      </dd>
                      <dd className={styles.factNote}>
                        This model returns a single subject per instant, so
                        there is no head count here and none is estimated. A
                        crowd shows up in the motion field, not as a number of
                        people.
                      </dd>
                    </div>
                    <div className={styles.fact}>
                      <dt className={styles.factKey}>Instants with presence</dt>
                      <dd className={styles.factVal}>
                        {result.posedSamples} of {result.samples.length}
                      </dd>
                    </div>
                    <div className={styles.fact}>
                      <dt className={styles.factKey}>Frame-wide change</dt>
                      <dd className={styles.factVal}>
                        {`${(result.meanChanged * 100).toFixed(1)}% of pixels`}
                      </dd>
                      <dd className={styles.factNote}>
                        {result.frameWideChange
                          ? "Most of the picture changes between instants, which usually means the camera is moving or the whole scene is animated."
                          : "A small share of the picture changes between instants, which is what a fixed viewpoint looks like."}
                      </dd>
                    </div>
                    <div className={styles.fact}>
                      <dt className={styles.factKey}>Representation held</dt>
                      <dd className={styles.factVal}>
                        Landmark coordinates only
                      </dd>
                      <dd className={styles.factNote}>
                        Body-point positions per instant. Nothing about
                        appearance, clothing or face is extracted or retained.
                      </dd>
                    </div>
                    <div className={styles.fact}>
                      <dt className={styles.factKey}>Clip</dt>
                      <dd className={styles.factVal}>
                        {result.duration.toFixed(2)} s · {result.width} ×{" "}
                        {result.height}
                      </dd>
                    </div>
                  </dl>

                  <p className={styles.boundary}>
                    Occupancy is not reported here at all: a density estimate
                    for a space needs the camera&apos;s geometry, a defined
                    zone and a detector that can separate people, and this
                    model returns one subject per frame. The SecureVision
                    pipeline adds all three, along with dwell and flow against
                    an expected pattern.
                  </p>

                  <div className={styles.links}>
                    <ProductLink slug="crowdsense" family="securevision" />
                    <ProductLink slug="privacyguard" family="securevision" />
                  </div>
                </div>
              )}

              {/* ── HOW IT RAN ── */}
              {activeTab === "technical" && (
                <div className={styles.body}>
                  <ol className={styles.chain}>
                    {[
                      [
                        "Runtime",
                        "MediaPipe Tasks Vision 1.0.1 · PoseLandmarker (BlazePose), WebAssembly, in this browser tab",
                      ],
                      [
                        "Model",
                        "pose_landmarker_lite, 5.5 MB, served from this site's own origin and fetched only when an analysis starts",
                      ],
                      [
                        "Decode",
                        `${result.width} × ${result.height}, ${result.duration.toFixed(2)}s, read through an object URL and played once`,
                      ],
                      [
                        "Inference",
                        `detectForVideo on ${result.samples.length} instants, one subject per instant, 33 landmarks, confidence floor 0.5`,
                      ],
                      [
                        "Motion field",
                        `luminance differencing at 192 px wide, per-pixel threshold 12/255, alongside every inference — ${(result.meanChanged * 100).toFixed(1)}% of pixels changed per instant`,
                      ],
                      [
                        "Derived",
                        "joint trajectories, body-centre path, travel and reversals, hip-vertical autocorrelation, per-ankle vertical range, Motion DNA channels",
                      ],
                      [
                        "Not computed",
                        "how many people are in frame, cadence, stride length, walking speed, symmetry score, mobility or balance score, fall risk, identity",
                      ],
                    ].map(([k, v], i) => (
                      <li key={k} className={styles.chainRow}>
                        <span className={styles.chainNo}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span>
                          <span className={styles.chainKey}>{k}</span>
                          <span className={styles.chainVal}>{v}</span>
                        </span>
                      </li>
                    ))}
                  </ol>
                  <p className={styles.boundary}>
                    This chain stops where the product pipeline begins. GaitAI
                    continues into gait-cycle segmentation, calibrated spatial
                    measurement, multimodal fusion and signal-quality gating —
                    none of which runs in a browser tab.
                  </p>
                </div>
              )}

              {/* ── WHERE THE SIGNAL GOES ── */}
              <div className={styles.after}>
                <span className={styles.afterLabel}>This signal can power</span>
                <div className={styles.links}>
                  <Link href="/mobilitycare" className={styles.link}>
                    MobilityCare →
                  </Link>
                  <Link href="/securevision" className={styles.link}>
                    SecureVision →
                  </Link>
                  <Link href="/research" className={styles.link}>
                    The research behind it →
                  </Link>
                </div>
                <button type="button" className={styles.clear} onClick={clear}>
                  Analyse another clip
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
