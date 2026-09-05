import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SignatureScene } from "@/components/labs/GaitLabScenes";
import styles from "@/components/labs/gaitLabs.module.css";
import {
  GAIT_LABS_BOUNDARY,
  GAIT_LABS_EYEBROW,
  GAIT_LAB_STATUS_LABEL,
  gaitLabById,
} from "@/data/labs";
import { allPublications } from "@/data/publications";

const lab = gaitLabById("biometrics");

const TITLE = `Gait Biometrics Lab — ${GAIT_LABS_EYEBROW}`;
const DESCRIPTION =
  "An environment for exploring gait biometrics, recognition and movement signatures: how a stride becomes features, features become a signature, and what covariates and privacy do to it — grounded in the published record, with no recognition result or accuracy stated.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/labs/biometrics" },
  openGraph: {
    type: "website",
    url: "/labs/biometrics",
    siteName: "GaitAI",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

/**
 * The lab's six modules, one per facet of the record, in pipeline order. Each
 * says what the module is FOR and what is true of it today. Exactly one thing
 * on this pipeline runs today — the analyzer in the Movement Intelligence Lab
 * derives Motion DNA channels from a real clip, in the browser — and that is
 * the only module that links anywhere. The rest are the framework: stated,
 * grounded, and not pretending to run.
 */
const MODULES: Record<
  string,
  { what: string; now: string; href?: string; hrefLabel?: string }
> = {
  "Stride capture": {
    what: "A walk, recorded from the side or from a camera in place, segmented into strides at the canonical gait events — heel strike, loading, mid-stance, toe-off, swing.",
    now: "Pose landmarks and the body's path through the frame are extracted from a real clip today, in the browser, by the Movement Intelligence Lab's analyzer.",
    href: "/movement-lab/#analyze",
    hrefLabel: "Run the analyzer on a clip",
  },
  "Movement features": {
    what: "The stride as temporal channels — joint trajectories, ground contact, vertical travel, cadence-bearing rhythms — the Motion DNA a signature is built from.",
    now: "The analyzer derives Motion DNA channels from a clip today. They are shown as channels, not scored.",
    href: "/movement-lab/#analyze",
    hrefLabel: "See Motion DNA on a clip",
  },
  Signature: {
    what: "The channels reduced to one compact, person-specific representation — the movement signature that gait recognition compares.",
    now: "Module to follow. No signature is computed on this site and no representation is shown as a result.",
  },
  Covariates: {
    what: "What changes the walk without changing the walker: viewing angle, clothing, carried objects, speed and surface. Robustness to them is the central problem of the published work.",
    now: "Module to follow, grounded in the covariate-invariant recognition papers listed below.",
  },
  Privacy: {
    what: "How a gait dataset and a signature are protected inside a deep-learning pipeline, and what an identity-free path keeps versus gives up.",
    now: "The Privacy Lens in the Movement Intelligence Lab walks the identity-free path today, on illustrative data. The dataset-protection work is published.",
    href: "/securevision/#privacy-lens",
    hrefLabel: "Step through the Privacy Lens",
  },
  Matching: {
    what: "Comparing one signature against enrolled ones — the recognition step, and the one where every claim must carry its evidence.",
    now: "Module to follow. Nothing on this site performs recognition, and no accuracy is stated anywhere in GaitAI Labs.",
  },
};

/**
 * /labs/biometrics — the Gait Biometrics Lab.
 *
 * The framework of an environment for exploring gait as a biometric, laid out
 * as the pipeline it will contain: capture, features, signature, covariates,
 * privacy, matching. It is grounded in seven published papers and it states,
 * module by module, what runs today and what does not. It does not perform
 * recognition and it prints no accuracy — the repository has no such result
 * to print, and the page would be inventing one.
 */
export default function GaitBiometricsLabPage() {
  if (!lab) notFound();

  const papers = allPublications.filter((p) => lab.publicationIds.includes(p.id));
  const live = lab.facets.filter((facet) => MODULES[facet]?.href).length;

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
                <span className="text-soft-mute">02</span>
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
              <SignatureScene />
            </figure>
          </div>
        </div>
      </section>

      {/* ── THE PIPELINE, AS MODULES ── */}
      <section
        id="modules"
        className="border-t border-white/[0.07] py-14 sm:py-16 site-anchor-offset"
      >
        <div className="container-wide">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
            The lab&apos;s structure
          </span>
          <h2 className="mt-5 max-w-2xl font-display text-display-md text-balance text-soft-white">
            From a stride to a signature,{" "}
            <span className="text-gradient">module by module.</span>
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-soft-gray">
            Six modules in pipeline order. Each states what it is for and what
            is true of it today: {live} of the {lab.facets.length} have something
            that runs now, elsewhere on the site, and are linked to it. The
            rest are the framework the lab grows into.
          </p>

          <ol className="mt-10 border-t border-white/[0.06]">
            {lab.facets.map((facet, i) => {
              const mod = MODULES[facet];
              if (!mod) return null;
              return (
                <li
                  key={facet}
                  className="grid gap-x-6 gap-y-3 border-b border-white/[0.06] py-7 sm:grid-cols-[4rem_1fr] sm:px-2"
                >
                  <span
                    aria-hidden="true"
                    className="font-display text-2xl leading-none text-soft-mute"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display text-xl text-soft-white">
                      {facet}
                    </h3>
                    <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-soft-gray">
                      {mod.what}
                    </p>
                    <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-soft-mute">
                      <span
                        className={`${styles.facetState} ${
                          mod.href ? styles.facetStateLive : ""
                        } mr-2 inline`}
                      >
                        {mod.href ? "Runs today" : "Module to follow"}
                      </span>
                      {mod.now}
                    </p>
                    {mod.href && mod.hrefLabel && (
                      <Link
                        href={mod.href}
                        className="mt-3 inline-flex items-center gap-1 text-sm text-cyan-300 transition-colors hover:text-cyan-200"
                      >
                        {mod.hrefLabel}
                        <span aria-hidden="true">&rarr;</span>
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* ── THE PUBLISHED WORK ── */}
      <section
        id="research"
        className="border-t border-white/[0.07] py-14 sm:py-16 site-anchor-offset"
      >
        <div className="container-wide">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
            Published work this lab rests on
          </span>
          <h2 className="mt-5 max-w-2xl font-display text-display-md text-balance text-soft-white">
            {papers.length} peer-reviewed papers on{" "}
            <span className="text-gradient">gait recognition.</span>
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-soft-gray">
            Deep-learning gait recognition with covariates, model-based
            recognition, pattern recognition for gait, and recognition from
            pose features. These are the record; the lab&apos;s modules are
            built against them and claim nothing beyond them.
          </p>

          <ol className="mt-8 border-t border-white/[0.06]">
            {papers.map((paper) => (
              <li key={paper.id}>
                <Link
                  href={`/publications/${paper.id}/`}
                  className="row-link group grid gap-x-6 gap-y-2 border-b border-white/[0.06] py-5 sm:grid-cols-[5rem_1fr_auto] sm:items-baseline sm:px-2"
                >
                  <span className="font-mono text-[11px] tracking-[0.14em] text-soft-mute">
                    {paper.year}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[15px] leading-snug text-soft-white">
                      {paper.title}
                    </span>
                    <span className="mt-1 block text-[12px] text-soft-mute">
                      {paper.venue}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className="row-link-arrow text-soft-mute sm:self-center"
                  >
                    &rarr;
                  </span>
                </Link>
              </li>
            ))}
          </ol>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/labs/dataset/" className="btn-primary">
              Explore the Gait Dataset &rarr;
            </Link>
            <Link href="/research/evidence/?area=res-gait-biometrics" className="btn-ghost">
              Evidence explorer
            </Link>
            <Link href="/labs/" className="btn-ghost">
              Back to GaitAI Labs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
