## Backend-managed identity

The source implements account registration, consent, email verification, session validation, password recovery and account deletion. Identity belongs to the Python service; Firebase's role in this architecture is frontend hosting.

## Layered access decision

Protected access depends on a valid account session, the required account state and authorization for the requested profile or resource. Some workflows have additional role or guardian requirements. Ownership checks therefore apply beyond initial sign-in: reads, edits, exports, file retrieval, sharing and deletion each need appropriate scope.

```text
Valid account session
  + required account state
  + authorized resource scope
  + workflow-specific permission
  = eligible operation
```

This is an architectural explanation, not a literal policy expression or an access procedure.

## Client responsibilities

The browser presents account screens and browser session state. Android adapts session persistence through its native store. Neither client should treat local state as permission to access a resource. Rejected or expired sessions must return the user to an appropriate recovery or sign-in path.

## Account lifecycle

Verification and reset actions are validated by the backend. Sign-out, password changes and deletion affect the lifecycle beyond the current UI. Tests should cover old links, previously active sessions and access after state changes using approved synthetic accounts.

The public documentation intentionally avoids exposing token formats, internal allowlists, privileged operations or authentication configuration values.
