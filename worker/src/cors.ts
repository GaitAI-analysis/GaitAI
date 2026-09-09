/**
 * CORS, AGAINST AN ALLOWLIST — AND AN ORIGIN IS REQUIRED.
 * =============================================================================
 * A browser always sends `Origin` on a cross-origin POST, and this endpoint is
 * always cross-origin (the site is on gaitai.in, the Worker on ask.gaitai.in).
 * So a request with no `Origin` is not a visitor: it is a script calling the
 * endpoint directly, which is the shape abuse takes on a public endpoint that
 * spends money per call. Rejecting it costs the site nothing.
 *
 * Never `*`. The accepted origin is echoed back exactly, with `Vary: Origin`
 * so no cache serves one origin's headers to another. Development origins are
 * configured in `.dev.vars`, never in the production allowlist.
 */

export function allowedOrigin(
  request: Request,
  allowed: Set<string>,
): string | null {
  const origin = request.headers.get("Origin");
  if (!origin) return null;
  return allowed.has(origin) ? origin : null;
}

export function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    /* Without this a browser cannot READ Retry-After on a 429/503, and the
       client's "give it a moment — about a minute" wording has no number. */
    "Access-Control-Expose-Headers": "Retry-After",
    "Access-Control-Max-Age": "3600",
    Vary: "Origin",
  };
}
