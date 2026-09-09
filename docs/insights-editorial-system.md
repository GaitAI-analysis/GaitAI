# GaitAI Insights — the editorial system

The Blog (`/insights/`, nav label **Blog**, in-page publication **GAITAI INSIGHTS**)
is an interactive journal of human movement intelligence. This document is
the internal manual for growing it: how the series are structured, what a
story record must carry, how an interaction is added and registered, how
events are named, what may never be tracked, how a story is checked before
it ships, and how often to publish.

It describes the code as it is. Where a rule is enforced by a script, the
script is named; where it is editorial judgement, it says so.

---

## 1. The publication model

```
Series (data/insight-series.ts)          8 registered strands
  └─ Article (data/insights.ts + data/insights-phase2/*.ts)
       ├─ Experience (data/insight-experiences.ts)   hero figure, terms, moments, links
       │    └─ Figure (components/insights/experience/figures/*)  registered in registry.tsx
       ├─ Cover concept (JournalCover ART + hub CardInteraction mini)
       └─ Social card (public/assets/images/insights/social/<slug>.png)
```

One record per story, in one place. The series a story belongs to is a
string on the record that must match a registered series name; its position
is `seriesOrder` (or `seriesStep`). Nothing about a series is duplicated on
the article: colour, label, route and description all come from the
registry.

### The series

| id | name (exact `series` value) | kind | route |
| --- | --- | --- | --- |
| `foundations` | GaitAI Foundations | path | `/insights/start-here/` |
| `inside-the-signal` | Inside the Signal | strand | `/insights/series/inside-the-signal/` |
| `engineering-gaitai` | Engineering GaitAI | strand | `/insights/series/engineering-gaitai/` |
| `research-to-reality` | Research → Reality | strand | `/insights/series/research-to-reality/` |
| `ai-under-stress` | AI Under Stress | strand | `/insights/series/ai-under-stress/` |
| `privacy-by-architecture` | Privacy by Architecture | strand | `/insights/series/privacy-by-architecture/` |
| `movement-stories` | Movement Stories | strand | `/insights/series/movement-stories/` |
| `field-notes` | Field Notes | notes | `/insights/series/field-notes/` |

Foundations is a finite ordered path (01–05) with a bridge between stories;
strands are open-ended and ordered by `seriesOrder`; Field Notes is
short-form. A series page renders only when the series has at least one
published story — an empty strand has no page and no link.

Cards carry the series micro-label (`AI UNDER STRESS · 01`) from
`seriesMark(name, order)`. The Foundations cover story, selector and
five Foundations articles are visually approved and are not to be redesigned.

### Metadata every story carries

Defined by `InsightArticle` in `src/data/insights.ts`. The fields Phase 2
added, and the rules on them:

| field | rule |
| --- | --- |
| `series`, `seriesOrder` | must be a registered series; positions unique within a series (tested) |
| `evidenceLevel` | `conceptual` · `illustrative` · `research-informed`; required outside Foundations (tested) |
| `memorableInteraction` | one sentence: what a reader will remember *doing*; required outside Foundations, or the story is explicitly editorial (tested) |
| `relatedSignals` | GaitScape node ids only; each must exist (tested) |
| `cover.concept` | a `CoverConcept`; each concept has a cover plate, a hub mini and a colour accent |
| `hero.src` | the social card path; the file must exist (tested) |
| `related` | slugs that exist (tested) |

Anything that looks like a performance metric (`87%`, `AUC`, `F1`,
`sensitivity of …`) anywhere in a record fails the content test. Stories
describe qualitatively; the evidence pages hold the published numbers.

---

## 2. Adding an article

1. **Write the record** in `src/data/insights-phase2/<slug>.ts` (one file per
   story) and add it to `phaseTwoArticles` in `index.ts`. Long-form stories
   are held to 900 words minimum (Foundations 600). Sections need stable
   `id`s — terms and figures are placed by section id.
2. **Write the experience** in `src/data/insight-experiences.ts`: `hero`
   figure key, `motif`, `terms` by section, at least four Visual Story
   `moments` (each a figure + state), a `bridge` (`learned`, `nextQuestion`),
   and `links` (evidence = real publication ids with a `why`; gaitscape =
   real node ids; `lab`; `ask`).
3. **Add terms** the story inspects to `src/data/insight-terms.ts` if new.
4. **Cover**: add the concept to `CoverConcept`, an ART plate in
   `JournalCover.tsx`, a mini + READOUT + CUE + reduced-motion rest in
   `hub/CardInteraction.tsx`, a glow in `hub.module.css` and an accent in
   `covers.module.css`. The plate, the mini and the hero figure should share
   one pure model file so they cannot disagree.
5. **Social card**: render a 1200×630 PNG to
   `public/assets/images/insights/social/<slug>.png`. Cards are drawn from
   the same model as the figure; label them *illustrative*.
6. **Run** `npx tsx scripts/test-insight-content.ts`, `tsc`, `lint`, and the
   QA checklist below.

A story is *not* published by adding it to `INSIGHT_PIPELINE` — that file is
intentions only and nothing there is routed.

---

