import Link from "next/link";
import { georama } from "@/components/care/Care";
import styles from "@/components/care/care.module.css";
import { ctas } from "@/data/content";
import { productApps, type ProductAppId } from "@/data/product-apps";
import { payments, SUBSCRIPTION_NOTE } from "@/data/subscriptions";

/**
 * THE ANDROID DOWNLOAD PAGE for a product app — the same shape as the GaitAI
 * Care download page: what the release is, the button, its exact size and
 * SHA-256, and the installation steps. Fails closed: with `release.publicApk`
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
          <section className={styles.releaseCard} aria-labelledby={`${product}-release-title`}>
            <h2 id={`${product}-release-title`}>{released ? `${app.name} ${r.version}` : "Download not yet available"}</h2>
            <p>{released ? "The signed APK, downloaded directly. This release is distributed outside Google Play." : r.detail}</p>
            <div className={styles.actions}>
              {r.publicApk ? (
                <a href={r.publicApk} download className={styles.primary} data-apk-download={product}>
                  Download {short} APK
                </a>
              ) : null}
              <Link href={ctas.demo.href} className={released ? styles.secondary : styles.primary}>
                {ctas.demo.label}
              </Link>
            </div>
            <dl>
              <dt>Version</dt>
              <dd>{r.version} (build {r.build})</dd>
              <dt>Requires</dt>
              <dd>{app.android} · ARM64 or x86_64</dd>
              <dt>Package</dt>
              <dd>{app.package}</dd>
              <dt>File size</dt>
              <dd>{r.bytes ? `${mib} (${r.bytes.toLocaleString("en-IN")} bytes)` : "—"}</dd>
              <dt>Signed by</dt>
              <dd>GaitAI release key (RSA-2048, APK Signature Scheme v2)</dd>
            </dl>
            <p>
              <strong>SHA-256</strong>
            </p>
            <code className={styles.checksum}>{r.sha256 ?? "Published with the release."}</code>
            <p className={styles.small}>Compare this checksum with the downloaded file before installation.</p>
          </section>
          <section className={styles.instructions} aria-labelledby={`${product}-install-title`}>
            <h2 id={`${product}-install-title`}>Installing</h2>
            <ol>
              <li>Download the APK from this page on your Android device. Keep Android and your browser up to date.</li>
              <li>
                Check the version and file size. To check SHA-256 on a computer, use <code>Get-FileHash</code> in PowerShell or <code>shasum -a 256</code> on macOS, and compare it with the value shown here.
              </li>
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
