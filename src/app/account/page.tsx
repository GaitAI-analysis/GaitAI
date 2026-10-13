import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { AccountPanel } from "@/components/account/AccountPanel";
import { georama } from "@/components/care/Care";
import styles from "@/components/care/care.module.css";
import { BILLING_SANDBOX } from "@/data/subscriptions";
import { SOCIAL_IMAGES, socialCard } from "@/lib/seo";

const TITLE = "GaitAI Account — Sign in, Subscribe, Manage Subscription";
const DESCRIPTION = "Sign in to your GaitAI account to subscribe to MobilityCare or SecureVision for Android, see your subscription status and billing history, and cancel at any time.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/account/" },
  ...socialCard({ title: TITLE, description: DESCRIPTION, path: "/account/", image: SOCIAL_IMAGES.default }),
};

/**
 * /account — the web half of the subscription: the same Firebase account the
 * Android apps use, the same billing Worker. Everything interactive is in
 * the client panel; this page is static so the export, SEO contract and
 * link check all see a complete document.
 */
export default function AccountPage() {
  return (
    <div className={`${styles.theme} ${styles.page} ${georama.variable}`}>
      <div className={styles.container}>
        <nav className={styles.crumb} aria-label="Breadcrumb">
          <Link href="/products/">Products</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Account</span>
        </nav>
        <header className={styles.downloadHero}>
          <span className={styles.badge}>GAITAI ACCOUNT{BILLING_SANDBOX ? " · SANDBOX" : ""}</span>
          <h1>
            Your subscriptions.
            <br />
            One account, every phone.
          </h1>
          <p className={styles.lead}>Sign in with the account you use in the GaitAI Android apps to subscribe, check your status, see your billing history and cancel at any time.</p>
        </header>
        <Suspense fallback={<p className={styles.small}>Loading your account…</p>}>
          <AccountPanel />
        </Suspense>
      </div>
    </div>
  );
}
