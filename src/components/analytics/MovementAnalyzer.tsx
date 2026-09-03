"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { assetPath } from "@/lib/paths";
import {
  STAGES,
  useMotionAnalysis,
  type MotionResult,
} from "./useMotionAnalysis";
import styles from "./analyzer.module.css";

/**
 * MOVEMENT ANALYZER — bring a clip, and see what can actually be measured.
 *
 * WHAT IS REAL HERE, AND WHY IT IS SHAPED THIS WAY
 * This site is a static export with no API routes and no ML dependency, so
 * there is no endpoint that could run GaitAI's pose model on an uploaded clip.
 * Rather than mock one, this measures what a browser genuinely can: frame
 * differencing on a canvas. Every number shown is computed from the reader's
 * own video — duration, frames sampled, motion energy over time, the centroid
 * of that motion, its drift and direction, its reversals, and an ESTIMATED
 * period from autocorrelation of the energy trace.
 *
 * The clip never leaves the device. It is read with `URL.createObjectURL` and
 * drawn to a canvas; nothing is uploaded, stored or transmitted. That is why
 * the privacy line is allowed to say so, and it is the only privacy claim made.
 *
 * WHAT IS DELIBERATELY ABSENT
 * No pose estimation, so no joint angles, no left/right symmetry, no per-limb
 * stride timing, and nothing clinical. The MobilityCare and SecureVision tabs
 * say what the real pipeline would add rather than printing numbers this demo
 * cannot compute. There is no fabricated score anywhere in this component.
 */

const MAX_BYTES = 60 * 1024 * 1024;
const ACCEPT = "video/mp4,video/quicktime,video/webm";

/** Sample clips already in the repository. Site animations, not footage. */
const SAMPLES = [
  {
    id: "capture",
    label: "Walking capture",
    note: "Site animation · a figure walking across frame",
    src: "/assets/videos/workflow/stage-01-capture.mp4",
  },
  {
    id: "spatial",
    label: "Spatial movement",
    note: "Site animation · movement through a space",
    src: "/assets/videos/securevision/securevision-hero.mp4",
  },
] as const;

type Tab = "overview" | "signals" | "mobility" | "secure" | "technical";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "signals", label: "Movement signals" },
  { id: "mobility", label: "MobilityCare" },
  { id: "secure", label: "SecureVision" },
  { id: "technical", label: "Technical view" },
];

const ERRORS: Record<string, string> = {
  "unsupported-type":
    "That file type is not supported. Use an MP4, MOV or WebM video.",
  "too-large": "That file is over 60 MB. Try a shorter or smaller clip.",
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
  failed: "Analysis could not be completed for that file.",
};

/** A small definition, revealed on demand. Never the only copy of a fact. */
function Term({ term, children }: { term: string; children: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className={styles.term}>
      {term}
      <button
        type="button"
        className={styles.termBtn}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="sr-only">{`What ${term} means`}</span>
        <span aria-hidden="true">ⓘ</span>
      </button>
      {open && <span className={styles.termBody}>{children}</span>}
    </span>
  );
}

/** The temporal energy trace, with a cursor at the video's position. */
function Trace({
  result,
  time,
}: {
  result: MotionResult;
  time: number;
}) {
  const W = 640;
  const H = 120;
  const { samples, peakEnergy, duration } = result;
  const x = (t: number) => (t / duration) * W;
  const y = (e: number) => H - 6 - (e / (peakEnergy || 1)) * (H - 18);

  const d = samples
    .map((s, i) => `${i ? "L" : "M"}${x(s.t).toFixed(1)} ${y(s.energy).toFixed(1)}`)
    .join(" ");

  return (
    <figure className={styles.figure}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={styles.trace}
        role="img"
        aria-label={`Movement intensity over ${duration.toFixed(1)} seconds, from ${samples.length} sampled instants. Peak intensity occurs at ${samples.reduce((a, b) => (b.energy > a.energy ? b : a)).t.toFixed(1)} seconds.`}
      >
        <defs>
          <linearGradient id="ma-trace" gradientUnits="userSpaceOnUse" x1="0" x2={W}>
            <stop offset="0" className={styles.stopCyan} />
            <stop offset="0.55" className={styles.stopBlue} />
            <stop offset="1" className={styles.stopViolet} />
          </linearGradient>
        </defs>
        <line className={styles.axis} x1={0} y1={H - 6} x2={W} y2={H - 6} />
        <path className={styles.traceLine} d={d} />
        {result.events.map((t) => (
          <line
            key={t}
            className={styles.event}
            x1={x(t)}
            y1={H - 6}
            x2={x(t)}
            y2={12}
          />
        ))}
        <line
          className={styles.cursor}
          x1={x(Math.min(time, duration))}
          y1={4}
          x2={x(Math.min(time, duration))}
          y2={H - 6}
        />
      </svg>
      <figcaption className={styles.caption}>
        Movement intensity per sampled instant · {result.events.length} local
        maxima marked
      </figcaption>
    </figure>
  );
}

