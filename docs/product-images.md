# Product image integration

The canonical registry is `src/data/products.ts`. Its `images` field supplies both
the shared catalogue card and the shared individual product hero. DefenceMotion
remains one of the twelve SecureVision products; its service modes are unchanged.

## Source audit — incomplete

All 78 files in `C:\Users\Anubha\Downloads\New folder (7)` were visually inspected.
There are 76 distinct files: two exact duplicates, several multi-panel contact
sheets, automotive posters, homepage composites and alternative versions of the
same scenes. The contact sheet headed “24 Products” depicts a different lineup,
including VINPlate OCR, ChassisVision and PaintSense.

Seven complete, visually relevant sets are available: WalkScan, FallRisk,
RehabTrack, SportsMotion, SeniorCare, IndustrialSafety and RetailGuard. The other
17 products have explicit `null` image records, pending matching source files.
No unrelated image, repeated photograph, synthesized theme or enlarged contact
sheet panel is used to fill those gaps. DefenceMotion has only a branded poster
with embedded copy, not a clean three-image set.

`product-image-manifest.json` records the full inventory, dimensions, SHA-256
hashes, selected source filenames, visual rationale, rejected alternatives,
duplicate files, focal points and encoded outputs. Source PNGs remain untouched
in the Downloads folder. Keep that folder as the original backup; the manifest
and full-resolution WebP masters are in this repository.

## Replacing an image

1. Inspect the actual image and confirm the product, role and theme. Update its
   inventory record and the explicit `sources` entry in the manifest. A complete
   reviewed set needs `heroDark`, `heroLight`, `card`, `visualDescription`,
   `heroPosition`, `cardPosition` and `status: "reviewed"`.
2. Run `python scripts/import-product-images.py --source-dir "path/to/originals"`
   with Pillow installed. The importer verifies the original hashes and encodes
   WebP at quality 94, preserving native dimensions without upscaling. It also
   writes smaller responsive derivatives and `src/data/product-images.generated.json`.
   Production components do not need source filenames or individual path edits.
3. Run `npm run check:product-images`, `npm run lint`, `npm run build` and the
   browser check below. The strict image check fails until all 72 assignments
   exist; `--allow-incomplete` audits present assets while explicitly reporting gaps.

The existing `ThemePicture` handles the actual next-themes class before first
paint and follows theme switches and client-side product navigation. This site
is a static export with `images.unoptimized`, so native `picture`/`srcset` use
pre-encoded local files instead of a nonexistent Next image optimization server.
Cards load lazily at 4:3; heroes load eagerly at high priority. Fixed aspect-ratio
containers reserve space before loading. Desktop heroes crop the intentional
empty left area using recorded focal positions; mobile uses a landscape frame.

## Browser verification

The repo's existing browser-audit dependency is Playwright in
`tmp/qa/node_modules/playwright`. After building, run:

```powershell
$env:GAITAI_AUDIT_OUT = 'out'
$env:QA_CHROMIUM = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
npm run check:product-images:browser
```

Screenshots and the machine-readable results are saved in the ignored
`tmp/product-image-audit/browser` directory. This is an integration check of
available imagery, not certification that the missing 17 sets exist.
