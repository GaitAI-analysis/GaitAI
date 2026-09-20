# Current product image coverage

[The full 24-product assignment table and exact filenames](product-image-assignments.md) are derived from `product-image-manifest.json`.

## Latest nested-folder audit

- Files inspected: **46**.
- Exact duplicate extra copies: **9**, in nine groups.
- Collages/overview sheets: **4**.
- Unique standalone photographs: **33**, forming **11 dedicated sets**.
- Additional near-duplicate exports: **0**. The dark/light terminal pair flagged by perceptual similarity is visually distinct.
- Unused unique standalone photographs: **0**.

## Current registry

- Products: **24/24**, original canonical order.
- Cards: **24/24**, with 24 distinct card photographs.
- Dark heroes: **24/24**.
- Light heroes: **24/24**.
- Assigned roles: **72/72** from **63 distinct source photographs**.
- Dedicated product sets: **21/24**.
- Closest-fit shared sets: **3/24**, explicitly marked.
- Missing rendered roles: **0**. Missing dedicated roles: **9**, listed individually below.

| Product | Dedicated role absent | Current closest-fit source |
|---|---|---|
| ForensicSearch | Dark Hero | N041 |
| ForensicSearch | Light Hero | N042 |
| ForensicSearch | Card | N041 |
| AccessMotion | Dark Hero | N023 |
| AccessMotion | Light Hero | N024 |
| AccessMotion | Card | N030 |
| Watchlist | Dark Hero | N014 |
| Watchlist | Light Hero | N015 |
| Watchlist | Card | N015 |

## Combined provenance

The source tree now contains **138 files**: the previous 92 plus the new 46. Every old source hash/dimension was rechecked before retaining its review. The combined inventory has 127 unique file hashes, 11 duplicate extra copies, 26 collages, four unrelated automotive posters, three flagged canonical posters and 105 photographic files (including duplicate copies). All ten similarity candidate pairs have a visual review.

Previous manifests and reports remain in `docs/audits/product-images/history/`. Historical manifest bytes are protected by `.gitattributes` and their SHA-256 values are verified. The old DefenceMotion poster warning remains in historical provenance; clean N044 replaces it in production.

Run `npm run check:product-audit -- --source-dir "C:\Users\Anubha\Downloads\New folder (7)"` for the combined tree, and `npm run check:product-images -- --require-complete` for the actual 24-product registry. The default build continues to integrate reviewed mappings without an all-72 gate.