/** The centroid path — a coordinate per instant, and nothing else. */
function Path({ result, time }: { result: MotionResult; time: number }) {
  const W = 320;
  const H = 200;
  const pts = result.samples.map((s) => ({
    x: 10 + s.cx * (W - 20),
    y: 10 + s.cy * (H - 20),
    t: s.t,
  }));
  const d = pts
    .map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  const now = pts.reduce((a, b) => (Math.abs(b.t - time) < Math.abs(a.t - time) ? b : a), pts[0]);

  return (
    <figure className={styles.figure}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={styles.path}
        role="img"
        aria-label={`Path of the moving region across the frame. Net drift ${(result.driftX * 100).toFixed(0)} percent of frame width horizontally and ${(result.driftY * 100).toFixed(0)} percent vertically. ${result.reversals} direction reversals.`}
      >
        <rect className={styles.pathFrame} x={4} y={4} width={W - 8} height={H - 8} rx={3} />
        <path className={styles.pathLine} d={d} />
        {pts.map((p) => (
          <circle key={p.t} className={styles.pathDot} cx={p.x} cy={p.y} r={1.6} />
        ))}
        <circle className={styles.pathNow} cx={now.x} cy={now.y} r={5} />
      </svg>
      <figcaption className={styles.caption}>
        Centre of changed pixels, per instant · position only, no identity
      </figcaption>
    </figure>
  );
}

