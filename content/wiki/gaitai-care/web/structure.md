## Module organization

The web source is organized around a common shell with separate files for product domains. Feature modules extend rendering and action handling rather than forming independent deployed services. The table is a public source map; it contains no local machine paths or configuration values.

| Source group | Role |
|---|---|
| `index.html` | Document shell, styles and ordered script loading |
| `app.js` | Core state, shared requests, base rendering and actions |
| Care and history modules | Daily observations, historical records and timelines |
| Profile and lifetime modules | Profile-specific views and longitudinal information |
| Extraction and document modules | Upload, candidate review and document presentation |
| Export and sharing modules | Summary creation and doctor-sharing UI |
| Password and branding modules | Account screens, recovery and product presentation |
| Chart and analytics modules | Trend displays from returned records |
| Feature CSS | Styling for corresponding areas |

## Loading order

The base state and request helpers must exist before modules extend them. This matters for the Android build: its boot layer is inserted before the base application, and its mobile interface layer is inserted after the feature modules. See [shared code and mobile overlays](/insights/wiki/gaitai-care/android/shared-code/).

```text
Document shell
  → base state and request helpers
  → product feature modules
  → rendered screen and user actions
```

## Component boundaries

Here, “component” refers to a UI responsibility such as a profile selector, document list, modal or timeline. It does not imply React components. A source change should be evaluated for its effect on both the hosted web client and the packaged mobile client.

## Maintenance considerations

Shared request and rendering hooks make reuse practical, but changes to global helpers can affect many screens. JavaScript syntax checks catch parsing errors; browser workflow tests are needed for runtime integration, event handling and script-order regressions.
