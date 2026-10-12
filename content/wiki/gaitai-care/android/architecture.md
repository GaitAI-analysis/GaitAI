## Layered architecture

The native Android activity hosts a Capacitor WebView. Packaged HTML, JavaScript and CSS provide the shared interface. Capacitor plugins and a small custom native plugin bridge selected capabilities between JavaScript and Android. Health-record operations still use the shared Python API over HTTPS.

| Layer | Implementation | Role |
|---|---|---|
| Shared interface | Existing web source | Records, forms, review and summaries |
| Mobile overlays | JavaScript and CSS | Navigation, native event handling and phone layout |
| Bridge | Capacitor 8 | Communication with Android capabilities |
| Native shell | Android activity and Java plugin | Session store and system file viewer |
| Native integrations | App, Browser, Network, Filesystem, Share, SplashScreen, LocalNotifications | Platform services |
| Backend | Shared Care API | Account authority and medical data |

```diagram
android-architecture
```

## Packaged rather than remote UI

The sync process copies shared assets into the mobile build. An installed app therefore contains a specific UI snapshot. It does not simply become the latest web release whenever Firebase assets change. A mobile update must be assembled and released separately.

## Data boundary

The device keeps the session and necessary temporary files; it does not implement an independent patient-data store. Server-backed operations require a connection. See [shared architecture](/insights/wiki/gaitai-care/backend/architecture/) and [offline behavior](/insights/wiki/gaitai-care/android/offline/) for the boundaries.

## Version interpretation

Capacitor major version, Android SDK configuration and application version are different identifiers. Application 1.0.0 does not mean Capacitor 1 or Android 1. The [build guide](/insights/wiki/gaitai-care/android/build/) records the inspected tooling separately.
