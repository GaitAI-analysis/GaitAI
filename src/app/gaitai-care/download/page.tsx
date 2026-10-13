import type { Metadata } from "next";
import Link from "next/link";
import { CareBrand, georama } from "@/components/care/Care";
import styles from "@/components/care/care.module.css";
import { gaitaiCare as care } from "@/data/gaitai-care";

export const metadata: Metadata = { title: "GaitAI Care for Android — Early Access", description: "Android Early Access release information, download status, installation guidance and SHA-256 integrity details for GaitAI Care.", alternates: { canonical: care.download } };

export default function CareDownloadPage() {
  const released = Boolean(care.release.apk);
  return <div className={`${styles.theme} ${styles.page} ${georama.variable}`}>
    <div className={styles.container}>
      <nav className={styles.crumb} aria-label="Breadcrumb"><Link href={care.href}>GaitAI Care</Link><span aria-hidden="true">/</span><span aria-current="page">Android</span></nav>
      <header className={styles.downloadHero}><CareBrand /><span className={styles.badge}>ANDROID EARLY ACCESS</span><h1>Your health history.<br />Closer to hand.</h1><p className={styles.lead}>The GaitAI Care Android app uses the same account and records as the web app. Version 1.0.0 is an early-access build; testing on physical devices is still pending.</p></header>
      <div className={styles.downloadGrid}>
        <section className={styles.releaseCard} aria-labelledby="release-title">
          <h2 id="release-title">{released ? "Get GaitAI Care 1.0.0" : "Download not yet available"}</h2>
          {released ? <p>Download the signed APK directly from gaitai.in. This release is distributed outside Google Play.</p> : <p>The signed build has passed local signature checks. Public download is on hold while its checksum is checked against the approved release report. You can use the web app in the meantime.</p>}
          <div className={styles.actions}>{care.release.apk && <a href={care.release.apk} download className={styles.primary}>Download APK · 4.39 MiB</a>}<a className={released ? styles.secondary : styles.primary} href={care.web} target="_blank" rel="noopener noreferrer">Try Web App <span aria-hidden="true">↗</span></a></div>
          <dl><dt>Version</dt><dd>{care.release.version}</dd><dt>Release channel</dt><dd>Early Access</dd><dt>Requires</dt><dd>Android 7.0 or later</dd><dt>File size</dt><dd>4.39 MiB</dd><dt>Exact size</dt><dd>4,602,976 bytes</dd><dt>Package</dt><dd>in.gaitai.care</dd></dl>
          <p><strong>SHA-256 · {released ? "Published APK" : "Inspected local APK"}</strong></p><code className={styles.checksum}>{care.release.sha256}</code>
          <p className={styles.small}>{released ? "Compare this checksum with the downloaded file before installation." : "This identifies the inspected file. It is not yet a verification against the original release report."}</p>
        </section>
        <section className={styles.instructions} aria-labelledby="install-title"><h2 id="install-title">When the download is ready</h2>
          <ol><li>Download the versioned APK from this page on your Android device. Keep Android and your browser up to date.</li><li>Check the version and file size. To check SHA-256 on a computer, use <code>Get-FileHash</code> in PowerShell or <code>shasum -a 256</code> on macOS, and compare it with the value shown here.</li><li>Open the downloaded file. Android may ask you to allow this browser or file manager to install apps. Grant that source permission only if you trust this release, then remove it after installation.</li><li>Keep Play Protect enabled. If Android reports that the app is unsafe or blocks installation, stop and contact support; do not bypass the warning.</li><li>Open GaitAI Care and sign in, or create an account and confirm your email. Your web and Android records use the same account.</li></ol>
          <p>This app is not listed on Google Play. Early Access does not establish compatibility with every device. Avoid relying on notifications as your only reminder.</p>
          <div className={styles.legalLinks}><a href={care.privacy}>Product privacy notice</a><Link href="/legal/terms/">Website terms</Link><Link href="/insights/wiki/gaitai-care/android/release/">Release documentation</Link><a href="mailto:support@gaitai.in?subject=GaitAI%20Care%20Android">Contact support</a></div>
          <p className={styles.small}>Separate product terms have not yet been published. GaitAI Care is a health-record organiser, not a diagnostic or treatment service.</p>
        </section>
      </div>
    </div>
  </div>;
}
