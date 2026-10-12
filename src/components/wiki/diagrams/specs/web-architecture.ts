import type { ArchitectureSpec } from "../types";

/** Verified against web/index.html, web/config.js, web/app.js, web/features.js, web/sw.js, web/doctor.js, firebase.json. */
export const webArchitecture: ArchitectureSpec = {
  kind: "architecture",
  id: "web-architecture",
  title: "Web application architecture",
  description: "A static shell served by Firebase Hosting boots a plain-JavaScript runtime. config.js selects the API origin from the hostname, app.js owns state, requests and rendering, and deferred feature modules wrap those functions. Every protected operation is an HTTPS call to the shared API with a bearer token.",
  relationships: [
    "Firebase Hosting serves index.html, the JavaScript modules and CSS over HTTPS with CSP, HSTS, X-Frame-Options DENY and no-referrer headers; index.html, config.js and sw.js are marked no-cache.",
    "index.html loads config.js synchronously, then app.js and the feature modules with defer, in a fixed order.",
    "config.js maps the public hostnames to the API origin; on any other host the app talks to a same-origin /api.",
    "app.js keeps the state object S, exposes request() (Authorization: Bearer, X-Requested-With, cache: no-store, 401 → sign-in), render() into #app and load(); it stores the bearer token in sessionStorage.",
    "Feature modules (features, history, lifetime, charts, analytics, share, care, exports, profiles, password, gaitai) extend the app by wrapping render, execute, submitForm and load rather than by a bundler.",
    "The service worker caches the shell network-first for GET requests and never intercepts /api.",
    "doctor.html is a separate public share view: it reads a share token from the URL fragment, sends an optional PIN header and never signs in.",
    "All record, document and account operations go to the shared FastAPI service; the browser never reaches PostgreSQL or object storage directly.",
  ],
  width: 1040,
  height: 540,
  groups: [
    { id: "browser", x: 20, y: 16, w: 650, h: 504, title: "Browser", subtitle: "Static client · no framework build step", tone: "client" },
    { id: "hosting", x: 700, y: 16, w: 320, h: 160, title: "Static delivery", subtitle: "Firebase Hosting", tone: "external" },
    { id: "backend", x: 700, y: 216, w: 320, h: 304, title: "Shared backend", subtitle: "Render · FastAPI", tone: "app" },
  ],
  nodes: [
    { id: "shell", x: 50, y: 86, w: 180, h: 70, title: "index.html", subtitle: "Application shell\nDeferred script order", kind: "artifact" },
    { id: "config", x: 50, y: 186, w: 180, h: 70, title: "config.js", subtitle: "Hostname → API origin\nSame-origin /api otherwise", tag: "1 · sync" },
    { id: "session", x: 50, y: 290, w: 180, h: 70, title: "sessionStorage", subtitle: "babycare_token (bearer)\nbabycare_signed_in", kind: "store" },
    { id: "sw", x: 50, y: 390, w: 180, h: 70, title: "sw.js", subtitle: "Network-first shell cache\nNever intercepts /api", tone: "muted" },
    { id: "core", x: 300, y: 86, w: 330, h: 170, title: "app.js — core runtime", subtitle: "State S · request() adds Bearer + X-Requested-With\nrender() → #app · tab routing · modals\nload(): /me and /patients · 401 → sign-in", tag: "2 · defer", tone: "accent" },
    { id: "modules", x: 350, y: 290, w: 280, h: 100, title: "Feature modules", subtitle: "features · history · lifetime · charts\nanalytics · share · care · exports\nprofiles · password · gaitai", tag: "3 · defer" },
    { id: "doctor", x: 350, y: 420, w: 280, h: 56, title: "doctor.html + doctor.js", subtitle: "Public share view · token in #t= · PIN header", kind: "external" },
    { id: "firebase", x: 730, y: 86, w: 260, h: 70, title: "Firebase Hosting", subtitle: "web/ assets · CSP, HSTS, frame DENY\nno-cache: index.html, config.js, sw.js", kind: "external" },
    { id: "api", x: 730, y: 280, w: 260, h: 110, title: "GaitAI Care API", subtitle: "/api JSON and multipart uploads\nBearer tokens · CORS allow-list\nSame service as Android", tone: "accent" },
    { id: "stores", x: 730, y: 424, w: 260, h: 56, title: "PostgreSQL · private storage", subtitle: "Reached only through the API", kind: "store", tone: "muted" },
  ],
  edges: [
    { id: "serve", from: "firebase", to: "shell", fromSide: "top", toSide: "top", via: 56, label: "Serves shell and assets", sublabel: "HTTPS GET" },
    { id: "load-config", from: "shell", to: "config", fromSide: "bottom", toSide: "top" },
    { id: "load-core", from: "shell", to: "core", fromSide: "right", toSide: "left", toAt: (121 - 171) / 170 },
    { id: "config-core", from: "config", to: "core", fromSide: "right", toSide: "left", toAt: (221 - 171) / 170 },
    { id: "core-modules", from: "core", to: "modules", fromSide: "bottom", toSide: "top", fromAt: (490 - 465) / 330, arrow: "both" },
    { id: "core-session", from: "core", to: "session", fromSide: "bottom", fromAt: (326 - 465) / 330, toSide: "right", arrow: "both", label: "Bearer token" },
    { id: "core-api", from: "core", to: "api", fromSide: "right", fromAt: 0.4, toSide: "left", via: 680, label: "JSON · Bearer" },
    { id: "doctor-api", from: "doctor", to: "api", fromSide: "right", toSide: "bottom", toAt: -0.3, points: [{ x: 685, y: 448 }, { x: 685, y: 408 }, { x: 782, y: 408 }], label: "Share token · PIN", style: "dashed" },
    { id: "api-stores", from: "api", to: "stores", fromSide: "bottom", toSide: "top", fromAt: 0.25, toAt: 0.25 },
  ],
  notes: [
    { id: "wrap", x: 50, y: 484, w: 600, text: ["Feature modules call the shared request() and wrap render(), execute(), submitForm() and load(); there is no bundler."] },
    { id: "hash", x: 50, y: 502, w: 600, text: ["Account links arrive as URL fragments (#verify-email=, #reset-password=) that the scripts read and strip."] },
  ],
  legend: [
    { style: "solid", label: "Load order or HTTPS request" },
    { style: "dashed", label: "Unauthenticated public share path" },
    { style: "box-store", label: "Browser or server storage" },
    { style: "box-external", label: "Outside the application code" },
  ],
};
