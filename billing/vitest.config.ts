import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

/**
 * Tests run inside workerd against the SANDBOX config, so the Worker under
 * test is the sandbox Worker: synthetic gateway, real D1 (local, migrated in
 * test/setup.ts from ./migrations), real WebCrypto. No request leaves the
 * machine: Firebase's JWKS is replaced by a generated RSA key
 * (AUTH_TEST_JWKS) and the Razorpay API is a scripted fetch where a test
 * needs it.
 */
export default defineConfig(async () => {
  const migrations = await readD1Migrations("./migrations");
  return {
    plugins: [
      cloudflareTest({
        wrangler: { configPath: "./wrangler.sandbox.jsonc" },
        remoteBindings: false,
        miniflare: {
          bindings: {
            WORKER_NAME: "gaitai-billing-sandbox",
            PUBLIC_BASE_URL: "https://billing.test",
            TEST_MIGRATIONS: migrations,
          },
        },
      }),
    ],
    test: {
      include: ["test/**/*.test.ts"],
      setupFiles: ["./test/setup.ts"],
    },
  };
});
