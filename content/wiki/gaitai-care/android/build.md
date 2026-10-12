## Inspected toolchain

| Component | Source configuration |
|---|---|
| Node.js | 22 or newer for the mobile package |
| Java | JDK 21 in the documented build and CI |
| Capacitor | Major version 8 |
| Gradle wrapper | 8.14.3 |
| Android Gradle Plugin | 8.13.0 |
| Minimum Android SDK | 24 |
| Compile and target SDK | 36 |
| Application version | 1.0.0, version code 1 |

These are values from the reviewed project, not a recommendation to upgrade an unrelated project to these versions.

## Assemble shared assets first

The mobile package's sync script prepares shared web assets and invokes Capacitor synchronization. The following commands describe an ordinary source build from the mobile project, without credentials or deployment configuration:

```bash
npm ci
npm run sync
```

Generated assets must be refreshed after changes to the shared web source or mobile overlays. Otherwise a successful Gradle build can still package stale interface code.

## Artifact types

| Build task | Output purpose |
|---|---|
| `assembleDebug` | Development APK and debug testing |
| `assembleRelease` | Release APK requiring signing verification |
| `bundleRelease` | Android App Bundle for a reviewed distribution process |

Build-task success alone does not prove the intended release signing identity was used. Verify artifacts separately and keep release signing configuration outside public source and documentation.

## Scope

This documentation review inspected existing artifacts. It did not rebuild, sign, install or publish the Care application. See [release verification](/insights/wiki/gaitai-care/android/release/) for actual findings and [CI](/insights/wiki/gaitai-care/android/ci/) for the job that builds the debug package.