## 3. Adding an interaction

Every major story has exactly one **memory interaction**: the single thing a
reader will remember doing. If a story does not have one worth building, it
ships as editorial and says so in `memorableInteraction` — a weak
interaction is worse than none.

### The framework

| primitive | use |
| --- | --- |
| `InteractiveFigure` | the frame: eyebrow, title, status badge (`illustrative` / `conceptual` / `measured`), caption, hint, text description, share/ask actions; emits `interactive_figure_seen` and `interactive_figure_start` with the time-to-first bucket |
| `StageControl` / `useStageScrub` | a scrubbable track with labelled stages; keyboard `← →`; drag |
| `ShareInsight` / `useSharedFigureState` | encode figure state into the URL and restore it |
| `useNarrow(640)` | switch to the stacked (phone) layout |
| `useFigureActive` | pause when off-screen |
| `PoseFrame`, `GAIT_PHASES`, `smoothPath` | the project's own body keyframes and stroke vocabulary |
| `experience.module.css` (`chips`, `segment`, `qual*`) and `figures.module.css` | the shared visual language |

### Visual typography — the canonical system

Every label drawn inside a figure, a hub card mini or a cover uses one type
system, defined in `src/components/insights/experience/figures.module.css`
(commit 6e62883). It is canonical: new figures do not invent SVG text sizes,
and no figure code carries a literal `fontSize`.

| role | class | use | examples |
| --- | --- | --- | --- |
| MICRO | `.labelSmall` | state hints, metadata | ILLUSTRATIVE · 8 OBSERVATIONS |
| LABEL | `.label` | technical labels, annotation | KNEE FLEXION · CAMERA · FACE |
| KEY | `.labelKey` | conceptual nodes | MOBILITY · OWN BASELINE · LEFT |
| STATE | `.labelState` | the one output statement | MILDLY ASYMMETRICAL · MODEL RIGHT |
| VALUE | `.labelDisplay` | a single display numeral | the trend hero's count |

Sizes are viewBox units from the `--vt-*` tokens multiplied by `--fig-type`,
the per-slot factor `hub.module.css` sets from measured render scales, so a
label lands at the same on-screen size in a wide spread, a half card, the
Foundations preview and a phone — always below the story title. Article
heroes run at factor 1; `.narrow` raises the roles together on a phone-wide
hero. Rules that follow from this:

* Colour carries selection — `labelAccent`, `labelTeal`, `labelWarn`,
  `labelInk`, a halo, line weight. Never size; a card must not jump when
  touched.
* The order of attention in every card is title → visual → active result →
  technical labels → metadata. If a label competes with the title, it is in
  the wrong role, not in need of a bigger font.
* Density is solved by hiding or demoting, not by shrinking:
  `.quietOnNarrow` hides a label on phones, `.underOnNarrow` steps a value
  under its label.
* The approved Blog design (hub, pagination, cards, heroes) is not restyled
  unless an actual responsive or accessibility defect is demonstrated with a
  screenshot or a measurement.

### Steps

1. Put the pure state model in `figures/<name>-model.ts`: types, closed
   label vocabularies, and the function that turns a state into what is
   shown. No React, no numbers presented as measurements.
2. Build `figures/<Name>Explorer.tsx` on the primitives. Accept
   `{ articleSlug, presentation }`; when `presentation` is set, render the
   SVG only (the Visual Story drives it) and emit no events.
3. Provide a `description` — a full text alternative — and a caption that
   states the reading in words.
4. Define *complete*: the state a reader has to reach to have understood the
   idea (two parameters moved, three links broken, all views seen …). Emit
   `interactive_figure_complete` once.
5. Register the key in `FigureKey` (`insight-experiences.ts`), in
   `registry.tsx` (`next/dynamic`), and in `FIGURE_KEYS` in
   `scripts/test-insight-content.ts`.
6. Add the story-specific event to `InsightEventMap` and, if it has one
   categorical dimension worth counting, to `DIMENSION` in the sink.
7. Check phone (375) and desktop (1440), dark and light, reduced motion, and
   keyboard-only.

Existing figures are the reference implementations: `PoseErrorExplorer`
(view toggle + issue chips), `SymmetryExplorer` (parameters + level track),
`CameraAngleExplorer` (ring drag + track + chips), `IdentityLayersExplorer`
(track + toggles + ledger), `SystemChainExplorer` (chips only),
`BaselineExplorer` (segment + track).

---

## 4. Analytics: the event layer

`src/lib/insight-events.ts` is the only way an event leaves a component:

```ts
trackInsightEvent("symmetry_adjusted", { article_slug, state }, { debounce: "symmetry" });
```

* **Typed.** `InsightEventMap` names every event and its props. An event
  not in the map does not compile.
* **Once.** `{ once: key }` fires at most once per page load; add
  `session: true` for once per browser session (scroll milestones,
  `insight_open`, figure seen/start/complete, feedback).
* **Debounced.** `{ debounce: key }` collapses a burst into the settled
  value — every drag uses it, so a scrub produces a handful of events, not
  hundreds.
