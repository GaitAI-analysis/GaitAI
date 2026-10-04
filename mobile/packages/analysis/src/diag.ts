/**
 * Engine diagnostics: one-line events on the device log (logcat tag
 * ReactNativeJS), never on screen. Callers pass coarse facts only; anything
 * that looks like a file path, media or analysis values is dropped here as a
 * second line of defence. Enabled in every build so a report from a test
 * phone can be read with `adb logcat -s ReactNativeJS`.
 */
type Primitive = string | number | boolean | null | undefined;
const started = Date.now();
const FORBIDDEN = ["uri", "path", "url", "landmark", "box", "metric", "value", "frame_data"];
const scrub = (data?: Record<string, Primitive>) =>
  data ? Object.fromEntries(Object.entries(data).filter(([k, v]) => v !== undefined && !FORBIDDEN.some((f) => k.toLowerCase().includes(f)))) : undefined;
const stamp = () => `+${((Date.now() - started) / 1000).toFixed(2)}s`;
const fmt = (event: string, data?: Record<string, Primitive>) => { const s = scrub(data); return `[gaitai-engine ${stamp()}] ${event}${s && Object.keys(s).length ? " " + JSON.stringify(s) : ""}`; };

export const diag = {
  enabled: true,
  log(event: string, data?: Record<string, Primitive>) { if (diag.enabled) console.log(fmt(event, data)); },
  warn(event: string, data?: Record<string, Primitive>) { if (diag.enabled) console.warn(fmt(event, data)); },
  error(event: string, data?: Record<string, Primitive>) { if (diag.enabled) console.error(fmt(event, data)); },
};
