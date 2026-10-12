## Browser application at a glance

The Care web application is a static HTML, JavaScript and CSS client, served through Firebase Hosting under its branded domain. It presents the health-record product and sends protected operations to the shared Python API. It is distinct from the Next.js corporate website that hosts this Wiki.

| Concern | Web implementation |
|---|---|
| Interface | Shared page shell and feature-focused JavaScript/CSS modules |
| Hosting | Static assets on Firebase Hosting |
| Identity | Backend-managed accounts and browser sessions |
| Medical records | Shared API, with account and profile authorization |
| Delivery | Frontend hosting release, separate from the API and Android package |

## Read this section

Start with [architecture and stack](/insights/wiki/gaitai-care/web/architecture/), then [source structure](/insights/wiki/gaitai-care/web/structure/) and [navigation](/insights/wiki/gaitai-care/web/navigation/). The workflow guides explain what the browser displays while the [shared backend guides](/insights/wiki/gaitai-care/backend/) explain what persists or processes the data.

## Status boundary

Browser features described here were inspected in source on 12 October 2026. Earlier deployment and test observations are labeled historical. This documentation review did not register accounts, upload medical files or change the running application.
