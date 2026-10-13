# Search visibility — how gaitai.in is found, and how to keep it that way

This is the operating manual for organic search on the public site. It records
what is implemented, what the deploy pipeline checks on every push, the one
account step only the site owner can take, and the sustainable way to grow
rankings without buying anything.

No first-page ranking is promised anywhere in this document. What is promised
is that the site is technically correct for search engines and that every
public page says, in the words a buyer uses, what it is for.

---

## 1. What is implemented

### Indexing

| Surface | Where | Notes |
| --- | --- | --- |
| `robots.txt` | `src/app/robots.ts` | Allows everything except `/admin-controlpanel/`; advertises the sitemap. The private Wiki gate is **not** disallowed on purpose — a `noindex` tag only works if the crawler is allowed to read it. |
| `sitemap.xml` | `src/app/sitemap.ts` | Derived from `data/site-map.ts`; every URL ends in `/` to match `trailingSlash: true`. The Wiki is filtered out. ~80 URLs. |
| Canonicals | each `page.tsx` | Every public route declares its own, self-referencing, trailing slash. The root layout declares none (it would inherit into every page). |
| `noindex` | `insights/wiki/layout.tsx`, admin console, unsubscribe, overflow pagination | Nothing else may be `noindex`; `scripts/check-seo.mjs` fails the deploy if a public route becomes one. |
| Verification | `src/app/layout.tsx` → `metadata.verification.google` | Rendered only when the `GOOGLE_SITE_VERIFICATION` repository variable is set (section 3). |

### Titles, descriptions, social cards

`src/lib/seo.ts` is the one place for the site URL, the social-card images and
the `socialCard()` helper. Every primary route builds its own Open Graph and
Twitter block from its title, description and canonical path — before this,
`/securevision/`, `/mobilitycare/`, `/products/` and `/use-cases/` inherited
the root layout's card and were shared as "GaitAI — Intelligence in Motion"
with `og:url` pointing at the home page.

Titles name the capability in the searcher's words first and the product
second: "SecureVision — AI CCTV Video Analytics for Security Monitoring",
"MobilityCare — AI Gait Analysis & Clinical Mobility Assessment", "GaitAI Care
— Personal Health Record App for You and Your Family". Module and use-case
titles are generated from the registry; `searchTitle()` strips the trailing
full stop a page headline carries so no `<title>` ends in `. | GaitAI`.

Social cards are 1200×630 JPEGs in `public/brand/og/`, rendered from the
hero stills the pages already use (home, SecureVision, MobilityCare, Products,
Use Cases). GaitAI Care uses its own app screenshot. The default card replaces
the 1254×1254 logo PNG, which cropped badly in every preview and weighed
580 KB.

### Structured data (JSON-LD)

All of it is built from the same records the page renders. **Nothing is
asserted that this repository does not document**: no ratings, reviews,
prices, offers, certifications, customers, clinical approvals or people.
`check-seo.mjs` fails the build if `aggregateRating`, `review`, `offers`,
`hasCredential` or `award` appears in any block.

| Route | Nodes |
| --- | --- |
| every page (root layout) | `Organization` (`@id` `https://gaitai.in/#organization`, role mailboxes, public profiles) + `WebSite` |
| every page except home (location trail) | `BreadcrumbList` from `data/site-map.ts` |
| `/securevision/`, `/mobilitycare/` | `Service` (provider → Organization, `hasPart` = the 12 module `Product`s) + `ItemList` of module pages |
| `/securevision/[slug]/`, `/mobilitycare/[slug]/` | `Product` with the documented outputs as `additionalProperty` |
| `/gaitai-care/` | `SoftwareApplication` (HealthApplication; Web + Android; version; feature list from the page; privacy notice) |
| `/insights/[slug]/` | `BlogPosting` with Organization author/publisher (pre-existing) |

Validate any page at <https://validator.schema.org/> or
<https://search.google.com/test/rich-results> by pasting its URL.

### Content

Each product family page carries an "In plain terms" section
(`src/components/sections/InPlainTerms.tsx`): the everyday name for each
capability — *AI CCTV video analytics*, *crowd analytics*, *anomaly detection
and security monitoring*, *authorised forensic gait analysis*; *AI gait
analysis from video*, *physiotherapy gait assessment and rehabilitation
progress*, *elderly mobility monitoring and fall-risk screening*,
*neurological, paediatric and prosthetic gait monitoring* — with one honest
paragraph paraphrasing the module descriptions in `data/products.ts`, and links
to the modules and environment pages that back it. Module and environment names
are resolved from the registry, never typed. The GaitAI Care page has the same
in its own design system ("What GaitAI Care is").

These sections are also the pages' internal map: every capability links down
to module pages and across to use-case pages, which link back up to the family
pages and to each other.

### Checks on every deploy (`.github/workflows/deploy.yml`)

After `npm run build`:

- `npm run check:seo` — `scripts/check-seo.mjs`: one `<title>` (unique,
  10–70 chars), one description (unique, 50–320), self-referencing canonical,
  `og:url` = canonical, `og:image` present and in the export, exactly one
  `<h1>`, parseable JSON-LD with no invented claims, `noindex` only where
  allowed, Wiki and admin console absent from the sitemap. `--report` prints
  every route's title and description.
- `npm run check:links` — every internal href resolves to a file in `out/`.
- `npm run check:wiki:private` — the private Wiki boundary (pre-existing).

Run them locally the same way after `npm run build`.

---

## 2. What is deliberately not done

