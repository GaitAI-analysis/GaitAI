# Product image integration

`product-image-manifest.json` is the source of truth for reviewed source selections,
visual rationale, native dimensions, SHA-256, perceptual similarity, warnings and
output provenance. `src/data/products.ts` exposes the generated image records to
both shared catalogue cards and the shared individual product hero.

## Current integration

All 24 canonical products have card, dark-hero and light-hero images: 72 role
assignments from 63 distinct source photographs, encoded into 288 responsive
WebP files. All 24 card source photographs are distinct. The ten previously
published sets are retained; 11 dedicated sets come from the newly supplied
nested folder. ForensicSearch, AccessMotion and Watchlist use explicitly
reviewed closest-fit sharing, following the latest placement instruction.

See [all 24 assignments and exact source filenames](product-image-assignments.md)
and [the current coverage audit](product-image-coverage.md). `sharedFrom` in each
relevant role review identifies the primary source owner; `mappingNote` records
the ambiguity. Validators reject undeclared sharing and duplicate-export
selections. Sharing never increases the count of distinct source images.

DefenceMotion now has clean N044/N045/N046 imagery. The old F074 poster stays
excluded; its warning and replacement resolution remain in historical provenance.
Army, Navy and Air Force remain modes of one DefenceMotion product.

There are no missing rendered roles. Nine dedicated roles are absent for the
three shared-match products, individually listed in `missingDedicatedAssets`.
Integration remains per product, without an all-72 publication gate.

Original PNGs remain untouched. The manifest includes the old 92 files and all
46 nested-folder files, with dimensions, hashes, perceptual similarity results,
review rationale, exclusions and generated output hashes. Prior manifests and
reports remain in `docs/audits/product-images/history/`; archived manifest bytes
are preserved across platforms and checked by SHA-256.

## Replacing an image

1. Visually inspect the source, confirm its product and role, then update its
   inventory record and explicit `sources` entry in the manifest. A complete
   set requires three `selected-clean` role reviews and `status: "reviewed"`,
   with `visualDescription`, `heroPosition` and `cardPosition`. Reuse existing product
   names for image alt text when no new page text is requested. Shared semantic
   selections also require `sharedFrom`, a reason and a product `mappingNote`.
2. Run `python scripts/import-product-images.py --source-dir "path/to/originals"`
   with Pillow installed. Use the common parent directory for the current combined manifest. The importer
   preflights hashes, product/role ownership
   and clean-image eligibility. It preserves incomplete products' existing
   imagery, encodes quality-94 WebP at native resolution without upscaling, and
   writes responsive derivatives plus `src/data/product-images.generated.json`.
3. Run `npm run check:product-audit -- --source-dir "path/to/originals"`,
   `npm run check:product-images`, `npm run lint`, `npm run build` and the browser
   check below. The default check requires every complete reviewed set to be
   integrated and validates actual assets. It reports incomplete roles without
   blocking publication. Optional `--require-complete` checks full 72-role
   role readiness; the build does not use that flag. Distinct-source coverage
   is reported separately from populated slots.

The existing `ThemePicture` follows the actual theme before first paint,
theme switches, persisted preferences and client navigation. Static export has
`images.unoptimized`, so native `picture`/`srcset` selects pre-encoded files.
Cards load lazily in a 4:3 frame; heroes load eagerly at high priority. Fixed
aspect ratios reserve space. Both use `object-fit: cover`; manifest focal
positions retain important subjects. RemoteCare, ClinicalTrials, ForensicSearch and DefenceMotion
use a wider desktop image frame to preserve context spanning both sides of the
photograph; mobile keeps the existing landscape frame. Wide card sources receive
accurate cover-adjusted `sizes`. No separate light/dark page implementation exists.

## Browser verification

After building, use the existing Playwright install in
`tmp/qa/node_modules/playwright`:

```powershell
$env:GAITAI_AUDIT_OUT = 'out'
$env:QA_CHROMIUM = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
npm run check:product-images:browser
```

The check covers all 24 routes and three catalogues, both themes, six viewport
widths, persisted light-mode reload and client navigation into every mapped
product. Screenshots and JSON results are stored in the ignored
`tmp/product-image-audit/browser` directory. See
[verification results](product-image-verification.md).
