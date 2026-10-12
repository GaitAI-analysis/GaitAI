## Account journey

The browser presents registration, privacy consent, email verification, sign-in, password recovery, sign-out and account-deletion interfaces. These screens invoke the backend's identity workflows; Firebase Hosting does not independently grant access to medical records.

```diagram
auth-sequence
```

## Browser session behavior

The reviewed web code uses browser session storage for session state. This is distinct from Android's native encrypted session handling. A token being present in the UI does not mean it is still valid: expiration, sign-out or an account change can require a new sign-in.

Protected access is evaluated by the API using the session, account state and requested resource. The [shared authentication guide](/insights/wiki/gaitai-care/backend/authentication/) covers that authority once for both platforms.

## Verification and recovery links

Account email links bring the browser into the appropriate verification or recovery screen. A fresh valid link and successful server validation are required. The interface must handle stale links and logged-out users without exposing account tokens in help requests or screenshots.

## User-facing troubleshooting

If a link is stale, request a new message through the application. If sign-in succeeds but record access remains unavailable, check the verification state shown by the app. Repeated refreshes do not replace the server-side verification step.

Session handling should be assessed together with input rendering and script restrictions. This guide describes the reviewed architecture; it does not assert that browser-side storage alone guarantees protection against every threat.
