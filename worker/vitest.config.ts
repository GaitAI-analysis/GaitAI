import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

/**
 * The tests run INSIDE workerd through the Cloudflare Vitest plugin, against
 * the real wrangler.jsonc — same bindings, same Durable Object, same
 * compatibility date — with three differences supplied here as plain bindings:
 *
 *   · a fake HF_TOKEN, so the "configured" path is exercised (it is never sent
 *     anywhere: every provider call is intercepted by `fetchMock`)
 *   · a fake HF_MODEL, for the same reason
 *   · a short HF_TIMEOUT_MS, so the timeout test takes milliseconds
 *
 * No test makes a real network call; `fetchMock.disableNetConnect()` in the
 * suite turns any attempt into a failure.
 */
export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.jsonc" },
      miniflare: {
        bindings: {
          HF_TOKEN: "test-token-not-real",
          HF_MODEL: "test-org/test-model",
          HF_TIMEOUT_MS: "150",
          ALLOWED_ORIGINS: "https://gaitai.in,https://www.gaitai.in,http://localhost:3000",
        },
      },
    }),
  ],
  test: {
    include: ["test/**/*.test.ts"],
  },
});
