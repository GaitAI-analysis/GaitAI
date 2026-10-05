# GaitAI MobilityCare — App Privacy answers (draft)

Basis: the app as built on `feature/ios-apps`. Re-check before every submission.

## What the app does with data
- Video is recorded or picked, copied into the app's cache, analysed by the on-device engine
  (MediaPipe inside WKWebView), then deleted unless "Keep analysed videos" is on. Nothing is
  sent to a server.
- Results (metrics, timestamps, quality flags) are stored on the device (AsyncStorage).
- "Share anonymous usage events" stores event names locally only; there is no analytics backend.
- Subscriptions are handled by Apple (StoreKit). The app keeps the last entitlement verdict on
  the device.
- No account, no sign-in, no push notifications, no location, no contacts, no tracking.

## App Privacy questionnaire
**Does the app collect data?** → **No, we do not collect data from this app.**
Reason: no data leaves the device to the developer or third parties. Purchases are processed
by Apple and are not collected by the developer.

If any of the following ships, this answer changes and the privacy manifest must gain
`NSPrivacyCollectedDataTypes`: cloud backup / account sync, server-side receipt validation,
crash reporting or analytics SDKs, support chat.

## Privacy manifest (app.json → ios.privacyManifests)
- NSPrivacyTracking: false; no tracking domains
- Collected data types: none
- Accessed API reasons: UserDefaults CA92.1, FileTimestamp C617.1, SystemBootTime 35F9.1, DiskSpace E174.1

## Permissions requested
Camera (recording a walk), Photo library (choosing a video; the system picker does not prompt).
Not requested: microphone (recordings are muted), photo-library-add, location, contacts, tracking.

## Privacy policy URL
https://gaitai.in/legal/privacy/ — confirm it describes on-device processing and local storage
in the same terms as the app before submission.
