# GaitAI SecureVision — App Privacy answers (draft)

Basis: the app as built on `feature/ios-apps`. Re-check before every submission.

## What the app does with data
- Video is recorded or picked, copied into the app's cache, analysed by the on-device engine
  (MediaPipe EfficientDet-Lite0 person detector inside WKWebView), then deleted unless "Keep
  analysed videos" is on. Nothing is sent to a server.
- Counts, zone geometry and timelines are stored on the device.
- The detector outputs bounding boxes only; no faces, identities or biometric templates are
  computed or stored.
- "Share anonymous usage events" stores event names locally only; there is no analytics backend.
- Subscriptions are handled by Apple (StoreKit). The app keeps the last entitlement verdict on
  the device.
- No account, no sign-in, no push notifications, no location, no contacts, no tracking.

## App Privacy questionnaire
**Does the app collect data?** → **No, we do not collect data from this app.**
Reason: no data leaves the device to the developer or third parties.

Changes that would alter this answer: cloud sync, server-side receipt validation, analytics or
crash SDKs, cloud video processing.

## Privacy manifest (app.json → ios.privacyManifests)
- NSPrivacyTracking: false; no tracking domains
- Collected data types: none
- Accessed API reasons: UserDefaults CA92.1, FileTimestamp C617.1, SystemBootTime 35F9.1, DiskSpace E174.1

## Permissions requested
Camera (recording a space), Photo library (choosing a video; the system picker does not prompt).
Not requested: microphone (recordings are muted), photo-library-add, location, contacts, tracking.

## Lawful-use note
The app asks the user to analyse only footage they are authorised to analyse. It performs no
identification. State this in the review notes and keep it in the in-app copy.
