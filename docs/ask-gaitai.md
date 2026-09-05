# Ask GaitAI

The site's own guide to movement intelligence — a grounded assistant that
answers from GaitAI's real records and links to the pages they came from.

It is **not** a general chatbot bolted onto the site. Every answer is built from
the same typed data modules the pages render, it can only link to routes that
exist, and it inherits the site's evidence discipline: no invented accuracy
figures, no clinical validation claims, no diagnosis, no certification status.

**Nothing to download, nothing to prepare.** A visitor opens the panel and asks.
Retrieval runs in their browser over a 315 KB corpus; the prose is written by a
hosted model behind the project's own Cloud Function. It works on a phone, on
Safari, on a low-end laptop, and on any browser without WebGPU — which is the
main reason the previous in-browser model is gone.

---

## 1. The architecture

```
GitHub Pages (static)                          Firebase (gaitai-intelligence)
──────────────────────                          ─────────────────────────────
Ask GaitAI panel
   |
   +--> /ask/knowledge.json?v=<digest>          the corpus, versioned per deploy
   |
   v
BM25 + entity + intent retrieval  ─── low confidence? ──> refuse locally, no model call
   |
   v  question · route · title · ≤6 prior turns
POST askGaitai  ─────────────────────────────>  validate · rate-limit · budget
                                                    |
                                                    v
                                                the SAME retrieval, same corpus
                                                    |
                                                    v  system policy + records
                                                Hugging Face Inference Providers
                                                    (HF_TOKEN from Secret Manager)
                                                    |
                                                    v
                                                clean: no traces, no bare URLs,
                                                links allowlisted · sources from
                                                retrieval · related · follow-ups
   |  <────────────────────────────────────────  JSON
   v
sanitize again → render
   |
   +-- any failure (network, 429, 503, 502, timeout) → EXTRACTIVE ANSWER
                                                        from the retrieval that
                                                        already ran in the tab
```

**Retrieval decides what is true; the model only decides how it reads.** The
model never receives the whole site. It receives the system policy, the
question, a short conversation window, and the seven records retrieval chose —
and it is told, in the policy, not to reach past them. Sources under an answer
come from the deterministic retrieval result, never from the model.

### What replaced what

| Before (in-browser model) | Now (hosted model) |
|---|---|
| `onnx-community/Qwen2.5-1.5B-Instruct`, q4f16 on WebGPU, q4 on WASM | a 7B-class-or-larger instruct model on Hugging Face Inference Providers |
| ~1.22 GB download, opt-in behind a button | nothing to download |
| Transformers.js + ONNX Runtime Web loaded from a CDN | no browser ML runtime at all |
| "Load local model" strip, download percentage, "Preparing GaitAI Assistant" | header · conversation · composer · privacy line |
| WebGPU detection, WASM fallback notices | works on every browser |
| model capped at 1.5B by laptop GPUs | model chosen by benchmark on the site's own questions |
| "Answers are generated locally in your browser" | "Please don't share sensitive personal or patient information." |
| `cache: "force-cache"` corpus fetch | corpus URL versioned by content digest |

Firebase stays exactly where it was for comments, journal counters,
authentication and the admin panel. One function is added: `askGaitai`.

---

## 2. The Cloud Function

`functions/` — Firebase Cloud Functions (2nd gen), Node 20, region `asia-south1`,
scale-to-zero, 512 MiB, 60 s timeout, max 10 instances.

| File | Role |
|---|---|
| `src/index.ts` | HTTP handler: CORS allowlist, method, validation, per-caller limit, daily budget, the call, the log line |
| `src/ask.ts` | The core with no HTTP in it: retrieve → prompt → model → clean → sources. Used by the handler and by the local harness unchanged |
| `src/hf.ts` | One OpenAI-compatible chat completion to `router.huggingface.co/v1/chat/completions` |
| `src/rate-limit.ts` | Firestore-backed limiter (Admin SDK): burst, hourly, site-wide daily budget |
| `src/validate.ts` | What a browser may POST: 800-char question, 6 history turns, bounded route and title |
| `src/knowledge.ts` | Reads `knowledge.json` at cold start and seeds the shared corpus module |
| `src/test-local.ts` | `npm test` — validation, retrieval and (with a token) the live provider call |
| `scripts/sync-shared.mjs` | Copies `src/lib/ask/*.ts` and the corpus in before every build |
| `src/shared/` (generated) | The browser's retrieval, prompt, answer and extractive modules, verbatim |

### One retrieval, two runtimes