- **No landing-page farm.** The existing pages answer the important intents
  once titled and explained properly; the module and use-case pages already
  cover the long tail (24 modules × 18 environments). New pages are added only
  when a real intent has no good answer — see section 5.
- **No `Disallow: /insights/wiki/`.** The gate pages are `noindex, nofollow`;
  blocking them in robots.txt would stop Google from ever seeing that tag.
- **No `keywords` removal.** The root layout's `keywords` meta is ignored by
  Google and harmless; it stays.
- **No change to the hero, navigation, footer or any product.** The Wiki links
  in the Blog menu and footer point at the private origin by design and are
  pinned by `scripts/test-wiki-private.ts`.
- **No paid tooling.** Everything here runs on the free tier of nothing:
  Node, headless Chromium, Search Console, Bing Webmaster Tools, IndexNow.

---

## 3. Google Search Console — the one step only the owner can take

Nothing in this repository can prove ownership of gaitai.in to Google; that
needs the owner's Google account. **The single step:**

1. Sign in to <https://search.google.com/search-console> with the account that
   should own the property (a role account for GaitAI, not a personal one if
   possible).
2. **Add property → Domain** → `gaitai.in`. Google shows a TXT record like
   `google-site-verification=XXXX`.
3. In the Hostinger DNS panel (the domain's nameservers are
   `*.dns-parking.com`, i.e. Hostinger), add a **TXT** record on `@` with that
   value. Keep the existing SPF TXT record. Wait a few minutes, then click
   **Verify**.

Why the Domain property: it covers `https://gaitai.in`, `http://`, `www.` and
`care.gaitai.in` in one place, survives redeploys, and does not depend on the
page source.

Alternative (no DNS access): **URL-prefix property** → `https://gaitai.in/` →
**HTML tag** method → copy only the token (the `content="…"` value) → in the
GitHub repository: *Settings → Secrets and variables → Actions → Variables →
New repository variable* `GOOGLE_SITE_VERIFICATION` = token → re-run the
Deploy workflow → click Verify. The layout renders the tag only when the
variable is set.

Once verified:

- **Sitemaps** → add `https://gaitai.in/sitemap.xml`.
- **URL Inspection** → paste each priority URL → **Request indexing**:
  `/`, `/products/`, `/securevision/`, `/mobilitycare/`, `/gaitai-care/`,
  `/use-cases/`, `/mobilitycare/walkscan/`, `/mobilitycare/fallrisk/`,
  `/securevision/crowdsense/`, `/securevision/suspiciousmotion/`,
  `/use-cases/physiotherapy-clinics/`, `/use-cases/elderly-care-centers/`,
  `/use-cases/airports-metro-rail/`. (Google allows roughly a dozen requests
  a day per property.)
- **Pages** report → check for "Excluded by noindex" (should be only the Wiki
  gates, admin and unsubscribe) and "Duplicate without user-selected
  canonical" (should be none).
- **Performance** → after two to four weeks, the queries and pages that
  actually get impressions. That report, not guesswork, drives section 5.

**Bing** (free, 20–30 % of desktop search in several markets): sign in to
<https://www.bing.com/webmasters>, choose *Import from Google Search Console*,
done. Then `npm run seo:indexnow` after each content deploy tells Bing (and
Yandex, Seznam, Naver) exactly which URLs changed; the key file is
`public/<32 hex>.txt` and is part of the deploy.

---

## 4. Measuring

- **Search Console → Performance**: impressions, clicks, average position per
  query and per page. The honest ranking signal.
- **Lighthouse** (free, in Chrome DevTools or `npx lighthouse`): mobile
  performance, accessibility, SEO. Run against the live URL with a cold cache.
  The home page's HTML is large (~670 KB, half of it the React Server
  Components payload and inline SVG) — this is a known cost of the interactive
  home page, not a crawl blocker, but it is the first thing to look at if
  mobile performance scores drop.
- `npm run check:seo -- --report` after a build: the title/description table
  for every route, for review in one glance.

---

## 5. Growing rankings sustainably (what to do next)

In order of expected return:

1. **Verify Search Console and submit the sitemap** (section 3). Until then
   nothing can be measured and Google indexes on its own schedule.
2. **Earn the first external links.** A new domain with zero referring
   domains ranks for its brand and little else. The cheapest credible links:
   the publisher pages of the eight papers and the patent (each can link back
   to `/publications/<id>/`), conference talk listings, university lab pages,
   the Play Store listing when GaitAI Care ships there, LinkedIn company page,
   GitHub organisation profile, Crunchbase/startup directories.
3. **One article per target intent, in the Blog**, answering the question a
   searcher actually has — "how does video gait analysis work?", "what is
   fall-risk screening?", "what can CCTV analytics detect without facial
   recognition?", "how to organise family medical records". Link each from
   the matching "In plain terms" entry. Articles already get `BlogPosting`
   markup and sitemap entries for free.
4. **Watch Performance for queries at positions 8–20** — the ones a better
   title or a paragraph of content can move onto page one — and adjust the
   page they land on. Never add a page for a query a page already ranks for.
5. **Revisit titles quarterly** against what people actually searched; the
   `check:seo` report makes the current state visible in one command.
6. **Keep the premium UI; grow the text.** Google reads server-rendered
   HTML. Every page here is statically exported with its full content, so
   the constraint is only how much the page says, never whether a crawler
   can see it.

Things that will not help and should not be done: buying links, keyword
stuffing, creating per-city or per-keyword pages, "AI content" at volume,
schema that claims ratings or reviews the site does not have.
