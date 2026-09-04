"use client";

import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      /* Dark is the GaitAI identity, so it is what a first-time visitor sees.
         System is offered immediately by the toggle — it is a choice, not the
         starting state. */
      defaultTheme="dark"
      /* Was false, which meant the site ignored the preference the visitor had
         already set at the OS level and there was no way to ask it to follow.
         With this on, "system" becomes a real third mode that tracks the
         machine as it changes, rather than a one-time read at first paint. */
      enableSystem
      disableTransitionOnChange={false}
    >
      {children}
    </ThemeProvider>
  );
}
