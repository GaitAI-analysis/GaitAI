## Historical emulator exercise

The repository's Android documentation records an exercise on 12 October 2026 using Android 16 and a WebView version recorded in that report. It describes synthetic account registration, email verification and reset, app restart with session persistence, profile creation, synthetic PDF upload, extraction review, feature navigation, export opening, picker flows, reminders, offline messaging and account cleanup.

## The 65-check claim

The owner reports 65 of 65 Android emulator checks passed. The source narrative supports that an emulator exercise occurred, but the exact 65-check total was not independently reproduced and a machine-readable result containing that count was not located in the reviewed materials. It is therefore published as an owner-reported historical result, not a new test result from this Wiki work.

## Device qualification matrix

| Area | Why a physical device matters |
|---|---|
| Camera and gallery | OEM chooser and capture behavior |
| Notifications | Permission, power-management and scheduling differences |
| App Links | Real installed signing identity and device association state |
| PDF viewers | Installed viewer and sharing-target behavior |
| Accessibility | TalkBack, enlarged text, focus and gesture navigation |
| Network transitions | Wi-Fi/mobile changes, offline recovery and slow responses |

## Testing boundary

This review did not create accounts, modify records or rerun production account-lifecycle tests. Source inspection, CI-result inspection and artifact verification are its evidence. Any new application test run should use approved synthetic data and include cleanup, without interacting with unrelated patient records.

Release claims should identify which artifact was tested and distinguish debug testing from release-package behavior.
