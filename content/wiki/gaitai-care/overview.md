## What GaitAI Care does

Application access: [Open Web App](https://care.gaitai.in/) · [Get Android App](/gaitai-care/download/) · [Product overview](/gaitai-care/). The Android page records current download availability and release checks.

GaitAI Care organizes personal and family health records over time. A profile brings together uploaded medical documents, reviewed extractions, medications, vaccinations, hospital visits, illness history and daily-care observations. Records can be inspected as histories, timelines and summaries, with exports for a person to review or share.

The product is a health-record organizer. It is not established as an autonomous diagnostic system, prescribing engine or certified clinical decision-support device. Source-reviewed functionality describes software behavior; it does not establish clinical accuracy or regulatory approval.

```diagram
care-system
```

## Three documentation areas

| Area | Read it for | Common infrastructure |
|---|---|---|
| [Web application](/insights/wiki/gaitai-care/web/) | Browser UI, page structure, sessions, hosting and browser tests | Uses the shared API |
| [Android application](/insights/wiki/gaitai-care/android/) | Capacitor shell, native integrations, local notifications and release artifacts | Uses the same accounts and API |
| [Shared backend](/insights/wiki/gaitai-care/backend/) | Authentication, records, PostgreSQL, private files, extraction and email | Serves both clients |

The clients share interface source but have different delivery and operating-system behavior. Neither has its own independent patient database. Start with the [platform comparison](/insights/wiki/gaitai-care/comparison/) for the boundaries.

## Implemented scope

The reviewed source contains account registration and recovery, family profiles, document upload and review, medical histories, medication and vaccination records, daily-care tracking, timeline views, exports and scoped doctor-sharing workflows. Availability still depends on deployment configuration and the account's permissions.

The Android client is implemented in Capacitor, with version 1.0.0 declared in the Android project. Local APK and AAB artifacts were inspected during this documentation review. Store publication and broad device qualification are separate questions; see [release evidence](/insights/wiki/gaitai-care/android/release/).

## Evidence and status

| Label | Meaning |
|---|---|
| Source-verified | Present in the source snapshot reviewed on 12 October 2026 |
| Artifact-verified | Observed in the release files examined for this review |
| Historical report | Described in the supplied documentation or earlier test report; not rerun here |
| Planned or pending | Proposed work, or a claim for which release evidence is incomplete |

The source snapshot matched the remote repository HEAD at review time. This library is a dated architecture reference, not a live status dashboard.

## Product boundaries

GaitAI Care, the corporate GaitAI website and the original ChildCare deployment are separate systems. This documentation does not migrate records between them. MobilityCare, SecureVision and GaitAI Core have their own documentation directory entries; their technical guides remain pending until real, reviewed material is supplied.
