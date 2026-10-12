import { androidArchitecture } from "./specs/android-architecture";
import { authSequence } from "./specs/auth-sequence";
import { backendComponents } from "./specs/backend-components";
import { careSystem } from "./specs/care-system";
import { cicdArchitecture } from "./specs/cicd-architecture";
import { dataModelEr } from "./specs/data-model-er";
import { documentPipeline } from "./specs/document-pipeline";
import { emailSequence } from "./specs/email-sequence";
import { webArchitecture } from "./specs/web-architecture";
import type { DiagramSpec } from "./types";

export interface DiagramEntry {
  spec: DiagramSpec;
  /** Area the figure belongs to, shown in the figure header. */
  scope: "Shared backend" | "Web application" | "Android application" | "Delivery";
  /** Public source files reviewed for the figure (no private paths or identifiers). */
  sources: string[];
  /** Below this CSS width the figure scrolls horizontally instead of shrinking its type further. */
  minWidth: number;
}

/**
 * Every diagram the Wiki can embed with a ```diagram fence. The key is the
 * fence body. Adding a diagram means adding a spec under ./specs and one entry
 * here; `npm run test:wiki` replays the geometry of each entry.
 */
export const diagramRegistry: Record<string, DiagramEntry> = {
  "care-system": { spec: careSystem, scope: "Shared backend", minWidth: 720, sources: ["api/main.py", "api/guardrails.py", "api/storage.py", "api/mailer.py", "supabase/functions/mail-relay", "render.yaml", "firebase.json", "mobile/capacitor.config.json"] },
  "web-architecture": { spec: webArchitecture, scope: "Web application", minWidth: 720, sources: ["web/index.html", "web/config.js", "web/app.js", "web/features.js", "web/sw.js", "web/doctor.js", "firebase.json"] },
  "android-architecture": { spec: androidArchitecture, scope: "Android application", minWidth: 720, sources: ["mobile/capacitor.config.json", "mobile/scripts/sync-web.mjs", "mobile/www-src", "AndroidManifest.xml", "MainActivity.java", "GaitAIMobilePlugin.java", "SecureStore.java"] },
  "backend-components": { spec: backendComponents, scope: "Shared backend", minWidth: 760, sources: ["api/main.py", "every module in api/", "Dockerfile", "docker-compose.yml"] },
  "document-pipeline": { spec: documentPipeline, scope: "Shared backend", minWidth: 760, sources: ["api/main.py", "api/extract.py", "api/extraction.py", "api/workflows.py", "api/review_validation.py", "api/storage.py", "api/crypto.py", "web/features.js"] },
  "auth-sequence": { spec: authSequence, scope: "Shared backend", minWidth: 720, sources: ["api/main.py", "api/security.py", "api/email_verification.py", "api/guardrails.py"] },
  "data-model-er": { spec: dataModelEr, scope: "Shared backend", minWidth: 1040, sources: ["migrations/versions/0001 to 0012", "migrations/legacy_schema.py", "migrations/v2_schema.py", "api/models.py", "api/care_models.py", "api/lifetime_models.py", "api/share_models.py", "api/vitals_models.py"] },
  "email-sequence": { spec: emailSequence, scope: "Shared backend", minWidth: 760, sources: ["api/mailer.py", "api/email_verification.py", "api/password_reset.py", "api/web_origin.py", "supabase/functions/mail-relay/index.ts", "supabase/functions/_shared", "migrations/versions/0012_mail_relay_guard.py", "web/gaitai.js", "web/password.js", "mobile/www-src/mobile.js"] },
  "cicd-architecture": { spec: cicdArchitecture, scope: "Delivery", minWidth: 720, sources: [".github/workflows/ci.yml", "render.yaml", "Dockerfile", "firebase.json", "supabase/functions/mail-relay/README.md", "docs/DEPLOYMENT.md", "docs/ANDROID.md", "mobile/android/app/build.gradle"] },
};

export const diagramNames = Object.keys(diagramRegistry);
