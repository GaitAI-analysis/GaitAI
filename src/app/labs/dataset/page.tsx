import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DatasetLineageScene } from "@/components/labs/GaitLabScenes";
import styles from "@/components/labs/gaitLabs.module.css";
import {
  GAIT_LABS_BOUNDARY,
  GAIT_LABS_EYEBROW,
  GAIT_LAB_STATUS_LABEL,
  gaitLabById,
} from "@/data/labs";
import { allPublications } from "@/data/publications";

const lab = gaitLabById("dataset");

const TITLE = `Gait Dataset — ${GAIT_LABS_EYEBROW}`;
const DESCRIPTION =
  "The gait dataset behind GaitAI's research: its dataset card, the published work on gait data it rests on, and how to enquire about research use. No figure is shown until it can be cited.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/labs/dataset" },
  openGraph: {
    type: "website",
    url: "/labs/dataset",
    siteName: "GaitAI",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

/**
 * /labs/dataset — the Gait Dataset.
 *
 * The route exists so the dataset has a canonical address inside GaitAI Labs
 * from the day the hub exists. What it may show is bounded by what the
 * repository can cite: the record (`data/labs.ts`) names no subject count,
 * session count, view count or availability, because none has been released,
 * and this page prints none. The dataset card below is therefore a CARD
 * SCHEMA — the fields that will be documented — each marked as not yet
 * published, rather than a table of invented values. When the release
 * documentation is final the values go into the record, and this page
 * renders them without changing shape.
 */
export default function GaitDatasetPage() {
  if (!lab) notFound();

  const papers = allPublications.filter((p) => lab.publicationIds.includes(p.id));

  return (
    <div className={styles.root}>
      {/* ── INTRO ── */}
      <section className="site-page-intro relative overflow-hidden pb-10">
        <div className="container-wide">
          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12">
            <div className="min-w-0">
              <Link
                href="/labs/"
                className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300 transition-colors hover:text-cyan-200"
              >
                {GAIT_LABS_EYEBROW}
                <span aria-hidden="true"> · </span>
                <span className="text-soft-mute">01</span>
              </Link>
              <h1 className="mt-5 font-display text-display-xl text-balance text-soft-white">
                {lab.name}
              </h1>
              <p className="mt-3 text-lg text-cyan-300">{lab.strap}</p>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-soft-gray sm:text-lg">
                {lab.body}
              </p>

              <div className="mt-6">
                <span className={styles.status}>
                  <span aria-hidden="true" className={styles.statusDot} />
                  {GAIT_LAB_STATUS_LABEL[lab.status]}
                </span>
              </div>

              <p className="mt-5 max-w-xl text-[13px] leading-relaxed text-soft-mute">
                {GAIT_LABS_BOUNDARY}
              </p>
            </div>

            <figure className={`${styles.areaStage} lg:pt-6`}>
              <DatasetLineageScene />
            </figure>
          </div>
        </div>
      </section>

      {/* ── THE DATASET CARD ── */}
      <section
        id="card"
        className="border-t border-white/[0.07] py-14 sm:py-16 site-anchor-offset"
      >
        <div className="container-wide">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
            Dataset card
          </span>
          <h2 className="mt-5 max-w-2xl font-display text-display-md text-balance text-soft-white">
            What the card{" "}
            <span className="text-gradient">will document.</span>
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-soft-gray">
            These are the fields the dataset card carries. A field is filled in
            only with a value that can be cited from the release documentation;
            until then it is listed and left empty, which is the honest state.
          </p>

          <ol className={styles.facets}>
            {lab.facets.map((facet, i) => (
              <li key={facet} className={styles.facet}>
                <span className={styles.facetIndex}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className={`${styles.facetName} block`}>{facet}</span>
                <span className={`${styles.facetState} block`}>
                  Not yet published
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── THE PUBLISHED WORK ON GAIT DATA ── Derived from the record's
          publication ids; the keywords are the papers' own. */}
      <section
        id="research"
        className="border-t border-white/[0.07] py-14 sm:py-16 site-anchor-offset"
      >
        <div className="container-wide">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
            Published work on gait data
          </span>
          <h2 className="mt-5 max-w-2xl font-display text-display-md text-balance text-soft-white">
            What the record already says about{" "}
            <span className="text-gradient">gait datasets.</span>
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-soft-gray">
            The founder&apos;s published work addresses how a gait dataset is
            protected inside a deep-learning pipeline and how recognition can be
            built on pose features rather than appearance. Both bear directly on
            how this dataset is prepared and how it may be used.
          </p>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {papers.map((paper) => (
              <Link
                key={paper.id}
                href={`/publications/${paper.id}/`}
                className="card-link relative flex flex-col rounded-[1.25rem] border border-white/[0.08] bg-white/[0.02] p-6"
              >
                <span className="font-mono text-[11px] tracking-[0.14em] text-soft-mute">
                  {paper.venue} · {paper.year}
                </span>
                <span className="mt-3 font-display text-lg leading-snug text-soft-white">
                  {paper.title}
                </span>
                <span className="mt-4 flex flex-wrap gap-1.5">
                  {(paper.keywords ?? []).map((keyword) => (
                    <span
                      key={keyword}
                      className="rounded-full border border-white/[0.09] px-2.5 py-1 text-[11px] text-soft-mute"
                    >
                      {keyword}
                    </span>
                  ))}
                </span>
                <span className="card-cue mt-5 inline-flex items-center gap-1 text-sm text-cyan-300">
                  Read the record
                  <span aria-hidden="true" className="card-cue-arrow">
                    &rarr;
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── RESEARCH USE ── */}
      <section
        id="access"
        className="border-t border-white/[0.07] py-14 sm:py-16 site-anchor-offset"
      >
        <div className="container-wide">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/8 bg-gradient-to-b from-white/[0.04] to-transparent p-10 sm:p-14">
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-radial-cyan opacity-40 blur-3xl" />
            <div className="relative max-w-2xl">
              <span className="eyebrow">
                <span className="h-1 w-6 rounded-full bg-gradient-brand" />
                Research usage &amp; availability
              </span>
              <h2 className="mt-5 font-display text-display-md text-balance text-soft-white">
                Access terms are published with the card.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-soft-gray">
                Licence, citation and the conditions of research use will be
                stated on this page when the dataset card is released. Until
                then, research enquiries go through the contact form, and the
                Gait Biometrics Lab is where the work the dataset supports is
                laid out.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/#contact" className="btn-primary">
                  Enquire about research use &rarr;
                </Link>
                <Link href="/labs/biometrics/" className="btn-ghost">
                  Enter Gait Biometrics Lab
                </Link>
                <Link href="/labs/" className="btn-ghost">
                  Back to GaitAI Labs
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
