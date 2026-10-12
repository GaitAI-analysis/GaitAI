## Shared service boundary

The Care web and Android clients use one Python API and common account and health-record model. The backend coordinates persistence, private files, extraction, exports and account email. A client-specific UI capability does not create a separate source of patient truth.

```diagram
care-system
```

## Infrastructure roles

| Service | Architectural role |
|---|---|
| Python API on Render | Validated requests and product workflows |
| Supabase PostgreSQL | Persistent relational records |
| Supabase private storage | Protected document objects |
| Supabase Edge Function | Account-email relay |
| Hostinger mail | Reported hosted SMTP delivery provider |

Provider roles come from reviewed integrations and the supplied deployment narrative. Exact runtime configuration, topology identifiers and service addresses remain private. Source support is not the same as a live infrastructure attestation.

## How to use this section

Read [system architecture](/insights/wiki/gaitai-care/backend/architecture/) for request flow, [the data model](/insights/wiki/gaitai-care/backend/data-model/) for relationships and [extraction](/insights/wiki/gaitai-care/backend/extraction/) for the boundary between raw documents and confirmed records. Platform-specific presentation is covered in the [web](/insights/wiki/gaitai-care/web/) and [Android](/insights/wiki/gaitai-care/android/) areas.
