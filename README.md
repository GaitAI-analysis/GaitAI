<div align="center">

<img src="public/brand/logo-main.png" alt="GaitAI" width="160" />

# GaitAI — Intelligence in Motion

**A research-led AI platform for movement intelligence — security, healthcare, elderly care and smart environments.**

[![Next.js](https://img.shields.io/badge/Next.js-14.2-000?logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-11-FF0080?logo=framer&logoColor=white)](https://www.framer.com/motion/)
[![Three.js](https://img.shields.io/badge/Three.js-r169-000?logo=three.js&logoColor=white)](https://threejs.org)
[![License: Proprietary](https://img.shields.io/badge/license-proprietary-111827)](#license)

</div>

---

## Table of contents

1. [Overview](#overview)
2. [Tech stack](#tech-stack)
3. [Frontend architecture](#frontend-architecture)
4. [Project structure](#project-structure)
5. [Design system](#design-system)
6. [Theming — dark & light](#theming--dark--light)
7. [Animations & page transitions](#animations--page-transitions)
8. [Brand assets & favicons](#brand-assets--favicons)
9. [Content modules — Publications & Admin](#content-modules--publications--admin)
10. [API reference](#api-reference)
11. [Getting started](#getting-started)
12. [Environment variables](#environment-variables)
13. [Scripts](#scripts)
14. [Accessibility & performance](#accessibility--performance)
15. [Deployment](#deployment)
16. [Roadmap & future scope](#roadmap--future-scope)
17. [License](#license)

---

## Overview

GaitAI is a production-grade marketing and publication platform for the **GaitAI** brand — the movement-intelligence company building two flagship verticals:

| Vertical | Focus |
| --- | --- |
| **GaitAI Secure** | Gait-based biometrics, suspicious-movement detection, airport & high-security analytics, crowd flow modeling. |
| **GaitAI Care** | Elderly fall-risk prediction, neurological screening, post-op rehab analytics, in-home wellness monitoring. |

The site is engineered to feel comparable to globally recognized premium tech brands: a cinematic WebGL hero, scroll-driven storytelling, glassmorphism, gradient meshes, micro-interactions, a fully theme-aware brand mark, and a route-level slide transition that turns navigation itself into part of the brand experience.

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | **Next.js 14** (App Router, RSC, Edge-ready) |
| Language | **TypeScript 5.6** (strict) |
| Styling | **Tailwind CSS 3.4** + custom design tokens |
| Motion | **Framer Motion 11**, **GSAP 3.12** (available for scroll choreography) |
| 3D | **Three.js r169** via **@react-three/fiber** + **@react-three/drei** |
| Icons | **lucide-react** |
| Theming | **next-themes** (dark default, light supported) |
| Fonts | **Space Grotesk** (display), **Inter** (body), **JetBrains Mono** (mono) |
| Utilities | **clsx**, **tailwind-merge** |
| Tooling | ESLint, PostCSS, Autoprefixer |

> **Runtime:** Node 18.18+ (Node 22 LTS recommended).

---

## Frontend architecture

### Rendering model

The site uses Next.js **App Router** with a Server-Components-first model:

- **Server Components** for everything that doesn't need interactivity — landing-page sections, post lists, post detail pages, layout shell, metadata. This minimizes JavaScript shipped to the browser.
- **Client Components** (`"use client"`) are surgically scoped to interactive units: `Navbar`, `ThemeToggle`, `Logo` (theme-aware), `PageTransition`, `PostsList` (filter/search), `HeroScene` (WebGL), the admin dashboard, and the contact form.

### Composition

```
RootLayout (server)
  └─ Providers (client) ──── next-themes ThemeProvider
       └─ Navbar (client)        ←— sticky, glassmorphic, mobile drawer
       └─ <main>
            └─ PageTransition (client)
                  └─ {route children}   ←— Hero, Publications, Admin…
       └─ Footer (server)
```

`PageTransition` is keyed off `usePathname()`, so every navigation through `<Link>` triggers a cinematic slide without touching the navbar or footer.

### State strategy

- **No global store.** The site is stateless at the page level — content is sourced from server components, `src/data/content.ts`, or `data/posts.json` (via `src/lib/posts.ts`).
- **Local state only** for ephemeral UI (open/closed drawers, hover, form fields). Kept in `useState` co-located with each component.
- **Theme** is the only truly global concern — handled via `next-themes` and reflected in CSS variables in `globals.css`.

### Data layer

- Marketing copy, feature lists, nav links, and stats live in **`src/data/content.ts`** as typed exports — a single source of truth.
- Posts are persisted to **`data/posts.json`** (dev-friendly) through `src/lib/posts.ts`. This is intentionally a thin abstraction so the storage backend can be swapped (Supabase, Sanity, Postgres, Notion, Firestore) without touching UI code.
- File uploads land in **`public/uploads/`** during local dev.

### Routing

```
/                       → landing page (Hero → Marquee → Verticals → How it works
                          → Use cases → Tech stack → Vision → CTA)
/publications           → public posts index (featured + grid + search/filter)
/publications/[slug]    → post detail page with custom markdown renderer
/admin                  → password-gated dashboard for posts CRUD
/api/posts              → REST: list / create
/api/posts/[id]         → REST: read / update / delete
/api/upload             → REST: attachment upload
/api/auth               → REST: login (cookie) / logout
```

### Type safety

`tsc --noEmit` runs clean. Strict mode is enabled. Path alias `@/*` resolves to `src/*` (see `tsconfig.json`).

---

## Project structure

```
GaitAI_Fr_Version1_Claude/
├── data/
│   └── posts.json                  # dev-mode post storage
├── public/
│   ├── brand/                      # themed logo artwork (dark/light variants)
│   │   ├── logo-horizontal-dark.png
│   │   ├── logo-horizontal-transparent.png
│   │   ├── icon-mark.png
│   │   ├── icon-mark-dark.png
│   │   ├── logo-dark.png
│   │   ├── logo-light.png
│   │   ├── logo-main.png
│   │   └── icon-app.png
│   ├── favicons/                   # 16 → 512 + apple-touch-icon
│   ├── uploads/                    # post attachments (dev)
│   ├── favicon.ico
│   └── manifest.webmanifest        # PWA manifest
├── src/
│   ├── Assets/                     # original raster sources (kept for reference)
│   ├── app/
│   │   ├── layout.tsx              # root layout, metadata, fonts, providers
│   │   ├── page.tsx                # landing page composition
│   │   ├── providers.tsx           # next-themes wrapper
│   │   ├── globals.css             # design tokens + custom utilities
│   │   ├── publications/
│   │   │   ├── page.tsx            # posts index
│   │   │   └── [slug]/page.tsx     # post detail
│   │   ├── admin/page.tsx          # admin gate + dashboard
│   │   └── api/                    # REST routes (posts, upload, auth)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx          # glassmorphic sticky nav + mobile drawer
│   │   │   ├── Footer.tsx          # 3-column footer w/ social
│   │   │   ├── ThemeToggle.tsx     # animated sun/moon switcher
│   │   │   └── PageTransition.tsx  # framer-motion route transitions
│   │   ├── sections/               # landing-page sections
│   │   │   ├── Hero.tsx
│   │   │   ├── PartnerMarquee.tsx
│   │   │   ├── Verticals.tsx       # GaitAI Secure + GaitAI Care
│   │   │   ├── HowItWorks.tsx      # scroll-driven 4-stage pipeline
│   │   │   ├── UseCases.tsx
│   │   │   ├── TechStack.tsx
│   │   │   ├── Vision.tsx
│   │   │   └── CTA.tsx             # demo-request form
│   │   ├── posts/
│   │   │   ├── PostsList.tsx       # client filter/search
│   │   │   ├── PostCard.tsx
│   │   │   └── CategoryBadge.tsx
│   │   ├── admin/
│   │   │   ├── AdminLogin.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   └── PostEditor.tsx
│   │   ├── three/
│   │   │   └── HeroScene.tsx       # R3F: 5-figure gait, particles, rings
│   │   └── ui/
│   │       ├── Logo.tsx            # theme-aware brand mark
│   │       ├── SectionHeading.tsx
│   │       └── VerticalVisual.tsx  # canvas waveform + SVG radar pulse
│   ├── data/
│   │   └── content.ts              # all marketing copy / nav / stats
│   └── lib/
│       ├── utils.ts                # cn() — clsx + tailwind-merge
│       ├── posts.ts                # post CRUD facade
│       ├── posts-store.ts          # JSON-file persistence (swappable)
│       ├── auth.ts                 # cookie auth helpers
│       └── markdown.tsx            # tiny in-house markdown renderer
├── tailwind.config.ts
├── next.config.mjs
├── tsconfig.json
└── package.json
```

---

## Design system

A compact, opinionated palette built around a single thesis: **deep obsidian + electric brand + neon glow**.

| Token | Hex | Role |
| --- | --- | --- |
| Obsidian | `#070B14` | Page background (dark) |
| Gunmetal | `#111827` | Card / surface |
| Royal Electric | `#2563FF` | Primary brand, CTA gradient start |
| Neon Violet | `#7C3AED` | Care vertical accent, gradient mid |
| Ice Cyan | `#4FD1FF` | Glow accent, gradient end |
| Soft White | `#F8FAFC` | Body & display text |
| Soft Gray | `#CBD5E1` | Secondary text |
| Soft Mute | `#94A3B8` | Tertiary / muted text |

All color tokens are declared as **RGB triplets** in `globals.css` (`--c-obsidian: 7 11 20;`) so every Tailwind utility composes with `/<alpha>` opacity modifiers (e.g. `bg-obsidian/80`).

### Custom utilities (in `globals.css`)

`btn-primary`, `btn-ghost`, `card`, `card-glow`, `glass`, `pill`, `text-gradient`, `ring-grid`, `noise`, `mask-fade-r`, `section`, `eyebrow`, `stat-num`, plus a library of background images (`gradient-brand`, `gradient-secure`, `gradient-care`, `gradient-mesh`, `radial-glow`, `grid-pattern`) and keyframes (`fade-up`, `pulse-glow`, `marquee`, `scan-line`, `float`, `shimmer`, `spin-slow`).

### Typography scale

| Class | Clamp | Use |
| --- | --- | --- |
| `text-display-2xl` | `3rem → 6.25rem` | Hero headlines |
| `text-display-xl` | `2.5rem → 4.5rem` | Section heroes |
| `text-display-lg` | `2rem → 3.25rem` | Section headings |
| `text-display-md` | `1.5rem → 2.25rem` | Sub-headings |

---

## Theming — dark & light

The platform ships **dark by default** with a fully designed light mode.

- `next-themes` toggles `<html class="light">`; the absence of `.light` means dark.
- Every design token has a `:root.light` override in `globals.css` — colors, surfaces, glass tints, shadows, divider gradients, grid lines, and noise opacity all retune for the light palette.
- `ThemeToggle` is a hydration-safe client component with an animated sun/moon morph.
- `viewport.themeColor` is media-query-aware, so the iOS/Android status bar tints to `#F6F8FC` in light and `#070B14` in dark automatically.

### Theme-aware brand mark

`<Logo />` (in `src/components/ui/Logo.tsx`) is the canonical brand wrapper. It swaps PNG art between dark and light variants via `useTheme().resolvedTheme` with a mounted guard to prevent hydration flash. Three variants:

| Variant | Use |
| --- | --- |
| `wordmark` | Navbar / footer — horizontal lockup |
| `icon` | Compact placements — just the G + walker mark |
| `stacked` | Hero / press kits — full vertical lockup w/ tagline |

Each variant has `sm`, `md`, `lg` sizes with locked aspect ratios so layout never reflows.

---

## Animations & page transitions

### Page transitions

`PageTransition` (in `src/components/layout/PageTransition.tsx`) wraps `{children}` inside `<main>`. It is the heart of the navigation experience:

- Keyed off `usePathname()` so every route change fires it.
- Uses `AnimatePresence mode="popLayout"` so the outgoing route slides **right while the incoming route enters from the left simultaneously** — not sequentially.
- Animates `transform` + `opacity` + `filter` only — GPU-composited, no layout thrash.
- Eased with `cubic-bezier(0.83, 0, 0.17, 1)` (expo-in-out) over **850 ms** — fast launch, smooth landing.
- A delicate **brand-gradient sweep** (cyan → royal → violet) plus a **hair-thin glowing leading edge** streak across the viewport in lockstep, giving the navigation a cinematic "reveal" beat.
- **`prefers-reduced-motion`** is honored — affected users get a quick 250 ms cross-fade instead.

Navbar and Footer sit **outside** the transition wrapper, so they stay rock-solid while the page content slides between them.

### Section-level motion

- Framer Motion `useInView` for fade-up reveals on scroll.
- Scroll-progress indicator on the **How it works** rail tracks the active stage.
- Hover micro-interactions on cards (glow, ring-tint, scale).
- `PartnerMarquee` runs an infinite seamless `marquee` keyframe.

### Hero WebGL

`HeroScene.tsx` is loaded with `dynamic({ ssr: false })`. It renders a parallax-tracked stick-figure gait sequence in R3F with a particle field and motion rings — completely GPU-driven, isolated from the first paint.

---

## Brand assets & favicons

Brand artwork lives in `public/brand/` and was generated from the originals in `src/Assets/`:

- **Themed logos** — cream-on-transparent (dark theme) and navy-on-transparent (light theme) variants for both horizontal wordmark and square icon mark.
- **Full lockups** — themed PNGs with tagline, used in the footer and OG/Twitter share cards.

Favicons in `public/favicons/` cover **16, 32, 64, 128, 256, 512** plus `.ico` and `apple-touch-icon.png`. `manifest.webmanifest` declares the app for PWA installs.

All assets are wired through Next.js `metadata.icons` in `src/app/layout.tsx`.

---

## Content modules — Publications & Admin

### `/publications` — public newsroom

A premium publication index supporting:

- Featured post strip + category-tinted post cards.
- Six categories: **Research · Announcements · Documentation · Approvals · Blog · Demos**.
- Live filters + full-text search (client-side).
- `/publications/[slug]` detail page with a custom in-house markdown renderer (`src/lib/markdown.tsx`) supporting `## / ###` headings, `**bold**`, `*italic*`, `` `code` ``, fenced code blocks, bullets, numbered lists, blockquotes, horizontal rules, and `[text](url)` links.
- Attachment download button (PDFs, etc.) and external-link cards.
- Related-posts strip + sticky sidebar with author, date and CTA.

### `/admin` — password-protected dashboard

Mobile-friendly content management:

- Password gate (`ADMIN_PASSWORD`, defaults to `gaitai-admin`).
- Cookie-based auth (`httpOnly`, `sameSite=strict`).
- Post list with search, edit and delete.
- Full editor — title, category, summary, markdown body, tags, attachment upload (up to 25 MB), external URL, author, publish date, featured toggle.
- Delete confirmation modal.
- Phone-publish ready.

### Storage (swappable)

Posts persist to `data/posts.json` and uploads to `public/uploads/`. This is intentional for local dev and self-hosted Node. Production deploys (Vercel, etc.) should swap `src/lib/posts-store.ts` for a hosted DB — UI, auth and routes will keep working without changes.

---

## API reference

| Method | Route | Auth | Description |
| --- | --- | :---: | --- |
| `GET` | `/api/posts` | — | List all posts |
| `POST` | `/api/posts` | yes | Create post |
| `GET` | `/api/posts/[id]` | — | Read one |
| `PUT` | `/api/posts/[id]` | yes | Update |
| `DELETE` | `/api/posts/[id]` | yes | Delete |
| `POST` | `/api/upload` | yes | Upload attachment |
| `POST` | `/api/auth` | — | Login (sets cookie) |
| `DELETE` | `/api/auth` | — | Logout |

---

## Getting started

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.example .env.local
# then edit ADMIN_PASSWORD inside .env.local

# 3. Run
npm run dev          # http://localhost:3000
npm run build        # production build
npm run start        # serve production build
npm run lint         # ESLint pass
```

Requires Node 18.18+ (Node 22 LTS recommended).

---

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `ADMIN_PASSWORD` | `gaitai-admin` | Required to sign in to `/admin` |

Copy `.env.example` to `.env.local` and override before deploying.

---

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start Next.js dev server with HMR |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint (Next.js config) |

---

## Accessibility & performance

- Semantic landmarks throughout (`header`, `main`, `nav`, `footer`, `section`, `article`).
- `prefers-reduced-motion` respected by the page transition and decorative animations.
- WebGL Hero scene is `dynamic({ ssr: false })` so first paint is never blocked by the 3D bundle.
- Fonts loaded via `next/font` with `display: swap`.
- Images via `next/image` with AVIF/WebP formats configured in `next.config.mjs`.
- Anchor links land below the fixed nav via `scroll-padding-top`.
- All animations use transform/opacity/filter — GPU-composited, layout-stable.
- TypeScript strict + `tsc --noEmit` passes with zero errors.

---

## Deployment

Recommended host: **Vercel** (one-click for Next.js App Router).

Before going to production:

1. Set `ADMIN_PASSWORD` to a strong, unique value in the host's env settings.
2. **Swap the posts storage** in `src/lib/posts-store.ts` from JSON-file to a hosted DB (Vercel's filesystem is read-only at runtime). Recommended: **Supabase** or **Postgres** for relational, **Sanity** for headless CMS, **Firestore** for low-ops NoSQL.
3. Verify Open Graph and Twitter card preview with the production URL.
4. Confirm favicons and the `manifest.webmanifest` are reachable.

---

## Roadmap & future scope

A pragmatic punch-list of what's queued — organized by priority.

### Near-term — polish & production readiness

- [ ] Replace JSON-file post storage in `src/lib/posts-store.ts` with a hosted DB (Supabase/Postgres recommended).
- [ ] Migrate file uploads from local `public/uploads/` to S3 / Cloudflare R2 / Vercel Blob.
- [ ] Harden admin auth — move from cookie-password to **NextAuth / Auth.js** with magic-link or OAuth (Google Workspace SSO for the team).
- [ ] Add **rate limiting** on `/api/auth` and `/api/upload` (Vercel KV / Upstash).
- [ ] Replace the in-house markdown renderer with **MDX** or **react-markdown + rehype** so posts can embed React components.
- [ ] Real partner logos in `PartnerMarquee` (currently a capabilities marquee).
- [ ] Add **sitemap.xml** and **robots.txt** via Next.js metadata files.

### Mid-term — features

- [ ] **Demo-request form (CTA)** — wire to HubSpot / Salesforce / Notion or an internal CRM endpoint with email notifications.
- [ ] **Newsletter signup** — Convertkit / Beehiiv / Mailchimp integration with double-opt-in.
- [ ] **Case studies** module (similar to publications, with hero imagery, metrics, customer quotes).
- [ ] **Careers** page with JD listings (Greenhouse / Ashby integration).
- [ ] **Search across publications** — full-text via Algolia or built-in Postgres FTS.
- [ ] **i18n** — `next-intl` with English first, then targeted regions (likely EN-IN, EN-US, ES).
- [ ] **Analytics** — Vercel Analytics + PostHog for product/event tracking; consent banner for EU users.
- [ ] **A/B testing** harness for hero copy and CTA variants (PostHog / GrowthBook).
- [ ] **Press kit** download zip generated server-side from `/brand/*`.

### Long-term — platform

- [ ] **Product app shell** — gated `/app` route hosting customer dashboards (likely a separate Next.js app or a separate route group with its own auth context).
- [ ] **Documentation site** at `/docs` — built on **Nextra** or **Fumadocs** for SDK + API reference.
- [ ] **Status page** at `/status` — uptime, incident history (BetterStack / Statuspage embed).
- [ ] **Customer testimonials** carousel with video.
- [ ] **3D product explainer** — extend the R3F hero into an interactive "scroll through the gait pipeline" experience.
- [ ] **Live demo** — WebRTC-based pose-estimation demo in-browser using TensorFlow.js / MediaPipe.
- [ ] **CMS migration** to a headless CMS (Sanity or Contentful) so non-engineers can publish without `/admin`.

### Quality & testing

- [ ] **Visual regression** with Playwright + Chromatic.
- [ ] **E2E test suite** for critical flows (admin login, publish post, request demo).
- [ ] **Lighthouse CI** in GitHub Actions — fail PRs that regress LCP / CLS / TBT.
- [ ] **Accessibility audit** with axe-core in CI.
- [ ] **Bundle analyzer** in CI to catch dependency bloat.
- [ ] **OG image generation** — dynamic `@vercel/og` route per publication.

### Brand & design

- [ ] Light-theme refinement pass — currently functional, can be more luxurious.
- [ ] Custom illustration set for the Verticals section (replacing iconography).
- [ ] Motion-design pass on `HowItWorks` — Lottie-style animated stages.
- [ ] Dark/light **brand video** for the hero, served via `<video poster>` with WebGL fallback.

---

## License

Proprietary © GaitAI. All rights reserved. Source code is not licensed for redistribution.

---

<div align="center">

Built with care for the GaitAI vision — _intelligence in motion._

</div>
