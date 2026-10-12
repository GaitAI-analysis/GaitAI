## Delivery model

Firebase Hosting delivers the application shell and assets. The browser loads ordinary JavaScript modules that manage UI state, render feature screens and invoke the Care API over HTTPS. The reviewed web client does not use a React or Next.js application build.

```diagram
web
```

The diagram shows logical responsibility, not private network addresses. The API and persistence tiers are explained in [shared system architecture](/insights/wiki/gaitai-care/backend/architecture/).

## Technology inventory

| Layer | Source-verified choice | Responsibility |
|---|---|---|
| Markup | HTML document and templates | Application shell and feature screens |
| Interaction | Browser JavaScript | Navigation, state, form actions and requests |
| Styling | Base and feature CSS | Layout, responsive behavior and brand themes |
| Visualization | Chart and analytics modules | Display of available record history |
| Browser delivery | Firebase Hosting configuration | Static assets and hosting behavior |
| Backend integration | HTTPS requests | Authoritative data and account operations |

## State and authority

Client state tracks the selected profile, visible section, loading state and returned records. It must not be interpreted as permission to access a record. The backend determines whether the current account can perform the requested operation. A hidden UI control is not a substitute for an authorization check.

## Update implications

Browser assets are delivered by a hosting release. Android packages a snapshot of the same source, so the browser and an older installed app can run different versions. Changes to shared responses therefore require compatibility testing with both clients rather than assuming a frontend deploy updates every user.
