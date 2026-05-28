// Server-only — must never be imported from a client component.
import fs from "fs/promises";
import path from "path";
import { Post, slugify } from "./posts";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "posts.json");

const seed: Post[] = [
  {
    id: "seed-approval-iso",
    slug: "gaitai-begins-iso-13485-readiness",
    title: "GaitAI begins ISO 13485 readiness assessment for medical-grade gait analytics",
    category: "approval",
    summary:
      "An important milestone on our path to certified medical use — GaitAI has formally begun ISO 13485 quality-management readiness for its Care vertical.",
    body: `## What this means

ISO 13485 is the global quality-management standard for medical devices and medical software. Beginning readiness is the first formal step toward GaitAI Care being deployable in clinical environments such as hospitals, rehabilitation centers and elderly-care facilities.

## What we're working on

- Documented quality-management system across product, engineering, data and clinical operations.
- Risk-management process per ISO 14971 for every Care feature.
- Clinical evaluation plan for fall-risk prediction and gait-based mobility scoring.
- Post-market surveillance plan covering edge devices and cloud analytics.

## Why this matters

Movement intelligence can only protect lives if it is auditable, safe and trustworthy. Our long-term mission is to make GaitAI Care a tool every clinician, family and rehabilitation specialist can rely on — and that begins with the right quality foundation.

> "Building movement intelligence for healthcare is a privilege. ISO 13485 is the floor we choose to build above."

We'll share periodic updates here as we progress through audit and certification.`,
    tags: ["ISO 13485", "medical", "compliance", "care"],
    publishedAt: "2026-04-22T09:00:00.000Z",
    author: "GaitAI Compliance",
    featured: true,
  },
  {
    id: "seed-research-parkinson",
    slug: "early-parkinsonian-gait-detection",
    title: "Early Parkinsonian gait detection via multi-view pose & temporal symmetry",
    category: "research",
    summary:
      "A look at our internal research on detecting early Parkinsonian movement patterns months before clinical diagnosis — using multi-view 2D pose plus temporal symmetry features.",
    body: `## Background

Parkinson's disease has well-documented gait markers — reduced arm swing, asymmetric stride, freezing episodes, postural micro-instabilities — that often appear long before formal diagnosis.

## Our approach

We combine:

- **Multi-view 2D pose** estimation at 30fps from standard RGB cameras.
- **Temporal symmetry features** computed across left/right limbs over rolling windows.
- A **probabilistic risk score** designed to surface change-over-time rather than absolute diagnosis.

## Early findings

In our internal dataset of synthetic and consented real-world walking sequences, the symmetry-decay feature alone produced strong separation between baseline and induced asymmetry. We're actively expanding the dataset with research partners.

## What's next

GaitAI is **not** a diagnostic device. The objective is to surface early signals that prompt human clinical review. The next phase is multi-site validation with neurology research groups.

If you're a clinician or research lab working on movement-linked neurological conditions, [reach out](#contact) — we're actively forming research collaborations.`,
    tags: ["Parkinson's", "neurology", "pose estimation", "research"],
    publishedAt: "2026-04-08T10:30:00.000Z",
    author: "GaitAI Research",
  },
  {
    id: "seed-announcement-care",
    slug: "gaitai-care-preview-launches",
    title: "GaitAI Care preview launches for select early partners",
    category: "announcement",
    summary:
      "The first private preview of GaitAI Care — designed for elderly fall-risk prediction and family-grade movement monitoring — is now in the hands of early partners.",
    body: `Today we are opening the first private preview of **GaitAI Care** to a small group of design partners: two rehabilitation centers, one senior-living provider and three family-care pilot homes.

## What's in the preview

- Continuous gait observation from a single ceiling-mounted RGB sensor.
- Daily mobility, balance and stability scoring for each resident.
- Family-friendly alerts when fall-risk indicators cross a personalized threshold.
- Clinician-grade longitudinal dashboards.

## What we're learning

Early feedback has been clear: families don't want more alerts, they want **fewer, more meaningful ones**. We're tuning our risk model to reduce noise and surface only changes worth a conversation.

If you operate an elderly-care facility, rehabilitation program or research home and want to join the next wave of design partners, [get in touch](#contact).`,
    tags: ["Care", "preview", "elderly", "fall-risk"],
    publishedAt: "2026-03-29T08:00:00.000Z",
    author: "GaitAI",
  },
  {
    id: "seed-docs-edge-sdk",
    slug: "gaitai-edge-sdk-getting-started",
    title: "GaitAI Edge SDK — getting started",
    category: "documentation",
    summary:
      "A walkthrough of the GaitAI Edge SDK — how to run gait pose, identity and risk inference on a single edge device with sub-40ms latency.",
    body: `## Install

\`\`\`bash
pip install gaitai-edge
\`\`\`

## Hello, gait

\`\`\`python
from gaitai_edge import GaitStream

stream = GaitStream.from_camera(0, model="gaitai-base-v1")
for frame in stream:
    print(frame.identity_score, frame.fall_risk, frame.cadence)
\`\`\`

## What you get per frame

- 17-keypoint 2D pose (COCO format)
- A rolling identity signature
- Balance, cadence and symmetry signals
- A bounded fall-risk score in [0, 1]

## Requirements

- Python 3.10+
- A CUDA-capable GPU **or** Apple Silicon (Metal)
- 200MB free disk

## Next

Read the [model card](#) and the [privacy whitepaper](#). Reach out to ship Edge SDK to your fleet at scale.`,
    tags: ["SDK", "edge", "Python", "developer"],
    publishedAt: "2026-03-12T12:00:00.000Z",
    author: "GaitAI Engineering",
  },
  {
    id: "seed-blog-biometric",
    slug: "why-movement-is-the-next-biometric",
    title: "Why movement intelligence is the next biometric frontier",
    category: "blog",
    summary:
      "Face, fingerprint and voice have limits. Movement is universal, ambient, hard to spoof — and reveals more than identity. A short essay on why it matters.",
    body: `Face works in good light. Fingerprint needs a touch. Voice fails in a crowd. Each of the dominant biometrics has a useful surface and a clear edge it falls off.

**Movement is different.** It works from a distance. It works from above, from below, from the side. It works in poor light, in masks, in heavy clothing. It works for the consenting and — uncomfortably — for the non-consenting. It can be a tool of safety and it can be a tool of surveillance. That is why how it is built matters.

GaitAI is built around two beliefs:

1. Movement intelligence will be the next dominant ambient biometric.
2. It must be built with privacy-by-design, explainability and the dignity of the observed person as first-class concerns.

The reason GaitAI splits its platform into **Secure** and **Care** is exactly because the same underlying signal — *how a person moves* — answers two different questions:

- *Who is this person?* (Secure)
- *Is this person okay?* (Care)

Both questions matter. We intend to answer them with the same intelligence and the same standard of care.`,
    tags: ["essay", "biometrics", "vision"],
    publishedAt: "2026-02-26T15:00:00.000Z",
    author: "GaitAI",
  },
  {
    id: "seed-demo-q2",
    slug: "q2-showcase-five-figure-sequence",
    title: "Q2 showcase: 5-figure gait sequence demo",
    category: "demo",
    summary:
      "Watch our Q2 internal showcase — five animated gait sequences rendered in real-time on a single edge device.",
    body: `Our Q2 showcase brought our hero demo to life: **five concurrent gait sequences**, each pulling identity, balance and cadence from a single edge inference pass.

## What we wanted to prove

- One model, five concurrent subjects, sub-40ms per frame.
- Clean identity separation even when subjects walked the same path.
- Per-subject longitudinal scoring that survives occlusion.

## What we learned

The biggest insight came from **occlusion recovery** — when subject 3 walks behind subject 4 for ~12 frames, the identity signature must hold. Our temporal pose buffer made the difference.

## Watch

A trimmed version of the showcase is available on request. [Get in touch](#contact) if you'd like a walkthrough.`,
    tags: ["demo", "showcase", "edge"],
    publishedAt: "2026-02-10T11:00:00.000Z",
    author: "GaitAI",
  },
];

async function ensureFile(): Promise<void> {
  try {
    await fs.access(FILE);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(FILE, JSON.stringify({ posts: seed }, null, 2));
  }
}

export async function readPosts(): Promise<Post[]> {
  await ensureFile();
  const raw = await fs.readFile(FILE, "utf-8");
  try {
    const data = JSON.parse(raw);
    return (data.posts as Post[]) || [];
  } catch {
    return [];
  }
}

export async function writePosts(posts: Post[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify({ posts }, null, 2));
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const posts = await readPosts();
  return posts.find((p) => p.slug === slug) ?? null;
}

export async function getPostById(id: string): Promise<Post | null> {
  const posts = await readPosts();
  return posts.find((p) => p.id === id) ?? null;
}

export async function uniqueSlug(base: string, ignoreId?: string): Promise<string> {
  const posts = await readPosts();
  const slug = slugify(base);
  if (!slug) return `p-${Date.now().toString(36)}`;
  let candidate = slug;
  let n = 2;
  while (posts.some((p) => p.slug === candidate && p.id !== ignoreId)) {
    candidate = `${slug}-${n++}`;
  }
  return candidate;
}
