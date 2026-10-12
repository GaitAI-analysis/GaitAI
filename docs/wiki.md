# Public technical Wiki

The Wiki is part of this Next.js website at `/insights/wiki/`. It uses the existing header, footer, themes, navigation and GitHub Pages workflow. There is no documentation backend or external search service.

## Content and routing

- `src/data/wiki.ts` defines products, availability and documentation areas. Products may supply their own area metadata; only registered area landing pages appear.
- `src/data/wiki-pages.json` defines the reviewed Care page metadata and reading order.
- `content/wiki/<product>/<slug>.md` contains public-safe Markdown. Nested slugs give each platform its own URL tree.
- `src/lib/wiki-content.ts` loads only registered files at build time and derives headings and section search entries.
- `src/app/insights/wiki/[product]/[...page]/page.tsx` exports registered article routes, including the three area landing pages.
- The shared site-map registry supplies Atlas breadcrumbs and the XML sitemap automatically.

Care has separate web, Android and shared-backend areas. Each has a filtered sidebar and its own reading order. The product overview links all three, with a separate platform comparison. Coming-soon products have no invented technical pages or dead links.

To add a guide, add reviewed Markdown and one metadata entry. To add a product, provide its public metadata and reviewed pages. The normal static build publishes it; the interface does not need to be rebuilt as a new product-specific component.

## Rendering

Markdown is rendered at build time with react-markdown and GFM tables. Raw HTML is disabled. Local SVG diagram components provide accessible flow, data and sequence diagrams without Mermaid JavaScript, remote rendering or a diagram CDN. A fenced `diagram` block selects a reviewed diagram name from `StaticDiagram.tsx`; unknown names fail the build. The image title, description and visible caption explain the same flow.

Syntax highlighting is produced on the server. Copy is a small client interaction with a text-selection fallback if clipboard access fails. Tables and diagrams scroll within their own container. Heading slugs are stable and linked from the desktop and mobile table of contents.

Search indexes only the reviewed Markdown, runs in the browser and links directly to matching sections. No query is sent to an external search provider. Normal Tab navigation works; Down Arrow enters results and Escape clears them. Native details controls make sidebar groups keyboard-accessible. Georama is loaded only by the Wiki layout using Next's font pipeline.

## Publication review

The supplied architecture bundle was reviewed outside this repository. The original ZIP, application source, artifacts and private review evidence are not committed or served. Only rewritten, reviewed public Markdown is included.

Source review on 12 October 2026 corrected the framework and Android status and documented the optional consented external transcription adapter. Historical tests are labeled as reports, not current production guarantees. The Android artifact and CI findings are qualified on the public release page; unverified emulator totals and missing original checksum evidence are not presented as independently verified facts.

Do not place patient examples, environment files, signing material, production identifiers, private service addresses, access runbooks or credential-bearing logs in this directory. Keep application repositories private. Automated pattern checks supplement, but do not replace, editorial review. Update review dates and evidence qualifications whenever the source baseline changes.

## Verification

```bash
npm run test:wiki
npm run typecheck
npm run lint
npm run build
npm run check:links
npm run test:wiki:browser
```

The browser check serves the actual `out/` export. It uses the existing local Playwright QA installation in `tmp/qa`, or a module path supplied through `PLAYWRIGHT_MODULE`. Set `WIKI_TEST_BASE` to a deployed origin to run the same checks live. It writes screenshots and results under ignored `tmp/wiki-qa/`.

The source validation runs in prebuild and therefore in the existing Pages workflow. It checks registered routes, search coverage, heading uniqueness, internal content links, navigation order, coming-soon boundaries and known private-material patterns. Do not count Wiki tests as application backend, medical or production-account tests.

## Validated publication baseline

The initial public corpus contains 47 Markdown guides: 4 product-level guides, 12 web guides, 17 Android guides and 14 shared-backend guides. Together with the Wiki directory and Care product landing page, this produces 49 Wiki routes.

Local validation on 12 October 2026 passed lint, TypeScript, the Next.js production build/static export, all five existing Insights scaling fixtures and the full-site internal-link check (152 HTML pages, 9,119 internal references and 149 local assets). The browser suite passed 528 assertions across 49 Wiki routes, 567 heading links and 11 rendered diagrams, with no browser runtime errors. It exercises light/dark appearance at desktop, tablet and phone widths, navigation, search, copying, existing page regressions and diagrams with JavaScript disabled. Results are dated observations, not guarantees for future builds.
