# Product image integration

`product-image-manifest.json` is the source of truth for reviewed source selections,
visual rationale, native dimensions, SHA-256, perceptual similarity, warnings and
output provenance. `src/data/products.ts` exposes the generated image records to
both shared catalogue cards and the shared individual product hero.

## Current integration

Ten complete clean sets are integrated: WalkScan, FallRisk, RehabTrack,
SportsMotion, WatchCare, NeuroMotion, OrthoMotion, SeniorCare, IndustrialSafety
and RetailGuard. That is 10 dark heroes, 10 light heroes and 10 cards (30/72
primary assets; 120 files including responsive derivatives).

Integration is per product: every complete reviewed clean three-image set is
integrated immediately. Incomplete products retain their existing imagery or
fallback. No product borrows another product's assets, and all-72 completeness
is not a build or publication gate.

DefenceMotion remains a first-class SecureVision product. Its dark poster has
embedded text/UI and is held until a clean dark replacement exists, even if
a light hero and card become available. It does not count as a clean hero.
Army, Navy and Air Force remain modes of DefenceMotion.

See [the 92-file audit and individual missing roles](product-image-coverage.md).
There are 42 missing clean roles: 41 roles without a selected source and the
DefenceMotion dark role requiring a clean replacement. The manifest preserves
the poster candidate and warning separately from clean coverage.

Original PNGs remain untouched in the supplied directory. Historical manifests,
including the original 78-file audit and the fresh 92-file pre-integration audit,
are retained byte-for-byte in `docs/audits/product-images/history/` and checked
against their stored hashes.

## Replacing an image

1. Visually inspect the source, confirm its product and role, then update its
   inventory record and explicit `sources` entry in the manifest. A complete
   set requires three `selected-clean` role reviews and `status: "reviewed"`,
   with a concise `visualDescription`, `heroPosition` and `cardPosition`.
2. Run `python scripts/import-product-images.py --source-dir "path/to/originals"`
   with Pillow installed. The importer preflights hashes, product/role ownership
   and clean-image eligibility. It preserves incomplete products' existing
   imagery, encodes quality-94 WebP at native resolution without upscaling, and
   writes responsive derivatives plus `src/data/product-images.generated.json`.
3. Run `npm run check:product-audit -- --source-dir "path/to/originals"`,
   `npm run check:product-images`, `npm run lint`, `npm run build` and the browser
   check below. The default check requires every complete reviewed set to be
   integrated and validates actual assets. It reports incomplete roles without
   blocking publication. Optional `--require-complete` checks full 72-role
   readiness; the build does not use that flag.

The existing `ThemePicture` follows the actual theme before first paint,
theme switches, persisted preferences and client navigation. Static export has
`images.unoptimized`, so native `picture`/`srcset` selects pre-encoded files.
Cards load lazily in a 4:3 frame; heroes load eagerly at high priority. Fixed
aspect ratios reserve space. Both use `object-fit: cover`; manifest focal
positions retain the important subjects in the desktop portrait frame, while
mobile uses a landscape frame. No separate light/dark page implementation exists.

## Browser verification

After building, use the existing Playwright install in
`tmp/qa/node_modules/playwright`:

```powershell
$env:GAITAI_AUDIT_OUT = 'out'
$env:QA_CHROMIUM = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
npm run check:product-images:browser
```

The check covers all 24 routes and three catalogues, both themes, six viewport
widths, persisted light-mode reload and client navigation into the newly
integrated products. Screenshots and JSON results are stored in the ignored
`tmp/product-image-audit/browser` directory. See
[verification results](product-image-verification.md).
