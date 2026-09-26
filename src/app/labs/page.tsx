import type { Metadata } from "next";
import { GaitLabAreas } from "@/components/labs/GaitLabAreas";
import { LabCover, LAB_COVER_IMAGE } from "@/components/labs/LabCover";
import { LabExperience } from "@/components/labs/LabExperience";
import {
  GAIT_LABS_EYEBROW,
  GAIT_LABS_TITLE_ACCENT,
  GAIT_LABS_TITLE_LEAD,
} from "@/data/labs";

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
    images: [{ url: LAB_COVER_IMAGE, width: 1672, height: 941, alt: "The GaitAI biometrics lab" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [LAB_COVER_IMAGE],
  },
};

/**
 * /labs — GaitAI Labs, the gait research hub, as a landing page.
 *
 * Two things and nothing else: the cover — the founder at the centre of the
 * biometrics capture room, with "Enter the Lab" opening the interactive
 * three-dimensional reconstruction of that room over the page — and the Gait
 * Dataset row beneath it. The page used to carry a title, blurb and boundary
 * line over the photograph, a second row for the Gait Biometrics Lab, the
 * list of papers behind both assets and a strip contrasting this hub with
 * the Movement Intelligence Lab; all of that explained the page instead of
 * being it, and duplicated what the asset pages already say. The biometrics
 * lab keeps its own route (/labs/biometrics), reached from the site map, the
 * Atlas, the search palette and the dataset page; the publications keep
 * theirs.
 *
 * The route stayed /labs: it is in the sitemap, in the Explore menu and in
 * the assistant's corpus, and a static export cannot redirect.
 */
export default function LabsPage() {
  return (
    <>
      {/* ── COVER ── The lab, with its founder at the centre of the ring,
          and the one action. */}
      <LabCover />

      {/* ── THE DATASET ── The single row below the cover. No border above
          it: the cover's grade already settles into the page ground, and a
          hairline there read as a seam. The row carries its own vertical
          room, so the section adds only a little, and the page ends on the
          dataset's call to action rather than running out. */}
      <section className="py-8 sm:py-12">
        <div className="container-wide">
          <GaitLabAreas ids={["dataset"]} />
        </div>
      </section>

      {/* The interactive room. Renders nothing until "Enter the Lab" asks. */}
      <LabExperience />
    </>
  );
}
