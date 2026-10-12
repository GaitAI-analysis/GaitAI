## What is built

The browser application consists of static source assets. Unlike the corporate website, it does not require a Next.js export. JavaScript syntax validation and browser tests check the web source; deployment publishes the intended static asset set to the configured hosting environment.

## Delivery sequence

1. Review shared source changes and their effect on existing clients.
2. Validate JavaScript syntax and browser workflows in the authorized test environment.
3. Confirm compatibility with the intended API release.
4. Publish the approved frontend asset set through the existing hosting process.
5. Check page rendering, navigation and account-entry behavior.
6. Record release evidence separately from the source changes.

This is a release model, not an infrastructure access runbook. Project configuration and deployment credentials remain private.

## What CI verifies

The reviewed GitHub Actions workflow includes a web job with syntax checks, email-relay unit checks and browser specifications. Backend, container and Android jobs are distinct. A successful Android build does not deploy the browser UI, and a successful web job does not by itself prove a Firebase release occurred.

## Shared-code compatibility

Changes to web feature modules can affect the mobile package after its next sync and build. Test the browser output and the [mobile assembly](/insights/wiki/gaitai-care/android/shared-code/) separately. A deployed browser fix will not automatically replace files already bundled in an installed APK.

## Validation record

The latest inspected Care workflow completed successfully for the reviewed source revision. This Wiki's own lint, export and browser tests are reported separately; they are not substitutes for testing the Care application itself.
