## Domain-oriented API

The Python application groups functionality around identity, profiles, medical history, daily care, documents, extraction review, exports and sharing. FastAPI routing and Pydantic schemas define request handling; the shared web client and Android package consume these services.

| Domain | Responsibility |
|---|---|
| Identity | Registration, verification, sessions and recovery |
| Profiles | Account-associated people and profile settings |
| Records | History, medications, vaccinations, observations and care events |
| Documents | Validation, protected storage and review state |
| Extraction | Candidate information and confirmed-record creation |
| Export and sharing | Selected summaries and scoped access workflows |

## Contract principles

Input validation and authorization are separate. A well-formed request can still be unauthorized; an authenticated account can still lack access to a particular resource. Clients must handle rejected, stale and invalid requests without interpreting a cached UI state as proof of permission.

Public examples are intentionally conceptual. This Wiki is not a dump of internal route schemas or operational endpoints.

```json
{
  "workflow": "document-review",
  "input": "candidate fields",
  "decision": "human confirmation",
  "output": "reviewed records"
}
```

The example illustrates stages, not a callable API request or response.

## Compatibility and retries

A lost response does not prove a write failed. Retrying reads and retrying record creation have different consequences. Release testing needs to check response recovery and duplicate prevention for the actual operation, not apply a universal retry rule.

The ZIP's earlier route and operation counts were historical inventory measurements. They are not reproduced as current API-size claims.
