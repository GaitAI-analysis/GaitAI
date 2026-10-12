## Brand asset pipeline

The mobile project includes an asset-generation script that derives launcher resources, splash marks and notification icons from the shared Care icon. Android resources include legacy and adaptive launcher variants, a monochrome option and density-specific splash assets.

| Resource | Role |
|---|---|
| Launcher icon | Application identity in the launcher and device UI |
| Adaptive and monochrome assets | System-shaped and themed launcher presentation |
| Splash mark | Initial native launch state |
| Notification icon | Small monochrome mark in reminder notifications |
| Theme resources | Native shell colors and launch behavior |
| Mobile stylesheet | WebView layout, overlays and touch presentation |

## Launch behavior

The native launch screen bridges the time before the packaged application renders. The JavaScript mobile layer coordinates hiding the splash when the interface is ready. A splash display should not be interpreted as successful account synchronization or API availability.

## Theme and layout boundary

The mobile stylesheet adapts the existing navy, gold and off-white product styling to a phone. Native bars, keyboard insets and WebView content need to work together. Browser theme behavior alone does not establish a correct native launch screen or legible system-bar content.

## Visual qualification

Review cold launch, rotation, large fonts, gesture navigation, dark system appearance, keyboard opening and high-density icons. Emulator screenshots are useful evidence but do not replace device review. Store artwork is a separate deliverable from the installed launcher assets.
