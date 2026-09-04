"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  PROOF_MODE_PARAM,
  PROOF_MODE_STORAGE_KEY,
  type ProofMode,
} from "@/data/provenance";

/**
 * The site-wide Explore / Evidence mode.
 *
 * WHY IT IS GLOBAL AND NOT PER-PAGE. The question evidence mode answers — "on
 * what basis is this being said?" — is not a question about one page. A reader
 * who turns it on while reading a module page is asking it of the whole site,
 * and having it silently reset on navigation would make it feel broken and
 * would quietly hide exactly the marks they asked to see. So there is one
 * state, in one provider, above the router.
 *
 * WHY IT READS THE URL AFTER MOUNT rather than through `useSearchParams`.
 * This site is a static export. `useSearchParams` in a layout-level provider
 * would force every page out of static rendering, which is not a trade worth
 * making for a display preference. So the first paint is always explore mode —
 * exactly what the exported HTML contains, so there is no hydration mismatch —
 * and an `?evidence=1` deep link or a stored choice applies one frame later.
 * That is the same trade `useQueryState` already makes in five places here.
 *
 * WHY BOTH URL AND STORAGE. The URL makes an evidence-mode page shareable,
 * which matters most: the natural use of this is to send someone a link that
 * shows what a claim rests on. Storage makes the choice survive a navigation
 * and a return visit. The URL wins when both are present, because an explicit
 * link should override a remembered preference.
 *
 * `history.replaceState` is used rather than the router, so toggling the mode
 * does not remount the page or lose scroll position — the whole point is to
 * watch marks appear around the paragraph you were already reading.
 */

interface ProofModeContext {
  mode: ProofMode;
  /** True only in evidence mode. The name every consumer actually wants. */
  evidence: boolean;
  setMode: (mode: ProofMode) => void;
  toggle: () => void;
  /** False until the URL and storage have been read. */
  hydrated: boolean;
}

const Ctx = createContext<ProofModeContext>({
  mode: "explore",
  evidence: false,
  setMode: () => {},
  toggle: () => {},
  hydrated: false,
});

const readInitial = (): ProofMode => {
  if (typeof window === "undefined") return "explore";
  const param = new URLSearchParams(window.location.search).get(
    PROOF_MODE_PARAM,
  );
  /* An explicit link wins over a remembered choice, including `?evidence=0`,
     which is how someone shares "look at this page, plainly". */
  if (param === "1" || param === "true") return "evidence";
  if (param === "0" || param === "false") return "explore";
  try {
    return window.localStorage.getItem(PROOF_MODE_STORAGE_KEY) === "evidence"
      ? "evidence"
      : "explore";
  } catch {
    /* Private mode, or storage blocked. Explore is the safe default: it is
       what the server rendered. */
    return "explore";
  }
};

export function ProofModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ProofMode>("explore");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setModeState(readInitial());
    setHydrated(true);
  }, []);

  const setMode = useCallback((next: ProofMode) => {
    setModeState(next);

    try {
      window.localStorage.setItem(PROOF_MODE_STORAGE_KEY, next);
    } catch {
      /* Nothing to do: the mode still works for this page load. */
    }

    /* Keep the URL truthful without navigating. `replaceState` leaves the
       history stack alone, which is right for a display preference — a reader
       pressing Back expects the previous page, not the previous mode. */
    try {
      const url = new URL(window.location.href);
      if (next === "evidence") url.searchParams.set(PROOF_MODE_PARAM, "1");
      else url.searchParams.delete(PROOF_MODE_PARAM);
      window.history.replaceState(window.history.state, "", url.toString());
    } catch {
      /* A URL the History API refuses is not worth failing the toggle over. */
    }
  }, []);

  const toggle = useCallback(
    () => setMode(mode === "evidence" ? "explore" : "evidence"),
    [mode, setMode],
  );

  const value = useMemo<ProofModeContext>(
    () => ({
      mode,
      evidence: mode === "evidence",
      setMode,
      toggle,
      hydrated,
    }),
    [mode, setMode, toggle, hydrated],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useProofMode = () => useContext(Ctx);
