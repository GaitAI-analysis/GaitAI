<div align="center">

<img src="public/brand/logo-main.png" alt="GaitAI" width="160" />

# GaitAI — Human Movement Intelligence Platform

**An AI-powered platform that transforms walking videos, wearable signals, posture and crowd movement into actionable healthcare, rehabilitation, sports, mobility, safety and security insights.**

[![Next.js](https://img.shields.io/badge/Next.js-14.2-000?logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-11-FF0080?logo=framer&logoColor=white)](https://www.framer.com/motion/)
[![Three.js](https://img.shields.io/badge/Three.js-r169-000?logo=three.js&logoColor=white)](https://threejs.org)
[![Firebase](https://img.shields.io/badge/Firebase-12-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com)
[![Deploy](https://img.shields.io/badge/deploy-GitHub_Pages-222?logo=github&logoColor=white)](https://gaitai.in)
[![License: Proprietary](https://img.shields.io/badge/license-proprietary-111827)](#license)

**Live:** [gaitai.in](https://gaitai.in)

</div>

---

## Table of contents

1. [Overview](#overview)
2. [The platform at a glance](#the-platform-at-a-glance)
3. [Tech stack](#tech-stack)
4. [Architecture](#architecture)
5. [Project structure](#project-structure)
6. [Routing & sitemap](#routing--sitemap)
7. [Firebase & the comment system](#firebase--the-comment-system)
8. [Admin Control Panel](#admin-control-panel)
9. [Ask GaitAI — the movement-intelligence guide](#ask-gaitai--the-movement-intelligence-guide)
10. [Environment variables & secrets](#environment-variables--secrets)
11. [Getting started](#getting-started)
12. [Scripts](#scripts)
13. [Deployment (CI/CD)](#deployment-cicd)
14. [Design system](#design-system)
15. [Theming — dark & light](#theming--dark--light)
16. [Navigation, transitions & animation](#navigation-transitions--animation)
17. [Code-rendered visuals](#code-rendered-visuals)
18. [Founder](#founder)
19. [Security notes](#security-notes)
20. [Related docs](#related-docs)
21. [Roadmap](#roadmap)
22. [License](#license)

---

## Overview

GaitAI is a production-grade, research-led marketing and publication platform for the **GaitAI** brand — a Human Movement Intelligence Platform built on **10+ years of founder-led research** in gait recognition, computer vision, biometrics and movement AI.

The platform organises everything around two verticals and 23 modular products:

| Vertical | Focus |
| --- | --- |
| **GaitAI MobilityCare** | Camera-based gait assessment, rehab tracking, fall-risk screening, sports motion analytics, neurological & orthopedic gait monitoring, smartwatch-based mobility intelligence. |
| **GaitAI SecureVision** | Movement anomaly detection, crowd flow analytics, worker safety, post-event investigation, gait re-identification, campus & event safety, privacy-aware surveillance. |

Beyond the marketing site, the codebase now ships a **community layer** (a Firebase-backed, admin-moderated comment system on publication pages) and an **Admin Control Panel** (`/admin-controlpanel`) that manages the content behind the Insights and Publications pages plus comment moderation — all deployed as a **fully static export** to GitHub Pages under a custom domain.

---

## The platform at a glance

- **23 products** across two verticals (12 MobilityCare + 11 SecureVision).
- **17 industry use cases** mapped to product mixes and concrete outcomes.
- **A 10-module AI pipeline** (pose, gait features, sensor fusion, fall-risk model, rehab model, sports-injury model, WatchCare sensor model, anomaly detection, clinical report generator, privacy layer).
- **A complete site map** — Home, About, MobilityCare, SecureVision, Products, Use Cases, Research, Publications, Insights, Admin Control Panel, plus legal stubs.
- **Moderated discussions** on publications — pending → approve → publish pipeline enforced by Firestore security rules.
- **Cinematic UX** — WebGL hero, glassmorphism, route-level slide transitions, code-rendered product mockups, theme-aware brand mark.

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | **Next.js 14** (App Router, static export `output: "export"`) |
| Language | **TypeScript 5.6** (strict) |
| Styling | **Tailwind CSS 3.4** + custom design tokens + safelist for dynamic accent classes |
| Motion | **Framer Motion 11**, **GSAP 3.12** |
| 3D | **Three.js r169** via **@react-three/fiber** + **@react-three/drei** |
| Backend-as-a-service | **Firebase 12** — Firestore (comments), Auth (moderator sign-in, planned) |
| Icons | **lucide-react** |
| Theming | **next-themes** (dark default, light supported) |
| Fonts | **Space Grotesk** (display), **Inter** (body), **JetBrains Mono** (mono) |
| Utilities | **clsx**, **tailwind-merge** |
| Tooling | ESLint, PostCSS, Autoprefixer |
| Hosting / CI | **GitHub Pages** + **GitHub Actions** (build on push) |

> **Runtime:** Node 18.18+ (Node 20/22 LTS recommended — CI builds on Node 20).

---

## Architecture

### Rendering model — static-first

The site builds to a **fully static export** (`out/`) served by GitHub Pages:

- `output: "export"` is applied to production builds only; `next dev` runs as a normal dev server so dynamic routes work with HMR.
- `trailingSlash: true` maps every route to `route/index.html` so deep links and refreshes never 404 on a static host.
- `images.unoptimized: true` — there is no image-optimization server on Pages.
- **There are no server API routes in production.** The legacy REST layer (`/api/posts`, `/api/upload`, `/api/auth`) is archived under `src/server-only/` for reference and is not part of the build.

### Client/server component discipline

- **Server Components** for all static content — landing sections, vertical pages, post lists, detail pages, layout, metadata.
- **Client Components** are surgically scoped to interactive units: `Navbar`, `ThemeToggle`, `Logo`, `PageTransition`, `PostsList`, `HeroScene`, `ProductGrid`, `Reveal`, the comment system, and the entire Control Panel.
- No functions cross the RSC boundary — client components accept plain data (strings/objects) and resolve icons/predicates internally.

### Data flow

| Data | Source of truth | Consumed by |
| --- | --- | --- |
| Products, use cases, pipeline | `src/data/products.ts` | Landing + vertical pages |
| Nav labels, hero stats | `src/data/content.ts` | Layout + hero |
| Publications seed data | `src/data/publications.ts`, `data/posts.json` (via `src/lib/posts-store.ts`, build-time only) | `/publications`, `/insights` |
| Comments (live) | **Firestore** via `src/lib/comments/service.ts` | Publication detail pages |
| Control-panel dataset | `src/lib/admin/panel-store.ts` (localStorage adapter today, Firestore adapter later) | `/admin-controlpanel` |

### Firebase boundary

All Firebase access flows through two seams — nothing else imports the SDK:

- `src/lib/firebase.ts` — the single client-SDK instance (app / Firestore / Auth), fully env-driven, with a startup connectivity probe.
- `src/lib/firebase-logger.ts` — structured, step-by-step console logging (`[GaitAI ⋅ Firebase]`) for every init, read, write and subscription, with error-code → plain-English hints.

---

## Project structure

```
GaitAI_Fr_Version1_Claude/
├── .github/workflows/
│   ├── deploy.yml                   # Pages deploy on push to main/master
│   └── deploy-pages.yml             # Pages deploy on push to frontend-v1
├── data/
│   └── posts.json                   # build-time post storage (seed content)
├── public/
│   ├── brand/                       # themed logos + founder portrait
│   ├── favicons/                    # 16 → 512 + apple-touch-icon
│   ├── uploads/                     # post attachments
│   └── manifest.webmanifest
├── scripts/
│   └── generate-firebase-config.mjs # emits gitignored public/firebase-config.js
│                                    # from env; doubles as fail-fast env check
├── src/
│   ├── app/                         # App Router — one folder per route
│   │   ├── layout.tsx               # root layout, metadata, fonts, providers
│   │   ├── page.tsx                 # landing page composition
│   │   ├── providers.tsx            # next-themes wrapper
│   │   ├── globals.css              # design tokens + custom utilities
│   │   ├── about/
│   │   ├── mobilitycare/
│   │   ├── securevision/
│   │   ├── products/
│   │   ├── use-cases/
│   │   ├── research/
│   │   ├── insights/                # newsroom feed (all posts, ordered)
│   │   ├── publications/            # explorer + [slug] detail w/ discussion
│   │   ├── admin-controlpanel/      # admin panel route (content + moderation)
│   │   └── legal/                   # privacy, terms, security, responsible-ai
│   ├── components/
│   │   ├── layout/                  # Navbar, Footer, ThemeToggle, PageTransition
│   │   ├── sections/                # landing-page sections (Hero … CTA)
│   │   ├── visuals/                 # code-rendered product mockups (SVG/Canvas)
│   │   ├── products/                # ProductCard, ProductGrid
│   │   ├── posts/                   # PostsList, PostCard, CategoryBadge
│   │   ├── comments/                # public discussion UI
│   │   │   ├── DiscussionMount.tsx  #   lazy client mount for post pages
│   │   │   ├── DiscussionSection.tsx#   orchestrator (live subscription)
│   │   │   ├── CommentForm.tsx / CommentItem.tsx
│   │   │   ├── LockedState.tsx      #   subscriber-only lock card
│   │   │   ├── Turnstile.tsx        #   optional CAPTCHA (off by default)
│   │   │   └── Toast.tsx
│   │   ├── admin/
│   │   │   ├── controlpanel/        # /admin-controlpanel views
│   │   │   │   ├── ControlPanel.tsx #   shell: sidebar, topbar, view switching
│   │   │   │   ├── OverviewView.tsx #   stats, content mix, attention panel
│   │   │   │   ├── ContentView.tsx  #   Content Studio: CRUD + live md preview
│   │   │   │   ├── CommentsView.tsx #   moderation queue + reports
│   │   │   │   └── ui.tsx           #   StatCard, EmptyState, Confirm, Toasts
│   │   │   └── (AdminDashboard, AdminLogin, PostEditor — legacy, unrouted)
│   │   ├── three/HeroScene.tsx      # R3F WebGL hero
│   │   └── ui/                      # Logo, SectionHeading, Reveal, …
│   ├── data/
│   │   ├── products.ts              # 23 products + 17 use cases + pipeline
│   │   ├── content.ts               # nav links + hero stats
│   │   └── publications.ts          # publications metadata
│   ├── lib/
│   │   ├── firebase.ts              # env-driven Firebase client (single instance)
│   │   ├── firebase-logger.ts       # step-by-step console diagnostics
│   │   ├── comments/                # comment domain logic
│   │   │   ├── types.ts             #   CommentDoc, ReportDoc, SubmitResult, …
│   │   │   ├── config.ts            #   limits, blocklist, collection paths
│   │   │   ├── service.ts           #   submit / subscribe / report / threading
│   │   │   ├── subscription.ts      #   subscriber gate (pluggable stub)
│   │   │   └── format.ts
│   │   ├── admin/
│   │   │   └── panel-store.ts       # PanelAdapter seam (local now, Firebase later)
│   │   ├── posts.ts / posts-store.ts# post types + build-time JSON persistence
│   │   ├── markdown.tsx             # in-house markdown renderer
│   │   ├── paths.ts                 # assetPath() basePath helper
│   │   ├── auth.ts                  # legacy cookie-auth helpers (unused in prod)
│   │   └── utils.ts                 # cn() — clsx + tailwind-merge
│   └── server-only/                 # ARCHIVED: old /admin route + REST API
├── firestore.rules                  # complete Firestore security rules (paste in console)
├── storage.rules                    # Insights media Storage rules (paste in console)
├── COMMENTS_SETUP.md                # comment-system setup guide
├── FIREBASE_SETUP_HANDOFF.txt       # backend-team Firebase configuration handoff
├── .env.example                     # env template (no real values — copy to .env.local)
├── next.config.mjs                  # static export, trailing slash, unoptimized images
├── tailwind.config.ts               # tokens + safelist for dynamic accent classes
└── package.json
```

---

## Routing & sitemap

```
/                        Home — hero, verticals, featured products, WatchCare flagship,
                              how it works, use cases, technology, research, vision, CTA.
/about                   Mission, founder story, journey, portfolio, audiences, values.
/mobilitycare            12-product grid + flagship blocks + clinical use cases.
/securevision            11-product grid + PrivacyGuard deep block + governance ribbon.
/products                All 23 products with cross-vertical category filters.
/use-cases               All 17 industries split by vertical, deep-linked anchors.
/research                Research hero, timeline, domains, AI pipeline, responsible AI.
/insights                Newsroom feed — every post, newest first.
/publications            Explorer — featured strip, filters, search.
/publications/[slug]     Post detail + moderated discussion thread (Firebase).
/admin-controlpanel      Admin Control Panel — content + comment moderation.
                              (noindex; auth temporarily disabled — see Security notes)
/legal/privacy|terms|security|responsible-ai    Legal stubs.
```

> No `/api/*` routes exist in production — the site is a static export. Dynamic behaviour (comments) goes straight from the browser to Firestore, guarded by `firestore.rules`.

---

## Firebase & the comment system

Publication pages carry an **admin-moderated discussion thread**. The full pipeline:

1. **Submit** — a visitor's comment is validated client-side (length, blocklist, 30s cooldown, duplicate fingerprints) and written in one atomic batch as `status: "pending"` to `pendingComments/{slug}/comments/{id}` **and** the flat mirror `pendingCommentQueue/{slug}__{id}`.
2. **Moderate** — an admin approves or rejects from the moderation queue. Approval copies the comment into `postComments/{slug}/comments/{id}` — the only public-readable collection.
3. **Render** — post pages hold a real-time `onSnapshot` subscription to approved comments and thread replies to a capped depth.
4. **Report** — readers can flag an approved comment into `reportedComments/{id}`.

**Enforcement lives in `firestore.rules`**, not the UI: the public may only *create validated pending docs* and *read approved docs*; only allow-listed admin accounts (verified Google sign-in) may read the queue, approve, reject, delete or manage reports. The rules file in the repo root is the complete, paste-into-console ruleset.

**Diagnostics:** every Firebase step logs to the console under `[GaitAI ⋅ Firebase]` — config load, app init, a connection probe (`✓ CONNECTION ESTABLISHED` / `✗ CONNECTION FAILED` with the Firestore error code and a plain-English fix), the 4-step submit pipeline, and live-subscription status. If comments misbehave, open DevTools and the logs tell you exactly which side is broken.

Optional hardening (pluggable, off by default): Cloudflare **Turnstile** CAPTCHA (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`) and a subscriber-only gate (`src/lib/comments/subscription.ts` stub).

---

## Admin Control Panel

`/admin-controlpanel` is the single place to run the site's content and community:

- **Overview** — stat cards (posts, pending queue, open reports, featured), latest content, per-category content mix, "needs your attention" shortcuts.
- **Content Studio** — search/filter/create/edit/delete every post shown on Insights & Publications, with category chips, tags, featured & subscriber-only toggles, publish date, and a **live markdown preview**.
- **Comments** — the moderation queue (approve / reject with animated feedback) and the reader-reports tab, with badge counts in the sidebar.

**Data seam:** the panel talks only to the `PanelAdapter` interface in `src/lib/admin/panel-store.ts`. Today a localStorage adapter (seeded from `data/posts.json` + sample moderation items) backs it, so the UI is fully usable with zero backend. Wiring Firebase means implementing `createFirebaseAdapter()` with the same interface and swapping one line — no UI changes.

**Auth is enforced** with verified Google sign-in against the same admin allowlist mirrored in `src/lib/comments/config.ts` and `firestore.rules`. Firestore remains the authoritative boundary for all control-panel reads and writes.

---

## Ask GaitAI — the movement-intelligence guide

A grounded assistant in the bottom-right corner of every route. It answers from
GaitAI's **own records** — the same typed data modules the pages render — and
links to the pages those records came from.

**Not a general chatbot.** `npm run build:knowledge` flattens `products.ts`,
`product-details*.ts`, `usecase-details.ts`, `publications.ts`, `evidence.ts`,
`insights.ts`, `gaitscape/graph.ts`, `trust.ts` and the `/legal` prose into
`functions/knowledge.json` — 113 records. Retrieval (BM25 + page awareness +
the canonical environment→module mapping) picks seven, and only those reach the
model. Rename a module and the assistant's answer changes with no edit to the
assistant; it cannot assert something the site does not, because it has nothing
else to read.

**The key is never in the browser.** The site is a static export on GitHub
Pages, so the model call lives in a Firebase Cloud Function in the existing
`gaitai-intelligence` project, with the credential in Secret Manager. The
browser is told one thing — the endpoint URL, which is not a secret. Set
`NEXT_PUBLIC_ASK_GAITAI_ENDPOINT` to enable it; leave it blank and the
assistant does not mount at all.

**Guardrails are quoted, not rewritten.** The system policy embeds
`notClaimed` from `trust.ts` and the `RESPONSIBLE_USE_*` statements from
`responsible-use.ts` verbatim, so the assistant cannot make a stronger claim
than `/legal/security/` or any module page does. No diagnosis, no invented
accuracy figures, no certification status, and research foundation is kept
distinct from product-specific validation.

Full architecture, deployment and testing: **`docs/ask-gaitai.md`**.

---

## Environment variables & secrets

**No credentials live in this repository.** All Firebase client config is env-driven.

| Variable | Required | Purpose |
| --- | :---: | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | ✅ | Firebase web app config |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | ✅ | Firebase web app config |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ✅ | Firebase web app config |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | ✅ | Firebase web app config |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | ✅ | Firebase web app config |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | ✅ | Firebase web app config |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | — | Enables the CAPTCHA gate when set |
| `ADMIN_PASSWORD` | — | Legacy admin password (unused in prod) |
| `NEXT_PUBLIC_ASK_GAITAI_ENDPOINT` | — | Ask GaitAI backend URL. A URL, not a secret — the model key lives in Secret Manager. Blank ⇒ the assistant does not mount. A GitHub Actions **variable**, not a secret |
| `LLM_API_KEY` | — | **Server only.** Anthropic key, in Google Secret Manager. Never in `.env*`, never in the bundle |
| `LLM_MODEL` | — | **Server only.** Model id for the assistant. Defaults to `claude-opus-5` |

- **Local:** `cp .env.example .env.local` and fill in the values. `.env.local` is gitignored (as is every `.env*` except the template).
- **CI:** the same six `NEXT_PUBLIC_FIREBASE_*` names must exist as **GitHub Actions repository secrets** (Repo → Settings → Secrets and variables → Actions). Both deploy workflows inject them at build time and **fail fast with a clear error if they're missing** (via the `predev`/`prebuild` guard script).
- Firebase web API keys are public client identifiers, not secrets — but they are still kept out of the repo and must be **referrer-restricted** in Google Cloud Console (see `FIREBASE_SETUP_HANDOFF.txt`).

---

## Getting started

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.example .env.local
# fill in the NEXT_PUBLIC_FIREBASE_* values (ask the backend team,
# or see FIREBASE_SETUP_HANDOFF.txt)

# 3. Run
npm run dev          # http://localhost:3000
```

> **Env changes require a dev-server restart** — Next.js reads `.env.local` only at startup.

To verify the Firebase connection, open any publication page with DevTools open and look for `✓ CONNECTION ESTABLISHED` under the `[GaitAI ⋅ Firebase]` log tag.

---

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Dev server with HMR (runs `predev` env check first) |
| `npm run build` | Static production export to `out/` (runs `prebuild` first) |
| `npm run start` | Serve a production build locally |
| `npm run lint` | ESLint (Next.js config) |
| `npm run build:knowledge` | Regenerates `functions/knowledge.json` — the Ask GaitAI corpus — from the site's data modules |
| `npm --prefix functions run test:retrieval` | Ask GaitAI acceptance suite. No API key, no network, no cost. Runs in CI |
| `npm --prefix functions run test:answers` | The same questions through the model. Needs a key |
| `predev` / `prebuild` | `scripts/generate-firebase-config.mjs` — validates the Firebase env vars (fail-fast) and emits the gitignored `public/firebase-config.js`; then rebuilds the Ask GaitAI corpus |

---

## Deployment (CI/CD)

The site deploys to **GitHub Pages** behind the custom domain **gaitai.in** via GitHub Actions:

| Workflow | Trigger | Notes |
| --- | --- | --- |
| `.github/workflows/deploy.yml` | push to `main` / `master` | builds, adds `.nojekyll` + `CNAME`, uploads `out/`, deploys |
| `.github/workflows/deploy-pages.yml` | push to `frontend-v1` | same pipeline for the active feature branch |

Both workflows read the Firebase config from **repository secrets** at the build step. A deploy with missing secrets fails immediately at `prebuild` rather than shipping a broken site.

Pre-launch checklist: rules published in Firebase console, Google provider enabled, authorized domains set (`gaitai.in`, `www.gaitai.in`, `localhost`), API key referrer-restricted, legal stubs replaced.

---

## Design system

A compact, opinionated palette around a single thesis: **deep obsidian + electric brand + neon glow**, extended with vertical-specific accents:

| Token | Hex | Role |
| --- | --- | --- |
| Obsidian | `#070B14` | Page background (dark) |
| Gunmetal | `#111827` | Card / surface |
| Royal Electric | `#2563FF` | Primary brand, SecureVision accent |
| Neon Violet | `#7C3AED` | Research accent, gradient mid |
| Ice Cyan | `#4FD1FF` | Glow accent, gradient end |
| Clinical Teal | `#0FA3B1` | MobilityCare accent |
| Warm Gold | `#D5A021` | WatchCare accent |
| Emerald | Tailwind `emerald-300/400` | Privacy / safety success state |

All color tokens are declared as **RGB triplets** in `globals.css` so every Tailwind utility composes with `/<alpha>` opacity modifiers (e.g. `bg-obsidian/80`). Dynamic accent classes are **safelisted** in `tailwind.config.ts` so the JIT scanner can't miss them in production.

Custom utilities: `btn-primary`, `btn-ghost`, `card`, `card-glow`, `glass`, `pill`, `text-gradient(-secure|-care)`, `ring-grid`, `noise`, `section`, `eyebrow`, plus gradient/mesh background images and a shared keyframe library.

Typography scale: `text-display-2xl` (hero) → `text-display-md` (sub-headings), all fluid via `clamp()`.

---

## Theming — dark & light

- **Dark by default** with a fully designed light mode via `next-themes` (`<html class="light">`).
- Every design token has a `:root.light` override — colors, surfaces, glass tints, shadows, grid lines and noise opacity all retune.
- `ThemeToggle` is hydration-safe with an animated sun/moon morph; `viewport.themeColor` is media-query-aware for mobile status bars.
- `<Logo />` swaps themed PNG artwork (`wordmark` / `icon` / `stacked` variants, three sizes, locked aspect ratios) with a mounted guard to prevent hydration flash.

---

## Navigation, transitions & animation

- **Navbar** — flat-tab desktop nav with active-route detection (`usePathname()`) and a `cyan → royal → violet` gradient hover underline; animated mobile drawer.
- **PageTransition** — route changes slide the outgoing page right while the incoming page enters from the left (850 ms expo-in-out), with a brand-gradient sweep. `prefers-reduced-motion` gets a 250 ms cross-fade.
- **Animation vocabulary** — `cubic-bezier(0.16, 1, 0.3, 1)` for reveals; the `Reveal` wrapper lets Server-Component pages opt sub-trees into `whileInView` fade-ups; `HowItWorks` draws its rail with `useScroll`; the WebGL hero is `dynamic({ ssr: false })` so 3D never blocks first paint.

---

## Code-rendered visuals

Every product moment is rendered as code (SVG + Canvas + Framer Motion) — crisp at any zoom, theme-aware, and animated live: `MobilityDashboardVisual`, `SecureOperationsVisual`, `SmartwatchVisual`, `ClinicalReportVisual`, `RunningTrailVisual`, `SkeletonOverlayVisual`, `CrowdHeatmapVisual`, `AIPipelineDiagram`, and the `JourneyTimeline` rail.

---

## Founder

**Dr. Anubha Parashar** — AI Research Scientist · Founder & CEO, GaitAI.

Ph.D. in Computer Science & Engineering (AI) from Manipal University Jaipur; doctoral research on gait recognition under occlusion, clothing variation and viewpoint changes. 10+ years across research, academia and industry. **Research output:** 50+ peer-reviewed publications · 6 patents · ~600 citations · 10+ keynotes. Full profile at `/about#founder` and [anubhaparashar.github.io](https://anubhaparashar.github.io/).

---

## Security notes

- **No secrets in the repo.** Firebase config is env-driven everywhere; `.gitignore` blocks all `.env*` (except the template), key files (`*.pem`, `*serviceAccount*.json`, …) and the generated `public/firebase-config.js`.
- **Firestore rules are the enforcement layer** — the UI is a convenience. Public writes are limited to validated pending comments/reports; moderation requires an allow-listed, verified Google account.
- **The Control Panel currently has no login** (temporary, clearly badged). Until auth is re-attached it runs on local sample data only — it must not be wired to live Firestore in this state.
- `/admin-controlpanel` is `noindex, nofollow`.
- The previously leaked API key must be referrer-restricted and/or regenerated — steps in `FIREBASE_SETUP_HANDOFF.txt` §D.

---

## Related docs

| File | What it covers |
| --- | --- |
| `COMMENTS_SETUP.md` | Comment-system architecture, collections, abuse protection, setup |
| `FIREBASE_SETUP_HANDOFF.txt` | Step-by-step Firebase configuration guide for the backend team + the exact values they must hand back |
| `firestore.rules` | The complete, paste-into-console Firestore security ruleset |
| `storage.rules` | Public-read/admin-write rules and file limits for Insights media |
| `docs/ask-gaitai.md` | Ask GaitAI: backend architecture, knowledge index, retrieval, guardrails, secrets, deployment, testing and cost |
| `src/server-only/README.md` | Why the legacy admin route + REST API are archived |

---

## Roadmap

### ✅ Shipped

- [x] Full marketing site — Home, About, MobilityCare, SecureVision, Products, Use Cases, Research, legal stubs
- [x] Publications explorer + detail pages, Insights newsroom feed
- [x] Static-export pipeline → GitHub Pages with custom domain + CI workflows
- [x] Firebase-backed moderated comment system with Firestore security rules
- [x] Step-by-step Firebase console diagnostics (`firebase-logger`)
- [x] Env-driven config end-to-end (`.env.local` + GitHub Actions secrets, fail-fast guard)
- [x] Admin Control Panel (`/admin-controlpanel`) — Overview, Content Studio (live markdown preview), Comments moderation — on a pluggable data adapter

### Near-term

- [ ] Wire the Control Panel's `PanelAdapter` to Firestore (posts collection + moderation collections)
- [ ] Re-enable panel authentication (Google sign-in against the rules allowlist)
- [ ] Regenerate + restrict the Firebase API key (post-leak hygiene)
- [ ] Enable Firebase App Check (reCAPTCHA v3) on the public comment write path
- [ ] `sitemap.xml` + `robots.txt` via Next.js metadata files
- [ ] Wire the CTA form to a CRM / inbox

### Mid-term

- [x] Firebase Storage media workflow for cover images, inline media and document attachments
- [ ] Post detail pages for priority products (`/products/[slug]`)
- [ ] Newsletter signup, case-studies module, per-industry landing pages
- [ ] MDX (or react-markdown + rehype) to replace the in-house renderer
- [ ] Analytics (privacy-aware) + consent banner

### Quality

- [ ] Playwright E2E for critical flows (submit comment, moderate, publish post)
- [ ] Lighthouse CI + axe-core accessibility audit in GitHub Actions
- [ ] Visual regression (Chromatic) and bundle-size tracking

---

## License

Proprietary © GaitAI. All rights reserved. Source code is not licensed for redistribution.

---

<div align="center">

Built with care for the GaitAI vision — _intelligence in motion._

</div>
