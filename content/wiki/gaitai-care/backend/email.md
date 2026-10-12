## Reported hosted design

The backend's mail abstraction supports several providers. The supplied deployment narrative identifies the hosted account-email path as a Supabase Edge Function relay delivering through Hostinger SMTP over encrypted transport. The source contains both the backend relay integration and the Edge Function implementation.

```diagram
email-sequence
```

## Responsibilities

| Layer | Role |
|---|---|
| Application API | Initiate verification and recovery messages |
| Email relay | Validate eligible requests and apply delivery policy |
| Mail provider | Accept and deliver mail through SMTP |
| Client | Present the account action reached through the email |

Provider acceptance, inbox arrival and a successfully completed account action are separate observations. A successful request to send mail does not prove the recipient has read or completed it.

## Source versus deployment

Other adapters in source do not mean those providers are all active in production. Earlier relay experiments mentioned in the ZIP are historical alternatives, not additional deployed components in the current reported design.

## Reliability and privacy

Account entry and recovery depend on valid links and email delivery. Failed sends, delays and stale links require understandable user states. Public examples contain no recipient identities, delivery credentials, signing mechanisms, operational limits or internal relay addresses.

The ZIP reports a historical 19-of-19 account-email API flow result. That snapshot is documented in [test evidence](/insights/wiki/gaitai-care/backend/validation/) and is not a claim of current inbox delivery for every message.
