## Runtime architecture

The reviewed backend is a Python FastAPI application served through Uvicorn. It is best understood as a modular monolith: separate source modules implement domains, but their existence does not imply separately deployed microservices. The reported hosted API deployment uses Render.

```diagram
system
```

## Verified technology stack

| Concern | Source evidence |
|---|---|
| HTTP application | FastAPI with Pydantic input models |
| Runtime | Python; container base uses Python 3.12 |
| Serving | Uvicorn ASGI server |
| Persistence | SQLAlchemy and PostgreSQL support through psycopg |
| Schema evolution | Alembic migrations |
| Document text | PyMuPDF and Tesseract integration |
| Images | Pillow and HEIF support |
| Application encryption | Python cryptography library |
| PDF reports | ReportLab |
| Tests | pytest, HTTP clients and browser specifications |

## Request lifecycle

A client submits a request. The service validates the input, resolves the account and resource scope, executes the domain workflow and returns an appropriate response. Data operations and object-storage operations are different steps; failure handling must account for work completed in one tier but not another.

## Configuration boundary

Source supports multiple persistence and provider modes, including local test configurations. The production topology described in the ZIP is a deployment report, not proof that every optional adapter is active. Confidential settings, connection strings and internal operations are intentionally excluded from public diagrams.
