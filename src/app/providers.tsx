"use client";

import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";
import { MotionConfig } from "framer-motion";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      /* LIGHT IS WHAT A FIRST-TIME VISITOR SEES (2026-09-23). `defaultTheme`
         is only consulted when nothing is stored, so the order is exactly
         the one the brief asks for: a saved choice wins, and in its absence
         the site opens light. It is NOT `system`, so a first visit does not
         follow `prefers-color-scheme` — a visitor whose machine is dark
         still meets GaitAI in light, which is the point.

         `enableSystem` stays on, and that is not a contradiction: it makes
         "system" a value the visitor can CHOOSE from the toggle and have
         restored later, rather than something imposed before they have
         chosen anything. next-themes writes every choice to localStorage
         and its blocking inline script applies the class before first
         paint, so there is no flash of the wrong theme either way. */
      defaultTheme="light"
      /* Was false, which meant the site ignored the preference the visitor had
         already set at the OS level and there was no way to ask it to follow.
         With this on, "system" becomes a real third mode that tracks the
         machine as it changes, rather than a one-time read at first paint. */
      enableSystem
      disableTransitionOnChange={false}
    >
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </ThemeProvider>
  );
}
