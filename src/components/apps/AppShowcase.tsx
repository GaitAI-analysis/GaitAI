import Link from "next/link";
import { ctas } from "@/data/content";
import { productApps, type ProductAppId } from "@/data/product-apps";
import { SUBSCRIPTION_NOTE } from "@/data/subscriptions";
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
 * paid, subscription-gated product: the download is free and every analysis
 * needs an active subscription. Plans, prices and payment are inside the app
 * only — this section never prints a price (data/subscriptions.ts). The
 * download button leads to the /<product>/download/ page; MobilityCare also
 * links the site's browser demonstration, labelled as a demonstration.
 *
 * A section of the product page, styled as one: the site's type, tokens,
 * buttons and cards (app/design-system.css), the page's own headline accent
 * and the family's selection colour — no palette of its own.
 */
export function AppShowcase({ app: appId }: { app: ProductAppId }) {
  const app = productApps[appId];
  const titleId = `${appId}-app-title`;

  return (
    <section
      id={app.anchor}
      className={`${styles.section} ${styles.theme} ${appId === "securevision" ? "ix-family-secure" : "ix-family-care"}`}
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
              <span className={appId === "securevision" ? "text-gradient-secure" : "text-gradient"}>{app.headline[1]}</span>
            </h2>
            <p className={styles.lead}>{app.lead}</p>
          </div>
          <div className={styles.aside}>
            <span className={styles.status}>{app.release.status.toUpperCase()} · ANDROID</span>
            <div className={styles.actions}>
              <Link href={app.downloadHref} className={styles.primary}>
                Download Android App <span aria-hidden="true">↓</span>
              </Link>
              <Link href={ctas.demo.href} className={styles.secondary}>
                {ctas.demo.label} <span aria-hidden="true">→</span>
              </Link>
            </div>
            <p className={styles.small}>{SUBSCRIPTION_NOTE}</p>
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
              <Link href={app.downloadHref} className={styles.primary}>
                Download Android App
              </Link>
              <Link href={ctas.demo.href} className={styles.secondary}>
                {ctas.demo.label}
              </Link>
            </div>
            <p className={styles.small}>
              Version {app.release.version} (build {app.release.build}) · {app.android} · free download.
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
