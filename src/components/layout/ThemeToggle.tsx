"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { MOTION, EASE_OUT, MOTION_NONE } from "@/lib/motion";

/**
 * Three modes, not two.
 *
 * This control used to be a boolean — light or dark, `enableSystem={false}` in
 * the provider — which quietly overrode the one preference the visitor had
 * already expressed at the OS level. Someone whose machine is set to light for
 * daytime and dark after sunset got whichever of the two they last clicked
 * here, forever.
 *
 * So the cycle is Light → Dark → System, and System is a real destination
 * rather than a hidden default: it hands the decision back to the operating
 * system and then follows it for as long as it changes.
 *
 * WHY A CYCLE AND NOT A SEGMENTED CONTROL. Three explicit radio buttons are
 * the more discoverable pattern and were the first choice, but this button
 * sits in a header row that already carries the search trigger, the Atlas
 * glyph and "Request demo"; three 36px targets there costs ~100px and pushes
 * the demo button off the small breakpoints. A cycle keeps one 36px target,
 * and the discoverability cost is paid back in the accessible name, which
 * always states the mode the site is in AND the one a press will move to —
 * so the third mode is announced before it is reached, rather than being
 * something you have to click twice to find.
 *
 * `defaultTheme` stays dark in the provider on purpose. Dark is the GaitAI
 * identity and it is what a first-time visitor should see; System is a choice
 * available immediately, not the state everyone starts in.
 */

/** The cycle, in order. Each entry owns its icon, ink and wording. */
const MODES = [
  {
    value: "light",
    icon: Sun,
    ink: "text-amber-400",
    /* Named as a noun for the current state, so the label reads
       "Theme: Light." rather than "Theme: switch to light." */
    noun: "Light",
  },
  {
    value: "dark",
    icon: Moon,
    ink: "text-cyan-300",
    noun: "Dark",
  },
  {
    value: "system",
    icon: Monitor,
    /* Deliberately not an accent: system is the absence of an override, and
       colouring it like a chosen theme implies it is one. */
    ink: "text-soft-mute",
    noun: "System",
  },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    /* Same box as the real control, touch sizing included, so mounting the
       toggle never nudges the header. */
    return <div className="ix-hit-box h-9 w-9 rounded-full glass" aria-hidden />;
  }

  /* An unrecognised or absent value resolves to the provider's default rather
     than to index -1, which would render no icon at all. */
  const index = Math.max(
    0,
    MODES.findIndex((mode) => mode.value === theme),
  );
  const current = MODES[index];
  const next = MODES[(index + 1) % MODES.length];
  const Icon = current.icon;

  /* Both halves in one string: where the site is now, and where a press goes.
     A screen-reader user should never have to activate a control to discover
     what it does. */
  const label = `Theme: ${current.noun}. Switch to ${next.noun.toLowerCase()}.`;

  return (
    /* No aria-pressed: this is not an on/off state, it is a choice among three
       named modes, and the label carries both the current one and the next.
       `.ix-hit-box` keeps the 36px box on a mouse and grows it to 44px on a
       touch device, where the header has the room — the pseudo-element trick
       cannot be used here because this button clips its own overflow for the
       icon swap, which would clip the enlarged target away with it. */
    <button
      type="button"
      onClick={() => setTheme(next.value)}
      aria-label={label}
      title={label}
      className="ix-hit-box relative grid h-9 w-9 place-items-center overflow-hidden rounded-full glass transition-all duration-ui ease-out hover:border-white/20 hover:shadow-glow active:scale-95"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          /* Keyed by mode so AnimatePresence swaps on every step of the
             cycle, including into and out of System. */
          key={current.value}
          initial={reduce ? { opacity: 0 } : { y: -14, opacity: 0, rotate: -90 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={reduce ? { opacity: 0 } : { y: 14, opacity: 0, rotate: 90 }}
          /* The UI band: the visitor is waiting on this, and it now agrees
             with every other hover and state change on the site. Reduced
             motion arrives without travelling — see `MOTION_NONE`. */
          transition={reduce ? MOTION_NONE : { duration: MOTION.ui, ease: EASE_OUT }}
          className="absolute"
        >
          <Icon className={`h-4 w-4 ${current.ink}`} />
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
