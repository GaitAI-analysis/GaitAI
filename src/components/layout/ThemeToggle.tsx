"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    /* Same box as the real control, touch sizing included, so mounting the
       toggle never nudges the header. */
    return <div className="ix-hit-box h-9 w-9 rounded-full glass" aria-hidden />;
  }

  const isDark = theme === "dark";

  return (
    /* The label says what the press will DO, not what the control is: "toggle
       theme" leaves a screen-reader user to guess which theme they are in.
       `.ix-hit-box` keeps the 36px box on a mouse and grows it to 44px on a
       touch device, where the header has the room — the pseudo-element trick
       cannot be used here because this button clips its own overflow for the
       icon swap, which would clip the enlarged target away with it.

       No aria-pressed: this is not an on/off state, it is a choice between
       two named modes, and the label carries which one is next. */
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="ix-hit-box relative grid h-9 w-9 place-items-center overflow-hidden rounded-full glass transition-all duration-300 hover:border-white/20 hover:shadow-glow active:scale-95"
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="moon"
            initial={{ y: -14, opacity: 0, rotate: -90 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: 14, opacity: 0, rotate: 90 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="absolute"
          >
            <Moon className="h-4 w-4 text-cyan-300" />
          </motion.span>
        ) : (
          <motion.span
            key="sun"
            initial={{ y: -14, opacity: 0, rotate: -90 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: 14, opacity: 0, rotate: 90 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="absolute"
          >
            <Sun className="h-4 w-4 text-amber-400" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
