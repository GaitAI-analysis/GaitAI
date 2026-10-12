## One product, two clients

Both clients use the same health-record service. The Android application packages the web interface and adds a native bridge; it is not a separately implemented database or identity system. A web deployment and an installed APK can therefore have different interface versions while accessing the same account.

| Capability | Web application | Android application |
|---|---|---|
| Profiles, histories and daily care | Shared web feature modules | The same modules bundled in the app |
| Upload and extraction review | Browser file input and review screens | File input plus camera/gallery choice |
| Account access | Browser session handling | Session handling adapted to encrypted native storage |
| Navigation | Browser layout and feature navigation | Bottom navigation, all-sections sheet and Android back handling |
| Account email links | Open in the browser | App Links when verified; browser fallback |
| PDF exports | Browser download or preview | Temporary file handoff to the Android system viewer |
| Reminder presentation | In-app notification views; browser push support depends on setup | Optional scheduled local notifications |
| Offline behavior | Server-backed operations need a connection | Offline banner; no offline record-editing database |
| Updates | New static frontend deployment | New packaged app release |
| Hardware integration | Browser capabilities and permissions | Native bridge and Android permission flow |

## What the comparison does not promise

Sharing source does not prove identical behavior on every browser or Android device. File choosers, keyboards, notification delivery and verified links depend on the platform. Android-only screens and permission flows have their own [testing requirements](/insights/wiki/gaitai-care/android/testing/).

The source includes a configurable external document-transcription adapter with per-document consent. Its existence is not evidence that it is enabled for either client in production. See [extraction and analytics](/insights/wiki/gaitai-care/backend/extraction/) for the common processing boundary.

## Choosing a guide

Use [Web application documentation](/insights/wiki/gaitai-care/web/) for browser navigation and hosting. Use [Android application documentation](/insights/wiki/gaitai-care/android/) for native behavior and release management. Use [Shared backend documentation](/insights/wiki/gaitai-care/backend/) for data ownership, API semantics, storage and recovery. Shared behavior is described once, then linked from the client guides.
