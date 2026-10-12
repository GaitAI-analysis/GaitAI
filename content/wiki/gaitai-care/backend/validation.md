## Historical results from the supplied bundle

The original architecture documentation was based on owner-provided deployment logs. The results below preserve useful evidence while keeping its provenance explicit. They were not rerun against the Care production service during this Wiki task.

| Historical suite | Reported result |
|---|---|
| API smoke and account isolation | 41 passed, 0 failed in the fourth completed run |
| Cross-account sweep | 385 calls, no unexpected successful access reported |
| Unauthenticated sweep | 191 calls, no unexpected successful access reported |
| Account-email API flows | 19 of 19 checks passed |
| Hosted-browser checks | 32 of 32 checks passed |
| Synthetic cleanup | Test records and files reported removed |

These are different measurements. Calls, assertions and end-to-end checks should not be added into one misleading total.

## Failure and recovery lessons

Earlier runs encountered interrupted transfers, a connection-reset recovery issue and a duplicate creation after a lost response was retried. Later harness work improved transport handling, write recovery and cleanup. A synthetic orphaned file was also identified and removed. These are historical test lessons, not newly discovered production incidents.

## Current documentation-review evidence

The source snapshot matched remote HEAD. The corresponding GitHub workflow was confirmed successful. Android artifacts were inspected separately; their results and qualifications are in [release evidence](/insights/wiki/gaitai-care/android/release/). No patient records, running account workflows or backend functionality were changed.

## Limits

Automated tests do not establish medical accuracy, independent penetration testing, regulatory compliance or performance at scale. Historical cleanup reports are not a current database-state assertion. Revalidation is necessary after meaningful authentication, storage, schema or client changes.
