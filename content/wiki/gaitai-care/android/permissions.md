## Capture and selection

For image-capable file inputs, the mobile layer presents a choice between photographing a document and choosing from gallery or files. Camera selection adjusts the browser file input for capture; gallery selection removes that capture preference. PDF-only inputs go directly to the system picker.

This is a user-initiated selection workflow. It should not be described as background access to all photographs or automatic medical-file collection.

## Permission categories

| Capability | Purpose |
|---|---|
| Internet and network state | API communication and connection messaging |
| Camera | Optional capture where the user selects that action |
| Notifications | Optional local reminder delivery |
| System file selection | Access to files the user chooses |

The app's source manifest declares camera hardware as optional. The inspected APK also includes plugin-contributed boot, wake-lock and exact-alarm permissions for notification scheduling. Release review must inspect the merged artifact rather than relying only on the handwritten manifest.

## Denial and cancellation

Permission denial should leave the rest of the record interface usable. Cancelling capture or file selection should not create a document record. After choosing a file, backend validation still determines whether it can enter the document workflow.

## Device coverage

An emulator can exercise the chooser flow but cannot establish every manufacturer's camera integration. Physical-device testing should cover capture, cancellation, orientation, large photos, PDF selection and permission denial. No broad real-device qualification is inferred from the supplied emulator report.
