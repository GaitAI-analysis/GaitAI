import { applyD1Migrations, env, type D1Migration } from "cloudflare:test";

declare module "cloudflare:test" {
  interface ProvidedEnv extends Record<string, unknown> {
    DB: D1Database;
    TEST_MIGRATIONS: D1Migration[];
  }
}

await applyD1Migrations(env.DB, (env as unknown as { TEST_MIGRATIONS: D1Migration[] }).TEST_MIGRATIONS);
