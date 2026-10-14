import type { Metadata } from "next";
import Link from "next/link";
import styles from "@/components/care/care.module.css";
import { productAppList } from "@/data/product-apps";
import { SUBSCRIPTION_NOTE } from "@/data/subscriptions";
import { SOCIAL_IMAGES, socialCard } from "@/lib/seo";

const TITLE = "GaitAI Account — Managed in the Android Apps";
const DESCRIPTION = "Your GaitAI account and subscription for MobilityCare or SecureVision are managed inside the Android app: sign in, see your status and receipts, and cancel from Profile.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/account/" },
  ...socialCard({ title: TITLE, description: DESCRIPTION, path: "/account/", image: SOCIAL_IMAGES.default }),
};

/**
 * /account — where the apps' "Manage on the web" link lands. Founder
 * decision 2026-10-14: account, plans, payment, receipts and cancellation
 * all happen inside the Android apps, so this page only says where to find
 * them. No sign-in, no checkout, no price (data/subscriptions.ts).
 */
export default function AccountPage() {
  return (
    <div className={`${styles.theme} ${styles.page}`}>
      <div className={styles.container}>
        <nav className={styles.crumb} aria-label="Breadcrumb">
          <Link href="/products/">Products</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Account</span>
        </nav>
        <header className={styles.downloadHero}>
          <span className={styles.badge}>GAITAI ACCOUNT</span>
          <h1>
            Your account lives
            <br />
            in the app.
          </h1>
          <p className={styles.lead}>{SUBSCRIPTION_NOTE}</p>
        </header>
        <div className={styles.downloadGrid}>
          <section className={styles.releaseCard} aria-labelledby="account-where-title">
            <h2 id="account-where-title">Manage your subscription</h2>
            <ol>
              <li>Open GaitAI MobilityCare or GaitAI SecureVision on your phone.</li>
              <li>Go to Profile, then Subscription.</li>
              <li>See your status, next renewal and receipts, or cancel. Cancelling stops future charges; access continues to the end of the period already paid for.</li>
            </ol>
            <p className={styles.small}>Signing in on another phone restores your subscription there. Each product is a separate subscription.</p>
            <div className={styles.actions}>
              {productAppList.map((app, i) => (
                <Link key={app.id} href={app.downloadHref} className={i === 0 ? styles.primary : styles.secondary}>
                  Download {app.name.replace("GaitAI ", "")}
                </Link>
              ))}
            </div>
          </section>
          <section className={styles.instructions} aria-labelledby="account-help-title">
            <h2 id="account-help-title">Help</h2>
            <p>
              Billing questions, refunds and account deletion: <a href="mailto:support@gaitai.in?subject=GaitAI%20subscription">support@gaitai.in</a>. Include the email address of your GaitAI account.
            </p>
            <div className={styles.legalLinks}>
              <Link href="/legal/terms/#subscriptions">Subscription terms</Link>
              <Link href="/legal/privacy/">Privacy policy</Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
