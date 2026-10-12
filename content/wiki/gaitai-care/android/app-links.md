## Account-link flow

Android intent filters declare the Care account-link hosts, and the web application contains an association asset for Android App Links. The mobile layer handles both an incoming link while the app is running and the initial launch URL.

```diagram
email-sequence
```

The native handler passes recognized verification or password-reset actions into the shared account interface. The common backend validates the action; opening a link alone does not establish authorization.

## Verified association versus fallback

Android link verification depends on the installed app's signing identity and the website's association data. When the association is not verified or the installed build uses another signing identity, the browser can complete the same account step. The application's confirmation action then refreshes its account state.

| Scenario | Expected route |
|---|---|
| Verified release association | Link can open in the Android application |
| Unverified association or different build identity | Browser fallback |
| Stale or invalid action link | Account interface displays failure or offers a fresh flow |
| App already open | Incoming link replaces the relevant account subflow |

## Store release consideration

Store-distributed signing identity can differ from a locally signed release. Association validation must be repeated for the actual distribution artifact. The public Wiki does not include signing certificates, certificate fingerprints, link tokens or association configuration values.

## Test boundary

The source Android narrative records historical verification and reset link checks. Source intent filters and historical success do not establish that every currently installed device has completed association verification.
