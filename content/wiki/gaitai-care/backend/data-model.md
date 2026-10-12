## Persistence model

SQLAlchemy models and Alembic migrations define the backend's relational structure. PostgreSQL is the reported production database through Supabase. SQLite support also exists for local and automated testing, so local behavior should not be assumed to prove all production database semantics.

```diagram
data
```

The diagram is conceptual. Labels are domain concepts rather than literal database identifiers or a complete physical schema.

## Data domains

| Domain | Representative information |
|---|---|
| Account | Identity, consent and account lifecycle |
| Profile | Person context, relationships and preferences |
| Medical history | Illness, treatment, hospital and longitudinal events |
| Daily care | Observations, timelines and associated context |
| Documents | File metadata, profile relationship and processing state |
| Reviewed values | Confirmed information with source provenance |
| Exports and sharing | Selected record sets and scoped access state |

## Provenance and time

Raw files, extracted candidates and confirmed records are different layers. A document can propose several records, and a person can correct them before confirmation. Histories also need meaningful dates and timezone handling; an ingestion timestamp is not necessarily the date of the medical event.

## Schema evolution

The repository includes migrations for the main record domains, later profile and care features, account flows and relay-related persistence. The old bundle's table count is not treated as the current schema count. Migration compatibility and tested recovery matter more than an unverified inventory number.

Database structure alone does not establish the runtime access policy. See [security and isolation](/insights/wiki/gaitai-care/backend/security/) for the boundary between source controls and production assurance.
