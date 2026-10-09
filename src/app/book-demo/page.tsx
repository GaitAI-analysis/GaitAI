import type { Metadata } from "next";
import { BookingExperience } from "@/components/booking/BookingExperience";
import styles from "@/components/booking/booking.module.css";

/**
 * /book-demo — the standalone booking route, for the footer's "Schedule a
 * Meeting", shared links and #15min / #30min deep links. The same booking
 * component also lives inside the home page's contact section.
 *
 * Static like every other route (output: "export", trailingSlash), so it is
 * `book-demo/index.html` on GitHub Pages and survives a direct visit or a
 * refresh. The calendar is Cal.com's official inline embed; there is no
 * booking backend here, and every Cal.com URL comes from `data/contact.ts`.
 */
export const metadata: Metadata = {
  title: "Book a Demo · GaitAI",
  description:
    "Book a 15-minute Quick Introduction or a 30-minute Product Demo & Technical Discussion with GaitAI Research Labs.",
  alternates: { canonical: "/book-demo/" },
  openGraph: {
    title: "Book a Demo · GaitAI",
    description:
      "Book a 15-minute Quick Introduction or a 30-minute Product Demo & Technical Discussion with GaitAI Research Labs.",
    url: "/book-demo/",
  },
};

export default function BookDemoPage() {
  return (
    <section className={`site-page-intro relative pb-16 sm:pb-20 ${styles.page}`}>
      <div className="container-wide">
        <header className="mx-auto max-w-3xl text-center">
          <span className={styles.eyebrow}>
            <span aria-hidden="true" className={styles.eyebrowRule} />
            Book a meeting
          </span>
          <h1 className={`mt-5 font-display text-balance ${styles.title}`}>
            Let&rsquo;s Explore Movement Intelligence{" "}
            <span className={styles.titleAccent}>Together</span>
          </h1>
          <p className={`mx-auto mt-5 max-w-2xl text-base leading-relaxed sm:text-lg ${styles.lead}`}>
            Connect with GaitAI Research Labs to explore our AI-powered
            solutions, discuss research collaborations, or discover how
            movement intelligence can support your organization.
          </p>
        </header>

        <BookingExperience variant="page" />
      </div>
    </section>
  );
}
