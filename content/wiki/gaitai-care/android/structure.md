## Source map

| Relative location | Responsibility |
|---|---|
| `mobile/package.json` | Capacitor dependencies and sync scripts |
| `mobile/capacitor.config.json` | Bridge and packaged-app configuration |
| `mobile/scripts/` | Shared-asset synchronization and image generation |
| `mobile/www-src/` | Mobile-only boot, interface and stylesheet overlays |
| `mobile/android/` | Gradle project and wrapper |
| Android app source | Main activity, native bridge plugin and secure-store implementation |
| Android resources | Launcher assets, splash visuals, theme resources and file-provider rules |

Only relative source locations are shown. Signing material, local machine paths and deployment configuration are excluded.

## Native initialization

The main activity extends Capacitor's bridge activity. It registers the custom plugin before normal bridge initialization so session adaptation is available when the web application loads. This ordering is important: a late session bridge would let the base UI initialize with the wrong storage behavior.

## Custom plugin boundary

The plugin provides a narrow session-storage bridge and a file-opening operation. It complements standard Capacitor plugins rather than replacing the whole interface with native Android screens. Authorization to patient records remains in the API.

## Generated versus authored code

The packaged web directory and Capacitor-synchronized Android assets are build outputs. Shared changes belong in the web source; mobile-only changes belong in the overlays or native project. Editing generated copies risks losing changes on the next sync and makes a release difficult to reproduce.
