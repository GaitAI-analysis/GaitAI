# GaitAI Care website launch review

Reviewed 12–13 October 2026. Application source: GaitAI Care commit `d1247af`.

## Delivered website scope

- Standalone product landing route `/gaitai-care/` and Android information route `/gaitai-care/download/`.
- Products dropdown on desktop and mobile, product catalogue, homepage section after FeaturedProducts, Products footer group, global search and sitemap/Atlas.
- Contextual MobilityCare cross-link and Care Wiki application links.
- Styled with the shared GaitAI design system (Inter, Space Grotesk, `--ui-*` tokens, global buttons and cards) since 2026-10-14; it originally shipped a scoped Georama palette, now removed. See docs/design-system.md. Existing homepage hero code and movement module registry are unchanged.

## Claim evidence

| Website statement | Reviewed application source |
|---|---|
| Personal and family profiles with access controls | `web/profiles.js`, `api/profiles_api.py`, `api/security.py` |
| Document upload, original source and extraction review | `web/history.js`, `api/main.py`, `api/extraction.py`, `api/review_validation.py` |
| Medicines, supplements and actual-use records | `web/app.js`, `web/history.js`, `api/models.py`, `api/history_api.py` |
| Vaccination records and confirmed dates | `web/app.js`, `api/vaccination.py` |
| Illness, hospital and treatment history | `web/lifetime.js`, `api/lifetime_api.py`, `api/history_api.py` |
| Daily health and care records | `web/care.js`, `api/care_api.py` |
| PDF summaries and complete archive | `web/exports.js`, `api/export_api.py`, `api/export_pdf.py` |
| Email verification, expiring sessions, scoped permissions | `web/gaitai.js`, `api/email_verification.py`, `api/security.py` |
| Application encryption of originals and clinical text | `api/crypto.py`, `api/storage.py`, `web/privacy.html` |

Screenshots are the current application's document component rendered locally with its initial empty state, using `layout(docsView())`. No account, patient profile, fabricated medical data, production record, or generated application screen was used. All API calls were blocked during capture. Branding is copied from the application's existing icon.

## Android release gate — NOT published

Local artifact: `GaitAI-Care-1.0.0.apk`, package `in.gaitai.care`, version code 1, minimum SDK 24, target SDK 36.

- Exact size: 4,602,976 bytes (4.39 MiB).
- SHA-256: `84e2f871c288444695ddb4ff74636183d17a2f14fd1ccb9af6952c11254c5ddd`.
- Android SDK `apksigner verify --verbose --print-certs`: passed APK signature scheme v2. One RSA-4096 signer; certificate matches `docs/ANDROID.md` and the app's `assetlinks.json`.
- APK manifest: backup and cleartext traffic disabled; no debuggable flag.
- 487 ZIP entries inspected. No private key, environment, keystore, database, service-account file or searched credential pattern found. 25 shared web assets matched current source byte for byte. Packaged web images are brand/icon assets, with no patient attachments.
- This is a pattern-based artifact inspection, not a claim of exhaustive malware analysis.
- The original release report's approved APK digest was not found. The earlier Wiki release review records the same evidence gap. A fresh checksum does not substitute for that comparison.

The download page therefore states that download is unavailable, and no APK was copied into public assets, committed or published. `gaitaiCare.release.apk` remains null. No live-download hash comparison is possible until publication is authorised by passing the release evidence gate. The artifact's 4.6 MB size is compatible with the existing static export workflow; no new hosting service or billing is needed. A future approved file should use `/downloads/gaitai-care/GaitAI-Care-1.0.0.apk`, followed by a fresh live download and hash comparison.

## Production application checks

Both `https://care.gaitai.in/` and `https://gaitai-care-project.web.app/` load over trusted HTTPS. The custom domain is the primary CTA target. Browser checks verified login UI, registration UI and mandatory privacy consent; unauthenticated `/me` and `/patients` returned 401; invalid registration input returned 422; invalid login returned 401; an invalid verification token returned 400 and its fragment was removed from the browser address. No browser JavaScript errors occurred.

Successful production sign-in and delivered-email verification were **not** exercised: no approved test account/mailbox was supplied. No account was created or changed, and no medical records were accessed. Earlier application documentation describes historical emulator email-flow checks, but this review does not treat those as a new end-to-end result.

The existing product privacy notice is linked and identified as a pre-release draft. No separate product terms were found. The website terms link is explicitly labelled **Website terms**, and is not represented as the product's legal agreement.

## Website verification

- `npm run verify` passed: TypeScript, lint, data integrity, strict media validation, evidence tests and the existing assistant acceptance, ranking and paraphrase suites (267/267 phrasings).
- Production static build passed, including Wiki validation, data validation and media checks.
- Internal link check: 154 pages, 10,843 internal links and 155 distinct local assets; all resolved.
- Responsive browser suite: 161 checks passed at 1440×900, 1280×800, 768×1024 and 390×844, in both light and dark themes.
- Both product CTAs above the fold in all eight combinations; no horizontal overflow; images loaded; disclosures, catalogue, dropdown, mobile menu, search, footer and Wiki links worked.
- WCAG A/AA automated checks found no violations in the product main content at 1440px and 390px in both themes. This does not claim a complete accessibility certification.
- Products, MobilityCare, SecureVision, Blog, Archive, Wiki and Research were checked in a browser.
- These are desktop browser tests with responsive viewports, not physical Android-device tests.

Local evidence is stored under `tmp/care-launch/`; screenshots and result files are excluded from Git. The release scripts perform no backend, Supabase, signing-key, original ChildCare, paid-service or billing changes.
