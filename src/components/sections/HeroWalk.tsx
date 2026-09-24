"use client";

import { useEffect, useRef, useState } from "react";
import { assetPath } from "@/lib/paths";
import styles from "./herowalk.module.css";

/**
 * THE POSE-ANALYSIS FIGURE, WALKING.
 * =============================================================================
 * The rightmost panel of the hero artwork holds an anatomical figure caught
 * mid-stride. Everything else in the panel — the gradient, the gold streams,
 * the "Pose analysis" pill, the floor and its reflection — is the founder's
 * picture and is not touched. Only the human moves.
 *
 * ── HOW ───────────────────────────────────────────────────────────────────
 * `erase.webp` repaints the pixels the painted figure occupied and is
 * transparent everywhere else, so there is no rectangle over the artwork and
 * no seam. Over it the same figure is rebuilt from eleven sprites cut out of
 * the original pixels — torso, two upper arms, two forearms, two thighs, two
 * shanks, two shoes — hung off each other at the joints. Rotating a layer
 * carries everything below it, so the shoe follows the shin, which follows
 * the thigh, exactly as a leg does.
 *
 * The stride itself is solved rather than drawn: each foot follows a path,
 * planted through stance and lifted through swing, and the hip and knee are
 * whatever reaches it. That is where the knee bend and the rise and fall of
 * the body come from. See scripts/hero-walk/.
 *
 * ── WHY SPRITES AND NOT A TRANSPARENT VIDEO ───────────────────────────────
 * The obvious build is a WebM over the panel. Transparency there means VP9
 * with an alpha channel, and Safari decodes that WebM without the alpha — a
 * black box across the hero. These sprites are the artwork's own pixels, so
 * they stay exactly as sharp as the picture at every width, where a video
 * would be pinned to whatever resolution it was encoded at. It also costs
 * about 175 KB rather than a megabyte, and it cannot fail to autoplay.
 *
 * ── IT WALKS ON THE SPOT ──────────────────────────────────────────────────
 * A seamless loop ends where it began, so it cannot have travelled. A figure
 * that advances has to jump back at the loop point; a figure that drifts
 * backwards while its feet step forward is the sliding the brief rules out.
 * What is left is the motion a camera walking alongside would record, which
 * is what a walk looks like. The floor here is a mirror with no texture on
 * it, so nothing in the frame contradicts it.
 *
 * ── NOTHING APPEARS UNTIL ALL OF IT CAN ───────────────────────────────────
 * The layer is transparent until every sprite has decoded. Until then the
 * painted artwork shows through untouched, so a slow connection sees the
 * hero it has always seen rather than a panel with the figure erased and the
 * limbs still arriving. If any sprite fails to load, `ready` never turns on
 * and the painted figure simply stays.
 *
 * Decorative throughout: `aria-hidden`, and `pointer-events: none` on every
 * layer so the pill hotspots underneath keep working.
 */

/** Sprites in paint order, with the intrinsic size of each cut-out. */
const SPRITE = {
  torso: [117, 293],
  armLUpper: [74, 111],
  armLFore: [57, 127],
  armRUpper: [57, 117],
  armRFore: [72, 123],
  thighL: [125, 183],
  shankL: [92, 170],
  footL: [67, 50],
  thighR: [103, 192],
  shankR: [131, 149],
  footR: [58, 76],
} as const;

type SpriteName = keyof typeof SPRITE;

function Sprite({ name }: { name: SpriteName }) {
  const [w, h] = SPRITE[name];
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static export; the cut-outs are pre-sized
    <img
      className={`${styles.sprite} ${styles[name]}`}
      src={assetPath(`/images/hero/walk/${name}.webp`)}
      alt=""
      width={w}
      height={h}
      decoding="async"
    />
  );
}

/** A joint: rotates about its own pivot, carrying whatever hangs off it. */
function Joint({
  name,
  children,
}: {
  name: SpriteName;
  children?: React.ReactNode;
}) {
  return (
    <div className={`${styles.layer} ${styles[`${name}Layer`]}`}>
      {children}
      <Sprite name={name} />
    </div>
  );
}

export function HeroWalk() {
  const root = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    let live = true;
    const images = Array.from(node.querySelectorAll("img"));
    Promise.all(images.map((img) => img.decode().catch(() => undefined))).then(
      () => {
        if (!live) return;
        // Only swap in the rig if the whole figure arrived. A half-loaded
        // body over an erased one would be worse than the still picture.
        if (images.every((img) => img.naturalWidth > 0)) setReady(true);
      },
    );
    return () => {
      live = false;
    };
  }, []);

  return (
    <div
      ref={root}
      aria-hidden="true"
      className={styles.walk}
      data-ready={ready ? "true" : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- static export; pre-sized */}
      <img
        className={styles.erase}
        src={assetPath("/images/hero/walk/erase.webp")}
        alt=""
        width={268}
        height={495}
        decoding="async"
      />
      <div className={`${styles.layer} ${styles.drift}`}>
        <div className={`${styles.layer} ${styles.root}`}>
          {/* Far side first: the camera is behind the figure's left. */}
          <Joint name="thighR">
            <Joint name="shankR">
              <Joint name="footR" />
            </Joint>
          </Joint>
          <Joint name="thighL">
            <Joint name="shankL">
              <Joint name="footL" />
            </Joint>
          </Joint>
          {/* The arms hang off the trunk, so they ride its sway. The torso
              itself paints last, over both shoulders and the pelvis, which
              is what hides the top of every limb. */}
          <Joint name="torso">
            <Joint name="armRUpper">
              <Joint name="armRFore" />
            </Joint>
            <Joint name="armLUpper">
              <Joint name="armLFore" />
            </Joint>
          </Joint>
        </div>
      </div>
    </div>
  );
}
