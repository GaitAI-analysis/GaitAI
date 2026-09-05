import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

/**
 * The tests run INSIDE workerd through the Cloudflare Vitest plugin, against
 * the real wrangler.jsonc — same bindings, same Durable Object, same
 * compatibility date — with three differences supplied here as plain bindings:
 *
 *   · a fake GEMINI_API_KEY, so the "configured" path is exercised (it is never
 *     sent anywhere: the suite replaces the global fetch, and any request to an
 *     origin other than the Gemini endpoint fails the test)
 *   · a fake GEMINI_MODEL, for the same reason
 *   · a short MODEL_TIMEOUT_MS, so the timeout test takes milliseconds
 *
 * No test makes a real network call.
 */
export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.jsonc" },
      miniflare: {
        bindings: {
          GEMINI_API_KEY: "test-key-not-real",
          GEMINI_MODEL: "gemini-test-model",
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
