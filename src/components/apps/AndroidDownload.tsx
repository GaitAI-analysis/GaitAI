import Link from "next/link";
import { Download, ShieldCheck } from "lucide-react";
import { georama } from "@/components/care/Care";
import styles from "@/components/care/care.module.css";
import dl from "./androidDownload.module.css";
import { VerifyDownload } from "./VerifyDownload";
import { ctas } from "@/data/content";
import { productApps, type ProductAppId } from "@/data/product-apps";
import { payments, SUBSCRIPTION_NOTE } from "@/data/subscriptions";

/**
 * THE ANDROID DOWNLOAD PAGE for a product app — the same shape as the GaitAI
 * Care download page: what the release is, the button, its exact size and
 * SHA-256 (folded into "Verify download"), and the installation steps. Fails closed: with `release.publicApk`
 * null the button is absent and the card says so.
 *
 * Product discovery and download only. Plans, prices and payment are inside
 * the app (data/subscriptions.ts); this page carries the one discreet line.
 */
export function AndroidDownload({ product }: { product: ProductAppId }) {
  const app = productApps[product];
  const r = app.release;
  const released = Boolean(r.publicApk);
  const short = app.name.replace("GaitAI ", "");
  const mib = r.bytes ? `${(r.bytes / 1048576).toFixed(1)} MB` : "—";
  return (
    <div className={`${styles.theme} ${styles.page} ${georama.variable}`}>
      <div className={styles.container}>
        <nav className={styles.crumb} aria-label="Breadcrumb">
          <Link href={app.productHref}>{short}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Download</span>
        </nav>
        <header className={styles.downloadHero}>
          <span className={styles.badge}>ANDROID · {released ? `VERSION ${r.version}` : "RELEASE PENDING"}</span>
          <h1>
            {short} for Android.
            <br />
            Analysis on the phone that filmed it.
          </h1>
          <p className={styles.lead}>{SUBSCRIPTION_NOTE}</p>
        </header>
        <div className={styles.downloadGrid}>
          <section className={`${styles.releaseCard} ${dl.card}`} aria-labelledby={`${product}-release-title`}>
            <h2 id={`${product}-release-title`}>{released ? app.name : "Download not yet available"}</h2>
            <p className={dl.lede}>{released ? "Free download, directly from GaitAI." : r.detail}</p>
            <div className={dl.cta}>
              {r.publicApk ? (
                <a href={r.publicApk} download className={`${styles.primary} ${dl.download}`} data-apk-download={product}>
                  <Download aria-hidden="true" />
                  Download {short} APK
                </a>
              ) : null}
              <Link href={ctas.demo.href} className={released ? styles.secondary : styles.primary}>
                {ctas.demo.label}
              </Link>
            </div>
            <dl className={dl.facts}>
              <div className={dl.fact}>
                <dt>Version</dt>
                <dd>
                  {r.version}
                  <small>Build {r.build}</small>
                </dd>
              </div>
              <div className={dl.fact}>
                <dt>Size</dt>
                <dd>{mib}</dd>
              </div>
              <div className={dl.fact}>
                <dt>Requires</dt>
                <dd>{app.androidShort}</dd>
              </div>
            </dl>
            {released && r.signatureVerified ? (
              <p className={dl.signed}>
                <ShieldCheck aria-hidden="true" />
                Signed GaitAI release
              </p>
            ) : null}
            {r.sha256 ? <VerifyDownload sha256={r.sha256} packageId={app.package} product={product} /> : null}
          </section>
          <section className={styles.instructions} aria-labelledby={`${product}-install-title`}>
            <h2 id={`${product}-install-title`}>Installing</h2>
            <ol>
              <li>Download the APK from this page on your Android device. Keep Android and your browser up to date.</li>
              <li>Check that the version and size match the ones shown here. To go further, open Verify download and compare the checksum.</li>
              <li>Open the downloaded file. Android may ask you to allow this browser or file manager to install apps. Grant that source permission only if you trust this release, then remove it after installation.</li>
              <li>Keep Play Protect enabled. If Android reports that the app is unsafe or blocks installation, stop and contact support; do not bypass the warning.</li>
              <li>Open the app and create your GaitAI account or sign in. Subscription details are shown inside the app.</li>
            </ol>
            {!payments.live ? <p className={styles.small}>{payments.statusLine}</p> : null}
            <div className={styles.legalLinks}>
              <Link href={app.productHref}>About {short}</Link>
              <Link href="/legal/privacy/">Privacy policy</Link>
              <Link href="/legal/terms/">Terms</Link>
              <a href={`mailto:support@gaitai.in?subject=${encodeURIComponent(`${app.name} Android`)}`}>Contact support</a>
            </div>
            <p className={styles.small}>{app.honesty}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
