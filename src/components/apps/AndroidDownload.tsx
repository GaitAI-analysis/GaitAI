import Link from "next/link";
import { georama } from "@/components/care/Care";
import styles from "@/components/care/care.module.css";
import { productApps, type ProductAppId } from "@/data/product-apps";
import { ACCOUNT_HREF, disclosures, payments, plansFor } from "@/data/subscriptions";

/**
 * THE ANDROID DOWNLOAD PAGE for a product app — the same shape as the GaitAI
 * Care download page: what the release is, whether it can be downloaded,
 * its exact size and SHA-256, and the installation steps. Fails closed: with
 * `release.publicApk` null the button says so and nothing is linked.
 *
 * Free to download, subscription to use — stated here as plainly as on the
 * product page, because a person arriving from a search lands here first.
 */
export function AndroidDownload({ product }: { product: ProductAppId }) {
  const app = productApps[product];
  const r = app.release;
  const released = Boolean(r.publicApk);
  const plans = plansFor(product);
  const mib = r.bytes ? `${(r.bytes / 1048576).toFixed(2)} MiB` : "—";
  return (
    <div className={`${styles.theme} ${styles.page} ${georama.variable}`}>
      <div className={styles.container}>
        <nav className={styles.crumb} aria-label="Breadcrumb">
          <Link href={app.productHref}>{app.name.replace("GaitAI ", "")}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Android</span>
        </nav>
        <header className={styles.downloadHero}>
          <span className={styles.badge}>ANDROID · {released ? "RELEASE" : "RELEASE PENDING"}</span>
          <h1>
            {app.name.replace("GaitAI ", "")} for Android.
            <br />
            Free to install. Subscribe to analyse.
          </h1>
          <p className={styles.lead}>{disclosures.download}</p>
        </header>
        <div className={styles.downloadGrid}>
          <section className={styles.releaseCard} aria-labelledby={`${product}-release-title`}>
            <h2 id={`${product}-release-title`}>{released ? `Get ${app.name} ${r.version}` : "Download not yet available"}</h2>
            <p>{released ? "Download the signed APK directly from gaitai.in. This release is distributed outside Google Play." : r.detail}</p>
            <div className={styles.actions}>
              {r.publicApk ? (
                <a href={r.publicApk} download className={styles.primary}>
                  Download APK · {mib}
                </a>
              ) : null}
              <Link href={ACCOUNT_HREF} className={released ? styles.secondary : styles.primary}>
                {released ? "Sign in · Subscription" : "Create a GaitAI account"}
              </Link>
            </div>
            <dl>
              <dt>Version</dt>
              <dd>{r.version} (build {r.build})</dd>
              <dt>Channel</dt>
              <dd>{released ? "Public release" : "Signed release candidate"}</dd>
              <dt>Requires</dt>
              <dd>{app.android}</dd>
              <dt>Package</dt>
              <dd>{app.package}</dd>
              <dt>File size</dt>
              <dd>{r.bytes ? `${mib} (${r.bytes.toLocaleString("en-IN")} bytes)` : "—"}</dd>
              <dt>Signed by</dt>
              <dd>GaitAI release key (RSA-2048)</dd>
            </dl>
            <p>
              <strong>SHA-256 · {released ? "Published APK" : "Release candidate"}</strong>
            </p>
            <code className={styles.checksum}>{r.sha256 ?? "Published with the release."}</code>
            <p className={styles.small}>
              {released ? "Compare this checksum with the downloaded file before installation." : "The checksum of the public file is printed here when the download opens."}
            </p>
          </section>
          <section className={styles.instructions} aria-labelledby={`${product}-install-title`}>
            <h2 id={`${product}-install-title`}>Installing and subscribing</h2>
            <ol>
              <li>Download the versioned APK from this page on your Android device. Keep Android and your browser up to date.</li>
              <li>
                Check the version and file size. To check SHA-256 on a computer, use <code>Get-FileHash</code> in PowerShell or <code>shasum -a 256</code> on macOS, and compare it with the value shown here.
              </li>
              <li>Open the downloaded file. Android may ask you to allow this browser or file manager to install apps. Grant that source permission only if you trust this release, then remove it after installation.</li>
              <li>Keep Play Protect enabled. If Android reports that the app is unsafe or blocks installation, stop and contact support; do not bypass the warning.</li>
              <li>Open the app, create your GaitAI account (or sign in) and verify your email. Choose a plan — {plans.map((p) => `${p.label} ${p.amount}`).join(" or ")} — and pay through the secure checkout. Features unlock when the payment is confirmed.</li>
            </ol>
            <p>{disclosures.separate} {disclosures.cancellation}</p>
            <p>{payments.live ? disclosures.payments : payments.statusLine}</p>
            <div className={styles.legalLinks}>
              <Link href={`${app.productHref}#pricing`}>Plans and pricing</Link>
              <Link href="/legal/privacy/">Privacy policy</Link>
              <Link href="/legal/terms/#subscriptions">Subscription terms</Link>
              <a href={`mailto:support@gaitai.in?subject=${encodeURIComponent(`${app.name} Android`)}`}>Contact support</a>
            </div>
            <p className={styles.small}>{app.honesty}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
