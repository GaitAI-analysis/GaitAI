## Export responsibility

The backend includes export modeling and PDF rendering using ReportLab. It assembles selected record information into a human-readable summary. Authorization and profile scope must be resolved before export data is collected.

An export is a representation of available records, not an independent medical interpretation. Missing, incorrect or unreviewed source information can affect the resulting summary.

## Sharing boundary

The source contains scoped doctor-sharing workflows and a hosted sharing view. This is distinct from giving another person unrestricted account access. Public documentation describes the purpose without exposing live grants, token formats or internal controls.

| Action | Boundary |
|---|---|
| Generate a summary | Backend reads the authorized selected records |
| Download a PDF | A copy can persist on the recipient device |
| Open on Android | Native file handoff presents the generated file |
| Share outside the application | Recipient handling is no longer controlled by the original UI |

## Lifecycle considerations

Changing a record later does not rewrite a previously exported PDF. Deleting an account does not imply remote deletion of every copy already downloaded or sent elsewhere. Retention policies need to distinguish server records, generated temporary files and externally held copies.

## Platform guides

Browser downloading is covered by [web document workflows](/insights/wiki/gaitai-care/web/documents/). Android viewing and sharing fall under [native file handling](/insights/wiki/gaitai-care/android/files/). Keeping these delivery details separate avoids duplicating the backend's data-selection and authorization description.
