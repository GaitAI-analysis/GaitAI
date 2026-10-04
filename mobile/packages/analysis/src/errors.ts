/**
 * Typed failures for the on-device analysis. Every failure the user can see
 * carries one of these codes, and the copy for each code says what actually
 * went wrong and which action can help. The engine never tells someone to
 * change their video when the problem is the engine.
 */
export type EngineErrorCode =
  | "ENGINE_INITIALIZATION_FAILED" // runtime did not boot, or the WebView page/renderer died before it was ready
  | "MODEL_ASSET_MISSING"          // a model or runtime file is not in this install
  | "VIDEO_DECODE_FAILED"          // the clip could not be opened or decoded
  | "VIDEO_TOO_LONG"               // the clip is over the accepted length
  | "NO_PERSON_DETECTED"           // inference ran; no frame contained a person
  | "INSUFFICIENT_VALID_FRAMES"    // inference ran; too few usable frames or steps for a result
  | "ANALYSIS_TIMEOUT"             // the engine stopped reporting progress
  | "ANALYSIS_FAILED"              // inference threw
  | "ENGINE_BUSY"                  // a second analysis was requested while one is running
  | "CANCELLED";                   // the user left the processing screen

export class EngineError extends Error {
  readonly code: EngineErrorCode;
  /** Technical detail for logs; never shown as the headline. */
  readonly detail?: string;
  constructor(code: EngineErrorCode, message?: string, detail?: string) {
    super(message ?? code);
    this.name = "EngineError";
    this.code = code;
    this.detail = detail;
  }
}

export const isEngineError = (e: unknown): e is EngineError => e instanceof EngineError || (!!e && typeof e === "object" && "code" in e && typeof (e as { code: unknown }).code === "string" && "message" in e);

/** Wraps anything thrown into an EngineError with the given fallback code. */
export function toEngineError(e: unknown, fallback: EngineErrorCode = "ANALYSIS_FAILED"): EngineError {
  if (e instanceof EngineError) return e;
  if (isEngineError(e)) return new EngineError((e as EngineError).code, (e as EngineError).message, (e as EngineError).detail);
  return new EngineError(fallback, e instanceof Error ? e.message : String(e));
}

export interface EngineErrorCopy {
  title: string;
  body: string;
  /** Re-initialise the engine, then re-run the pending analysis. */
  retryInit: boolean;
  /** Run the same clip again without re-initialising. */
  retrySame: boolean;
  /** Offer a different clip (only when the clip itself is the problem). */
  anotherVideo: boolean;
}

const COPY: Record<EngineErrorCode, EngineErrorCopy> = {
  ENGINE_INITIALIZATION_FAILED: {
    title: "The movement engine could not start",
    body: "The analysis engine on this phone did not finish starting, so your video was not analysed. Your selected video is kept. Retry restarts the engine and then runs the analysis.",
    retryInit: true, retrySame: false, anotherVideo: false,
  },
  MODEL_ASSET_MISSING: {
    title: "A model file is missing from this install",
    body: "The engine could not read one of its model files. Your video is fine. Retry once; if it fails again, reinstalling the app restores the missing file.",
    retryInit: true, retrySame: false, anotherVideo: false,
  },
  VIDEO_DECODE_FAILED: {
    title: "This video could not be read",
    body: "The phone could not decode this clip. An MP4 recorded with this phone's camera works best. Nothing was uploaded.",
    retryInit: false, retrySame: false, anotherVideo: true,
  },
  VIDEO_TOO_LONG: {
    title: "This clip is too long",
    body: "Choose a clip under 60 seconds. The first 20 seconds are analysed, so 10–20 seconds of walking is ideal.",
    retryInit: false, retrySame: false, anotherVideo: true,
  },
  NO_PERSON_DETECTED: {
    title: "No person was found in the video",
    body: "The pose model ran on every sampled frame and did not find a body. Keep the whole body in frame, head to feet, with the camera about 3–5 m away and even light.",
    retryInit: false, retrySame: false, anotherVideo: true,
  },
  INSUFFICIENT_VALID_FRAMES: {
    title: "Not enough clear steps to measure",
    body: "A body was found, but too few clear foot contacts to time steps. Record 10–20 seconds of continuous walking with both feet visible, ideally from the side.",
    retryInit: false, retrySame: false, anotherVideo: true,
  },
  ANALYSIS_TIMEOUT: {
    title: "The analysis took too long",
    body: "The engine stopped reporting progress. This can happen with a very large clip or when the phone is low on memory. Try again, or use a shorter clip.",
    retryInit: false, retrySame: true, anotherVideo: true,
  },
  ANALYSIS_FAILED: {
    title: "The analysis stopped",
    body: "Something failed while analysing this clip. Nothing was uploaded. Try again; if it fails again with this clip, try another one.",
    retryInit: false, retrySame: true, anotherVideo: true,
  },
  ENGINE_BUSY: {
    title: "Another analysis is still running",
    body: "Wait for it to finish, then start this one.",
    retryInit: false, retrySame: true, anotherVideo: false,
  },
  CANCELLED: {
    title: "Analysis cancelled",
    body: "The analysis was stopped before it finished.",
    retryInit: false, retrySame: true, anotherVideo: false,
  },
};

export const describeEngineError = (code: EngineErrorCode): EngineErrorCopy => COPY[code] ?? COPY.ANALYSIS_FAILED;