export function MovementAnalyzer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<string | null>(null);

  const [src, setSrc] = useState<string | null>(null);
  const [name, setName] = useState<string>("");
  const [origin, setOrigin] = useState<"upload" | "sample" | null>(null);
  const [dragging, setDragging] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [time, setTime] = useState(0);
  const [privacy, setPrivacy] = useState(false);

  const { phase, stageIndex, progress, error, result, analyse, reset } =
    useMotionAnalysis();

  /* Object URLs are revoked when replaced and on unmount. */
  const releaseUrl = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  }, []);
  useEffect(() => releaseUrl, [releaseUrl]);

  const clear = useCallback(() => {
    reset();
    releaseUrl();
    setSrc(null);
    setName("");
    setOrigin(null);
    setTime(0);
    setPrivacy(false);
    setTab("overview");
    setInputError(null);
  }, [releaseUrl, reset]);

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
      reset();
      releaseUrl();
      const url = URL.createObjectURL(file);
      urlRef.current = url;
      setSrc(url);
      setName(file.name);
      setOrigin("upload");
      setTime(0);
    },
    [releaseUrl, reset],
  );

  const loadSample = useCallback(
    (sample: (typeof SAMPLES)[number]) => {
      reset();
      releaseUrl();
      setSrc(assetPath(sample.src));
      setName(sample.label);
      setOrigin("sample");
      setTime(0);
      setInputError(null);
    },
    [releaseUrl, reset],
  );

  /* Analysis starts once the browser has metadata and a decodable frame. */
  const onLoaded = useCallback(() => {
    const video = videoRef.current;
    if (video) void analyse(video);
  }, [analyse]);

  const summary = useMemo(() => {
    if (!result) return null;
    const spm =
      result.periodSeconds && result.periodSeconds > 0
        ? Math.round(60 / result.periodSeconds)
        : null;
    return { spm };
  }, [result]);

  const message = inputError ?? error;

  return (
    <div className={styles.lab}>
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
          >
            <p className={styles.dropTitle}>Drag &amp; drop a walking video</p>
            <p className={styles.dropMeta}>
              MP4 / MOV / WebM · up to 60 MB · recommended 5–20 seconds
            </p>

            {/* A real label-wrapped file input: keyboard and screen-reader
                reachable, no click-forwarding trickery. */}
            <label className={styles.browse}>
              <input
                ref={inputRef}
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
              Analysis runs entirely in your browser. The file is read locally
              and drawn to a canvas — it is never uploaded, stored or sent
              anywhere.
            </p>
          </div>

          <div className={styles.samples}>
            <p className={styles.samplesLabel}>Or analyse a sample clip</p>
            {SAMPLES.map((sample) => (
              <button
                key={sample.id}
                type="button"
                className={styles.sample}
                onClick={() => loadSample(sample)}
              >
                <span className={styles.sampleName}>{sample.label}</span>
                <span className={styles.sampleNote}>{sample.note}</span>
              </button>
            ))}
            <p className={styles.samplesNote}>
              These are animations already on this site, not clinical footage.
              They are analysed by the same code as an uploaded file.
            </p>
          </div>
        </div>
      )}

      {message && (
        <p role="alert" className={styles.error}>
          {ERRORS[message] ?? ERRORS.failed}
          {src && (
            <button type="button" className={styles.errorAction} onClick={clear}>
              Try another clip
            </button>
          )}
        </p>
      )}

      {/* ─────────── WORKSPACE ─────────── */}
      {src && (
        <div className={styles.work}>
          <div className={styles.stage}>
            <div className={styles.stageHead}>
              <span className={styles.stageName} title={name}>
                {name}
              </span>
              <span className={styles.stageOrigin}>
                {origin === "sample" ? "Sample clip" : "Your file · local only"}
              </span>
            </div>

            <div className={styles.player}>
              <video
                ref={videoRef}
                src={src}
                className={`${styles.video} ${privacy ? styles.videoHidden : ""}`}
                playsInline
                muted
                controls={!privacy}
                preload="auto"
                crossOrigin="anonymous"
                onLoadedData={onLoaded}
                onError={() => setInputError("load-failed")}
                onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
              />

              {/* Privacy-aware visualisation: the derived signal only. It is
                  named for what it is — the analysis never had identity to
                  remove, because it only ever held a coordinate. */}
              {privacy && result && (
                <div className={styles.privacyView}>
                  <Path result={result} time={time} />
                  <p className={styles.privacyNote}>
                    Privacy-aware visualisation · everything this analysis
                    derived is on screen
                  </p>
                </div>
              )}
            </div>

            {result && (
              <div className={styles.stageFoot}>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={privacy}
                    onChange={(e) => setPrivacy(e.target.checked)}
                  />
                  <span>Privacy-aware visualisation</span>
                </label>
                <span className={styles.timeRead}>
                  {time.toFixed(2)}s / {result.duration.toFixed(2)}s
                </span>
                <button type="button" className={styles.clear} onClick={clear}>
                  Analyse another clip
                </button>
              </div>
            )}
          </div>

          <div className={styles.panel}>
            {/* ── Progress ── */}
            {phase === "running" && (
              <>
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
              </>
            )}

            {phase === "ready" && result && (
              <>
                <div role="tablist" aria-label="Analysis" className={styles.tabs}>
                  {TABS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      role="tab"
                      aria-selected={tab === t.id}
                      className={`${styles.tab} ${tab === t.id ? styles.tabOn : ""}`}
                      onClick={() => setTab(t.id)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* ── OVERVIEW ── */}
                {tab === "overview" && (
                  <div className={styles.body}>
                    <dl className={styles.facts}>
                      {[
                        ["Duration", `${result.duration.toFixed(2)} s`],
                        ["Resolution", `${result.width} × ${result.height}`],
                        ["Instants sampled", String(result.sampled)],
                        [
                          "Movement detected",
                          result.motionDetected ? "Yes" : "None above noise floor",
                        ],
                        ["Primary direction", result.direction],
                        ["Processing", "In-browser · frame differencing"],
                      ].map(([k, v]) => (
                        <div key={k} className={styles.fact}>
                          <dt className={styles.factKey}>{k}</dt>
                          <dd className={styles.factVal}>{v}</dd>
                        </div>
                      ))}
                    </dl>

                    {!result.motionDetected && (
                      <p className={styles.note}>
                        Frame-to-frame change stayed below the noise floor, so
                        no movement signal was built. A clip with a person
                        moving across the frame will produce one.
                      </p>
                    )}

                    <p className={styles.boundary}>
                      Every value above is measured from this clip in your
                      browser. This demo does not run GaitAI&apos;s pose model,
                      so it locates no joints and produces no clinical output.
                    </p>
                  </div>
                )}

                {/* ── MOVEMENT SIGNALS ── */}
                {tab === "signals" && (
                  <div className={styles.body}>
                    <Trace result={result} time={time} />
                    <Path result={result} time={time} />
                    <p className={styles.note}>
                      Scrub or play the clip — the cursor and the path marker
                      follow it.
                    </p>
                  </div>
                )}

                {/* ── MOBILITYCARE ── */}
                {tab === "mobility" && (
                  <div className={styles.body}>
                    <dl className={styles.facts}>
                      <div className={styles.fact}>
                        <dt className={styles.factKey}>
                          <Term term="Estimated period">
                            The dominant repeat interval in the movement-intensity
                            trace, found by autocorrelation. It is a property of
                            the whole frame, not of a limb.
                          </Term>
                        </dt>
                        <dd className={styles.factVal}>
                          {result.periodSeconds
                            ? `${result.periodSeconds.toFixed(2)} s`
                            : "No clear periodicity"}
                        </dd>
                      </div>
                      <div className={styles.fact}>
                        <dt className={styles.factKey}>
                          <Term term="Estimated rate">
                            Sixty divided by the estimated period — how often the
                            dominant movement cycle repeats per minute. Not a
                            step count: without pose, individual steps are not
                            located.
                          </Term>
                        </dt>
                        <dd className={styles.factVal}>
                          {summary?.spm ? `${summary.spm} cycles/min` : "—"}
                        </dd>
                      </div>
                      <div className={styles.fact}>
                        <dt className={styles.factKey}>Movement events</dt>
                        <dd className={styles.factVal}>
                          {result.events.length} local maxima
                        </dd>
                      </div>
                    </dl>

                    <p className={styles.boundary}>
                      What the full MobilityCare pipeline adds, and this demo
                      cannot: pose estimation, so per-limb stride timing, gait
                      symmetry, joint-angle trends and posture indicators. Those
                      need the model, not a frame difference — and none of them
                      is shown here rather than estimated.
                    </p>

                    <div className={styles.links}>
                      {[
                        ["WalkScan", "/mobilitycare/walkscan"],
                        ["FallRisk", "/mobilitycare/fallrisk"],
                        ["RehabTrack", "/mobilitycare/rehabtrack"],
                      ].map(([label, href]) => (
                        <Link key={href} href={href} className={styles.link}>
                          {label} →
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── SECUREVISION ── */}
                {tab === "secure" && (
                  <div className={styles.body}>
                    <Path result={result} time={time} />
                    <dl className={styles.facts}>
                      <div className={styles.fact}>
                        <dt className={styles.factKey}>Net drift</dt>
                        <dd className={styles.factVal}>
                          {`${(result.driftX * 100).toFixed(0)}% x · ${(result.driftY * 100).toFixed(0)}% y`}
                        </dd>
                      </div>
                      <div className={styles.fact}>
                        <dt className={styles.factKey}>
                          <Term term="Direction reversals">
                            How many times the moving region changed horizontal
                            direction — a path that turns back on itself.
                          </Term>
                        </dt>
                        <dd className={styles.factVal}>{result.reversals}</dd>
                      </div>
                      <div className={styles.fact}>
                        <dt className={styles.factKey}>Representation</dt>
                        <dd className={styles.factVal}>Position only</dd>
                      </div>
                    </dl>

                    <p className={styles.boundary}>
                      This is the whole of what the analysis holds about the
                      subject: a coordinate per instant. Nothing identifying is
                      derived, because nothing identifying is extracted. The
                      full SecureVision pipeline adds zone geometry, dwell and
                      flagged deviation against an expected flow — none of which
                      is inferred here.
                    </p>

                    <div className={styles.links}>
                      {[
                        ["SuspiciousMotion", "/securevision/suspiciousmotion"],
                        ["CrowdSense", "/securevision/crowdsense"],
                      ].map(([label, href]) => (
                        <Link key={href} href={href} className={styles.link}>
                          {label} →
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── TECHNICAL ── */}
                {tab === "technical" && (
                  <div className={styles.body}>
                    <ol className={styles.chain}>
                      {[
                        ["Video", `${result.width} × ${result.height}, ${result.duration.toFixed(2)}s, decoded locally`],
                        ["Frames", `${result.sampled + 1} sampled, scaled to 160px wide, luminance only`],
                        ["Motion field", `absolute luminance difference per pixel, threshold 18/255`],
                        ["Temporal features", `energy and centroid per instant, ${result.sampled} points`],
                        ["Derived", `drift, direction, reversals, autocorrelation period`],
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
                      This chain stops where GaitAI&apos;s begins. The product
                      pipeline continues into pose estimation, gait-cycle
                      segmentation, multimodal fusion and signal-quality
                      gating — none of which runs in a browser tab.
                    </p>
                  </div>
                )}

                {/* ── AFTER RESULTS ── */}
                <div className={styles.after}>
                  <span className={styles.afterLabel}>
                    Want this on real footage?
                  </span>
                  <div className={styles.links}>
                    <Link href="/mobilitycare" className={styles.link}>
                      Explore MobilityCare →
                    </Link>
                    <Link href="/securevision" className={styles.link}>
                      Explore SecureVision →
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
