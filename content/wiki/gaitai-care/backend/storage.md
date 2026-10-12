## Split storage responsibility

The relational database stores document metadata and relationships. A storage adapter handles protected file bytes. The source supports private Supabase object storage and a local mode for appropriate test or development contexts. The supplied hosted architecture reports Supabase storage for medical documents.

```diagram
document-pipeline
```

## Ingestion

An authorized upload is validated and associated with its profile. Protected bytes and metadata are written through their respective tiers. Extraction then produces text or candidates for review. Confirmed records are a later workflow result, not a property of merely uploading a file.

## Retrieval

Clients do not receive an unrestricted public medical-file directory. The backend mediates document access and associates retrieval with authorized application workflows. Downloaded or exported files can nevertheless persist on a user's device after the request completes.

## Integrity and partial failure

Object storage and relational writes can fail independently. A file without its expected metadata, metadata referencing unavailable bytes, or an interrupted download needs explicit handling. Historical test reports describe investigating interrupted transfers and cleaning an orphaned synthetic object; these are lessons about failure handling, not current incident claims.

## Review priorities

File validation, parser robustness, size limits, deletion behavior and restoration need continuing tests with synthetic fixtures. The public guide does not publish bucket names, object naming conventions, storage keys or retrieval-signing mechanics.

For what happens after retrieval or extraction, see [extraction](/insights/wiki/gaitai-care/backend/extraction/) and [exports and sharing](/insights/wiki/gaitai-care/backend/exports/).
