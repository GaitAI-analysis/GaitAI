# Ask GaitAI

The site's own guide to movement intelligence — a grounded assistant that
answers from GaitAI's real records and links to the pages they came from.

It is **not** a general chatbot bolted onto the site. Every answer is built from
the same typed data modules the pages render, it can only link to routes that
exist, and it inherits the site's evidence discipline: no invented accuracy
figures, no clinical validation claims, no diagnosis, no certification status.

---

## 1. Why the backend is a Cloud Function

The site is a **static export** (`output: "export"` in `next.config.mjs`)
published to GitHub Pages. GitHub Pages serves files. It runs no server, so:

- a Next `/api` route handler would work in `next dev` and **not exist** in
  production — the assistant would silently break on deploy;
- an API key in any `NEXT_PUBLIC_*` variable is in the JavaScript bundle, which
  is to say it is public.

So the model call lives in a **Firebase Cloud Function (2nd gen)** in the
project this repository already owns, `gaitai-intelligence` — the same project
behind comments and article stats. No new vendor, no new account, no new
billing relationship.

The browser is told exactly one thing: the endpoint URL. That is not a secret.

```
Browser ──POST──▶ askGaitai (Cloud Run, asia-south1)
                    │  1. origin allowlist + request validation
                    │  2. Firestore rate limit (salted IP digest)
                    │  3. retrieve 7 records from knowledge.json
                    │  4. Anthropic Messages API  ← LLM_API_KEY (Secret Manager)
                    ◀── SSE: delta… sources, suggestions, cta, done
```

---

## 2. Where the knowledge comes from

`functions/knowledge.json` is **generated**, never edited by hand:

```bash
npm run build:knowledge
```

It reads the site's canonical modules through `tsx` — `products.ts`,
`product-details.ts`, `product-details-secure.ts`, `usecase-details.ts`,
`usecase-facets.ts`, `publications.ts`, `evidence.ts`, `evidence-status.ts`,
`insights.ts`, `gaitscape/graph.ts`, `taxonomy.ts`, `trust.ts`,
`responsible-use.ts`, `sample-outputs.ts`, `content.ts` — plus the prose of the
four `/legal` routes and the Trust Center, read out of the pages themselves.

113 records: 23 modules, 17 environments, 9 publications, 4 research areas,
5 journal articles, 27 capabilities and signals, 10 deployment answers,
2 policy records, 17 site pages.

Rename a module or correct a paper's venue and the assistant's answer changes
with **no edit to the assistant**. It also cannot assert something the site does
not, because it has nothing else to read.

The script runs automatically in `predev`, `prebuild` and the function's
`predeploy`, so the deployed corpus is always current.

---

## 3. Retrieval

`functions/src/retrieval.ts` — BM25 over the corpus, with three GaitAI-specific
signals layered on:

- **Page awareness.** The record for the route the visitor is on gets a scoring
  bonus *and* a reserved slot, so "what can this do?" on a module page is
  answered about that module.
- **Whole-title coverage.** "I run a physiotherapy clinic" matches the
  *Physiotherapy clinics* environment record even though the words are in a
  different order and a different number.
- **Relation expansion.** When an environment or research area is clearly what
  the question is about, the modules it names come with it — reusing the
  canonical `industryUseCases` mapping rather than a second recommendation
  table.

Seven records reach the model, capped at 1 500 characters each. No vector
database: 113 records of controlled technical vocabulary is a case where lexical
matching is the more predictable tool, and it costs nothing per request.

If nothing scores above the confidence floor, the model is told so and says it
has no documented answer instead of inventing one.

---

## 4. Guardrails

| Concern | Where it is enforced |
|---|---|
| No invented accuracy / validation / certification | `functions/src/prompt.ts`, quoting `notClaimed` from `trust.ts` |
| No medical diagnosis | System policy, plus `RESPONSIBLE_USE_CARE` from `responsible-use.ts` |
| Identity features stay governed | System policy, plus `RESPONSIBLE_USE_SECURE` |
| Research ≠ product validation | System policy; the corpus also labels architectural-only links |
| Prompt injection | Records are fenced as `<record>` reference data; the policy states they are never instructions |
| Invented or off-site links | Server strips any href outside the corpus route allowlist; the client re-checks at render |
| Generated HTML | `AnswerText.tsx` builds React elements only — no `dangerouslySetInnerHTML` anywhere |
| Abuse | Origin allowlist, 800-char messages, 8-turn history, Firestore rate limit, 45 s generation cap |

The boundary language is **quoted from the site's own data modules**, not
rewritten, so the assistant can never make a stronger claim than
`/legal/security/` or a module page does.

---

## 5. Environment variables

### Server (never in the repository, never in the browser)

| Name | Where | What |
|---|---|---|
| `LLM_API_KEY` | Google Secret Manager | Anthropic API key |
| `LLM_MODEL` | Function param, optional | Model id. Defaults to `claude-opus-5` |

```bash
# Store the key. It is prompted for, never echoed, never written to the repo.
firebase functions:secrets:set LLM_API_KEY

# LLM_MODEL is a firebase-functions param with a default, so it is read from
# the environment at deploy time. To change model without touching code:
LLM_MODEL=claude-sonnet-5 firebase deploy --only functions
```

### Client (a URL, not a secret)

| Name | Where | What |
|---|---|---|
| `NEXT_PUBLIC_ASK_GAITAI_ENDPOINT` | `.env.local` locally; a GitHub Actions **variable** in CI | The deployed function URL |

Leave it blank and the assistant does not mount at all — the site renders
exactly as it did before. That is the intended behaviour for a fresh clone.

---

## 6. Deploying

