# Product imagery verification

Status: incomplete source set. The supplied folder has 78 files (76 unique), but only seven complete, visually matching canonical product sets. No new images were generated or unrelated files substituted.

| Product | Dark Hero | Light Hero | Card |
|---|---|---|---|
| WalkScan | Yes | Yes | Yes |
| FallRisk | Yes | Yes | Yes |
| RehabTrack | Yes | Yes | Yes |
| SportsMotion | Yes | Yes | Yes |
| WatchCare | Missing | Missing | Missing |
| NeuroMotion | Missing | Missing | Missing |
| OrthoMotion | Missing | Missing | Missing |
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

- Registry: 24/24 products, in canonical order.
- Complete imagery: 7/24 products.
- Dark heroes: 7/24.
- Light heroes: 7/24.
- Cards: 7/24.
- Primary assignments: 21/72.
- Encoded files: 84, including responsive size derivatives (not extra primary assignments).

## Checks

- `npm run lint`: passed.
- `npm run build`: passed; prebuild reports incomplete image coverage explicitly.
- `npm run typecheck`: passed.
- `npm run validate:gaitai`: passed, with the existing Watchlist environment warning.
- `npm run check:media`: passed (zero errors/warnings).
- `npm run test:evidence`: passed for all 24 modules.
- `npm run check:links`: passed, 102 pages and 5,547 internal links.
- `npm run check:product-images`: intentionally fails completeness (51 missing primary sources); all 21 present assignments pass integrity checks.
- All 84 WebP files decoded with verified dimensions; source masters preserved at original width and height.
- Browser: all 24 detail routes and all three catalogues checked; 114 hero checks across both themes at 1920, 1440, 1280, 768, 390 and 375 pixels; client navigation and persisted light-mode reload checked; zero broken product images or hydration errors.

- Final focal-point adjustment recheck: 34 additional hero checks passed for the four affected products, including desktop/mobile screenshots and catalogue/client-navigation checks.

## Outstanding input

Provide the folder containing the missing 17 dedicated sets, or explicit source mappings for review. DefenceMotion currently has only a branded poster with embedded copy and no dedicated light hero/card; it remains a first-class product and its Army/Navy/Air Force modes are unchanged.

Publication of the seven verified product sets was explicitly authorized after the source audit. The integration is included in `v1/feature/insights`, which publishes through the existing GitHub Pages workflow. The source audit remains on `feat/product-images-source-audit`; the remaining 17 sets (51 primary assets) still require matching source files.

Before publication, the complete `npm run verify` deployment gate also passed, including strict theme-media checks and the Ask GaitAI retrieval, ranking and paraphrase suites (267/267 phrasings).
