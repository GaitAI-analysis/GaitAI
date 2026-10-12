## Assembly order

The sync script copies the shared web assets into the mobile bundle, inserts the Capacitor runtime and adds mobile-specific files. The hosted doctor-sharing view and browser service worker are excluded from this package. Shared doctor links can open in the browser instead.

```text
Shared web source
  → mobile asset sync
  → native boot adapter before the base application
  → shared product modules
  → mobile UI adapter and stylesheet
  → Capacitor Android asset sync
  → APK or AAB build
```

## Boot adapter

The boot layer runs only on a native platform. It adapts session storage to the native secure store before the base application reads account state. It also avoids browser service-worker behavior inside the packaged app, where cached web assets could conflict with app updates.

## UI adapter

The later mobile layer augments rendering and network requests. It adds bottom navigation, section sheets, file handling, native links, reminders and connection messages. The CSS overlay fits the existing navy, gold and off-white visual system to a phone, including native screen insets and touch-oriented layout.

## Integration risk

The overlay depends on shared helper names and initialization order. A web refactor can parse successfully while breaking native augmentation. Test the packaged build after changes to the web shell, request helper, render flow or file inputs. See [Android testing](/insights/wiki/gaitai-care/android/testing/) for the relevant behaviors.
