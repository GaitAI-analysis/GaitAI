import Link from "next/link";
import { georama } from "@/components/care/Care";
import { ctas } from "@/data/content";
import { androidAccessMailto, productApps, type ProductAppId } from "@/data/product-apps";
import { ACCOUNT_HREF, androidHref, payments } from "@/data/subscriptions";
import { AppWalkthrough } from "./AppWalkthrough";
import styles from "./appShowcase.module.css";

/**
 * "EXPLORE THE APP" — the Android app of a product family, shown on that
 * family's page with its real screens.
 *
 * The section makes three promises and keeps all of them with data from
 * data/product-apps.ts: the screens are the app's own; the capabilities
 * listed are the ones that run on the device today, with what is coming
 * marked as coming; and the release status is stated as it is. The app is a
 * paid, subscription-gated product: the download is free, every analysis
 * needs an active subscription, and the plans sit in the SubscriptionPlans
 * section directly below. The download button appears only once
 * `release.publicApk` is set; until then the visitor can read the plans,
 * create an account, request a demo, and (for MobilityCare) try the site's
 * browser demonstration, which is labelled as a demonstration.
 *
 * Georama, warm paper, navy, graphite and one gold accent, like the GaitAI
 * Care surfaces: the apps are products, and this is the product voice.
 */
export function AppShowcase({ app: appId }: { app: ProductAppId }) {
  const app = productApps[appId];
  const titleId = `${appId}-app-title`;

  return (
    <section
      id={app.anchor}
      className={`${styles.section} ${styles.theme} ${georama.variable}`}
      aria-labelledby={titleId}
      data-app-showcase={appId}
    >
      <div className={styles.container}>
        <div className={styles.head}>
          <div>
            <p className={styles.eyebrow}>{app.eyebrow}</p>
            <h2 id={titleId}>
              {app.headline[0]}
              <br />
              <span>{app.headline[1]}</span>
            </h2>
            <p className={styles.lead}>{app.lead}</p>
          </div>
          <div className={styles.aside}>
            <span className={styles.status}>{app.release.status.toUpperCase()} · ANDROID</span>
            <div className={styles.actions}>
              <Link href={androidHref(app.id)} className={styles.primary}>
                {app.release.publicApk ? "Download for Android" : "Android download page"} <span aria-hidden="true">↓</span>
              </Link>
              <Link href={`${app.productHref}#pricing`} className={styles.secondary}>
                See plans <span aria-hidden="true">→</span>
              </Link>
            </div>
            <Link href={ACCOUNT_HREF} className={styles.textLink}>
              Sign in · Manage subscription <span aria-hidden="true">→</span>
            </Link>
            {app.webDemo && (
              <Link href={app.webDemo.href} className={styles.textLink}>
                {app.webDemo.label} <span aria-hidden="true">→</span>
              </Link>
            )}
            {app.webDemo && <p className={styles.small}>{app.webDemo.note}</p>}
          </div>
        </div>

        <AppWalkthrough app={app.id} name={app.name} screens={app.screens} />

        <div className={styles.facts}>
          <div className={styles.fact}>
            <h3>What the subscription includes</h3>
            <ul>
              {app.analyses.map((a) => (
                <li key={a.name}>
                  <strong>{a.name}</strong>
                  <em>{a.input}.</em>
                  <br />
                  <span className={styles.tier}>Included</span>
                  {a.included}.
                </li>
              ))}
            </ul>
            <p className={styles.soon}>
              <strong>Coming soon, visible but not startable:</strong> {app.comingSoon.join(" · ")}.
            </p>
          </div>

          <div className={styles.fact}>
            <h3>Privacy, in the app</h3>
            <ul>
              {app.privacy.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>

          <div className={`${styles.fact} ${styles.release}`}>
            <h3>Release status</h3>
            <p>{app.release.detail}</p>
            <div className={styles.actions}>
              <Link href={androidHref(app.id)} className={styles.primary}>
                {app.release.publicApk ? "Download for Android" : "Download page"}
              </Link>
              <Link href={ctas.demo.href} className={styles.secondary}>
                {ctas.demo.label}
              </Link>
            </div>
            <p className={styles.small}>
              {payments.live
                ? "Free to download; features need an active subscription on your GaitAI account."
                : <>Payments are not yet switched on. Pilots and evaluations can still be arranged: <a href={androidAccessMailto(app)}>request access</a>.</>}
            </p>
          </div>
        </div>

        <div className={styles.ribbon}>
          <span>
            <strong>{app.name}</strong> · {app.package}
          </span>
          <span>
            Version <strong>{app.version}</strong> (build {app.build})
          </span>
          <span>
            Requires <strong>{app.android}</strong>
          </span>
          <span>
            Native Android app · analysis on the device · subscription required
          </span>
        </div>
        <p className={styles.honesty}>{app.honesty}</p>
      </div>
    </section>
  );
}
