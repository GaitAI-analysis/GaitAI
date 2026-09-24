"use client";

import { useEffect, useRef } from "react";
import { assetPath } from "@/lib/paths";

/**
 * THE LIGHT HERO'S LOOP — a film that is only ever an enhancement.
 * =============================================================================
 * The light hero's still (`ThemePicture`) is the loop's first frame, pixel for
 * pixel. So this element can arrive late, or never, and the page looks the
 * same: it renders with NO source, fetches nothing on the server-rendered
 * pass, and only attaches a file once all of these hold on the client:
 *
 *   - the site theme is light (the `light` class next-themes keeps on <html>,
 *     never `prefers-color-scheme` — dark shows the night photograph instead);
 *   - the window is at least tablet-landscape wide (≥1024px). On a phone the
 *     picture is a small strip under the copy and the still carries it,
 *     without a download;
 *   - the visitor has not asked for reduced motion.
 *
 * It fades in on `playing`, not on load, so a stalled network never swaps the
 * still for an empty frame. It pauses when the hero leaves the viewport and
 * when the theme turns dark, and resumes when either comes back. The markup is
 * identical on server and client — every decision is in the effect — so there
 * is no hydration branch to get wrong.
 */
export function HeroMotion({
  className,
  webm,
  mp4,
}: {
  readonly className?: string;
  readonly webm: string;
  readonly mp4: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const root = document.documentElement;
    const wide = window.matchMedia("(min-width: 1024px)");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = true;
    let attached = false;

    const sync = () => {
      const wanted = root.classList.contains("light") && wide.matches && !still.matches;
      if (!wanted) {
        video.pause();
        delete video.dataset.playing;
        return;
      }
      if (!attached) {
        const vp9 = video.canPlayType('video/webm; codecs="vp9"') !== "";
        video.src = assetPath(vp9 ? webm : mp4);
        attached = true;
      }
      if (visible) video.play().catch(() => {});
      else video.pause();
    };

    const onPlaying = () => {
      video.dataset.playing = "true";
    };
    video.addEventListener("playing", onPlaying);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    io.observe(video);
    const mo = new MutationObserver(sync);
    mo.observe(root, { attributes: true, attributeFilter: ["class"] });
    wide.addEventListener("change", sync);
    still.addEventListener("change", sync);
    sync();

    return () => {
      video.removeEventListener("playing", onPlaying);
      io.disconnect();
      mo.disconnect();
      wide.removeEventListener("change", sync);
      still.removeEventListener("change", sync);
      video.pause();
    };
  }, [webm, mp4]);

  return (
    <video
      ref={ref}
      className={className}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
      tabIndex={-1}
      disablePictureInPicture
    />
  );
}
