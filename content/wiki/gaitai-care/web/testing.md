## Browser test scope

A useful end-to-end run covers account entry, verification, profile selection, navigation, synthetic uploads, extraction review, exports and sign-out. Negative tests need to check that invalid or unrelated account access fails without exposing another person's information. Synthetic-data cleanup is part of the test, not an optional follow-up.

## Historical evidence

The supplied architecture bundle reports 32 of 32 hosted-browser checks passing in an earlier run. That number belongs to the reported test snapshot. The documentation review did not independently rerun those Care scenarios against production or claim they cover every current browser version.

The current source includes browser specifications and a CI web job. A green workflow establishes the result of that workflow, not continuous service availability.

## Common symptoms

| Symptom | Safe user-facing interpretation |
|---|---|
| Page appears but records do not load | Frontend delivery and API availability are separate |
| Verification link no longer works | The link may be stale; request a fresh one in the app |
| Upload has no useful extracted fields | Document quality or layout may exceed extraction capability |
| Download appears incomplete | Check the completed file before relying on it; retry the retrieval if appropriate |
| A save appears to time out | Check whether the record was created before submitting again |
| Chart omits a record | Required dates, units or verified values may be missing |

## Remaining qualification

Browser-version coverage, keyboard access, enlarged text, screen readers, slow networks and recovery after interrupted writes should be evaluated explicitly. Earlier successful tests do not establish those outcomes for every future release. See [web limitations](/insights/wiki/gaitai-care/web/roadmap/) for current boundaries.
