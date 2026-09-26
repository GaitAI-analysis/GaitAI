# Product imagery verification

Current integration: **10/24 complete clean product sets**, including WatchCare, NeuroMotion and OrthoMotion. The canonical registry still contains exactly 24 products. All incomplete products retain their existing imagery/fallback.

| Product | Dark Hero | Light Hero | Card |
|---|---|---|---|
| WalkScan | Yes | Yes | Yes |
| FallRisk | Yes | Yes | Yes |
| RehabTrack | Yes | Yes | Yes |
| SportsMotion | Yes | Yes | Yes |
| WatchCare | Yes | Yes | Yes |
| NeuroMotion | Yes | Yes | Yes |
| OrthoMotion | Yes | Yes | Yes |
| SeniorCare | Yes | Yes | Yes |
| PediatricMotion | Missing | Missing | Missing |
| ProstheticFit | Missing | Missing | Missing |
| RemoteCare | Missing | Missing | Missing |
| ClinicalTrials | Missing | Missing | Missing |
| SuspiciousMotion | Missing | Missing | Missing |
| CrowdSense | Missing | Missing | Missing |
| IndustrialSafety | Yes | Yes | Yes |
| PrivacyGuard | Missing | Missing | Missing |
| CampusShield | Missing | Missing | Missing |
| EventShield | Missing | Missing | Missing |
| RetailGuard | Yes | Yes | Yes |
| ForensicSearch | Missing | Missing | Missing |
| ReID | Missing | Missing | Missing |
| AccessMotion | Missing | Missing | Missing |
| Watchlist | Missing | Missing | Missing |
| DefenceMotion | Missing | Missing | Missing |

- Clean dark heroes: **10/24**.
- Clean light heroes: **10/24**.
- Cards: **10/24**.
- Primary assets integrated: **30/72**.
- Responsive files: **120** (36 newly added files for the three new sets).
- Missing clean roles: **42**, individually recorded in `missingCleanAssets` in the manifest and [the coverage report](product-image-coverage.md).

DefenceMotion dark is a held text/UI poster candidate, not a clean hero. Its warning remains in the manifest until a clean replacement is supplied. It is excluded from the totals above. Army/Navy/Air Force remain modes of the single DefenceMotion product.

## Verification results

- Full image inventory rerun: **92 files**, **2 exact duplicate extra copies**, **22 collages/mockups**, **4 unrelated posters**, **66 standalone candidates** (63 photographs plus 3 flagged canonical posters). Nine similarity pairs remain visually reviewed as distinct images; all recomputed hashes, dimensions, pixel hashes, pHashes and dHashes match the audit.
- `npm run check:product-audit -- --source-dir "C:\Users\Anubha\Downloads\New folder (7)"`: passed for all 92 sources and both preserved historical manifests.
- `npm run check:product-images`: passed for all 30 primary assets and 120 derivatives. Verifies canonical order, uniqueness, product/role ownership, case-sensitive URLs, file hashes, native dimensions, responsive ladders and complete-set integration.
- All 120 WebP files decode with their recorded dimensions. Native masters remain unchanged in resolution; no images were upscaled.
- `npm run lint`: passed without warnings or errors.
- `npm run verify`: passed, including type checking, strict theme media checks, all 24 evidence modules, retrieval/ranking suites and **267/267** paraphrase checks. The existing Watchlist environment-association warning remains; no integrity errors.
- `npm run build`: passed; **106/106** static pages generated.
- `npm run check:links`: passed for **102 pages and 5,547 internal links**.
- `npm run check:product-images:browser`: passed for **24 product routes**, **three catalogues** and **165 hero checks** at 1920, 1440, 1280, 768, 390 and 375-pixel widths. Covers real dark/light toggles, persisted light-mode reload, image loading and client navigation into all three new products. No broken product images, hydration errors or product-hero horizontal overflow.
- Visual review of the new desktop and mobile screenshots confirms appropriate focal cropping: visible smartwatch, neurological assessment context and orthopedic knee-brace/parallel-bar context.

The all-72 integration gate has been removed. Default validation requires every complete clean reviewed set to be integrated, while incomplete roles are reported without blocking publication. `--require-complete` is an optional readiness check, not used by the build.

## Provenance and publication

The manifest remains authoritative. Original PNGs are untouched; previous 78-file and fresh 92-file pre-integration manifests remain byte-for-byte in `docs/audits/product-images/history/`. `.gitattributes` preserves their bytes across Windows and Linux so archived SHA-256 checks remain portable.

The prior seven-product verification is preserved in [the history archive](audits/product-images/history/verification-seven-products.md). This change is published by pushing to `v1/feature/insights`, through the existing [GitHub Pages workflow](https://github.com/GaitAI-analysis/GaitAI/actions/workflows/deploy.yml), serving [gaitai.in](https://gaitai.in).
