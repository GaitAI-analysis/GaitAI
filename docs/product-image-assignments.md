# Product image assignments

Source of truth: `product-image-manifest.json`. Existing ten dedicated sets are preserved. New selections come from `C:\Users\Anubha\Downloads\New folder (7)\New folder`. Product copy, names, order, routes and catalogue structure are unchanged.

**24 cards, 24 dark heroes, 24 light heroes = 72 assignments from 63 distinct source photographs.** Twenty-one products have dedicated sets; ForensicSearch, AccessMotion and Watchlist use explicit closest-fit shared sources. All 24 card source photographs are distinct.

Each product uses `/images/products/<slug>/card.webp`, `dark-hero.webp`, and `light-hero.webp`, with responsive derivatives. The table gives the exact source review IDs; the filename key below resolves every ID.

| Product | Card source | Dark hero source | Light hero source | Placement |
|---|---|---|---|---|
| WalkScan | F034 | F032 | F033 | Existing dedicated set retained |
| FallRisk | F064 | F062 | F063 | Existing dedicated set retained |
| RehabTrack | F008 | F006 | F007 | Existing dedicated set retained |
| SportsMotion | F040 | F038 | F039 | Existing dedicated set retained |
| WatchCare | F082 | F080 | F081 | Existing dedicated set retained |
| NeuroMotion | F085 | F083 | F084 | Existing dedicated set retained |
| OrthoMotion | F088 | F086 | F087 | Existing dedicated set retained |
| SeniorCare | F056 | F054 | F055 | Existing dedicated set retained |
| PediatricMotion | N004 | N002 | N003 | New dedicated set |
| ProstheticFit | N007 | N005 | N006 | New dedicated set |
| RemoteCare | N010 | N008 | N009 | New dedicated set |
| ClinicalTrials | N013 | N011 | N012 | New dedicated set |
| SuspiciousMotion | N016 | N014 | N015 | New dedicated set |
| CrowdSense | N019 | N017 | N018 | New dedicated set |
| IndustrialSafety | F067 | F065 | F066 | Existing dedicated set retained |
| PrivacyGuard | N025 | N023 | N024 | New dedicated set |
| CampusShield | N028 | N026 | N027 | New dedicated set |
| EventShield | N031 | N029 | N030 | New dedicated set |
| RetailGuard | F070 | F068 | F069 | Existing dedicated set retained |
| ForensicSearch | N041 | N041 | N042 | Closest-fit shared scenes |
| ReID | N043 | N041 | N042 | New dedicated set |
| AccessMotion | N030 | N023 | N024 | Closest-fit shared scenes |
| Watchlist | N015 | N014 | N015 | Closest-fit shared scenes |
| DefenceMotion | N046 | N044 | N045 | New dedicated set |

## Ambiguous/contextual mappings

- **PrivacyGuard:** Rear-view pedestrian scene with body-joint overlays in a public atrium; contextual privacy-layer illustration, not proof of anonymization.
- **ForensicSearch:** Closest semantic fit: terminal CCTV viewpoints and tracked paths, shared with ReID. No dedicated forensic-search interface is present.
- **AccessMotion:** Closest semantic fit: pedestrian entrance/atrium flow, shared with PrivacyGuard and EventShield. No dedicated credential or turnstile scene is present.
- **Watchlist:** Closest semantic fit: highlighted candidate in an airport concourse, shared with SuspiciousMotion. The photograph does not depict or establish authorized-list membership.

These scene choices illustrate context; they do not add capabilities or claims to the product copy. No dedicated ForensicSearch, AccessMotion or Watchlist set is present in the nested folder. Their nine dedicated roles are recorded in `missingDedicatedAssets`, while their rendered roles are all populated.

## Exact source filenames

Paths are relative to `C:\Users\Anubha\Downloads\New folder (7)`. N-prefixed IDs are in the new nested folder.

