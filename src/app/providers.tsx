"use client";

import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";
import { ProofModeProvider } from "@/components/proof/ProofModeProvider";

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
      {/* Explore / Evidence. Global for the same reason the theme is: the
          question it answers is asked of the site, not of one page, and a
          mode that reset on navigation would silently hide the marks a reader
          just asked to see. It reads the URL and storage after mount rather
          than through useSearchParams, which would pull every page out of the
          static export — see ProofModeProvider. */}
      <ProofModeProvider>{children}</ProofModeProvider>
    </ThemeProvider>
  );
}
