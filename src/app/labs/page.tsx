import type { Metadata } from "next";
import Link from "next/link";
import { DiagramField } from "@/components/visuals/DiagramField";
import {
  LABS_BLURB,
  LABS_BOUNDARY,
  LABS_EYEBROW,
  LABS_PRIMARY_HREF,
  LABS_TITLE_ACCENT,
  LABS_TITLE_LEAD,
  LAB_BASIS_LABEL,
  labs,
} from "@/data/labs";

const DESCRIPTION =
  "Interactive experiments that make GaitAI's movement-intelligence pipeline easier to understand: the capture-to-intelligence walkthrough, the ecosystem landscape, the signal chain, a footage check, a human/AI reading of one walk, the privacy path, a fusion sandbox and five illustrative sessions to scrub through.";

export const metadata: Metadata = {
  title: "GaitAI Labs — Explore movement before deploying it",
  description: DESCRIPTION,
  alternates: { canonical: "/labs" },
  openGraph: {
    type: "website",
    url: "/labs",
    siteName: "GaitAI",
    title: "GaitAI Labs — Explore movement before deploying it",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "GaitAI Labs — Explore movement before deploying it",
    description: DESCRIPTION,
  },
};

/**
 * /labs — the experimental destination.
 *
 * It is an INDEX, not a new set of demos. Everything it lists already runs
 * somewhere on the site; what was missing was a door marked "experiments" and
 * a page that says what each one is for, so a reader who wants to poke at the
 * pipeline is not left guessing which of Explore's items is the interactive
 * one. Nothing here is duplicated: each entry links to the live surface.
 *
 * WHY IT IS A LIST AND NOT A GRID OF CARDS. A numbered editorial column reads
 * faster than a grid of boxes, states the numbering the brief asked for as
 * typography rather than chrome, and keeps this page from becoming the fifth
 * card grid on the site — which matters more as the list grows. The rows wash
 * and their arrow slides — `.row-link`, the shared compact-row behaviour — so
 * they do not lift one by one down the page.
 *
 * The records live in `data/labs.ts` and the rule there is that a lab exists
 * on this page only once it works. Experiments from the brief that do not run
 * yet are therefore absent, not greyed out.
 */
export default function LabsPage() {
  return (
    <>
      {/* ── HERO ── */}
      <section className="site-page-intro relative overflow-hidden pb-14">
        <DiagramField variant="ecosystem" gridMask="maskRight" className="-z-10" />

        <div className="container-wide">
          <div className="max-w-2xl">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
              {LABS_EYEBROW}
            </span>
            <h1 className="mt-5 font-display text-display-xl text-balance text-soft-white">
              {LABS_TITLE_LEAD}{" "}
              <span className="text-gradient">{LABS_TITLE_ACCENT}</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-soft-gray sm:text-lg">
              {LABS_BLURB}
            </p>

            {/* Said once, here, rather than repeated under every entry — and
                specific about which part is illustrative, because the
                analyzer does run a real model. */}
            <p className="mt-5 max-w-xl text-[13px] leading-relaxed text-soft-mute">
              {LABS_BOUNDARY}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href={LABS_PRIMARY_HREF} className="btn-primary">
                Take a clip apart
                <span aria-hidden="true"> &rarr;</span>
              </Link>
              <Link href="/gaitscape" className="btn-ghost">
                Open GaitScape
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── THE EXPERIMENTS ── */}
      <section className="border-t border-white/[0.06] py-14 sm:py-16">
        <div className="container-wide">
          <h2 className="sr-only">The experiments</h2>

          <ol className="border-t border-white/[0.06]">
            {labs.map((lab) => (
              <li key={lab.id}>
                <Link
                  href={lab.href}
                  aria-label={`${lab.name}: ${lab.strap}`}
                  className="row-link group grid gap-x-6 gap-y-3 border-b border-white/[0.06] py-7 sm:grid-cols-[4rem_1fr_auto] sm:items-baseline sm:px-2"
                >
                  {/* The index as type, which is the whole ornament. */}
                  <span
                    aria-hidden="true"
                    className="font-display text-2xl leading-none text-soft-mute transition-colors group-hover:text-cyan-300"
                  >
                    {String(lab.index).padStart(2, "0")}
                  </span>

                  <span className="min-w-0">
                    <span className="block font-display text-xl text-soft-white">
                      {lab.name}
                    </span>
                    {/* Plain `text-cyan-300`, never `/90`: the light theme
                        remaps the bare utility to #0e7490, and an opacity
                        modifier generates a class that remap does not cover —
                        which left this line pale cyan on white. */}
                    <span className="mt-1 block text-sm text-cyan-300">
                      {lab.strap}
                    </span>
                    <span className="mt-3 block max-w-xl text-[14.5px] leading-relaxed text-soft-gray">
                      {lab.body}
                    </span>

                    <span className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-[0.14em] text-soft-mute">
                      <span>{LAB_BASIS_LABEL[lab.basis]}</span>
                      {lab.home && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{lab.home}</span>
                        </>
                      )}
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

          {/* Where to go when the experiments have done their job. Two links,
              not a CTA block: this page's job is to send people INTO the
              interactive surfaces, not to sell from underneath them. */}
          <p className="mt-10 text-[14.5px] leading-relaxed text-soft-gray">
            The experiments explain the pipeline.{" "}
            <Link
              href="/products"
              className="text-cyan-300 underline decoration-cyan-300/40 underline-offset-2 transition-colors hover:text-cyan-200"
            >
              The products
            </Link>{" "}
            are what runs it, and{" "}
            <Link
              href="/research"
              className="text-cyan-300 underline decoration-cyan-300/40 underline-offset-2 transition-colors hover:text-cyan-200"
            >
              the research
            </Link>{" "}
            is what they are built on.
          </p>
        </div>
      </section>
    </>
  );
}
