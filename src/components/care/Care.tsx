import Image from "next/image";
import Link from "next/link";
import { Georama } from "next/font/google";
import { gaitaiCare as care } from "@/data/gaitai-care";
import styles from "./care.module.css";

export const georama = Georama({ subsets: ["latin"], variable: "--font-care", display: "swap" });

export function CareBrand() {
  return <div className={styles.brand}><Image src="/images/gaitai-care/app-icon.png" alt="" width={44} height={44} /><span>GaitAI <b>Care</b></span></div>;
}

export function CareActions({ learn = false }: { learn?: boolean }) {
  return <div className={styles.actions}>
    <a className={styles.primary} href={care.web}>Try Web App <span aria-hidden="true">↗</span></a>
    <Link className={styles.secondary} href={care.download}>Download for Android <span aria-hidden="true">↓</span></Link>
    {learn && <Link className={styles.textLink} href={care.href}>Learn More <span aria-hidden="true">→</span></Link>}
  </div>;
}

export function CareScreenshot({ priority = false }: { priority?: boolean }) {
  return <figure className={styles.screenshot}>
    <div className={styles.screenBar}><span>GAITAI CARE</span><span>Your personal record space</span></div>
    <div className={styles.screenImages}>
      <Image className={styles.lightScreen} src="/images/gaitai-care/records-light.png" width={1360} height={820} alt="GaitAI Care document library with upload, review filters and health-record navigation, shown with no records." priority={priority} />
      <Image className={styles.darkScreen} src="/images/gaitai-care/records-dark.png" width={1360} height={820} alt="GaitAI Care document library with upload, review filters and health-record navigation, shown with no records." priority={priority} />
    </div>
    <figcaption>Actual app interface · Empty records view · No patient data</figcaption>
  </figure>;
}

export function CareFeature() {
  return <section id="gaitai-care" className={`${styles.feature} ${styles.theme} ${georama.variable}`} aria-labelledby="care-feature-title">
    <div className={styles.container}>
      <div className={styles.featureGrid}>
        <div>
          <p className={styles.eyebrow}>PERSONAL &amp; FAMILY HEALTH</p>
          <CareBrand />
          <h2 id="care-feature-title">Your health story.<br />Together, at last.</h2>
          <p className={styles.lead}>Reports in one folder. Prescriptions in another. GaitAI Care gives your health records a home — across people, appointments and everyday care.</p>
          <CareActions learn />
          <p className={styles.small}>A standalone GaitAI product · Android Early Access</p>
        </div>
        <CareScreenshot />
      </div>
    </div>
  </section>;
}
