# Fresh product-image audit - 92 current files

This report was rebuilt from all files currently in `C:\Users\Anubha\Downloads\New folder (7)`. File order/date was used only to label review aids, never to infer product assignments. All 92 images were visually reviewed; ambiguous/new clinical scenes were inspected at native resolution. No source images were generated, extracted from collages, substituted, modified or deleted.

The authoritative source selection is `product-image-manifest.json` (schema 2). The previous manifest is retained byte-for-byte under `docs/audits/product-images/history/`, with its SHA-256 recorded in the current manifest.

## Coverage

Each Yes is one distinct reviewed clean image integrated into the website. The DefenceMotion poster is retained as a flagged candidate, excluded from clean coverage. Review IDs identify files in the inventory below.

| Product | Dark Hero | Light Hero | Card |
|---|---|---|---|
| WalkScan | Yes F032 | Yes F033 | Yes F034 |
| FallRisk | Yes F062 | Yes F063 | Yes F064 |
| RehabTrack | Yes F006 | Yes F007 | Yes F008 |
| SportsMotion | Yes F038 | Yes F039 | Yes F040 |
| WatchCare | Yes F080 | Yes F081 | Yes F082 |
| NeuroMotion | Yes F083 | Yes F084 | Yes F085 |
| OrthoMotion | Yes F086 | Yes F087 | Yes F088 |
| SeniorCare | Yes F054 | Yes F055 | Yes F056 |
| PediatricMotion | Missing | Missing | Missing |
| ProstheticFit | Missing | Missing | Missing |
| RemoteCare | Missing | Missing | Missing |
| ClinicalTrials | Missing | Missing | Missing |
| SuspiciousMotion | Missing | Missing | Missing |
| CrowdSense | Missing | Missing | Missing |
| IndustrialSafety | Yes F065 | Yes F066 | Yes F067 |
| PrivacyGuard | Missing | Missing | Missing |
| CampusShield | Missing | Missing | Missing |
| EventShield | Missing | Missing | Missing |
| RetailGuard | Yes F068 | Yes F069 | Yes F070 |
| ForensicSearch | Missing | Missing | Missing |
| ReID | Missing | Missing | Missing |
| AccessMotion | Missing | Missing | Missing |
| Watchlist | Missing | Missing | Missing |
| DefenceMotion | Missing clean hero (poster F074 held) | Missing | Missing |

- Files inspected: **92**; unique SHA-256 file hashes: **90**.
- Exact duplicates: **2 extra copies in 2 groups** (4 participating files).
- Contact sheets/collages/catalogue mockups: **22 files**, including both duplicate copies (**20 unique**).
- Unrelated/rejected outside that collage count: **4** standalone automotive posters.
- Canonical single-product posters flagged separately: **3**.
- Valid standalone candidates: **66** - 63 clean photographs plus 3 canonical posters. Of the 63 photographs, 54 have a clear product match and 9 remain ambiguous; alternatives for the same product are not additional mapped roles.
- Additional near-duplicate exports confirmed: **0**; **9** candidate pairs reviewed. This is the result of the documented similarity method and visual review, not a guarantee against every possible crop/transformation.
- Clean Dark Hero: **10/24**. DefenceMotion poster F074 is excluded.
- Light Hero: **10/24**.
- Card: **10/24**.
- Clean assets mapped and integrated: **30/72**. One additional flagged poster candidate is held.
- Missing clean roles: **42** (41 absent sources plus one clean poster replacement).
- Complete clean product sets integrated: **10/24**.

Counts reconcile as 22 collage files + 4 unrelated posters + 3 canonical posters + 63 clean photographs = 92 files. Duplicate copies overlap the collage count and must not be added again.

## New complete matches

- **WatchCare - F080/F081/F082:** an older adult walking at home with a smartwatch visible in all three images. The separate WatchCare poster F090 is an alternative, not an extra role.
- **NeuroMotion - F083/F084/F085:** gait assessment with a clinician and brain-scan monitors visible in the background. The knee support is a brace, not a prosthesis. The neurological context comes from the scan display, not an inferred diagnosis.
- **OrthoMotion - F086/F087/F088:** knee-brace rehabilitation between parallel bars with a physiotherapist. These are not ProstheticFit assets.

## Posters - explicitly separate from clean photography

| File | Product | Candidate role | Decision |
|---|---|---|---|
| F074 | DefenceMotion | Dark Hero | Held poster candidate with embedded text/UI; not a clean hero and not integrated. Requires a clean Dark Hero replacement, Light Hero and Card. |
| F075 | RehabTrack | Dark Hero | Not selected; clean F006 is preferred. |
| F090 | WatchCare | Dark Hero | Not selected; clean F080 is preferred. |