| ID | Source filename | Native pixels | Used by product/role |
|---|---|---|---|
| F032 | `ChatGPT Image Sep 16, 2026, 01_50_48 AM (1).png` | 1672 x 941 | WalkScan / heroDark |
| F033 | `ChatGPT Image Sep 16, 2026, 01_50_48 AM (2).png` | 1672 x 941 | WalkScan / heroLight |
| F034 | `ChatGPT Image Sep 16, 2026, 01_50_48 AM (3).png` | 1448 x 1086 | WalkScan / card |
| F062 | `ChatGPT Image Sep 16, 2026, 02_20_57 AM (1).png` | 1672 x 941 | FallRisk / heroDark |
| F063 | `ChatGPT Image Sep 16, 2026, 02_20_57 AM (2).png` | 1672 x 941 | FallRisk / heroLight |
| F064 | `ChatGPT Image Sep 16, 2026, 02_20_58 AM (3).png` | 1448 x 1086 | FallRisk / card |
| F006 | `ChatGPT Image Sep 16, 2026, 01_12_59 AM (4).png` | 1774 x 887 | RehabTrack / heroDark |
| F007 | `ChatGPT Image Sep 16, 2026, 01_13_00 AM (5).png` | 1774 x 887 | RehabTrack / heroLight |
| F008 | `ChatGPT Image Sep 16, 2026, 01_13_00 AM (6).png` | 1448 x 1086 | RehabTrack / card |
| F038 | `ChatGPT Image Sep 16, 2026, 01_50_49 AM (7).png` | 1672 x 941 | SportsMotion / heroDark |
| F039 | `ChatGPT Image Sep 16, 2026, 01_50_49 AM (8).png` | 1672 x 941 | SportsMotion / heroLight |
| F040 | `ChatGPT Image Sep 16, 2026, 01_50_50 AM (9).png` | 1448 x 1086 | SportsMotion / card |
| F080 | `ChatGPT Image Sep 20, 2026, 02_20_18 AM (1).png` | 1672 x 941 | WatchCare / heroDark |
| F081 | `ChatGPT Image Sep 20, 2026, 02_20_18 AM (2).png` | 1672 x 941 | WatchCare / heroLight |
| F082 | `ChatGPT Image Sep 20, 2026, 02_20_19 AM (3).png` | 1448 x 1086 | WatchCare / card |
| F083 | `ChatGPT Image Sep 20, 2026, 02_20_19 AM (4).png` | 1672 x 941 | NeuroMotion / heroDark |
| F084 | `ChatGPT Image Sep 20, 2026, 02_20_19 AM (5).png` | 1672 x 941 | NeuroMotion / heroLight |
| F085 | `ChatGPT Image Sep 20, 2026, 02_20_19 AM (6).png` | 1448 x 1086 | NeuroMotion / card |
| F086 | `ChatGPT Image Sep 20, 2026, 02_20_19 AM (7).png` | 1672 x 941 | OrthoMotion / heroDark |
| F087 | `ChatGPT Image Sep 20, 2026, 02_20_20 AM (8).png` | 1672 x 941 | OrthoMotion / heroLight |
| F088 | `ChatGPT Image Sep 20, 2026, 02_20_20 AM (9).png` | 1448 x 1086 | OrthoMotion / card |
| F054 | `ChatGPT Image Sep 16, 2026, 02_07_33 AM (4).png` | 1672 x 941 | SeniorCare / heroDark |
| F055 | `ChatGPT Image Sep 16, 2026, 02_07_33 AM (5).png` | 1672 x 941 | SeniorCare / heroLight |
| F056 | `ChatGPT Image Sep 16, 2026, 02_07_33 AM (6).png` | 1448 x 1086 | SeniorCare / card |
| N002 | `New folder/ChatGPT Image Sep 20, 2026, 05_12_46 PM (1).png` | 1672 x 941 | PediatricMotion / heroDark |
| N003 | `New folder/ChatGPT Image Sep 20, 2026, 05_12_46 PM (2).png` | 1672 x 941 | PediatricMotion / heroLight |
| N004 | `New folder/ChatGPT Image Sep 20, 2026, 05_12_47 PM (3).png` | 1448 x 1086 | PediatricMotion / card |
| N005 | `New folder/ChatGPT Image Sep 20, 2026, 05_12_48 PM (4).png` | 1672 x 941 | ProstheticFit / heroDark |
| N006 | `New folder/ChatGPT Image Sep 20, 2026, 05_12_48 PM (5).png` | 1672 x 941 | ProstheticFit / heroLight |
| N007 | `New folder/ChatGPT Image Sep 20, 2026, 05_12_49 PM (6).png` | 1448 x 1086 | ProstheticFit / card |
| N008 | `New folder/ChatGPT Image Sep 20, 2026, 05_12_50 PM (7).png` | 1672 x 941 | RemoteCare / heroDark |
| N009 | `New folder/ChatGPT Image Sep 20, 2026, 05_12_50 PM (8).png` | 1672 x 941 | RemoteCare / heroLight |
| N010 | `New folder/ChatGPT Image Sep 20, 2026, 05_12_50 PM (9).png` | 1448 x 1086 | RemoteCare / card |
| N011 | `New folder/ChatGPT Image Sep 20, 2026, 05_19_08 PM (1).png` | 1672 x 941 | ClinicalTrials / heroDark |
| N012 | `New folder/ChatGPT Image Sep 20, 2026, 05_19_09 PM (2).png` | 1672 x 941 | ClinicalTrials / heroLight |
| N013 | `New folder/ChatGPT Image Sep 20, 2026, 05_19_09 PM (3).png` | 1448 x 1086 | ClinicalTrials / card |
| N014 | `New folder/ChatGPT Image Sep 20, 2026, 05_19_10 PM (4).png` | 1672 x 941 | SuspiciousMotion / heroDark; Watchlist / heroDark |
| N015 | `New folder/ChatGPT Image Sep 20, 2026, 05_19_11 PM (5).png` | 1672 x 941 | SuspiciousMotion / heroLight; Watchlist / heroLight; Watchlist / card |
| N016 | `New folder/ChatGPT Image Sep 20, 2026, 05_19_12 PM (6).png` | 1448 x 1086 | SuspiciousMotion / card |
| N017 | `New folder/ChatGPT Image Sep 20, 2026, 05_19_12 PM (7).png` | 1672 x 941 | CrowdSense / heroDark |
| N018 | `New folder/ChatGPT Image Sep 20, 2026, 05_19_13 PM (8).png` | 1672 x 941 | CrowdSense / heroLight |
| N019 | `New folder/ChatGPT Image Sep 20, 2026, 05_19_14 PM (9).png` | 1448 x 1086 | CrowdSense / card |
| F065 | `ChatGPT Image Sep 16, 2026, 02_20_58 AM (4).png` | 1672 x 941 | IndustrialSafety / heroDark |
| F066 | `ChatGPT Image Sep 16, 2026, 02_20_59 AM (5).png` | 1672 x 941 | IndustrialSafety / heroLight |
| F067 | `ChatGPT Image Sep 16, 2026, 02_20_59 AM (6).png` | 1448 x 1086 | IndustrialSafety / card |
| N023 | `New folder/ChatGPT Image Sep 20, 2026, 05_49_51 PM (1).png` | 1672 x 941 | PrivacyGuard / heroDark; AccessMotion / heroDark |
| N024 | `New folder/ChatGPT Image Sep 20, 2026, 05_49_52 PM (2).png` | 1672 x 941 | PrivacyGuard / heroLight; AccessMotion / heroLight |
| N025 | `New folder/ChatGPT Image Sep 20, 2026, 05_49_52 PM (3).png` | 1448 x 1086 | PrivacyGuard / card |
| N026 | `New folder/ChatGPT Image Sep 20, 2026, 05_49_53 PM (4).png` | 1672 x 941 | CampusShield / heroDark |
| N027 | `New folder/ChatGPT Image Sep 20, 2026, 05_49_53 PM (5).png` | 1672 x 941 | CampusShield / heroLight |
| N028 | `New folder/ChatGPT Image Sep 20, 2026, 05_49_54 PM (6).png` | 1448 x 1086 | CampusShield / card |
| N029 | `New folder/ChatGPT Image Sep 20, 2026, 05_49_54 PM (7).png` | 1672 x 941 | EventShield / heroDark |
| N030 | `New folder/ChatGPT Image Sep 20, 2026, 05_49_54 PM (8).png` | 1672 x 941 | EventShield / heroLight; AccessMotion / card |
| N031 | `New folder/ChatGPT Image Sep 20, 2026, 05_49_55 PM (9).png` | 1448 x 1086 | EventShield / card |
| F068 | `ChatGPT Image Sep 16, 2026, 02_20_59 AM (7).png` | 1672 x 941 | RetailGuard / heroDark |
| F069 | `ChatGPT Image Sep 16, 2026, 02_20_59 AM (8).png` | 1672 x 941 | RetailGuard / heroLight |
| F070 | `ChatGPT Image Sep 16, 2026, 02_21_00 AM (9).png` | 1448 x 1086 | RetailGuard / card |
| N041 | `New folder/ChatGPT Image Sep 20, 2026, 05_58_10 PM (1).png` | 1672 x 941 | ForensicSearch / heroDark; ForensicSearch / card; ReID / heroDark |
| N042 | `New folder/ChatGPT Image Sep 20, 2026, 05_58_11 PM (2).png` | 1672 x 941 | ForensicSearch / heroLight; ReID / heroLight |
| N043 | `New folder/ChatGPT Image Sep 20, 2026, 05_58_11 PM (3).png` | 1448 x 1086 | ReID / card |
| N044 | `New folder/ChatGPT Image Sep 20, 2026, 05_58_12 PM (4).png` | 1672 x 941 | DefenceMotion / heroDark |
| N045 | `New folder/ChatGPT Image Sep 20, 2026, 05_58_13 PM (5).png` | 1672 x 941 | DefenceMotion / heroLight |
| N046 | `New folder/ChatGPT Image Sep 20, 2026, 05_58_13 PM (6).png` | 1448 x 1086 | DefenceMotion / card |

## Files excluded from the nested folder

- **N001, N020, N021, N022:** collages/overview sheets. Not split or used as standalone assets.
- **N032-N040:** nine exact duplicate exports of N023-N031. Earlier copies are selected; duplicates do not increase coverage.
- **All 33 unique standalone nested-folder photographs are used.** No unmatched standalone photographs remain.
- The earlier **F074 DefenceMotion poster** stays excluded with its warning archived. New N044/N045/N046 supply clean dark/light/card imagery. DefenceMotion remains one product with Army/Navy/Air Force modes.

## Framing and loading

Source resolutions are retained in quality-94 WebP masters. Cards use a consistent 4:3 cover frame and responsive srcsets; wide-source cards account for cover scaling. Heroes use the existing shared theme component and fixed aspect ratios. RemoteCare, ClinicalTrials, ForensicSearch and DefenceMotion use a wider desktop image frame to retain the laptop session, research participant/clinician, camera-view context and installation environment. Other page structure is unchanged.
