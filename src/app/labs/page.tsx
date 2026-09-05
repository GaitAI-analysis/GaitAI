import type { Metadata } from "next";
import Link from "next/link";
import { DiagramField } from "@/components/visuals/DiagramField";
import { GaitLabAreas } from "@/components/labs/GaitLabAreas";
import { LabDistinction } from "@/components/labs/LabDistinction";
import { EXPERIMENTS_ANCHOR, experiments } from "@/data/experiments";
import {
  GAIT_LABS_BLURB,
  GAIT_LABS_BOUNDARY,
  GAIT_LABS_EYEBROW,
  GAIT_LABS_TITLE_ACCENT,
  GAIT_LABS_TITLE_LEAD,
  gaitLabs,
} from "@/data/labs";
import { allPublications } from "@/data/publications";

const TITLE = `${GAIT_LABS_EYEBROW} — ${GAIT_LABS_TITLE_LEAD} ${GAIT_LABS_TITLE_ACCENT}`;
const DESCRIPTION =
  "GaitAI Labs is the home of GaitAI's gait research assets: the prepared gait dataset and the gait biometrics lab, grounded in the published record on gait recognition, pose-based gait analysis and privacy-preserving gait data.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/labs" },
  openGraph: {
    type: "website",
    url: "/labs",
    siteName: "GaitAI",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

/**
 * /labs — GaitAI Labs, the gait research hub.
 *
 * This route used to be an index of the interactive movement experiments. It
 * is now the home of GaitAI's dedicated gait RESEARCH assets — the gait
 * dataset and the gait biometrics lab — and the experiments moved to the foot
 * of the Movement Intelligence Lab, which is what they are about. The route
 * stayed: it is in the sitemap, in the Explore menu and in the assistant's
 * corpus, and a static export cannot redirect. A reader who arrives here
 * looking for an experiment finds the pointer under the two assets.
 *
 * WHAT THE PAGE MAY SAY. The published record covers gait recognition with
 * covariates, pose-based gait recognition and protecting gait datasets inside
 * deep-learning pipelines. It holds no dataset statistics and no recognition
 * results, so this page shows the two assets, their status in words, and the
 * papers behind them — and no figure. That boundary is stated once, in the
 * hero, and the asset pages repeat it.
 */
export default function LabsPage() {
  const primary = gaitLabs[0];
  const secondary = gaitLabs[1];

  /* Every paper either asset rests on, once, in the record's own order. */
  const cited = new Set(gaitLabs.flatMap((lab) => lab.publicationIds));
  const papers = allPublications.filter((p) => cited.has(p.id));

  return (
    <>
      {/* ── HERO ── The research field, not the ecosystem field: this page is
          about the data and the science, and its ground says so. */}
      <section className="site-page-intro relative overflow-hidden pb-14">
        <DiagramField variant="research" gridMask="maskRight" className="-z-10" />

        <div className="container-wide">
          <div className="max-w-2xl">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
              {GAIT_LABS_EYEBROW}
            </span>
            <h1 className="mt-5 font-display text-display-xl text-balance text-soft-white">
              {GAIT_LABS_TITLE_LEAD}{" "}
              <span className="text-gradient">{GAIT_LABS_TITLE_ACCENT}</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-soft-gray sm:text-lg">
              {GAIT_LABS_BLURB}
            </p>
            <p className="mt-5 max-w-xl text-[13px] leading-relaxed text-soft-mute">
              {GAIT_LABS_BOUNDARY}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href={primary.href} className="btn-primary">
                {primary.cta}
                <span aria-hidden="true"> &rarr;</span>
              </Link>
              <Link href={secondary.href} className="btn-ghost">
                {secondary.cta}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── THE TWO ASSETS ── */}
      <section className="border-t border-white/[0.06] py-10 sm:py-12">
        <div className="container-wide">
          <h2 className="sr-only">The research assets</h2>
          <GaitLabAreas />
        </div>
      </section>

      {/* ── THE RECORD BEHIND THEM ── Derived from the assets' publication
          ids, so the list is exactly the papers the assets cite. */}
      <section className="border-t border-white/[0.06] py-14 sm:py-16">
        <div className="container-wide">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
            The published record
          </span>
          <h2 className="mt-5 max-w-2xl font-display text-display-md text-balance text-soft-white">
            What the assets{" "}
            <span className="text-gradient">rest on.</span>
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-soft-gray">
            Peer-reviewed work on gait recognition with covariates, pose-based
            gait recognition and the protection of gait datasets inside
            deep-learning pipelines. Each asset page lists the papers behind
            it; together they are these.
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
        </div>
      </section>

      {/* ── WHICH LAB ── The distinction, stated where it is most likely to
          be blurred, and the pointer for anyone who came here for an
          experiment that used to be listed on this route. */}
      <section className="border-t border-white/[0.06] py-14 sm:py-16">
        <div className="container-wide">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
            Two labs, two questions
          </span>
          <h2 className="mt-5 max-w-2xl font-display text-display-md text-balance text-soft-white">
            Research assets here.{" "}
            <span className="text-gradient">Experiments in the Movement Intelligence Lab.</span>
          </h2>
          <div className="mt-10">
            <LabDistinction current="labs" />
          </div>

          <p className="mt-8 max-w-2xl text-[14.5px] leading-relaxed text-soft-gray">
            Looking for{" "}
            {experiments
              .filter((experiment) => experiment.id !== "movement-lab")
              .map((experiment) => experiment.name)
              .join(", ")}
            ? They used to be listed here and now live in the{" "}
            <Link
              href={EXPERIMENTS_ANCHOR}
              className="text-cyan-300 underline decoration-cyan-300/40 underline-offset-2 transition-colors hover:text-cyan-200"
            >
              Movement Intelligence Lab
            </Link>
            , after the analyzer.
          </p>
        </div>
      </section>
    </>
  );
}
