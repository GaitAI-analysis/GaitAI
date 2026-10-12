## Implemented versus published

The Android client is implemented and local signed artifacts exist. The reviewed source documentation still describes Google Play submission as pending. There is no evidence here of a public Play Store launch, store review approval or completed physical-device qualification.

## Version management

The source declares version name 1.0.0 and version code 1. A later release needs a deliberate version change and a new synchronized bundle. The backend may evolve independently, so installed clients require compatibility consideration even when the browser already serves a newer interface.

## Store-readiness work

| Topic | Remaining release evidence |
|---|---|
| Distribution artifact | Resolve verifier warnings and validate the intended AAB |
| App Links | Validate association for the actual store-signed app |
| Device testing | Record representative physical-device results |
| Privacy disclosures | Align with real storage, exports and optional external transcription |
| Permissions | Review the merged manifest and justify actual use |
| Store listing | Approved assets, product descriptions and required disclosures |
| Account/data deletion | Verify the published user journey and policy alignment |

These are release-review categories, not instructions for accessing private store or signing infrastructure. Current store requirements should be checked at the time of submission.

## Known limitations

The app depends on network access for record operations. It is not an offline-first medical database. Local reminders can be affected by OS scheduling and stale synchronization. A successful emulator run does not guarantee all-device behavior. Optional vision transcription requires explicit consent and configured service support.

Planned improvements and verification work carry no promised delivery date. The shared [data recovery](/insights/wiki/gaitai-care/backend/recovery/) and [backend roadmap](/insights/wiki/gaitai-care/backend/roadmap/) remain relevant to both clients.
