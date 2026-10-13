import type { Metadata } from "next";
import Link from "next/link";
import { CareActions, CareBrand, georama } from "@/components/care/Care";
import styles from "@/components/care/care.module.css";
import { gaitaiCare as care } from "@/data/gaitai-care";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_URL, SOCIAL_IMAGES, organizationRef, socialCard } from "@/lib/seo";

/* THE LAUNCH ANNOUNCEMENT, as published on 13 October 2026. The text is the
   release as written; this page gives it a permanent address under the
   product it announces, in the product's own styling, so the link in a post
   or an email lands on the announcement and not on a feed. The product page
   remains the place that explains the product — this one records that it
   launched, and when. */
const LAUNCH_TITLE = "Introducing GaitAI Care — Product Launch Announcement";
const LAUNCH_DESCRIPTION =
  "GaitAI Research Labs announces GaitAI Care, a personal and family health-record management platform for web and Android, launched 13 October 2026.";

export const metadata: Metadata = {
  title: LAUNCH_TITLE,
  description: LAUNCH_DESCRIPTION,
  alternates: { canonical: care.launch },
  ...socialCard({ title: LAUNCH_TITLE, description: LAUNCH_DESCRIPTION, path: care.launch, image: SOCIAL_IMAGES.care, type: "article" }),
};

/* A NewsArticle about the SoftwareApplication the product page declares.
   Author and publisher are the organisation — no person is named on any
   public surface — and the only dates are the ones printed on the page. */
const LAUNCH_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "@id": `${SITE_URL}${care.launch}#announcement`,
  headline: "Introducing GaitAI Care: Your Health Records. Your History. Your Insights.",
  description: LAUNCH_DESCRIPTION,
  datePublished: care.launchDate,
  dateModified: care.launchDate,
  inLanguage: "en",
  mainEntityOfPage: `${SITE_URL}${care.launch}`,
  url: `${SITE_URL}${care.launch}`,
  image: `${SITE_URL}${SOCIAL_IMAGES.care.url}`,
  author: organizationRef,
  publisher: organizationRef,
  about: { "@id": `${SITE_URL}${care.href}#app` },
};

const capabilities: Array<[string, string]> = [
  ["Organize medical documents:", "Upload reports, prescriptions, and medical images, with assisted information extraction and review."],
  ["Manage family profiles:", "Maintain separate health histories for family members."],
  ["Track medications and vaccinations:", "Record treatments, supplements, dosages, and vaccination history."],
  ["Understand health timelines:", "Review illnesses, hospitalizations, treatments, and medical events chronologically."],
  ["Record everyday care:", "Track relevant daily health observations and care activities."],
  ["Generate summaries:", "Export organized medical information into shareable PDF reports."],
];

export default function CareLaunchPage() {
  return <div className={`${styles.theme} ${styles.page} ${georama.variable}`}>
    <JsonLd data={LAUNCH_JSON_LD} />
    <div className={styles.container}>
      <nav className={styles.crumb} aria-label="Breadcrumb"><Link href={care.href}>GaitAI Care</Link><span aria-hidden="true">/</span><span aria-current="page">Launch announcement</span></nav>
      <header className={styles.downloadHero}>
        <CareBrand />
        <p className={styles.dateline}><span>PRODUCT LAUNCH</span><span aria-hidden="true">·</span><time dateTime={care.launchDate}>13 OCTOBER 2026</time><span aria-hidden="true">·</span><span>GAITAI RESEARCH LABS</span></p>
        <h1>Introducing GaitAI Care.</h1>
        <p className={styles.lead}>Your health records. Your history. Your insights.</p>
      </header>
      <article className={styles.article} aria-labelledby="launch-lede">
        <p id="launch-lede">Today, GaitAI Research Labs announces the launch of <strong>GaitAI Care</strong>, a personal and family health-record management platform designed to make organizing medical information simpler, more accessible, and more meaningful.</p>
        <p>Medical records often become scattered across hospital files, prescriptions, laboratory reports, photographs, and different healthcare providers. Finding the right information when it matters can be challenging.</p>
        <p><strong>GaitAI Care brings these records together in one organized digital experience.</strong></p>

        <h2 id="launch-history">One place for your health history</h2>
        <p>GaitAI Care is designed to help individuals and families:</p>
        <ul>{capabilities.map(([label, text]) => <li key={label}><strong>{label}</strong> {text}</li>)}</ul>

        <h2 id="launch-platforms">Available on Web and Android</h2>
        <p>GaitAI Care has been developed for browser-based use and Android devices, using a shared backend so that account records remain consistent across supported platforms.</p>
        <p>The Android application is being introduced through an early-access release, with availability and installation information provided through the <Link href={care.download}>official product website</Link>.</p>

        <h2 id="launch-privacy">Designed with privacy in mind</h2>
        <p>Personal medical information requires careful handling. GaitAI Care incorporates account verification, authenticated access, and protected record storage as part of its architecture.</p>
        <p>GaitAI Care is intended for personal health-record organization and information management. It does not replace professional medical diagnosis, treatment, or clinical judgment.</p>

        <h2 id="launch-explore">Explore GaitAI Care</h2>
        <p>Discover the platform, explore its capabilities, and access the web and Android applications.</p>
        <CareActions learn />

        <p className={styles.signoff}><strong>GaitAI Research Labs</strong><br /><em>Technology designed to make information more useful, accessible, and meaningful.</em><br />Launch date: <time dateTime={care.launchDate}>13 October 2026</time></p>
        <div className={styles.legalLinks}><a href={care.privacy}>Product privacy notice</a><Link href={care.download}>Android Early Access</Link><Link href={care.documentation}>Technical documentation</Link></div>
      </article>
    </div>
  </div>;
}