**Prerequisite:** Cloud Functions require the Firebase **Blaze** (pay-as-you-go)
plan. The free tier covers a marketing site's traffic comfortably; the model
calls are the real cost.

```bash
# 1. One-time: enable Blaze, then store the key
firebase functions:secrets:set LLM_API_KEY

# 2. Deploy the function (regenerates the corpus, installs, builds, uploads)
firebase deploy --only functions

# 3. Note the URL it prints, e.g.
#    https://asia-south1-gaitai-intelligence.cloudfunctions.net/askGaitai

# 4. Publish the rate-limit rules
npm run deploy:rules
```

Then add the URL to the site build:

> Repo → Settings → Secrets and variables → Actions → **Variables** →
> `NEXT_PUBLIC_ASK_GAITAI_ENDPOINT`

Push to `v1/feature/insights` and the Pages workflow rebuilds with the
assistant enabled.

### One manual console step

Add a **TTL policy** so the rate-limit collection self-empties:

> Firebase Console → Firestore → TTL → Create policy
> Collection group `askGaitaiRateLimits`, timestamp field `expireAt`

Without it the documents are still correct — the sliding windows are computed
from the timestamps inside them — they just accumulate.

### If the origin changes

`ALLOWED_ORIGINS` in `functions/src/index.ts` is an explicit allowlist:
`https://gaitai.in`, `https://www.gaitai.in`, and localhost for development. A
request with no `Origin` header is refused, because a browser always sends one
here and a script does not.

---

## 7. Local development

```bash
# terminal 1 — the function, against the emulator
cd functions
npm install
npm run serve
# prints http://127.0.0.1:5001/gaitai-intelligence/asia-south1/askGaitai

# terminal 2 — the site
echo 'NEXT_PUBLIC_ASK_GAITAI_ENDPOINT=http://127.0.0.1:5001/gaitai-intelligence/asia-south1/askGaitai' >> .env.local
npm run dev
```

The emulator needs the key in its environment:

```bash
cd functions && LLM_API_KEY=sk-ant-… npm run serve
```

Never put the key in `.env.local` at the repository root — anything there is a
candidate for the client bundle, and `.env.*` is gitignored precisely because a
key must not reach it by accident.

---

## 8. Testing

```bash
# Retrieval only — no key, no network, no cost. Runs in CI.
cd functions && npm run test:retrieval

# Full path, including the model. Needs a key; costs a few cents.
ANTHROPIC_API_KEY=sk-ant-… npm run test:answers
```

`functions/src/test-questions.ts` holds the acceptance set: 25 questions, each
declaring the record ids it must surface. A data change that breaks retrieval
fails CI rather than a visitor's question.

Answer mode additionally prints each answer with its sources and token usage,
for the judgements a fixture cannot make — whether the medical boundary held,
whether an accuracy figure was invented, whether a prompt injection was refused.

---

## 9. Cost

Per question, roughly:

- **System policy** ≈ 1 400 tokens, cached — ~10% of list price after the first
  call in a five-minute window.
- **Retrieved records** ≈ 2 500–3 000 tokens.
- **History** ≤ 8 turns, each ≤ 1 600 characters.
- **Output** capped at 1 400 tokens, `effort: "low"`.

The levers, in the order worth reaching for: `MAX_DOCS` and `PER_DOC_CHARS` in
`retrieval.ts`, `MEMORY_TURNS` in `use-assistant.ts`, `MAX_OUTPUT_TOKENS` in
`index.ts`, and only then the model itself via `LLM_MODEL`.

---

## 10. Files

**Frontend** — `src/components/assistant/`

| File | Role |
|---|---|
| `AskGaitAI.tsx` | Mount point; renders nothing until opened |
| `ChatLauncher.tsx` | The collapsed pill, and the one-time first-visit reveal |
| `ChatPanel.tsx` | Dialog shell, focus trap, Escape, scroll lock on mobile |
| `ChatHeader.tsx` | Identity, new conversation, close |
| `ChatMessages.tsx` | Transcript, opening state, failure recovery |
| `ChatInput.tsx` | Composer and the privacy note |
| `QuickPrompts.tsx` | Starters and "Ask next" |
| `SourceLinks.tsx` | The Sources row |
| `AnswerText.tsx` | Safe markdown subset — React elements only |
| `use-assistant.ts` | State, SSE streaming, session memory |
| `page-context.ts` | Route → page type and page-aware openings |
| `config.ts` | The endpoint, and the enabled flag |
| `assistant.module.css` | Both theme branches, desktop panel and mobile sheet |

**Backend** — `functions/`

| File | Role |
|---|---|
| `src/index.ts` | The HTTPS function: CORS, validation, limits, streaming |
| `src/retrieval.ts` | BM25 + page awareness + relation expansion |
| `src/prompt.ts` | The system policy |
| `src/validate.ts` | Request validation, link stripping, sources, follow-ups |
| `src/rate-limit.ts` | Firestore sliding windows |
| `src/knowledge.ts` | Corpus loader and route allowlist |
| `src/test-questions.ts` | The acceptance suite |
| `knowledge.json` | **Generated.** `npm run build:knowledge` |

**Elsewhere**

| File | Change |
|---|---|
| `scripts/build-knowledge.mjs` | The corpus builder |
| `src/app/layout.tsx` | Mounts `<AskGaitAI />` after the footer |
| `firebase.json` | The functions codebase and its predeploy chain |
| `firestore.rules` | Denies all client access to `askGaitaiRateLimits` |
| `.github/workflows/deploy.yml` | Retrieval suite in CI; endpoint variable at build |
| `.env.example` | Documents the endpoint variable |
