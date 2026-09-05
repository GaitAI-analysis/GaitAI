import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

/**
 * The tests run INSIDE workerd through the Cloudflare Vitest plugin, against
 * the real wrangler.jsonc — same bindings, same Durable Object, same
 * compatibility date — with three differences supplied here as plain bindings:
 *
 *   · a placeholder WORKERS_AI_MODEL, so the "configured" path is exercised
 *   · a short MODEL_TIMEOUT_MS, so the timeout test takes milliseconds
 *   · ASK_DAILY_BUDGET=0 (unlimited) — see below
 *
 * THE AI BINDING IS NEVER CALLED. Cloudflare documents that Workers AI
 * "always accesses your Cloudflare account … even in local development", so
 * every test that reaches the model calls the handler directly with an env
 * whose `AI` is a scripted mock (see test/ask.test.ts). No test makes a real
 * inference request, and none needs a login.
 */
export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.jsonc" },
      /* The AI binding is a remote resource: with this on, the pool would open
         a proxy session to the Cloudflare account just to start. Off, the
         binding is inert in tests — and it is replaced by the mock anyway. */
      remoteBindings: false,
      miniflare: {
        bindings: {
          WORKERS_AI_MODEL: "@cf/test/grounded-model",
          MODEL_TIMEOUT_MS: "150",
          /* The suite makes well over 25 hosted calls against one shared guard
             object; the production default (25/day) is asserted separately
             through readConfig, and the budget path is exercised with an
             explicit override. */
          ASK_DAILY_BUDGET: "0",
          ALLOWED_ORIGINS: "https://gaitai.in,https://www.gaitai.in,http://localhost:3000",
        },
      },
    }),
  ],
  test: {
    include: ["test/**/*.test.ts"],
  },
});
