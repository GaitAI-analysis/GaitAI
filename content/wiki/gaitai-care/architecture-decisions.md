## Separate the product boundary

The architecture bundle describes Care as a distinct product with independent deployment infrastructure. Keeping it separate from the corporate website and original ChildCare system avoids treating personal records as website content or assuming that existing records should be migrated. This Wiki is public documentation only.

## Keep one backend for both clients

A modular Python service owns health-record operations, identity and access decisions. Managed database and storage services provide persistence. This concentrates common behavior in one place and prevents web and Android implementations from drifting into different patient-data models. The trade-off is a shared dependency on API compatibility and service availability.

## Host the web client as static assets

Firebase Hosting serves the browser application. The reviewed Care frontend uses HTML, JavaScript and CSS rather than the corporate site's Next.js architecture. Hosting does not replace backend authentication or database authorization. See [web architecture](/insights/wiki/gaitai-care/web/architecture/).

## Package shared code with Capacitor

The mobile sync step packages the existing web source and overlays a native integration layer. This preserves product behavior while adding Android sessions, file opening, back navigation and reminders. Native permissions and store updates still require their own engineering and test work.

## Require review of extracted information

Text extraction produces candidate fields, not automatically trusted clinical records. Keeping proposed and confirmed states distinct preserves the opportunity to correct dates, names, units and document interpretation. The optional vision adapter remains a transcription aid, not an established diagnosis engine.

## Separate email delivery

Account emails use a backend delivery abstraction. The reported hosted deployment routes mail through a Supabase Edge Function to Hostinger. This separates API work from SMTP connectivity, at the cost of another dependency and a need to distinguish provider acceptance from inbox delivery.

These decisions summarize the supplied architecture material and reviewed implementation. They are not a claim that every historical discussion was preserved as a formal decision record.