The DefenceMotion dark poster is retained only for provenance and its warning. It cannot qualify for integration even if its other two roles become available. Clean-photography coverage is **30/72**.

## Exactly which roles are missing

| Product | Missing roles |
|---|---|
| PediatricMotion | Dark Hero, Light Hero, Card |
| ProstheticFit | Dark Hero, Light Hero, Card |
| RemoteCare | Dark Hero, Light Hero, Card |
| ClinicalTrials | Dark Hero, Light Hero, Card |
| SuspiciousMotion | Dark Hero, Light Hero, Card |
| CrowdSense | Dark Hero, Light Hero, Card |
| PrivacyGuard | Dark Hero, Light Hero, Card |
| CampusShield | Dark Hero, Light Hero, Card |
| EventShield | Dark Hero, Light Hero, Card |
| ForensicSearch | Dark Hero, Light Hero, Card |
| ReID | Dark Hero, Light Hero, Card |
| AccessMotion | Dark Hero, Light Hero, Card |
| Watchlist | Dark Hero, Light Hero, Card |
| DefenceMotion | Dark Hero (clean replacement; poster held), Light Hero, Card |

Each of these 42 missing clean product/role pairs is an individual entry in the manifest's `missingCleanAssets` array. The original `missingAssets` array separately records the 41 roles without a selected source; the held poster is not a clean asset.

## Duplicate and similarity review

| Exact duplicate group | SHA-256 |
|---|---|
| F027, F028 | `076836b070e74414d043ab948e09f3ffd898bc587af27159271027839782fac7` |
| F060, F061 | `f1e2f6ca3fe851b227c8e34bcc9d8f800a593bb1832a2272c3c71dc902483807` |

63-bit DCT pHash, 64-bit dHash and grayscale SSIM at 128x128. Candidate pairs: pHash <= 12 OR dHash <= 10; human review decides duplication. Theme variants and similar subjects are not automatically duplicates.

| Pair | pHash distance | dHash distance | SSIM | Visual conclusion |
|---|---:|---:|---:|---|
| F003 / F004 | 8 | 22 | 0.367895 | Different dark/light renderings, not duplicate exports. |
| F042 / F054 | 10 | 9 | 0.543352 | Different photograph: the latter adds a caregiver and changes the walking pose. |
| F071 / F076 | 12 | 4 | 0.409657 | Different automotive posters with different text/layout; both rejected as unrelated. |
| F009 / F010 | 12 | 29 | 0.364963 | Distinct dark/light terminal-security renderings, not duplicate exports. |
| F030 / F031 | 14 | 10 | 0.215579 | Different multi-product contact sheets; both excluded. |
| F005 / F010 | 14 | 8 | 0.190174 | Different portrait-card versus wide light-hero composition; background and subject placement differ. Both remain ambiguous. |
| F030 / F041 | 22 | 10 | 0.229946 | Different multi-product contact sheets; both excluded. |
| F012 / F015 | 28 | 9 | 0.292038 | Different subjects: independent gait assessment versus elderly cane-assisted walking. |
| F029 / F030 | 28 | 10 | 0.107211 | Different automotive contact sheets; both excluded. |

## Integration and verification

All ten complete reviewed clean sets are integrated into catalogue cards and
individual theme-aware heroes. The canonical registry still contains exactly
24 products. The 14 incomplete products retain their existing fallback.
The manifest records `deploymentStatus: "integrated"` for the ten ready products,
30 primary assignments and 120 responsive WebP files. Integration does not wait
for all 72 roles. DefenceMotion's poster warning remains authoritative.

- The inventory script rechecks every image's native dimensions, SHA-256,
  decoded pixels, pHash/dHash and similarity candidates.
- `npm run check:product-audit -- --source-dir "C:\Users\Anubha\Downloads\New folder (7)"`
  verifies all current source files and historical snapshots.
- `npm run check:product-images` validates production paths, dimensions, hashes,
  uniqueness, responsive derivatives and complete-set integration.
- See [the current verification record](product-image-verification.md) for lint,
  build, browser and publication checks.

## Complete current inventory

Every record also includes full SHA-256, decoded-pixel SHA-256, pHash, dHash, visual description, candidate role/product, eligibility and selection status in the JSON manifest. Ratios below are native width / height.