* **Context.** `setInsightContext({ article_slug, series })` on the article
  page; `device_class` and `theme` are added automatically. Explicit props
  win over context.
* **Sanitised.** `sanitize()` drops any prop whose key matches the prohibited
  list (email, name, text, comment, filename, user, token, ip …) and any
  string value that looks like free text (over 80 characters, multi-line, or
  containing `@`). This is not a policy; it is a filter that runs on every
  call.
* **Sink.** `insight-analytics-sink.ts` folds each event into
  `insightEventCounts/{day}__{article}__{eventKey}` and increments a count in
  a 1.5 s batch. `eventKey` is the event name plus at most one dimension
  (`camera_angle_changed:front`). Do Not Track disables the sink. A failed
  write is reported once and the page is unaffected.

### Naming

`noun_verb` in snake case, past tense for something that happened
(`insight_open` is the exception, kept from the first version):
`pose_issue_selected`, `system_component_failed`, `baseline_mode_changed`.
Props are short lower-case identifiers from a closed vocabulary defined next
to the component that emits them. Never a label, never a sentence.

### What is never tracked

Uploaded media, gait measurements, health data, personal analysis results,
email addresses, comment text, names, IP addresses, precise timestamps per
visitor, or anything that would let two events be joined into one person's
path. There is no user id, no session id and no per-visitor document. The
Firestore rules only accept bounded increments on ids of the aggregate
shape, and only admins can read. `scripts/test-insight-analytics.ts`
asserts the once/debounce/sanitise/key behaviour; extend it when adding an
event with a new prop.

### Reading the numbers

The **Insights Analytics** tab in `/admin-controlpanel/` reads the
aggregate (admin sign-in). Interpret with care:

* *Opens* counts page loads once per session; a reader who returns tomorrow
  counts again. That is intended.
* *Read to 75%* over opens is the honest reading-depth figure; 100% includes
  readers who skimmed to the end.
* *Figure started* over *seen* says whether the hero invites touch;
  *completed* over *started* says whether the interaction is understood.
  A low completion on a high start is a figure problem, not a story problem.
* *Time to first interaction* is bucketed at the figure, before any event
  leaves the page; `never` is the seen-but-not-started gap.
* *Foundations path* shows opens per Foundation in order and how many were
  reached from another Foundation in the same session.
* *Helpful* is two buttons and four fixed reasons. Read the reasons per story
  before deciding a story is too technical.
* Numbers under about fifty are noise. Do not redesign a figure on a week of
  data.

---

## 5. Privacy rules for authors

1. Nothing a reader types is an event prop. Search terms, comments, questions
   to Ask GaitAI and feedback are not analytics.
2. A figure's state vocabulary is closed and defined in its model file. If a
   state needs a free string, it does not get tracked.
3. Do not add a dimension that identifies a person or a device beyond
   `device_class` (phone/tablet/desktop) and `theme`.
4. Do not track the Movement Lab, uploads, or anything derived from a
   reader's own video. Ever.
5. If a story needs a new kind of measurement, extend the typed map, extend
   the tests, and update the privacy policy paragraph *Blog interaction
   counts* in the same commit.

---

## 6. QA checklist before publishing

* `npx tsx scripts/test-insight-content.ts` · `scripts/test-insight-analytics.ts` · `scripts/test-insights-scaling.ts`
* `tsc --noEmit`, `next lint`, `next build`
* Hero renders at 375 and 1440, dark and light; no label collisions; no
  horizontal overflow at 320
* Every control reachable by keyboard; `aria-pressed` / `aria-checked` on
  chips and segments; the track responds to `← →`
* Reduced motion: the figure rests at its most informative state and no
  hydration warning appears
* Text description present; caption states the reading in words
* The status badge matches `evidenceLevel`
* Every SVG label uses a type-system class (MICRO / LABEL / KEY / STATE / VALUE); no literal `fontSize`; selection changes colour, not size
* Share link restores the figure state
* Series page lists the story with the right micro-label; the bridge names
  the series and the next story
* Social card exists and is unique to the story
* `node scripts/check-links.mjs` and `node scripts/site-doctor.mjs --local`
* Browser console clean apart from Firestore permission notices where rules
  are not deployed locally

---

## 7. Publication process and cadence

**Cadence.** One major interactive story roughly every two weeks, in
whichever strand the last analytics review points at; short Field Notes
between them when there is something to say. Do not publish to fill a slot —
the content test allows an article, it does not require one.

**Process.**

1. Pick the next story from `INSIGHT_PIPELINE` against the last review
   (which strands are read to 75%, which figures are completed, which
   feedback reasons recur).
2. Write the thesis and the memory interaction sentence first. If the
   interaction cannot be described in one sentence, the story is editorial.
3. Build the model, the figure, the record, the experience, the cover and
   the card, in that order.
4. Run the checklist. Screenshots at both widths are part of the review.
5. Commit content and interaction together so the story is never live
   without its figure; push to the feature branch; review; merge.
6. After two weeks, read the Insights Analytics tab for that story alone
   before choosing the next.

**Deferred by design.** No per-article comments on figures, no A/B testing,
no cohorting — each would need a per-reader record, which this system does
not create.