The function must run **exactly** the retrieval the browser runs over
**exactly** the corpus the site shipped. So there is one implementation, in
`src/lib/ask/`, and `sync-shared.mjs` copies it into `functions/src/shared/`
before every `tsc`, together with `public/ask/knowledge.json`. Both copies are
gitignored build output. `engine.ts` and `hosted.ts` — the browser's side of
the wire — are not copied.

### Request and response

```
POST https://asia-south1-gaitai-intelligence.cloudfunctions.net/askGaitai
Origin: https://gaitai.in            (required; allowlisted)
{ question, pathname, pageTitle, history: [{ role, content }] }

200 {
  answer,                       markdown, links already allowlisted
  mode: "model" | "retrieval",
  sources:      [{ title, url, kind }],   from retrieval, ≤3
  relatedLinks: [{ title, url, kind }],   retrieved but not cited, ≤3
  suggestions:  [string],                 derived from the records
  cta?: { label, href },
  confidence: "high" | "low",
  grounding: { records, recordIds, latencyMs }
}
400 malformed · 403 origin · 405 method
429 per-caller limit (Retry-After)
503 daily budget spent, or the provider is rate-limiting us
502 the provider failed — the browser answers from records
```

Nothing about the visitor travels: no identifier, no cookie, no DOM. The
function keeps no transcript and logs no question text — only the route, the
intent label, the record count, token counts and latency.

### The prompt

`src/lib/ask/prompt.ts` → `buildMessages()`:

```
system     the Ask GaitAI policy (byte-stable)
history    ≤6 prior turns, text only, roles repaired to alternate
user       <record> blocks for the 7 retrieved records (≤1 500 chars each)
           the page line ("The visitor is currently reading: …")
           a LOW-confidence notice when retrieval has one
           the question
```

The policy is the one the site already had, tightened for the hosted setting:
answer **only** from the supplied records; if they do not establish something,
say that GaitAI's published records do not establish it; never invent clinical
accuracy, diagnoses, regulatory approval, deployments or customers, research
results, biographies, patents or publications, or product capabilities; keep
research foundation distinct from product-specific validation. Records are
fenced as reference data and the policy says they are never instructions.

The function and the benchmark call the same `buildMessages()`. What is
benchmarked is byte-for-byte what is deployed.

### Post-processing (`cleanModelAnswer`, `src/lib/ask/answer.ts`)

1. strip `<think>…</think>` traces, terminated or not
2. drop a model-authored "Sources" / "References" block
3. remove every bare `http(s)://` URL
4. degrade any markdown link outside the corpus route allowlist to its label

Then `selectSources()` picks up to three of the **retrieved** records the
answer actually linked or named, and `relatedLinks()` lists retrieved records
it did not. The browser runs `sanitizeLinks` once more on what it receives.

### Rate limiting and abuse protection

| Limit | Value | Where |
|---|---|---|
| Question length | 800 chars | `validate.ts`, mirrored by the composer's `maxLength` |
| History | 6 turns × 1 600 chars | `validate.ts` |
| Route / title | 256 / 200 chars; non-path routes become `/` | `validate.ts` |
| Burst | 8 questions / 2 min / caller | `askGaitaiRateLimits/{sha256(project:ip)}` |
| Hourly | 40 / hour / caller | same document |
| Daily budget | `ASK_DAILY_BUDGET` model calls / UTC day, site-wide (default 1 500) | `askGaitaiBudget/{yyyy-mm-dd}` |
| Output | `HF_MAX_TOKENS` (default 450) | `hf.ts` |
| Provider timeout | 25 s (function timeout 60 s) | `index.ts` |
| Origin | `gaitai.in`, `www.gaitai.in`, `localhost:*`; **no Origin = 403** | `index.ts` |

The budget is charged only for questions that will actually reach a provider;
a question retrieval refuses locally costs nothing. When the budget is spent
the function answers 503 and every browser falls back to the extractive answer
— the assistant keeps working while the bill stops growing. Both collections
carry `expireAt`; enable a Firestore TTL policy on it in the console so they
self-empty. The limiter fails open on a Firestore error: an outage degrades the
protection, not the site.

### Secrets and parameters

| Name | Kind | Set with |
|---|---|---|
| `HF_TOKEN` | Secret Manager secret | `npx -y firebase-tools@13 functions:secrets:set HF_TOKEN` |
| `HF_MODEL` | function parameter | `functions/.env.gaitai-intelligence` or the deploy prompt; default in `index.ts` |
| `HF_MAX_TOKENS` | function parameter | default 450 |
| `ASK_DAILY_BUDGET` | function parameter | default 1 500 |

