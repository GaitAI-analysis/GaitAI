## Session storage on Android

The implemented native store uses Android Keystore-backed encryption for small session values. Ciphertext is kept in app-private storage. The mobile boot adapter routes the application's session operations through that store, allowing a session to survive an app restart without treating plain browser storage as the native persistence mechanism.

This is session protection, not an on-device medical-record database and not a claim of end-to-end encryption of all product data. The API still validates each session and requested resource.

## Lifecycle behavior

| Event | Intended interpretation |
|---|---|
| App restarts | Previously stored session state can be restored |
| Server rejects the session | The client must return to an appropriate account flow |
| User signs out | Application session state is cleared through the shared account behavior |
| Device key is unavailable | Stored values cannot be treated as a usable session; sign-in is needed again |
| App is reinstalled or data is reset | Device-bound state may be lost |

## Backup and transport boundaries

The app configuration excludes ordinary application backup for this data and disallows cleartext network traffic. These are source-level settings. They do not replace device security, a safe JavaScript rendering boundary or backend authorization.

## Validation scope

The repository's Android test narrative describes restarting the app to check session persistence. That is historical test evidence, not proof that every operating-system version and device configuration has been covered. Public documentation omits key aliases, key files, signing material and storage internals that would serve as operational instructions.
