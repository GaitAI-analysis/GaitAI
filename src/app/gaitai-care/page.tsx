import type { Metadata } from "next";
import Link from "next/link";
import { CareActions, CareBrand, CareScreenshot, georama } from "@/components/care/Care";
import styles from "@/components/care/care.module.css";
import { gaitaiCare as care } from "@/data/gaitai-care";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_URL, SOCIAL_IMAGES, organizationRef, socialCard } from "@/lib/seo";

/* Named for what people search for — "personal health record app",
   "family medical records" — with the product name first, because the
   product is new and the category is not. */
const CARE_TITLE = "GaitAI Care — Personal Health Record App for You and Your Family";
const CARE_DESCRIPTION =
  "Organise family medical records in one private place: medical reports, prescriptions, medication and vaccination history, illness timelines and daily care notes. Web app and Android Early Access.";

export const metadata: Metadata = {
  title: CARE_TITLE,
  description: CARE_DESCRIPTION,
  alternates: { canonical: care.href },
  ...socialCard({ title: CARE_TITLE, description: CARE_DESCRIPTION, path: care.href, image: SOCIAL_IMAGES.care }),
};

/* A SoftwareApplication, because that is what GaitAI Care is: a web app with
   an Android client. Every field is stated on this page or in
   data/gaitai-care.ts — platforms, version, category, feature list, the
   privacy notice. No price, rating, review, download count or clinical
   claim, because none is documented; the page itself says no clinical
   validation is claimed. */
const CARE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": `${SITE_URL}${care.href}#app`,
  name: care.name,
  description: CARE_DESCRIPTION,
  url: `${SITE_URL}${care.href}`,
  applicationCategory: "HealthApplication",
  applicationSubCategory: "Personal health record organiser",
  operatingSystem: "Web, Android 7.0 or later",
  softwareVersion: care.release.version,
  releaseNotes: `${SITE_URL}${care.download}`,
  installUrl: care.web,
  screenshot: `${SITE_URL}${SOCIAL_IMAGES.care.url}`,
  featureList: [
    "Separate profiles for family members and people in your care",
    "Medical reports, prescriptions and vaccination cards kept as originals with extracted text to review",
    "Medication and supplement records",
    "Vaccination history and documented appointments",
    "Illness and treatment timelines",
    "Daily health and care observations",
    "Caregiver access with viewer or editor permissions",
    "Export of records, original files and PDF summaries",
  ],
  author: organizationRef,
  publisher: organizationRef,
  privacyPolicy: care.privacy,
};

const features = [
  ["A place for every person", "Create separate profiles for yourself, children, parents or people whose care you are authorised to manage. Keep each person’s documents and history together."],
  ["Originals, with context", "Upload medical reports, prescriptions and vaccination cards as PDF, JPEG or PNG. Review extracted text against the original before confirming a record."],
  ["Medicines & supplements", "Keep prescribed courses, supplements and actual-use records in context. Medication instructions remain drafts until you check them against the prescription."],
  ["Vaccination history", "Record doses, documented dates and confirmed upcoming appointments. Review imported details against the vaccination card or your provider’s advice."],
  ["Illness & treatment timelines", "Bring illness episodes, hospital visits and recorded treatments into a chronological history. A planned appointment stays distinct from a treatment actually received."],
  ["The everyday details", "Keep daily health and care observations alongside the longer history, including hydration and age-appropriate care records. Record what happened, when it happened."],
];

