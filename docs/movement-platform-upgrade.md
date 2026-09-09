# Movement intelligence upgrade

## Phase 0 — baseline, 9 September 2026

Base commit: `49a606f`. Branch: `v1/feature/insights`.

`npm run build` passed before source changes: 93 static pages, with lint and TypeScript checks. Data validation: 23 products, 17 environments, 13 capabilities, 9 publications, 89 graph nodes and 301 relationships. Existing warning: Watchlist is not mapped to an environment; no deployment relationship should be invented to suppress it.

Canonical routes remain owned by `src/data/site-map.ts` and `src/app/sitemap.ts`. Preserve `/`, `/mobilitycare/`, `/securevision/`, all 23 module detail routes, `/products/`, `/movement-lab/`, `/gaitscape/`, `/labs/`, `/research/`, `/research/evidence/`, `/research/talks/`, `/publications/`, `/insights/`, `/use-cases/`, `/trust/`, `/legal/*` and existing dynamic publication fallback. No hosting migration or navigation restructuring.

Reuse the RGB color tokens and semantic `--page-bg`, `--text-primary`, `--text-secondary`, `--text-muted`, `--trajectory`, family accents, border and motion variables in `globals.css`. Preserve Inter, Space Grotesk and JetBrains Mono, both theme branches, media color fidelity and existing card primitives.

## Existing systems to extend

- The hero headline, gait kinematics, MotionDNAThread, flagship hierarchy and four-stage scroll timeline already exist.
- Movement Studio performs real browser-side MediaPipe pose estimation. Its separate pipeline walkthrough and sample outputs are illustrative. These must never be conflated.
- MotionDNA renders measured time series. MovementXRay uses shared illustrative gait keyframes. Shared view controls should expose their different provenance.
- Evidence joins already distinguish direct research subjects from architectural connections. A paper-to-product path is not product validation.
- GaitScape already has graph, tree, list, challenge paths and mobile alternatives. Add guided stories to those views.
- Global search/command palette, stack recommendations, product comparisons, publication filters, related modules, source-grounded Ask GaitAI and schema already exist.

## Delivery phases

1. Privacy/security disclosures, comment data minimization, evidence states and sources, Trust matrix, context/limitations and publication-pending benchmark support.
2. Shared Human / AI / Explain controls, progressive Movement X-Ray, public-state sharing and restrained motion signature.
3. Additive living hero exploration, concise movement narrative, visitor intent paths into existing recommendations; preserve flagship grouping.
4. Improve Studio entry, actual-channel explainability and illustrative walkthrough sharing. Keep media in the tab.
5. GaitScape stories, valid URL focus restoration and research traceability.
6. Grounded visual relationship cards in Ask GaitAI, retaining transport and source restrictions.
7. Publication provenance filters, palette keyboard repair, branded 404 and resilient states.
8. Production build, data/Ask tests, links, responsive/light/dark/accessibility/browser checks and performance review.

## Boundaries

No invented medical scores, clinical validation, benchmarks, customer deployments, compliance certification or financial ROI. Existing configurable stack recommendations already cover discovery; another recommendation engine is unnecessary. No additional analytics collector or sensitive-media share flow. Sharing contains allowlisted public record selections only. Production historical comment records require a separately reviewed cleanup; a client fix does not erase old data.

## Baseline bundle observations

Next.js first-load JavaScript: homepage 209 kB; Movement Studio 171 kB; GaitScape 182 kB. These are build sizes, not Lighthouse scores. The existing hero allocates geometry buffers on every frame and loads WebGL on mobile; preserve its gait model while reducing that cost. Videos already have posters, reduced-motion and intersection handling.

## Completed in this pass (9 September 2026)

- Evidence Index now separates a DIRECT research foundation (the paper is about
  a capability the module is built on) from an ARCHITECTURAL research
  relationship (reached only through a shared platform capability). Both come
  from `evidence.ts` tiers; `scripts/test-evidence.ts` (`npm run test:evidence`,
  part of `verify`) asserts a paper is never counted in both and that every
  "available" row has a canonical source. Pilot/deployment, benchmark, clinical
  and regulatory rows stay "not published" / "not claimed" by construction.
- Visitor-intent paths (`src/data/visitor-intent.ts`, `VisitorIntent`) pre-fill
  the existing `recommendStack()` finder and link to existing demo, evidence,
  research, story and use-case pages. Choice is kept in localStorage only.
- GaitAI 404, route `error.tsx` and `loading.tsx` share one trajectory /
  gait-cycle mark (`LostTrajectory`, `MotionLoader`); no stack traces in UI.
- Hero: stage row shown only while the WebGL scene runs; static Motion DNA
  otherwise. `useVisualBudget` probes for a WebGL context and `SceneBoundary`
  catches a failed context so the homepage never unmounts to the error route.
- Search palette: the scrim ignored nothing before — a phone tap on the menu's
  Search button was followed by a synthesized mousedown on the scrim, closing
  the palette immediately. A 400 ms open guard fixes it; keyboard, Tab trap,
  Escape and focus restoration verified by script.
- Ask GaitAI connection cards resolve module sources by their detail route as
  well as the graph anchor; duplicate-source keys fixed.
- GaitScape Story Mode: Escape now exits through the same path as Exit Story so
  the URL state is cleared.

## Verification

Run against the working tree on 9 September 2026:

- `npm run typecheck`, `npm run lint`: pass.
- `npm run validate:gaitai`: pass (the pre-existing Watchlist environment
  warning remains, intentionally).
- `npm run test:evidence`: 23 modules pass; 0 published benchmarks.
- `npm run ask:test` (25/25 retrieval expectations, 0 grounding failures) and
  `npm run ask:rank`: pass.
- Browser scripts (Playwright, Edge, headless): 24/24 interaction checks —
  Ctrl/Cmd+K, Escape, arrows, Tab trap, focus restoration, touch open via the
  menu sheet, 44 px option targets, visitor-intent storage round-trip,
  Story Mode URL restore/advance/exit, `?focus=` restore. The real MediaPipe
  demo-walk analysis completed headlessly and exposed measured channels in the
  Explain view.
- Screenshots at 320/360/375/390/412/430/768/1024/1440 in dark and light:
  no horizontal overflow on any page tested; media keeps its original
  appearance in light mode.
- Worker tests were not run here: `worker/node_modules` is not installed in
  this checkout.

## Still open (requires the owner)

- Historical `comments/{id}` records may still hold `email` / `userId` values
  readable through the public rules. Nothing in this branch inspects or
  cleans production data; see `docs/trust-remediation.md` for the reviewed
  cleanup and rules-deployment steps. The new `firestore.rules` are not
  deployed by a site deploy.
- Benchmarks stay "Validation pending publication" until a documented record
  is added to `src/data/benchmarks.ts`.

