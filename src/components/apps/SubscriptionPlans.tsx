import Link from "next/link";
import { georama } from "@/components/care/Care";
import { productApps, type ProductAppId } from "@/data/product-apps";
import { ACCOUNT_HREF, androidHref, disclosures, payments, plansFor, subscribeHref, tax, TERMS_SUBSCRIPTIONS_HREF } from "@/data/subscriptions";
import showcase from "./appShowcase.module.css";
import styles from "./subscriptionPlans.module.css";

/**
 * SUBSCRIPTION PLANS — the pricing section of a product page.
 *
 * Two plan cards (annual first, with its saving stated), then the facts a
 * person needs before paying: the charge and its rhythm, how to cancel, how
 * tax is treated, that each product is its own subscription, that the
 * download is free and the features are not. The buttons go to the Android
 * download page, the account page (sign in, subscribe, manage) and the terms.
 *
 * Same visual language as the app showcase above it. While payments are not
 * switched on, the section says so and the Subscribe button says "open soon"
 * instead of pretending.
 */
export function SubscriptionPlans({ product }: { product: ProductAppId }) {
  const app = productApps[product];
  const plans = plansFor(product);
  const titleId = `${product}-pricing-title`;
  return (
    <section id="pricing" className={`${showcase.section} ${showcase.theme} ${styles.section} ${georama.variable}`} aria-labelledby={titleId}>
      <div className={showcase.container}>
        <div className={showcase.head}>
          <div>
            <p className={showcase.eyebrow}>Subscription plans</p>
            <h2 id={titleId}>
              Download free.
              <br />
              <span>Subscribe to analyse.</span>
            </h2>
            <p className={showcase.lead}>{disclosures.download}</p>
          </div>
          <div className={showcase.aside}>
            <span className={showcase.status}>{payments.live ? "SUBSCRIPTIONS OPEN" : "ANNOUNCED PRICING · PAYMENTS NOT YET LIVE"}</span>
            <div className={showcase.actions}>
              <Link href={androidHref(product)} className={showcase.primary}>
                Download Android app <span aria-hidden="true">↓</span>
              </Link>
              <Link href={ACCOUNT_HREF} className={showcase.secondary}>
                Sign in · Manage subscription
              </Link>
            </div>
          </div>
        </div>

        <div className={styles.plans}>
          {plans.map((plan) => (
            <article key={plan.id} className={`${styles.plan} ${plan.highlight ? styles.highlight : ""}`} aria-label={`${plan.label} plan`}>
              <div className={styles.planHead}>
                <h3>{plan.label}</h3>
                {plan.highlight ? <span className={styles.badge}>Save {plan.savingsPercent}%</span> : null}
              </div>
              <p className={styles.price}>
                {plan.amount} <span>/ {plan.cycle === "annual" ? "year" : "month"}</span>
              </p>
              <p className={styles.perMonth}>{plan.cycle === "annual" ? `${plan.perMonth} per month, billed once a year · saves ${plan.savings} against twelve monthly payments` : "Billed every month"}</p>
              <ul className={styles.features}>
                {app.analyses.map((a) => (
                  <li key={a.name}>
                    <strong>{a.name}.</strong> {a.included}
                  </li>
                ))}
              </ul>
              <p className={styles.renews}>Renews {plan.renews} at {plan.amount} until cancelled.</p>
              <Link href={payments.live ? subscribeHref(product, plan.cycle) : ACCOUNT_HREF} className={plan.highlight ? showcase.primary : showcase.secondary} aria-disabled={!payments.live}>
                {payments.live ? `Subscribe · ${plan.label}` : "Subscriptions open soon"}
              </Link>
            </article>
          ))}
        </div>

        <div className={styles.terms}>
          <div>
            <h3>Billing</h3>
            <p>{disclosures.recurring} {disclosures.payments}</p>
          </div>
          <div>
            <h3>Cancellation</h3>
            <p>{disclosures.cancellation}</p>
          </div>
          <div>
            <h3>Tax</h3>
            <p>{tax.text}</p>
          </div>
          <div>
            <h3>One product, one subscription</h3>
            <p>{disclosures.separate} {disclosures.refunds}</p>
          </div>
        </div>

        <div className={showcase.actions}>
          <Link href={TERMS_SUBSCRIPTIONS_HREF} className={showcase.textLink}>
            Subscription terms and cancellation <span aria-hidden="true">→</span>
          </Link>
          <Link href="/legal/privacy/" className={showcase.textLink}>
            Privacy policy <span aria-hidden="true">→</span>
          </Link>
          <a href="mailto:support@gaitai.in" className={showcase.textLink}>
            Billing support <span aria-hidden="true">→</span>
          </a>
        </div>
        {!payments.live ? <p className={showcase.small}>{payments.statusLine}</p> : null}
      </div>
    </section>
  );
}
