## Reviewed release

The Android source declares version 1.0.0 with version code 1. Local distribution files include a debug APK, a release APK and an AAB. Their presence supersedes the original ZIP's statement that Android artifacts had not been demonstrated.

## Verification findings

| Claim | Evidence available in this review | Qualification |
|---|---|---|
| Release APK generated | Local artifact inspected; Android APK signature verification passed | Not a Play Store approval or device-test result |
| AAB generated and signed | Local artifact inspected; JAR verification reported success | Verifier also emitted certificate/timestamp and archive-reading warnings; distribution readiness needs separate review |
| Version 1.0.0 | Android build configuration and packaged APK metadata | Current reviewed version, not a promise of future compatibility |
| APK SHA-256 recorded | A fresh SHA-256 was calculated for the inspected APK | Original deployment-report digest was not located for comparison |
| Latest Care CI green | GitHub API confirmed the reviewed workflow completed successfully | CI's Android job builds a debug artifact |
| 65/65 emulator checks | Reported by the owner; repository narrative confirms a historical emulator exercise | Exact count not independently reproduced or verified from a raw result file |

## Signing boundary

Release signing material stays outside the public website. No keys, certificates, fingerprints, passwords, signing-property files or private filesystem paths are published here. The existence of a file named “release” is insufficient evidence of the intended signing identity.

The AAB verifier warnings are not hidden or treated as a passing Play Console validation. No artifact was uploaded to a store during this review. Store acceptance and installation of the distributed build remain separate release gates. The packaged base application, mobile JavaScript layers and mobile stylesheet matched the reviewed source files byte for byte.

## Evidence still needed

Retain a traceable relationship between approved source, build output, checksums and test reports. A recorded raw emulator result and the original artifact digest would close the two report-verification gaps above. Physical-device coverage, store checks and notification/link behavior must be evaluated for the actual artifact being distributed.
