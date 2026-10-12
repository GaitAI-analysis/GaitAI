## Local processing path

The source uses PyMuPDF to read PDF content and a Tesseract integration for OCR where needed. Pillow supports image handling, including an optional HEIF integration. Classification and structured candidate extraction then produce information for the review workflow.

## Proposed versus confirmed data

Candidate extraction can identify medication, vaccination and laboratory-observation information. Ambiguous dates or missing units must not be silently interpreted as established facts. The review flow preserves a distinction between extracted text, proposed fields and accepted records.

```diagram
ingestion
```

## Optional external vision adapter

The current source contains an adapter that can transmit selected document-page images to a configured external transcription provider. It requires explicit consent for the document and identifies the provider before transmission. Returned text remains unverified and enters review.

This corrects the original bundle's overly broad description of future provider support. The adapter exists in source; whether a production provider is configured was not established by this review. It is not appropriate to claim that no document can leave the service, or that every document is sent to external AI.

## Analytics boundary

Confirmed and otherwise eligible records inform histories, search, chronology, trend displays and PDF summaries. Analytics cannot establish missing clinical context or make an unreviewed extraction reliable. A displayed trend depends on source completeness, compatible units, dates and the record's review state.

## Not established

The source does not establish autonomous diagnosis, treatment prescribing or general clinical interpretation as validated product capabilities. The optional adapter is a transcription integration. Future inference features would require their own consent, provenance, validation and governance work.
