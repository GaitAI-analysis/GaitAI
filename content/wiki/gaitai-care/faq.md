## Is Care the same as MobilityCare or ChildCare?

No. These names identify different product or application contexts. This library documents GaitAI Care's web client, Android client and shared service. It does not assume that records from the original ChildCare deployment were imported or that the Care implementation describes every MobilityCare product.

## Do Android and web have separate records?

They use the same account and backend record model. Android packages the shared interface with native integrations. Differences in client version or device behavior can still affect the experience; see the [platform comparison](/insights/wiki/gaitai-care/comparison/).

## Does extraction confirm a medical finding?

Extraction proposes text and structured information for review. It can be incomplete or incorrect. The review workflow distinguishes candidate fields from confirmed records. Neither extraction nor a chart is established here as an autonomous diagnostic capability.

## Are document images sent to an external AI service?

The source contains local extraction and an optional external vision-transcription adapter. The latter needs configuration and explicit per-document consent. Its presence is not proof that it is enabled in production. See [extraction and analytics](/insights/wiki/gaitai-care/backend/extraction/).

## Is the Android app published on Google Play?

Local release artifacts were inspected, but a Play Store publication was not established. Artifact verification, emulator testing, real-device qualification and store approval are separate evidence. The [release guide](/insights/wiki/gaitai-care/android/release/) records the observed results and remaining gaps.

## Where should I troubleshoot a problem?

Use [browser testing and troubleshooting](/insights/wiki/gaitai-care/web/testing/) for web symptoms, [Android documentation](/insights/wiki/gaitai-care/android/) for native links, reminders and file handling, and [shared troubleshooting](/insights/wiki/gaitai-care/backend/roadmap/) for common workflow boundaries. Never include patient records, recovery links or credentials in a public issue report.
