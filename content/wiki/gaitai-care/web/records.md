## Profile-centered records

The selected health profile anchors the dashboard and feature views. Medical histories, documents and observations are associated with that profile, while the backend determines whether the account is permitted to view or change them. Selecting another profile changes the record context; it does not create a second independent account.

## Record categories

| Category | Examples of represented information | Important distinction |
|---|---|---|
| Medical history | Illness episodes, hospital visits and treatment events | Entered or imported history, not a new diagnosis |
| Medication records | Prescriptions, courses and recorded administrations | Planned use and actual use are different facts |
| Vaccination records | Recorded doses and due dates | Extracted dates need review |
| Daily observations | Fluids, diapers, stool and activity observations | User-entered observations have context and uncertainty |
| Documents | Reports, prescriptions and supporting files | The original is distinct from extracted fields |
| Exports | Selected summaries and histories | A generated report depends on its source records |

## Timelines and analytics

Chronology connects events across these categories. Trend views need usable dates, values and units; a chart cannot recover information absent from the underlying record. The shared [data model](/insights/wiki/gaitai-care/backend/data-model/) explains relationships and provenance.

## Review before export

Review dates, profile selection and source documents before treating an export as a faithful account of a person's history. Corrections belong in the underlying records so later views and exports can reflect them. A downloaded or externally shared copy has its own lifecycle after it leaves the application.