| ID | Filename | Native dimensions | Ratio | Kind | Candidate product | Role | Selection |
|---|---|---|---:|---|---|---|---|
| F001 | 3a1609cd-1034-4851-9da9-61a5197d59ff.png | 1536 - 1024 | 1.5000 | contact-sheet-or-collage | - | - | rejected |
| F002 | 8aacf179-7c26-475e-9017-7d3344c9b288.png | 1672 - 940 | 1.7787 | contact-sheet-or-collage | - | - | rejected |
| F003 | ChatGPT Image Sep 16, 2026, 01_12_58 AM (1).png | 1774 - 887 | 2.0000 | clean-photograph | CrowdSense, ReID | Dark Hero | held-ambiguous |
| F004 | ChatGPT Image Sep 16, 2026, 01_12_58 AM (2).png | 1774 - 887 | 2.0000 | clean-photograph | CrowdSense, ReID | Light Hero | held-ambiguous |
| F005 | ChatGPT Image Sep 16, 2026, 01_12_59 AM (3).png | 1448 - 1086 | 1.3333 | clean-photograph | SuspiciousMotion, AccessMotion, Watchlist | Card | held-ambiguous |
| F006 | ChatGPT Image Sep 16, 2026, 01_12_59 AM (4).png | 1774 - 887 | 2.0000 | clean-photograph | RehabTrack | Dark Hero | selected |
| F007 | ChatGPT Image Sep 16, 2026, 01_13_00 AM (5).png | 1774 - 887 | 2.0000 | clean-photograph | RehabTrack | Light Hero | selected |
| F008 | ChatGPT Image Sep 16, 2026, 01_13_00 AM (6).png | 1448 - 1086 | 1.3333 | clean-photograph | RehabTrack | Card | selected |
| F009 | ChatGPT Image Sep 16, 2026, 01_13_01 AM (7).png | 1774 - 887 | 2.0000 | clean-photograph | SuspiciousMotion, AccessMotion, Watchlist | Dark Hero | held-ambiguous |
| F010 | ChatGPT Image Sep 16, 2026, 01_13_01 AM (8).png | 1774 - 887 | 2.0000 | clean-photograph | SuspiciousMotion, AccessMotion, Watchlist | Light Hero | held-ambiguous |
| F011 | ChatGPT Image Sep 16, 2026, 01_13_02 AM (9).png | 1448 - 1086 | 1.3333 | clean-photograph | CrowdSense, ReID | Card | held-ambiguous |
| F012 | ChatGPT Image Sep 16, 2026, 01_18_25 AM (1).png | 1774 - 887 | 2.0000 | clean-photograph | WalkScan | Dark Hero | alternative |
| F013 | ChatGPT Image Sep 16, 2026, 01_18_25 AM (2).png | 1774 - 887 | 2.0000 | clean-photograph | WalkScan | Light Hero | alternative |
| F014 | ChatGPT Image Sep 16, 2026, 01_18_26 AM (3).png | 1448 - 1086 | 1.3333 | clean-photograph | WalkScan | Card | alternative |
| F015 | ChatGPT Image Sep 16, 2026, 01_18_26 AM (4).png | 1774 - 887 | 2.0000 | clean-photograph | FallRisk | Dark Hero | alternative |
| F016 | ChatGPT Image Sep 16, 2026, 01_18_27 AM (5).png | 1774 - 887 | 2.0000 | clean-photograph | FallRisk | Light Hero | alternative |
| F017 | ChatGPT Image Sep 16, 2026, 01_18_27 AM (6).png | 1448 - 1086 | 1.3333 | clean-photograph | FallRisk | Card | alternative |
| F018 | ChatGPT Image Sep 16, 2026, 01_18_27 AM (7).png | 1774 - 887 | 2.0000 | clean-photograph | SportsMotion | Dark Hero | alternative |
| F019 | ChatGPT Image Sep 16, 2026, 01_18_28 AM (8).png | 1774 - 887 | 2.0000 | clean-photograph | SportsMotion | Light Hero | alternative |
| F020 | ChatGPT Image Sep 16, 2026, 01_18_28 AM (9).png | 1448 - 1086 | 1.3333 | clean-photograph | SportsMotion | Card | alternative |
| F021 | ChatGPT Image Sep 16, 2026, 01_23_02 AM (1).png | 1536 - 1024 | 1.5000 | contact-sheet-or-collage | - | - | rejected |
| F022 | ChatGPT Image Sep 16, 2026, 01_23_03 AM (2).png | 1536 - 1024 | 1.5000 | contact-sheet-or-collage | - | - | rejected |
| F023 | ChatGPT Image Sep 16, 2026, 01_30_50 AM (1).png | 1536 - 1024 | 1.5000 | contact-sheet-or-collage | - | - | rejected |
| F024 | ChatGPT Image Sep 16, 2026, 01_30_51 AM (2).png | 1536 - 1024 | 1.5000 | contact-sheet-or-collage | - | - | rejected |
| F025 | ChatGPT Image Sep 16, 2026, 01_35_08 AM.png | 1536 - 1024 | 1.5000 | contact-sheet-or-collage | - | - | rejected |
| F026 | ChatGPT Image Sep 16, 2026, 01_37_33 AM.png | 1536 - 1024 | 1.5000 | contact-sheet-or-collage | - | - | rejected |
| F027 | ChatGPT Image Sep 16, 2026, 01_39_42 AM.png | 1536 - 1024 | 1.5000 | contact-sheet-or-collage | - | - | rejected |
| F028 | ChatGPT Image Sep 16, 2026, 01_41_03 AM (1).png | 1536 - 1024 | 1.5000 | contact-sheet-or-collage | - | - | rejected (exact duplicate) |
| F029 | ChatGPT Image Sep 16, 2026, 01_41_03 AM (2).png | 1536 - 1024 | 1.5000 | contact-sheet-or-collage | - | - | rejected |
| F030 | ChatGPT Image Sep 16, 2026, 01_42_40 AM.png | 1536 - 1024 | 1.5000 | contact-sheet-or-collage | - | - | rejected |
| F031 | ChatGPT Image Sep 16, 2026, 01_45_53 AM.png | 1536 - 1024 | 1.5000 | contact-sheet-or-collage | - | - | rejected |
| F032 | ChatGPT Image Sep 16, 2026, 01_50_48 AM (1).png | 1672 - 941 | 1.7768 | clean-photograph | WalkScan | Dark Hero | selected |
| F033 | ChatGPT Image Sep 16, 2026, 01_50_48 AM (2).png | 1672 - 941 | 1.7768 | clean-photograph | WalkScan | Light Hero | selected |
| F034 | ChatGPT Image Sep 16, 2026, 01_50_48 AM (3).png | 1448 - 1086 | 1.3333 | clean-photograph | WalkScan | Card | selected |
| F035 | ChatGPT Image Sep 16, 2026, 01_50_48 AM (4).png | 1672 - 941 | 1.7768 | clean-photograph | FallRisk | Dark Hero | alternative |
| F036 | ChatGPT Image Sep 16, 2026, 01_50_49 AM (5).png | 1672 - 941 | 1.7768 | clean-photograph | FallRisk | Light Hero | alternative |
| F037 | ChatGPT Image Sep 16, 2026, 01_50_49 AM (6).png | 1448 - 1086 | 1.3333 | clean-photograph | FallRisk | Card | alternative |
| F038 | ChatGPT Image Sep 16, 2026, 01_50_49 AM (7).png | 1672 - 941 | 1.7768 | clean-photograph | SportsMotion | Dark Hero | selected |
| F039 | ChatGPT Image Sep 16, 2026, 01_50_49 AM (8).png | 1672 - 941 | 1.7768 | clean-photograph | SportsMotion | Light Hero | selected |
| F040 | ChatGPT Image Sep 16, 2026, 01_50_50 AM (9).png | 1448 - 1086 | 1.3333 | clean-photograph | SportsMotion | Card | selected |
| F041 | ChatGPT Image Sep 16, 2026, 01_52_49 AM.png | 1536 - 1024 | 1.5000 | contact-sheet-or-collage | - | - | rejected |
| F042 | ChatGPT Image Sep 16, 2026, 02_01_44 AM (1).png | 1774 - 887 | 2.0000 | clean-photograph | SeniorCare | Dark Hero | alternative |
| F043 | ChatGPT Image Sep 16, 2026, 02_01_44 AM (2).png | 1774 - 887 | 2.0000 | clean-photograph | SeniorCare | Light Hero | alternative |
| F044 | ChatGPT Image Sep 16, 2026, 02_01_44 AM (3).png | 1448 - 1086 | 1.3333 | clean-photograph | SeniorCare | Card | alternative |
| F045 | ChatGPT Image Sep 16, 2026, 02_01_45 AM (4).png | 1774 - 887 | 2.0000 | clean-photograph | IndustrialSafety | Dark Hero | alternative |
| F046 | ChatGPT Image Sep 16, 2026, 02_01_45 AM (5).png | 1774 - 887 | 2.0000 | clean-photograph | IndustrialSafety | Light Hero | alternative |
| F047 | ChatGPT Image Sep 16, 2026, 02_01_45 AM (6).png | 1448 - 1086 | 1.3333 | clean-photograph | IndustrialSafety | Card | alternative |
| F048 | ChatGPT Image Sep 16, 2026, 02_01_46 AM (7).png | 1774 - 887 | 2.0000 | clean-photograph | CrowdSense, ReID | Dark Hero | held-ambiguous |
| F049 | ChatGPT Image Sep 16, 2026, 02_01_46 AM (8).png | 1774 - 887 | 2.0000 | clean-photograph | CrowdSense, ReID | Light Hero | held-ambiguous |
| F050 | ChatGPT Image Sep 16, 2026, 02_01_46 AM (9).png | 1448 - 1086 | 1.3333 | clean-photograph | CrowdSense, ReID | Card | held-ambiguous |
| F051 | ChatGPT Image Sep 16, 2026, 02_07_32 AM (1).png | 1672 - 941 | 1.7768 | clean-photograph | RetailGuard | Dark Hero | alternative |
| F052 | ChatGPT Image Sep 16, 2026, 02_07_32 AM (2).png | 1672 - 941 | 1.7768 | clean-photograph | RetailGuard | Light Hero | alternative |
| F053 | ChatGPT Image Sep 16, 2026, 02_07_32 AM (3).png | 1448 - 1086 | 1.3333 | clean-photograph | RetailGuard | Card | alternative |
| F054 | ChatGPT Image Sep 16, 2026, 02_07_33 AM (4).png | 1672 - 941 | 1.7768 | clean-photograph | SeniorCare | Dark Hero | selected |
| F055 | ChatGPT Image Sep 16, 2026, 02_07_33 AM (5).png | 1672 - 941 | 1.7768 | clean-photograph | SeniorCare | Light Hero | selected |
| F056 | ChatGPT Image Sep 16, 2026, 02_07_33 AM (6).png | 1448 - 1086 | 1.3333 | clean-photograph | SeniorCare | Card | selected |
| F057 | ChatGPT Image Sep 16, 2026, 02_07_33 AM (7).png | 1672 - 941 | 1.7768 | clean-photograph | IndustrialSafety | Dark Hero | alternative |
| F058 | ChatGPT Image Sep 16, 2026, 02_07_34 AM (8).png | 1672 - 941 | 1.7768 | clean-photograph | IndustrialSafety | Light Hero | alternative |
| F059 | ChatGPT Image Sep 16, 2026, 02_07_34 AM (9).png | 1448 - 1086 | 1.3333 | clean-photograph | IndustrialSafety | Card | alternative |
| F060 | ChatGPT Image Sep 16, 2026, 02_15_22 AM.png | 1536 - 1024 | 1.5000 | contact-sheet-or-collage | - | - | rejected |
| F061 | ChatGPT Image Sep 16, 2026, 02_15_37 AM.png | 1536 - 1024 | 1.5000 | contact-sheet-or-collage | - | - | rejected (exact duplicate) |
| F062 | ChatGPT Image Sep 16, 2026, 02_20_57 AM (1).png | 1672 - 941 | 1.7768 | clean-photograph | FallRisk | Dark Hero | selected |
| F063 | ChatGPT Image Sep 16, 2026, 02_20_57 AM (2).png | 1672 - 941 | 1.7768 | clean-photograph | FallRisk | Light Hero | selected |
| F064 | ChatGPT Image Sep 16, 2026, 02_20_58 AM (3).png | 1448 - 1086 | 1.3333 | clean-photograph | FallRisk | Card | selected |
| F065 | ChatGPT Image Sep 16, 2026, 02_20_58 AM (4).png | 1672 - 941 | 1.7768 | clean-photograph | IndustrialSafety | Dark Hero | selected |
| F066 | ChatGPT Image Sep 16, 2026, 02_20_59 AM (5).png | 1672 - 941 | 1.7768 | clean-photograph | IndustrialSafety | Light Hero | selected |
| F067 | ChatGPT Image Sep 16, 2026, 02_20_59 AM (6).png | 1448 - 1086 | 1.3333 | clean-photograph | IndustrialSafety | Card | selected |
| F068 | ChatGPT Image Sep 16, 2026, 02_20_59 AM (7).png | 1672 - 941 | 1.7768 | clean-photograph | RetailGuard | Dark Hero | selected |
| F069 | ChatGPT Image Sep 16, 2026, 02_20_59 AM (8).png | 1672 - 941 | 1.7768 | clean-photograph | RetailGuard | Light Hero | selected |
| F070 | ChatGPT Image Sep 16, 2026, 02_21_00 AM (9).png | 1448 - 1086 | 1.3333 | clean-photograph | RetailGuard | Card | selected |
| F071 | ChatGPT Image Sep 16, 2026, 02_33_11 AM (1).png | 1672 - 941 | 1.7768 | unrelated-rejected | - | Dark Hero | rejected |
| F072 | ChatGPT Image Sep 16, 2026, 02_33_11 AM (2).png | 1672 - 941 | 1.7768 | unrelated-rejected | - | Dark Hero | rejected |
| F073 | ChatGPT Image Sep 16, 2026, 02_33_12 AM (3).png | 1672 - 941 | 1.7768 | unrelated-rejected | - | Dark Hero | rejected |
| F074 | ChatGPT Image Sep 20, 2026, 01_48_46 AM (1).png | 1672 - 941 | 1.7768 | single-product-poster | DefenceMotion | Dark Hero | selected |
| F075 | ChatGPT Image Sep 20, 2026, 01_48_46 AM (2).png | 1672 - 941 | 1.7768 | single-product-poster | RehabTrack | Dark Hero | poster-alternative |
| F076 | ChatGPT Image Sep 20, 2026, 01_48_46 AM (3).png | 1672 - 941 | 1.7768 | unrelated-rejected | - | Dark Hero | rejected |
| F077 | ChatGPT Image Sep 20, 2026, 02_09_22 AM.png | 1536 - 1024 | 1.5000 | contact-sheet-or-collage | - | - | rejected |
| F078 | ChatGPT Image Sep 20, 2026, 02_12_52 AM.png | 1448 - 1086 | 1.3333 | contact-sheet-or-collage | - | - | rejected |
| F079 | ChatGPT Image Sep 20, 2026, 02_15_43 AM.png | 1536 - 1024 | 1.5000 | contact-sheet-or-collage | - | - | rejected |
| F080 | ChatGPT Image Sep 20, 2026, 02_20_18 AM (1).png | 1672 - 941 | 1.7768 | clean-photograph | WatchCare | Dark Hero | selected |
| F081 | ChatGPT Image Sep 20, 2026, 02_20_18 AM (2).png | 1672 - 941 | 1.7768 | clean-photograph | WatchCare | Light Hero | selected |
| F082 | ChatGPT Image Sep 20, 2026, 02_20_19 AM (3).png | 1448 - 1086 | 1.3333 | clean-photograph | WatchCare | Card | selected |
| F083 | ChatGPT Image Sep 20, 2026, 02_20_19 AM (4).png | 1672 - 941 | 1.7768 | clean-photograph | NeuroMotion | Dark Hero | selected |
| F084 | ChatGPT Image Sep 20, 2026, 02_20_19 AM (5).png | 1672 - 941 | 1.7768 | clean-photograph | NeuroMotion | Light Hero | selected |
| F085 | ChatGPT Image Sep 20, 2026, 02_20_19 AM (6).png | 1448 - 1086 | 1.3333 | clean-photograph | NeuroMotion | Card | selected |
| F086 | ChatGPT Image Sep 20, 2026, 02_20_19 AM (7).png | 1672 - 941 | 1.7768 | clean-photograph | OrthoMotion | Dark Hero | selected |
| F087 | ChatGPT Image Sep 20, 2026, 02_20_20 AM (8).png | 1672 - 941 | 1.7768 | clean-photograph | OrthoMotion | Light Hero | selected |
| F088 | ChatGPT Image Sep 20, 2026, 02_20_20 AM (9).png | 1448 - 1086 | 1.3333 | clean-photograph | OrthoMotion | Card | selected |
| F089 | ChatGPT Image Sep 20, 2026, 02_22_42 AM.png | 1536 - 1024 | 1.5000 | contact-sheet-or-collage | - | - | rejected |
| F090 | ChatGPT Image Sep 20, 2026, 02_25_53 AM.png | 1672 - 941 | 1.7768 | single-product-poster | WatchCare | Dark Hero | poster-alternative |
| F091 | gaitai_hero_dark_main.png | 1774 - 887 | 2.0000 | contact-sheet-or-collage | - | - | rejected |
| F092 | gaitai_hero_light_main.png | 1774 - 887 | 2.0000 | contact-sheet-or-collage | - | - | rejected |
