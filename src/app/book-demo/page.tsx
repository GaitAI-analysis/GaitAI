import type { Metadata } from "next";
import { BookDemo } from "@/components/booking/BookDemo";
import styles from "@/components/booking/booking.module.css";

/**
 * /book-demo — book a 15- or 30-minute meeting with GaitAI Research Labs.
 *
 * Static like every other route (output: "export", trailingSlash), so it is
 * `book-demo/index.html` on GitHub Pages and survives a direct visit or a
 * refresh. The calendar itself is Cal.com's official inline embed, loaded by
 * BookDemo only after a visitor picks a meeting; there is no booking backend
 * here, and every Cal.com URL comes from `data/contact.ts`.
 */
export const metadata: Metadata = {
  title: "Book a Demo · GaitAI",
  description:
    "Book a 15-minute introduction or a 30-minute product demo and technical discussion with GaitAI Research Labs.",
  alternates: { canonical: "/book-demo/" },
  openGraph: {
    title: "Book a Demo · GaitAI",
    description:
      "Book a 15-minute introduction or a 30-minute product demo and technical discussion with GaitAI Research Labs.",
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

        <BookDemo />
      </div>
    </section>
  );
}
