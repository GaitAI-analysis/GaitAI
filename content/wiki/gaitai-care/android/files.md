## Why Android needs an adapter

The shared interface can generate a browser download or open a blob URL for an export. A WebView does not necessarily handle those actions like a desktop browser. The mobile layer intercepts those export paths, reads the returned file bytes and routes them through native file handling.

## File journey

1. The shared workflow requests an authorized export from the backend.
2. The mobile adapter obtains the returned blob bytes.
3. The filesystem integration creates a temporary app file.
4. A native file-provider handoff offers an appropriate Android viewer.
5. If the primary opening operation fails, the implementation can use a sharing fallback.

The [shared exports guide](/insights/wiki/gaitai-care/backend/exports/) covers authorization and record selection. This guide covers the device handoff only.

## Privacy boundary

An export may contain health information. Once opened or shared in another app, its subsequent handling is outside the Care application's control. Temporary files and externally saved copies need a lifecycle distinct from the server record. Account deletion should not be described as remotely erasing copies that a user has already exported elsewhere.

## Troubleshooting

An unavailable viewer, interrupted retrieval or failed handoff can prevent an export from opening even when record creation succeeded. Check that the download completed and that a compatible viewer is present before retrying the retrieval. Do not repeat unrelated record-creation actions to fix a file-opening problem.

Emulator testing should be complemented with real-device viewers and sharing targets, using synthetic documents only.
