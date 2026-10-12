## Verified CI structure

| Job | Purpose in the reviewed workflow |
|---|---|
| Backend | Run tests with SQLite and a PostgreSQL staging setup |
| Web | Validate JavaScript, relay units and browser specifications |
| Container | Build and boot the API container with throwaway test data |
| Android | Synchronize assets and compile a debug APK |

The inspected current workflow completed successfully. Job definitions and results describe that revision's checks; they do not prove continuous production health.

```diagram
cicd-architecture
```

## Deployment surfaces

The supplied architecture narrative describes a Render-hosted Python API, Firebase-hosted frontend, Supabase database and storage, and an Edge Function email relay. These surfaces have separate release mechanisms. A single green CI badge should not be interpreted as evidence that all were deployed atomically.

## Compatibility model

Schema, backend and clients must remain compatible across an update. Existing Android installations can lag behind the browser UI. A safe release record ties together source, schema compatibility, application artifacts and observed behavior without exposing configuration or service access details.

## Release checks

Review migration behavior, test output, container startup and interface compatibility before deployment. After an authorized release, verify the intended public UI and approved synthetic workflows, then record cleanup and recovery evidence.

The public Wiki does not contain private deployment commands, dashboard instructions, infrastructure identifiers or credentials. Android packaging is covered separately in [the Android build guide](/insights/wiki/gaitai-care/android/build/).