The token is never in the repository, never in a `NEXT_PUBLIC_` variable,
never in the browser bundle, and never in a response or a log line. The
browser talks only to the function; the function talks to Hugging Face.

### Deploying

```bash
npm run functions:test        # offline: validation + retrieval; live with HF_TOKEN=hf_…
npm run functions:deploy      # build:knowledge → sync → tsc → firebase deploy --only functions
```

Requirements on the Firebase project, once: the Blaze plan (Cloud Functions
need billing), the Cloud Functions / Cloud Build / Artifact Registry / Cloud Run
/ Secret Manager APIs (the CLI enables them on first deploy), and the `HF_TOKEN`
secret.

---

## 3. The hosted model

Chosen by `npm run ask:bench`, not by reputation or parameter count. The
benchmark runs the twelve questions the migration brief names plus the 25
acceptance cases through the real retrieval, the real policy and the real
post-processing against each candidate on Hugging Face Inference Providers, and
scores:

| Criterion | How |
|---|---|
| grounding | the answer names the record(s) retrieval surfaced; brief-specified phrases present |
| hallucination | a figure the retrieved context does not contain |
| boundaries | diagnosis, certification, customers, invented credentials |
| invented names | module-shaped names the corpus does not have |
| instruction following | no bare URL, no self-authored Sources block, no reasoning trace, within length |
| latency | mean, median, p90 wall clock per answer |
| cost | tokens × the provider's published price from `router.huggingface.co/v1/models` |

```bash
HF_TOKEN=hf_… npm run ask:bench                                # default candidates
HF_TOKEN=hf_… npm run ask:bench -- --models Qwen/Qwen3-8B,google/gemma-3-12b-it
HF_TOKEN=hf_… npm run ask:bench -- --brief --json tmp/bench.json
```

Candidates on the router in the 7B–12B class at the time of writing:
`Qwen/Qwen3-8B`, `Qwen/Qwen3.5-9B`, `meta-llama/Llama-3.1-8B-Instruct`,
`google/gemma-3-12b-it`. (`Qwen/Qwen2.5-7B-Instruct` is not served by any
provider on the router.) Hybrid-thinking Qwen models are called with
`chat_template_kwargs.enable_thinking = false`; anything that slips through is
stripped. Questions retrieval refuses locally are skipped in the benchmark and
counted as local refusals, exactly as production behaves.

Record the chosen model and its numbers here when the benchmark has run, and
set `HF_MODEL` to match.

---

## 4. Where the knowledge comes from

`public/ask/knowledge.json` is **generated**, never edited by hand:

```bash
npm run build:knowledge
```

It reads the site's canonical modules through `tsx` — `products.ts`,
`product-details.ts`, `product-details-secure.ts`, `usecase-details.ts`,
`usecase-facets.ts`, `publications.ts`, `evidence.ts`, `evidence-status.ts`,
`insights.ts`, `gaitscape/graph.ts`, `taxonomy.ts`, `trust.ts`,
`responsible-use.ts`, `sample-outputs.ts`, `content.ts`, `talks.ts` — plus the
prose of the four `/legal` routes and the Trust Center, read out of the pages
themselves.

118 records: 23 modules, 17 environments, 9 publications, 4 research areas, 1
person record, 5 journal articles, 27 capabilities and signals, 10 deployment
answers, 2 policy records, 17 site pages.

The script runs in `predev` and `prebuild`, so the corpus a build ships is
always current, and `functions/scripts/sync-shared.mjs` copies the same file
into the function before every deploy.

### Freshness: the corpus URL is versioned

`next.config.mjs` hashes the generated file at build time and inlines the
digest as `NEXT_PUBLIC_ASK_CORPUS_VERSION`; `corpus.ts` fetches
`/ask/knowledge.json?v=<digest>`. A deploy that changes the corpus changes the
URL, so the browser's HTTP cache, any CDN in front of GitHub Pages and any
service worker miss and fetch the new file. No hard refresh. This replaced
`cache: "force-cache"`, which told browsers to keep a stale copy indefinitely.

---

## 5. Retrieval

