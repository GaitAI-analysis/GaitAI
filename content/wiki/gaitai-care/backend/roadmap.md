## Implemented foundations

The reviewed service contains FastAPI domain modules, account authorization, relational persistence, private storage integration, local extraction, optional consented vision transcription, exports and email-provider abstractions. Web and Android use this common layer.

## Remaining evidence and future work

| Topic | Status or needed evidence |
|---|---|
| Restore readiness | A recorded rehearsal of the actual recovery scope |
| Live database policy | Independent verification of deployed access settings |
| Privacy and retention governance | Approved policy and lifecycle evidence |
| Monitoring and alerting | Demonstrated coverage for important failure modes |
| Optional external transcription | Configuration and consent behavior verified for any enabled provider |
| Clinical inference | Not an established validated diagnostic capability |
| Capacity and availability | Measurements beyond historical functional test counts |

## Shared troubleshooting model

A working client screen does not prove API availability. An accepted email request does not prove inbox arrival. Stored document bytes do not prove extraction quality. A generated export does not prove the underlying record is complete. Diagnose the stage of the workflow before repeating an operation.

For slow or interrupted writes, establish whether the first operation completed before resubmitting it. For incorrect extracted content, use review and correction rather than treating automated text as established clinical fact. For account problems, use the application's verified recovery flow.

## Platform-specific guidance

Browser presentation problems belong in [browser troubleshooting](/insights/wiki/gaitai-care/web/testing/). Native file viewers, reminders, links and offline messages belong in [Android documentation](/insights/wiki/gaitai-care/android/). This separation avoids presenting a device symptom as a database or identity-system failure.
