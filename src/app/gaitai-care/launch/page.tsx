import type { Metadata } from "next";
import Link from "next/link";
import { CareBrand, CareScreenshot, georama } from "@/components/care/Care";
import styles from "@/components/care/care.module.css";
import { gaitaiCare as care } from "@/data/gaitai-care";
import { announcements } from "@/data/announcements";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_URL, SOCIAL_IMAGES, breadcrumbList, organizationRef, socialCard } from "@/lib/seo";

/* THE LAUNCH ANNOUNCEMENT, as published on 13 October 2026. The text is the
   release as written; this page gives it a permanent address under the
   product it announces, in the product's own styling, so the link in a post
   or an email lands on the announcement and not on a feed. It is also a
   story in GaitAI Insights (data/announcements.ts): the hub, the archive and
   the feed all point HERE, so there is one canonical URL. The product page
   remains the place that explains the product — this one records that it
   launched, and when. */
const story = announcements.find((item) => item.href === care.launch)!;

/* Named for what people search for — "GaitAI Care launch", "personal health
   records app", "family medical records app" — with the product first. */
const LAUNCH_TITLE = "GaitAI Care Launch — Personal & Family Health Records App";
const LAUNCH_DESCRIPTION =
  "GaitAI Research Labs launches GaitAI Care on 13 October 2026: a personal and family health-record organiser for web and Android. Medical documents, medicines, vaccinations and a chronological health history in one private place; Android in early access.";

export const metadata: Metadata = {
  title: LAUNCH_TITLE,
  description: LAUNCH_DESCRIPTION,
  alternates: { canonical: care.launch },
  ...socialCard({ title: LAUNCH_TITLE, description: LAUNCH_DESCRIPTION, path: care.launch, image: SOCIAL_IMAGES.care, type: "article" }),
};

/* A NewsArticle about the SoftwareApplication the product page declares.
   Author and publisher are the organisation — no person is named on any
   public surface. `datePublished` is when this article went live on the
   site; the product's launch date is the dateline printed on the page. */
const LAUNCH_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "@id": `${SITE_URL}${care.launch}#announcement`,
  headline: story.title,
  alternativeHeadline: "GaitAI Research Labs launches GaitAI Care for web and Android",
  description: LAUNCH_DESCRIPTION,
  articleSection: "Product Launch",
  keywords: story.tags.join(", "),
  datePublished: story.date,
  dateModified: story.updated,
  inLanguage: "en",
  isAccessibleForFree: true,
  mainEntityOfPage: `${SITE_URL}${care.launch}`,
  url: `${SITE_URL}${care.launch}`,
  image: [`${SITE_URL}${SOCIAL_IMAGES.care.url}`],
  author: organizationRef,
  publisher: organizationRef,
  about: { "@id": `${SITE_URL}${care.href}#app` },
  isPartOf: { "@type": "Blog", name: "GaitAI Insights", url: `${SITE_URL}/insights/` },
};

const LAUNCH_BREADCRUMBS = breadcrumbList([
  { name: "GaitAI", path: "/" },
  { name: "GaitAI Insights", path: "/insights" },
  { name: "Introducing GaitAI Care", path: care.launch },
]);

const capabilities: Array<[string, string]> = [
  ["Organize medical documents:", "Upload reports, prescriptions, and medical images, with assisted information extraction and review."],
  ["Manage family profiles:", "Maintain separate health histories for family members."],
  ["Track medications and vaccinations:", "Record treatments, supplements, dosages, and vaccination history."],
  ["Understand health timelines:", "Review illnesses, hospitalizations, treatments, and medical events chronologically."],
  ["Record everyday care:", "Track relevant daily health observations and care activities."],
  ["Generate summaries:", "Export organized medical information into shareable PDF reports."],
];

/* The announcement's own actions. "Download for Android" appears only when a
   verified public release exists (care.release.apk); until then the Android
   link is labelled for what it is — early access, with the release status
   page behind it. The web app opens in a new tab. */
