## Hosting responsibility

Firebase Hosting serves the Care browser application and static assets. Its role is delivery: the application accounts and medical data are managed by the shared backend. Firebase Hosting should not be confused with Firebase Authentication, Firestore or Firebase Storage in this architecture.

The branded Care domain is a patient-facing entry point. Backend and provider addresses are intentionally omitted from this public guide. A browser client reaching its own page does not establish that every downstream service is healthy.

## Custom-domain lifecycle

The original documentation recorded an earlier certificate-issuance stage. That observation is historical and is not carried forward as a statement of today's domain status. Domain mapping, HTTPS certificate validity, routing and application delivery are separate checks.

| Check | What it establishes |
|---|---|
| Domain resolves | DNS can locate the host |
| Valid HTTPS | The browser can establish a trusted encrypted connection |
| Correct application renders | Hosting serves the intended frontend |
| Account workflow completes | Frontend and backend integrate for the tested scenario |

## Release boundary

The Care CI file validates web code and browser behavior. Its presence does not prove that every commit automatically publishes Firebase Hosting. Frontend hosting, backend deployment, database changes and email relay changes are separately coordinated surfaces.

## Safe troubleshooting

If the browser reports a certificate or site-routing problem, use the official support channel and avoid entering health information through a warning bypass. The public Wiki does not reproduce DNS records, project identifiers, console access procedures or privileged deployment configuration.
