## Upload to review

The browser lets an authorized user select a medical file and associate it with a profile. It sends the file to the backend for validation, protected storage and extraction. The client displays the resulting state and proposed information; it does not become the authoritative parser or document store.

```diagram
ingestion
```

## Reviewable information

Extraction can propose medication, vaccination or observation fields from supported report content. Dates, names, values, units and interpretations can be incomplete or wrong. The review interface gives the user an opportunity to confirm or correct those proposals against the original document before creating confirmed structured records.

| State | Reader interpretation |
|---|---|
| Uploaded | A file has entered the document workflow |
| Extracted or needs review | Candidate text or fields are available, but remain unverified |
| Confirmed | The review workflow has accepted selected records |
| Failed or incomplete | The file needs attention; do not infer missing values |

These are workflow descriptions, not a published API response schema.

## Optional external transcription

The source contains an optional vision-transcription integration. It requires configuration and explicit per-document consent. When enabled, document page images can be sent to the selected provider. This must not be described as a guarantee that all extraction is local or that external processing is always enabled.

Processing details, provenance and storage belong in [extraction and analytics](/insights/wiki/gaitai-care/backend/extraction/) and [private document storage](/insights/wiki/gaitai-care/backend/storage/). The Android-specific picker and file-viewer behavior is covered in [Android file handling](/insights/wiki/gaitai-care/android/files/).
