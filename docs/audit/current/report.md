# Corrective systems pass — audit report (2026-09-14)

Repository-wide corrective pass: canonical counts, terminology, privacy wording,
visual authenticity, accessibility, motion/performance. No redesign. Machine-
readable companions: `source-inventories.json` (counts / claims / privacy /
visuals / CTAs / anchors from the AST), `route-payloads.json` (per-route JS
weight), `../browser/results.json` + `issues.json` (axe + page-error + overflow
+ broken-image checks per route × width × theme). Screenshots are written next
to them (`*.png`, git-ignored, 278 MB per full run).

## Canonical counts (from `src/data/generated/site-facts.json`, built by `npm run build:facts`)

| Fact | Value | Rendered on |
|---|---|---|
| Product modules | 24 (12 MobilityCare · 12 SecureVision) | `/`, `/products/`, `/mobilitycare/`, `/securevision/`, `/use-cases/`, `/gaitscape/` |
| Deployment environments | 18 | `/`, `/products/`, `/use-cases/` |
| Capabilities | 13 | `/products/`, `/use-cases/`, `/gaitscape/` |
| Publications / patents | 8 papers · 1 granted patent (9 research records) | `/`, `/publications/`, `/research/` |
| Talks & presentations | 21 (10 invited talks · 2 presentations · 1 poster · 8 paper presentations) | `/research/talks/` |
| GaitScape graph | 92 nodes · 320 relationships | `/gaitscape/` |
| Product validation studies | 0 (no published product benchmark) | `/research/evidence/`, every product page |

`npm run check:facts` passes; every rendered numeral above was grepped in `out/`
and matches. Sub-counts ("8 products" in a SecureVision capability group,
"one environment") are legitimate subsets, not conflicting totals.

## Findings and fixes

| Route | Component | Problem | Fix | Canonical source | Desktop | Mobile |
|---|---|---|---|---|---|---|
| `/`, `/mobilitycare/`, `/securevision/` | `HowItWorks`, `HeroSlider` (any tree that branched on `useReducedMotion`) | React #418/#422 under `prefers-reduced-motion`: framer-motion returns `true` on the first client render, server rendered `false`; `<source>` and Play/Pause icon differed | `src/lib/usePrefersReducedMotion.ts` (`useSyncExternalStore`, server snapshot `false`) | — | ✓ 1920–1024 | ✓ 768–375 |
| `/investors/` | `about/Partnerships` | `<dl>` groups wrapped `dt/dd` in a nested `div` (axe `definition-list`, `dlitem`) | index moved inside `dt`, positioned into the gutter | — | ✓ | ✓ |
| `/mobilitycare/*`, `/securevision/*`, `/use-cases/*` | `ProductDetailView`, `UseCaseDetailView` contents index | `opacity-70` took the index numbers to 4.4:1 (dark) | opacity removed | — | ✓ | ✓ |
| `/research/evidence/` | `EvidenceExplorer` control chips | horizontally scrollable strip of text chips with nothing focusable | `role="group"`, `aria-label`, `tabIndex=0` | — | ✓ | ✓ 430 |
| `/` | `FeaturedProducts` tab pill | 55 % dark glass read mid-grey on the light ground; inactive tab text 2.8:1 | `.light .featured-tabs` near-solid ground | — | ✓ | ✓ |
| `/products/` | `.card-cue` | light cue `rgb(21 94 173 / .85)` 4.3:1 | solid | `interactions.css` | ✓ | ✓ |
| `/labs/*` | `gaitLabs` cyan | `#0e8ab8` 4.3:1 on light | `#0e7490` | `gaitLabs.module.css` | ✓ | ✓ |
| `/research/evidence/` | `boundary` cyan | same | same | `boundary.module.css` | ✓ | ✓ |
| `/insights/*` | journal rail index, archive kicker, atlas trail | 75–90 % opacity / accent tints under 4.5:1 on light | light-only full opacity; solid mute for the "here" tag | module CSS | ✓ | ✓ |
| `/movement-lab/` | footage levels, WHY list, rail labels, source index, signal-chain accents, demo caption | dim-by-design tones 1.5–3.9:1; light remaps put dark ink on the dark poster island | levels/WHY at 0.8; light accent tokens; poster caption keeps dark-island ink | module CSS | ✓ | ✓ |
| all | `text-soft-mute/70|80`, `text-cyan-300/90` | translucent utilities 4.2–4.4:1 on light | `.light` remaps to solid tokens | `globals.css` corrective block | ✓ | ✓ |
| `/research/#record-map` (+ any deep link) | `layout/ScrollClearance` | same-height content swap above a target escaped the `<main>` resize observer; landed 45 px under the header on some loads | observe every top-level block + timed re-checks | `--header-clearance` | ✓ | ✓ |
| `/movement-lab/` | `MovementLab` video stage | wireframe mannequin film labelled as footage | recorded walking sequence (`recorded-walk.mp4`, poster) | `public/assets/images/capture/README.md` | ✓ | ✓ |
| `/securevision/`, `/mobilitycare/`, `/insights/…` | privacy copy | absolute wording ("no identity channel remains") | "Appearance channel removed"; identity capabilities named as a separate governed group | — | ✓ | ✓ |
| `/` | `HowItWorks` | `/#research` deep link had no target | `id="research"` on the record line | `home-sections` | ✓ | ✓ |

