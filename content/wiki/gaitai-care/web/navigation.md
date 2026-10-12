## Application shell

The browser experience separates account entry screens from the signed-in product shell. Once an account can access records, profile selection determines which person's information is shown. The current section determines the visible workspace, while shared dialogs support create, edit, review and confirmation actions.

## Main destinations

| Destination | Reading purpose |
|---|---|
| Today and dashboard | Current reminders and selected-profile summary |
| Documents | Uploaded files, extraction state and review actions |
| Medical history | Treatments, visits, illnesses and chronology |
| Medications and vaccinations | Recorded plans, administrations and due items |
| Daily care | Household observations and timeline views |
| Analytics and exports | Trends and selected summaries |
| Account settings | Account lifecycle and related preferences |

Exact available controls depend on the account state, selected profile and current source version. The product overview describes capabilities, not a guarantee that every action is relevant to every profile.

## Loading and error states

An action may require network work before a screen updates. A slow response should not be interpreted as a completed save. Repeatedly submitting a creation form can produce a second operation if the first succeeded but its response was lost. Confirm the resulting record before retrying an uncertain write.

## Platform difference

The browser relies on its web shell and browser controls. Android adds bottom navigation, a section sheet and a deliberate back-button sequence. Those behaviors are documented separately in [native navigation](/insights/wiki/gaitai-care/android/navigation/), rather than attributed to the browser client.
