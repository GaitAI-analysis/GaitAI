/** Standalone health-record product. Deliberately outside the movement-module registry. */
export const gaitaiCare = {
  name: "GaitAI Care",
  tagline: "Your health records. Your history. Your insights.",
  description: "A personal and family health-record organiser. Keep medical documents, medicines and everyday care together, with a history you can return to.",
  href: "/gaitai-care/",
  web: "https://care.gaitai.in/",
  download: "/gaitai-care/download/",
  privacy: "https://care.gaitai.in/privacy.html",
  documentation: "https://gaitai-wiki.gait-ai-founder.workers.dev/insights/wiki/gaitai-care/",
  release: {
    version: "1.0.0",
    bytes: 4602976,
    sha256: "84e2f871c288444695ddb4ff74636183d17a2f14fd1ccb9af6952c11254c5ddd",
    // Fail closed: only set after comparison with the original approved release report.
    apk: null as string | null,
  },
} as const;