## Inventories

- **Visual authenticity.** Every Human/Camera/Raw/Captured view now draws
  `visuals/SequenceFrame` (Pexels 9731860, SHVETS production, Pexels licence;
  frames + masks + pose derived by `scripts/derive-walking-sequence.mjs`) or a
  photograph plate. Grep of `PoseSilhouette` mannequins in any camera-labelled
  slot: none. Silhouette / pose / trajectory / sensor views remain graphical by
  rule. `docs/visual-authenticity-audit.md` holds the per-route table.
- **Privacy terminology.** 454 privacy strings inventoried; 31 mention
  anonymity and every one of them denies it ("does not guarantee anonymity",
  "a skeleton is not anonymous", "privacy-aware architecture is not a
  guarantee of anonymity"). No "anonymous / anonymised" claim remains.
- **CTA labels.** 249 distinct CTA strings; primary verbs are Explore /
  Request demo / Pilot / Contact / Discuss, no "Learn more" placeholders.
- **Anchors.** 102 anchor/clearance sites; every `[id]` scroll-margin comes from
  `--header-clearance: calc(var(--site-header-height) + var(--site-anchor-gap))`.
- **Research record.** Patent: "Granted 27 July 2022 · current legal status
  requires registry verification" (kept). `ivc-2023`: Crossref has no work with
  that title (the only Parashar/Rida comparative study is the listed Pattern
  Recognition Letters paper), so "Manuscript · publisher unverified" is kept.

## Test totals (final build)

| Suite | Result |
|---|---|
| `npm run build` (typecheck + lint inside) | ✓ 106 static pages |
| `npm run verify` | ✓ |
| `npm run check:facts` | ✓ |
| `npm run check:links` | ✓ 102 pages · 5,672 internal links · 152 assets |
| `npm run site:doctor -- --local` | ✓ all items match the repository |
| `npm run test:insights` / `test:evidence` | ✓ / ✓ (24 modules, 0 published benchmarks) |
| `ask:test` / `ask:rank` / `ask:paraphrase` | 53/53 · 76/76 · 267/267 |
| `ask:embed` | 399 vectors (82 re-embedded after the copy freeze) |
| worker `typecheck` + `vitest` | ✓ · 136/136 |
| Browser audit, previous build, all 101 routes × 7 widths × 2 themes | 1,399 checks · 0 page errors · 0 overflow · 0 broken images · axe findings all traced to the rows above |
| Browser audit, final build, the 14 routes that carried every finding | 182 checks · **0 cases need review** |
| Deep-link clearance (18 checks, 1440 + 375) | all converge to 114 px under the 90 px header |

## Remaining known limitations

- `ivc-2023` stays labelled *publisher unverified*; patent legal status stays
  *requires registry verification*.
- Product validation studies: 0 — every product page says so.
- `/evidence/`, `/developers/`, `/reports/`, `/signals/`, `/glossary/`,
  `/compare/`, `/solution-builder/`, `/releases/` are planned routes (site
  doctor WARN, not FAIL).
- The full 1,399-check audit was run on the penultimate build; the final build
  was re-audited on the 14 routes that carried findings. Re-run
  `GAITAI_AUDIT_OUT=out node scripts/audit-browser.mjs` (≈1 h) for a complete
  pass on any later change.
