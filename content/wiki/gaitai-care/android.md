## Implemented Android client

GaitAI Care for Android packages the shared web application inside a Capacitor 8 native shell. The reviewed Android configuration declares version name 1.0.0 and version code 1. It uses the same backend accounts and records as the web application.

The original ZIP's “Android framework unconfirmed” description is superseded by the current source and local release artifacts. This does not establish Play Store publication.

```diagram
android
```

## What is native

The mobile layer adds encrypted session persistence, bottom navigation, back-button behavior, account-email link handling, camera/gallery choice, file opening, network-state messaging, a splash screen and opt-in phone reminders. These integrations adapt the shared UI rather than introducing a separate health-record database.

## Release evidence at a glance

| Evidence | Review outcome |
|---|---|
| Capacitor implementation and 1.0.0 configuration | Verified in source |
| Local release APK | Present; APK signature verification succeeded |
| Local AAB | Present; JAR verification reported success with warnings requiring release review |
| Latest reviewed GitHub workflow | Completed successfully |
| 65/65 emulator checks | Owner-reported; exact count not independently reproduced or supported by a located raw result file |
| Play Store release | Not established; source documentation describes publication as pending |

Read [release and signing evidence](/insights/wiki/gaitai-care/android/release/) for qualifications. The remaining guides separate source behavior from emulator reports, physical-device qualification and store readiness.
