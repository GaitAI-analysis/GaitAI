## Browser security boundary

The browser is an untrusted client. It displays records and submits user actions, while the API owns identity, authorization and protected file access. Hosting configuration includes browser security policies; their presence in source is not an independent verification of live response headers.

| Surface | Architectural expectation |
|---|---|
| Forms and rendered text | Validate inputs and treat record content as untrusted |
| Scripts and external content | Limit unexpected executable content |
| Sessions | Clear account state appropriately and handle rejection from the API |
| Downloads | Avoid accidental persistence or disclosure on shared devices |
| Account links | Handle verification and recovery without sharing tokens |

Shared data and privacy controls are documented in [security and isolation](/insights/wiki/gaitai-care/backend/security/).

## Accessibility considerations

Forms, navigation, dialogs and review tables must be usable with a keyboard and understandable labels. Focus needs to remain visible; opening and closing a dialog should preserve a usable reading and navigation order. Narrow layouts, enlarged text, high contrast and long filenames are useful stress cases for a medical-record interface.

The source includes responsive layouts and interface states, but this review does not establish a complete WCAG conformance audit of the Care application. Accessibility testing remains a release requirement, particularly for custom dialogs, charts and extraction review.

## Scope of assurance

An architecture review does not prove the absence of vulnerabilities, certify legal compliance or establish medical suitability. The public documentation deliberately omits confidential configuration, operational bypasses and access procedures. User-facing issues should be reported without patient records or credential-bearing screenshots.