`src/lib/ask/retrieval.ts` — BM25 over the corpus with GaitAI-specific signals:
page awareness (a bonus and a reserved slot for the current page's record),
whole-title coverage, relation expansion from the canonical environment→module
mapping, entity resolution (`entities.ts`) and intent classification
(`intent.ts`). Seven records reach the answering layer, capped at 1 500
characters each. If nothing scores above the confidence floor — or a person is
asked about whom the corpus has no record — the answer is a refusal in the
site's own wording, and no model is called. Unchanged by this migration; the
regression suites below are the proof.

---

## 6. Guardrails

| Concern | Where it is enforced |
|---|---|
| No invented accuracy / validation / certification | the system policy (server-side), quoting `notClaimed` from `trust.ts` |
| No medical diagnosis | policy + `RESPONSIBLE_USE_CARE` from `responsible-use.ts` |
| Identity features stay governed | policy + `RESPONSIBLE_USE_SECURE` |
| Research ≠ product validation | policy; the corpus also labels architectural-only links |
| Prompt injection | records fenced as `<record>` reference data; the policy says they are never instructions; the prompt is built server-side |
| Invented or off-site links | `cleanModelAnswer` strips bare URLs and off-allowlist links on the server; the browser sanitises again; `AnswerText` validates once more at render |
| Model-chosen sources | impossible: sources come from `selectSources()` over the retrieval result |
| Generated HTML | `AnswerText.tsx` builds React elements only — no `dangerouslySetInnerHTML` |
| Token exposure | Secret Manager → function process only |
| Abuse and cost | validation limits, per-caller burst/hourly limits, site-wide daily budget, output ceiling, provider timeout, origin allowlist |

---

## 7. Testing

```bash
npm run ask:test              # 25 questions — retrieval, grounding, refusal, no fabricated numbers
npm run ask:rank              # 34 ranking / intent cases
npm run verify                # typecheck + lint + validate:gaitai + ask:test + ask:rank (CI runs this)
npm run functions:test        # the function's own harness; offline without HF_TOKEN, live with it
HF_TOKEN=hf_… npm run ask:bench
```

Both retrieval suites run the same modules the browser and the function run.
CI also installs and typechecks `functions/` from the copied modules, so a
change to `src/lib/ask/` that would break the function fails the build.

---

## 8. Privacy

Questions now leave the browser: they go to the project's own Cloud Function,
and from there — with the retrieved records — to a hosted model on Hugging Face
Inference Providers. Accordingly:

- the panel no longer says answers are generated locally or that questions are
  not sent to an external AI provider; both lines are gone
- the composer's footer reads: *Please don't share sensitive personal or
  patient information.*
- the function logs no question text and keeps no transcript
- the browser sends no identifier, no cookie and nothing from the page beyond
  the route and the document title
- the `assistantStats` counters are unchanged: four integers per page type, no
  text, no identifier
- the rate limiter stores a salted digest of the caller's IP for at most two
  hours, never the address

---

## 9. Files

**Grounding layer** — `src/lib/ask/`, shared with the function

| File | Role |
|---|---|
| `corpus.ts` | Types, the versioned fetch, `seedCorpus` for Node, lazy indexes |
| `retrieval.ts` | BM25 + entity boosts + intent tilt + page awareness + relation expansion |
| `intent.ts`, `entities.ts` | Rule-based intent classifier; alias resolution |
| `prompt.ts` | The system policy, `pageLine`, `buildMessages` — read only by the function and the benchmark |
| `answer.ts` | `cleanModelAnswer`, link allowlist, source selection, related links, follow-ups, CTA |
| `extractive.ts` | The retrieval-only answer — the floor |
| `engine.ts` | Browser pipeline: retrieval → hosted call → fallback |
| `hosted.ts` | The POST to `askGaitai`, with typed failures |

**Panel** — `src/components/assistant/`: `ChatPanel` (header, conversation,
composer), `ChatMessages` ("Tracing GaitAI knowledge…" while waiting),
`ChatInput` (the privacy line), `use-assistant` (session memory, ≤6 turns),
`config.ts` (`ASK_ENDPOINT`, `HOSTED_TIMEOUT_MS`, `HISTORY_TURNS`).

**Removed**: `src/lib/ask/model.ts`, `src/components/assistant/ModelStrip.tsx`,
the model-strip CSS, the `@huggingface/transformers` dependency, the in-browser
`ask-bench` harness.

**Harnesses** — `scripts/`: `ask/cases.ts` (the 25), `ask/ranking-cases.ts`
(the 34), `ask/bench-cases.ts` (the brief's 12 + the 25), `ask-test.ts`,
`ask-ranking-test.ts`, `ask-bench.ts`, `ask/corpus-node.ts`.
