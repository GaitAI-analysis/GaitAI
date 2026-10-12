## Source-verified job

The Care workflow contains an Android job using Node 22 and JDK 21. It installs locked mobile dependencies, checks mobile JavaScript syntax, synchronizes shared web assets into the Android project and executes a Gradle debug build. The resulting debug APK is uploaded as a workflow artifact.

```text
Checkout source
  → install mobile dependencies
  → validate JavaScript syntax
  → sync web assets and Capacitor project
  → Gradle debug build
  → retain debug artifact
```

```diagram
cicd-architecture
```

## Latest reviewed result

The GitHub API confirmed a successful completed workflow for the source revision reviewed on 12 October 2026. The short commit reported by the owner was checked against that workflow. Private repository links and internal revision identifiers are not published as navigation in this public Wiki.

## What green does not establish

The Android job is a debug compilation job. It does not by itself prove a correctly signed release APK, AAB store acceptance, successful installation on a phone, physical-camera behavior or notification delivery. The owner-reported emulator checks belong to a separate test history.

## Shared source implications

CI synchronization helps prevent building from stale packaged web files. However, syntax and compilation cannot detect every bridge-order or UI integration regression. The [test guide](/insights/wiki/gaitai-care/android/testing/) covers those behaviors, and the [release evidence guide](/insights/wiki/gaitai-care/android/release/) describes the existing artifacts without conflating them with CI outputs.
