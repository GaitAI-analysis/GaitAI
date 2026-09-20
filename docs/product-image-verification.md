# Product imagery verification

All **24/24 products** now have card, dark-hero and light-hero mappings. Product names, copy, canonical order, routes and page/card structure remain unchanged. The existing ten dedicated sets are retained.

[The assignment report](product-image-assignments.md) lists all 24 products with every exact source filename, role and semantic exception. `product-image-manifest.json` is the source of truth.

## Coverage

- Cards: **24/24**, with **24 distinct card source photographs**.
- Dark heroes: **24/24**.
- Light heroes: **24/24**.
- Primary role assignments: **72/72**, from **63 distinct source photographs**.
- Dedicated product sets: **21/24**; documented closest-fit shared sets: **3/24**.
- Missing rendered roles: **0**; absent dedicated roles: **9**, individually recorded in `missingDedicatedAssets`.
- Encoded files: **288**, including responsive derivatives; **261 unique encoded contents** because shared source/size pairs intentionally repeat.

ForensicSearch uses terminal camera viewpoints shared with ReID; AccessMotion uses atrium/entrance flow shared with PrivacyGuard and EventShield; Watchlist uses highlighted terminal movement shared with SuspiciousMotion. These are contextual matches, not dedicated feature illustrations. PrivacyGuard imagery is also contextual and does not establish anonymization. None of these notes change product copy.

DefenceMotion has clean N044/N045/N046 dark/light/card images. The earlier F074 poster is excluded and its warning remains in historical provenance. Army/Navy/Air Force remain modes of one product.

## Checks completed

- Nested-folder audit: **46 files**, **9 duplicate extra copies**, **4 collages**, **33 unique standalone photographs** in 11 dedicated sets. All unique standalone photographs are used.
- Combined source audit: **138 files**, all filenames and SHA-256 hashes checked; existing 92-file metadata rechecked and preserved. All ten similarity candidate pairs retain visual reviews. Historical manifest hashes pass.
- `npm run check:product-images -- --require-complete`: passed for 72 assignments and 288 responsive files; checks canonical order, ownership, declared sharing, distinct cards, case-sensitive URLs, hashes, dimensions and srcsets.
- Every WebP decoded successfully with its recorded dimensions; no master was upscaled.
- Negative selection checks reject undeclared sharing, wrong ownership, duplicate-export substitution, the excluded poster and dark/light reversal.
- `npm run verify`: passed, including type checking, `npm run lint` with no lint warnings/errors, strict media checks, 24 evidence modules, retrieval/ranking and **267/267** paraphrases. The existing Watchlist environment-association warning remains.
- `npm run build`: passed before browser review and again after the final crop corrections; **106/106** static pages generated.
- `npm run check:links`: passed for **102 pages and 5,547 internal links**.
- Full browser pass: **24 routes**, **three catalogues**, **408 hero checks**, both themes at **1920, 1440, 1280, 768, 390 and 375** pixels, persisted light-theme reload and client navigation to every product.
- Final crop recheck: **18 additional hero checks** for PediatricMotion and ClinicalTrials at desktop/mobile sizes, plus all three catalogues. All 24 card images were captured for visual review.
- No broken product images, hydration/next-image errors or hero horizontal overflow. Fixed image aspect ratios and cover behavior preserve proportions.
- Visual review corrected PediatricMotion to retain the child and clinician. Wider desktop image framing retains context for RemoteCare, ClinicalTrials, ForensicSearch and DefenceMotion. Mobile retains the existing landscape frame.

## Provenance and publication

Original PNGs remain untouched. Prior manifests and the ten-product reports are preserved in `docs/audits/product-images/history/`. Archived manifest bytes are protected from line-ending conversion.

The default build validates every reviewed mapping without restoring the old all-72 gate. It distinguishes populated roles from distinct source coverage.

Publishing uses `v1/feature/insights` and the existing [GitHub Pages workflow](https://github.com/GaitAI-analysis/GaitAI/actions/workflows/deploy.yml), serving [gaitai.in](https://gaitai.in).
