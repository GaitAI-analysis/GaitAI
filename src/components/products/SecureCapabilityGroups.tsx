"use client";

// Client component on purpose. ProductCard is a client component and takes a
// whole GaitProduct, whose `icon` is a Lucide forwardRef object — passing that
// across a server→client boundary throws "Functions cannot be passed directly
// to Client Components". Reading the product list on the client side keeps the
// icon from ever crossing, which is how ProductGrid handles it too.

import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { ProductCard } from "@/components/products/ProductCard";
import { secureProducts } from "@/data/products";

/**
 * SecureVision, split into the two groups a buyer and a reviewer both need to
 * see separately.
 *
 * The suite previously read as one undifferentiated grid, which put
 * identity-free crowd and safety analytics next to person re-identification
 * and watchlist matching as if they carried the same governance weight. They
 * do not. Group A works without identifying anyone; Group B requires lawful
 * authority, access control and auditability, and carries that condition
 * visibly on the group rather than buried in a product page.
 *
 * Membership is derived from the product records, so a new SecureVision
 * product lands in a group automatically.
 */
const IDENTITY_PRODUCT_IDS = new Set([
  "reid",
  "accessmotion",
  "forensicsearch",
  "watchlist",
]);

const privacyAwareProducts = secureProducts.filter(
  (p) => !IDENTITY_PRODUCT_IDS.has(p.id)
);
const identityProducts = secureProducts.filter((p) =>
  IDENTITY_PRODUCT_IDS.has(p.id)
);

function GroupHeader({
  eyebrow,
  count,
  title,
  description,
  tone,
}: {
  eyebrow: string;
  count: number;
  title: string;
  description: string;
  tone: "secure" | "restricted";
}) {
  const rule = tone === "secure" ? "bg-royal-300/50" : "bg-amber-300/50";
  const label = tone === "secure" ? "text-royal-300" : "text-amber-300";

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className={`h-1 w-6 rounded-full ${rule}`} />
        <span
          className={`text-[10.5px] font-semibold uppercase tracking-[0.18em] ${label}`}
        >
          {eyebrow}
        </span>
        <span className="text-[10.5px] uppercase tracking-[0.18em] text-soft-mute">
          {count} products
        </span>
      </div>
      <h3 className="mt-3 font-display text-2xl text-balance text-soft-white sm:text-3xl">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-soft-gray sm:text-[15px]">
        {description}
      </p>
    </div>
  );
}

export function SecureCapabilityGroups() {
  return (
    <div className="space-y-20">
      {/* GROUP A — works without identifying anyone */}
      <section id="privacy-aware">
        <Reveal>
          <GroupHeader
            eyebrow="Privacy-aware safety intelligence"
            count={privacyAwareProducts.length}
            title="Safety analytics that never need to know who someone is."
            description="Anomaly detection, crowd flow, worker safety and campus monitoring run on movement features rather than identity. PrivacyGuard applies skeleton-only processing, optional face blur, role-based access and configurable retention at the pipeline level. This is the default posture for SecureVision — privacy-aware architecture, not a guarantee of anonymity."
            tone="secure"
          />
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {privacyAwareProducts.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </section>

      {/* GROUP B — requires lawful authority */}
      <section id="authorized-identity">
        <Reveal>
          <GroupHeader
            eyebrow="Authorized identity & investigation"
            count={identityProducts.length}
            title="Identity-related capabilities, under governance."
            description="Cross-camera correspondence, gait-assisted access control, post-event investigation and policy-governed watchlist matching. These produce confidence-based candidates for trained review — never proof of identity — and they are not offered for general-public surveillance."
            tone="restricted"
          />
        </Reveal>

        {/* The condition sits on the group, not buried in a product page. */}
        <Reveal>
          <div className="mt-6 rounded-2xl border border-amber-300/25 bg-amber-300/[0.04] p-5 sm:p-6">
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-amber-300">
              Authorized deployments only
            </div>
            <p className="mt-2.5 max-w-3xl text-[13.5px] leading-relaxed text-soft-gray">
              Identity-related capabilities are intended only for lawful,
              authorized environments with appropriate access controls,
              governance and auditability. Where non-identifying movement
              intelligence is sufficient for the outcome, that is what we
              deploy.
            </p>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
              <Link
                href="/legal/responsible-ai"
                className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300 transition-colors hover:text-amber-200"
              >
                Responsible AI policy
              </Link>
              <Link
                href="/legal/security"
                className="text-xs font-semibold uppercase tracking-[0.16em] text-soft-mute transition-colors hover:text-soft-white"
              >
                Access &amp; audit controls
              </Link>
            </div>
          </div>
        </Reveal>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {identityProducts.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