function LaunchActions() {
  return <div className={styles.actions}>
    <Link className={styles.primary} href={care.href}>Explore GaitAI Care <span aria-hidden="true">→</span></Link>
    <a className={styles.secondary} href={care.web} target="_blank" rel="noopener noreferrer">Try Web App <span aria-hidden="true">↗</span></a>
    {care.release.apk
      ? <Link className={styles.secondary} href={care.download}>Download for Android <span aria-hidden="true">↓</span></Link>
      : <Link className={styles.textLink} href={care.download}>Android early access <span aria-hidden="true">→</span></Link>}
  </div>;
}

export default function CareLaunchPage() {
  return <div className={`${styles.theme} ${styles.page} ${georama.variable}`}>
    <JsonLd data={LAUNCH_JSON_LD} />
    <JsonLd data={LAUNCH_BREADCRUMBS} />
    <div className={styles.container}>
      <nav className={styles.crumb} aria-label="Breadcrumb"><Link href="/insights/">GaitAI Insights</Link><span aria-hidden="true">/</span><Link href={care.href}>GaitAI Care</Link><span aria-hidden="true">/</span><span aria-current="page">Launch announcement</span></nav>

      <header className={styles.hero} aria-labelledby="launch-title">
        <div className={styles.heroGrid}>
          <div>
            <CareBrand />
            <p className={styles.dateline}><span>PRODUCT LAUNCH</span><span aria-hidden="true">·</span><time dateTime={care.launchDate}>13 OCTOBER 2026</time><span aria-hidden="true">·</span><span>GAITAI RESEARCH LABS</span></p>
            <h1 id="launch-title">Introducing GaitAI Care.<br /><span>Your health records. Your history. Your insights.</span></h1>
            <p className={styles.lead}>Today, GaitAI Research Labs announces the launch of GaitAI Care, a personal and family health-record management platform designed to make organizing medical information simpler, more accessible, and more meaningful.</p>
            <LaunchActions />
            <p className={styles.small}>Official announcement · Published in <Link href="/insights/">GaitAI Insights</Link> · Web app available · Android early access</p>
          </div>
          <CareScreenshot priority />
        </div>
      </header>

      <article className={styles.article} aria-labelledby="launch-title">
        <p>Medical records often become scattered across hospital files, prescriptions, laboratory reports, photographs, and different healthcare providers. Finding the right information when it matters can be challenging.</p>
        <p><strong>GaitAI Care brings these records together in one organized digital experience.</strong></p>

        <h2 id="launch-history">One place for your health history</h2>
        <p>GaitAI Care is designed to help individuals and families:</p>
        <ul>{capabilities.map(([label, text]) => <li key={label}><strong>{label}</strong> {text}</li>)}</ul>

        <h2 id="launch-platforms">Available on Web and Android</h2>
        <p>GaitAI Care has been developed for browser-based use and Android devices, using a shared backend so that account records remain consistent across supported platforms.</p>
        <p>The web application is available today at <a href={care.web} target="_blank" rel="noopener noreferrer">care.gaitai.in</a>. The Android application is being introduced through an <strong>early-access release</strong>; it is not yet available as a public download, and its release status and installation guidance are published on the <Link href={care.download}>Android early-access page</Link>.</p>

        <h2 id="launch-privacy">Designed with privacy in mind</h2>
        <p>Personal medical information requires careful handling. GaitAI Care incorporates account verification, authenticated access, and protected record storage as part of its architecture.</p>
        <p>GaitAI Care is intended for personal health-record organization and information management. It does not replace professional medical diagnosis, treatment, or clinical judgment.</p>

        <h2 id="launch-explore">Explore GaitAI Care</h2>
        <p>Discover the platform, explore its capabilities, and access the web application and the Android early-access programme from the <Link href={care.href}>GaitAI Care product page</Link>.</p>
        <LaunchActions />

        <p className={styles.signoff}><strong>GaitAI Research Labs</strong><br /><em>Technology designed to make information more useful, accessible, and meaningful.</em><br />Official launch date: <time dateTime={care.launchDate}>13 October 2026</time><br />Published: <time dateTime={story.date}>13 October 2026</time> · Updated: <time dateTime={story.updated}>13 October 2026</time></p>
        <div className={styles.legalLinks}><a href={care.privacy}>Product privacy notice</a><Link href={care.download}>Android early access</Link><Link href={care.documentation}>Technical documentation</Link><Link href="/insights/archive/">Blog archive</Link></div>
      </article>
    </div>
  </div>;
}
