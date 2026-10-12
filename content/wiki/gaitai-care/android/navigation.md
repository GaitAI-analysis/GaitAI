## Navigation model

The mobile interface reuses the application's feature sections and adds a bottom navigation layer. An all-sections sheet exposes destinations that do not fit in the persistent navigation. Feature actions continue to run through the shared web implementation.

## Back-button sequence

The source registers a native back-button listener. It resolves the current UI state before deciding whether to leave the foreground:

1. Close an open mobile sheet.
2. Close an application modal if one is active.
3. Leave a password-recovery subflow through its own back action.
4. Return from another signed-in section to Today.
5. Minimize the app when no nearer navigation action applies.

This ordering prevents the hardware or gesture back action from discarding the whole session when a local overlay should close first.

## External destinations

External web destinations use a browser handoff rather than being treated as ordinary in-app record screens. Blob-based exports use the file-handling path. This distinction preserves native expectations for links and documents.

## Test cases

Test back from an empty screen, a populated feature, a modal, the all-sections sheet and account-recovery views. Repeat with the keyboard visible, after app backgrounding and after opening an account email link. Source-level ordering does not establish consistent behavior across every gesture-navigation implementation.

Both the documentation and the application should preserve a clear route back to the product's main context. Shared record semantics remain in [the backend guides](/insights/wiki/gaitai-care/backend/).
