import type { Metadata } from "next";
import Link from "next/link";
import { UnsubscribeForm } from "@/components/subscribe/UnsubscribeForm";

export const metadata: Metadata = {
  title: "Unsubscribe — GaitAI Blog",
  description:
    "Remove your email address from GaitAI blog and product updates. One field, no account, and no reason required.",
  alternates: { canonical: "/insights/unsubscribe" },
  /* A utility page, not a destination: useful to the person holding the link
     and to nobody arriving from a search result. */
  robots: { index: false, follow: true },
};

/**
 * UNSUBSCRIBE — the other half of a mailing list.
 *
 * A list you can only join is not a list, it is a trap, so this route exists
 * in the same commit as the signup rather than as a promise in the privacy
 * policy. It needs no account and no token in the URL: the subscriber
 * document is addressed by the hash of the address itself (see lib/subscribe),
 * so typing the address is enough to find and flag the one row it owns.
 *
 * WHY TYPING THE ADDRESS IS ENOUGH. The worst thing a stranger can do with
 * this form is remove an address they already know from a mailing list — an
 * inconvenience, not a disclosure. Requiring a signed token would mean a
 * server to sign it, and this site is a static export; requiring an account
 * would be a far larger imposition than the thing being undone.
 */
export default function UnsubscribePage() {
  return (
    <div className="site-page-intro">
      <div className="container-wide">
        <div className="w-full max-w-[42rem]">
          <Link
            href="/insights"
            className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-soft-mute transition-colors hover:text-soft-white"
          >
            ← Back to Blog
          </Link>

          <h1 className="mt-8 font-display text-display-md text-balance text-soft-white">
            Unsubscribe
          </h1>

          <p className="mt-5 text-base leading-relaxed text-soft-gray">
            Enter the address you subscribed with and it will stop receiving
            GaitAI updates. No account, no sign-in, and no reason required.
          </p>

          <UnsubscribeForm />

          <p className="mt-10 text-sm leading-relaxed text-soft-mute">
            Your address is kept and marked as unsubscribed rather than
            deleted, so a later export cannot quietly add it back. To have the
            record removed entirely, see the{" "}
            <Link
              href="/legal/privacy"
              className="text-cyan-300 underline decoration-cyan-300/35 underline-offset-4"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