export default function GaitAICarePage() {
  return <div className={`${styles.theme} ${styles.page} ${georama.variable}`}>
    <JsonLd data={CARE_JSON_LD} />
    <div className={styles.container}><nav className={styles.crumb} aria-label="Breadcrumb"><Link href="/products/">Products</Link><span aria-hidden="true">/</span><span aria-current="page">GaitAI Care</span></nav></div>
    <section className={styles.hero}>
      <div className={`${styles.container} ${styles.heroGrid}`}>
        <div><CareBrand /><h1>Your health records.<br />Your history.<br /><span>Your insights.</span></h1>
          <p className={styles.lead}>One calm place for personal and family health records. Bring documents, medicines and everyday care into a history that stays with you.</p>
          <CareActions /><p className={styles.small}>Web app available · Android Early Access<br />Health-record organisation. Medical decisions stay with your clinician.</p>
        </div>
        <CareScreenshot priority />
      </div>
    </section>
    <div className={styles.ribbon}><div className={styles.container}><span><strong>For you.</strong> For the people you care for.</span><span>Separate profiles · Connected history</span><span>Web + Android · One account</span></div></div>
    <section className={styles.section}>
      <div className={`${styles.container} ${styles.introGrid}`}>
        <div><p className={styles.eyebrow}>LESS SEARCHING. MORE CONTEXT.</p><h2>Life moves on.<br />Your records should<br />come with you.</h2></div>
        <div><p>A prescription on your phone. A report in a drawer. A date you are trying to remember before an appointment. Looking after your health often starts with finding the pieces.</p><p>GaitAI Care brings those pieces into a personal record space. Individuals, parents and authorised family caregivers can organise information over time, return to the original source and prepare a clearer history to discuss with a clinician.</p></div>
      </div>
    </section>
    {/* IN PLAIN TERMS. The page above speaks in the product's own voice;
        this says the same thing in the words people search for — personal
        health record app, family medical records, medication and vaccination
        history — so the page answers the question it is found by. Same
        two-column intro layout; nothing claimed beyond the feature list and
        scope note already on this page. */}
    <section className={styles.section} aria-labelledby="care-what-it-is">
      <div className={`${styles.container} ${styles.introGrid}`}>
        <div><p className={styles.eyebrow}>WHAT GAITAI CARE IS</p><h2 id="care-what-it-is">A personal health<br />record app for<br />the whole family.</h2></div>
        <div>
          <p>GaitAI Care is a personal health record app and medical history organiser for individuals and families. It keeps medical reports, prescriptions and vaccination cards as originals, with the extracted text beside them for you to check, and arranges them into a timeline of illnesses, treatments and appointments for each person you care for.</p>
          <p>Use it as a medication tracker for prescribed courses, supplements and what was actually taken; as a vaccination record for doses, documented dates and confirmed upcoming appointments; and as a daily care log for the smaller details that are easy to lose between visits. The same account works in the web app and the Android app, and you can export your records and original files at any time.</p>
          <p>It is not a diagnostic tool and does not perform gait analysis — that is <Link href="/mobilitycare/">MobilityCare</Link>, a separate GaitAI product for clinics. See <Link href="/products/">all GaitAI products</Link>.</p>
        </div>
      </div>
    </section>
    <section className={`${styles.section} ${styles.tinted}`} aria-labelledby="care-features">
      <div className={styles.container}>
        <div className={styles.sectionHead}><p className={styles.eyebrow}>A RECORD THAT GROWS WITH YOU</p><h2 id="care-features">The big milestones.<br />The small, daily details.</h2><p>One place to organise the information that is easy to lose between visits.</p></div>
        <div className={styles.features}>{features.map(([title, body], i) => <article className={styles.featureItem} key={title}><span className={styles.number}>0{i + 1}</span><h3>{title}</h3><p>{body}</p></article>)}</div>
      </div>
    </section>
    <section className={styles.section} aria-labelledby="care-workflow">
      <div className={styles.container}>
        <div className={styles.sectionHead}><p className={styles.eyebrow}>FROM PAPERWORK TO PERSPECTIVE</p><h2 id="care-workflow">Keep the source.<br />Build the story.</h2><p>Extraction helps with organisation. Your review gives each record its context.</p></div>
        <CareScreenshot />
        <div className={styles.workflow}>
          <div><span className={styles.number}>01 / COLLECT</span><h3>Bring your records in.</h3><p>Choose the right profile and upload the original document. Add daily observations and dates as you go.</p></div>
          <div><span className={styles.number}>02 / REVIEW</span><h3>Check what was read.</h3><p>Compare extracted text and dates with the source. Correct unclear details; unverified text is not a medical fact.</p></div>
          <div><span className={styles.number}>03 / PREPARE</span><h3>Take your history with you.</h3><p>Review timelines, generate summaries and export PDF reports for your own records or to discuss with your treating team.</p></div>
        </div>
      </div>
    </section>
    <section className={styles.section} aria-labelledby="care-privacy">
      <div className={styles.container}>
        <div className={styles.privacy}>
          <div><p className={styles.eyebrow}>PERSONAL INFORMATION. CONSIDERED CARE.</p><h2 id="care-privacy">Your records deserve<br />a private space.</h2><p>GaitAI Care uses HTTPS, password-based accounts and email verification. Access to records is checked on the server, with separate permissions for people you invite.</p><div className={styles.legalLinks}><a href={care.privacy}>Product privacy notice</a><Link href="/legal/terms/">Website terms</Link></div><p className={styles.small}>The product privacy notice is a pre-release draft. Separate product terms have not yet been published.</p></div>
          <ul>
            <li><h3>Protection at the source</h3><p>Uploaded originals, extracted text and clinical free text are encrypted by the application before storage. This is not end-to-end encryption.</p></li>
            <li><h3>Access you can manage</h3><p>Profiles belong to your account. Invite a caregiver with viewer or editor access, and revoke that access when needed.</p></li>
            <li><h3>A way to take records with you</h3><p>Export your records and original files. Account deletion is available in Settings; copies already downloaded or shared remain outside the app’s control.</p></li>
          </ul>
        </div>
        <p className={styles.scope}><strong>A clear role in your care.</strong> GaitAI Care organises information; it does not diagnose, prescribe or recommend treatment. Extractions and summaries can be incomplete or wrong. Check originals with your clinician and never use the app to decide a dose or delay care. No clinical validation is claimed.</p>
      </div>
    </section>
    <section className={`${styles.section} ${styles.tinted}`}>
      <div className={`${styles.container} ${styles.faq}`}>
        <p className={styles.eyebrow}>A FEW USEFUL DETAILS</p><h2>Before you begin.</h2>
        <details><summary>Is GaitAI Care the same as MobilityCare?</summary><p>No. GaitAI Care is a standalone product for personal and family health-record management. <Link href="/mobilitycare/">MobilityCare</Link> focuses on movement intelligence and gait analysis. GaitAI Care does not perform gait analysis.</p></details>
        <details><summary>Can I manage records for my family?</summary><p>Yes. Create separate profiles for people whose health information you are authorised to manage, including children or parents. A child does not need a separate account.</p></details>
        <details><summary>Do the web and Android apps share my records?</summary><p>Yes. They use the same account and service. Internet access is needed to access server records. The Android build is labelled Early Access while physical-device testing remains pending.</p></details>
        <details><summary>What happens when I create an account?</summary><p>Read the product privacy notice, enter your email and password, and confirm your email address using the verification link. Records stay locked until verification. The hosting service may take a short while to wake up.</p></details>
        <details><summary>Where can I read about how it works?</summary><p>The <Link href={care.documentation}>Technical Documentation</Link> explains the web app, Android client, authentication, storage, extraction and release evidence.</p></details>
      </div>
    </section>
    <section className={styles.closing}><div className={styles.container}><div><p className={styles.eyebrow}>YOUR NEXT CHAPTER</p><h2>A little more organised.<br />A little better prepared.</h2><p>Start bringing your health history together.</p></div><CareActions /></div></section>
  </div>;
}
