/** JSON responses, typed API errors and CORS. */
import type { Config } from "./env";

export class ApiError extends Error {
  constructor(public status: number, public code: string, message?: string, public extra?: Record<string, unknown>) {
    super(message ?? code);
  }
}

export const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers } });

export const errorResponse = (e: ApiError) => json({ error: e.code, message: e.message, ...(e.extra ?? {}) }, e.status);

/**
 * CORS: browsers on the website origins; native apps send no Origin and are
 * admitted by their bearer token, not by CORS. An unknown Origin gets no
 * allow header, so the browser blocks the response.
 */
export function corsHeaders(config: Config, request: Request): Record<string, string> {
  const origin = request.headers.get("origin");
  if (!origin || !config.allowedOrigins.includes(origin)) return {};
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET,POST,DELETE,OPTIONS",
    "access-control-allow-headers": "authorization,content-type,x-gaitai-client",
    "access-control-max-age": "600",
    vary: "origin",
  };
}

export function withCors(res: Response, headers: Record<string, string>): Response {
  if (!Object.keys(headers).length) return res;
  const out = new Response(res.body, res);
  for (const [k, v] of Object.entries(headers)) out.headers.set(k, v);
  return out;
}

export async function readJson<T = Record<string, unknown>>(request: Request): Promise<T> {
  const text = await request.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError(400, "invalid_json");
  }
}
