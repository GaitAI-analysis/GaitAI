"use client";

import { useRef, useState } from "react";
import { Play } from "lucide-react";
import type { InsightBlock } from "@/data/insights";
import { assetPath } from "@/lib/paths";
import styles from "./insight-film.module.css";

export function InsightFilmPlayer({
  film,
  playLabel = "Play film",
  preload = "metadata",
}: {
  film: Extract<InsightBlock, { type: "video" }>;
  playLabel?: string;
  preload?: "none" | "metadata";
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playRef = useRef<HTMLButtonElement>(null);
  const [started, setStarted] = useState(false);
  const [failed, setFailed] = useState(false);
  const src = assetPath(film.src);

  async function play() {
    const video = videoRef.current;
    if (!video) return;

    setFailed(false);
    try {
      await video.play();
    } catch {
      setFailed(true);
    }
  }

  return (
    <div className={styles.film}>
      <video
        ref={videoRef}
        aria-label={film.title}
        controls
        playsInline
        preload={preload}
        poster={assetPath(film.poster)}
        width={film.width}
        height={film.height}
        onPlay={(event) => {
          if (document.activeElement === playRef.current) {
            event.currentTarget.focus({ preventScroll: true });
          }
          setStarted(true);
        }}
        onError={() => setFailed(true)}
      >
        <source src={src} type="video/mp4" onError={() => setFailed(true)} />
        {film.captions && (
          <track kind="captions" src={assetPath(film.captions)} srcLang="en" label="English" />
        )}
        <a href={src}>Open the video</a>
      </video>
      {!started && (
        <div className={styles.action}>
          <button
            ref={playRef}
            type="button"
            className={styles.play}
            onClick={() => void play()}
          >
            <Play size={18} aria-hidden="true" />
            {playLabel}
            <span className={styles.duration}>{film.duration}</span>
          </button>
        </div>
      )}
      {failed && (
        <p className={styles.error} role="status">
          The player couldn’t load the film. <a href={src}>Open the MP4</a>.
        </p>
      )}
    </div>
  );
}
