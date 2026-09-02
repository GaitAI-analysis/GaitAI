import Link from "next/link";
import styles from "./evidence.module.css";

/**
 * The conceptual bridge from research to product.
 *
 * This replaces the full ten-model pipeline diagram that used to sit here.
 * That diagram's data (`aiPipeline` in products.ts) is untouched and still
 * exported — only its rendering on /research is reduced, because the page's
 * job is the evidence chain, not the model inventory. The detail is one
 * disclosure away rather than the default view.
 *
 * The two endpoints are emphasised: research at the top, and the operator- or
 * clinician-facing output at the bottom. The middle steps are the platform's,
 * not the record's — which is exactly the distinction the page is built
 * around.
 */
const chain = [
  {
    label: "Research foundation",
    detail: "Peer-reviewed methods and the granted patent.",
    strong: true,
  },
  {
    label: "Movement representations",
    detail: "Pose, gait features and temporal signals extracted from capture.",
    strong: false,
  },
  {
    label: "Platform capabilities",
    detail: "The shared capability layer the products draw on.",
    strong: false,
  },
  {
    label: "Product-specific models",
    detail: "Tuned per product and per environment.",
    strong: false,
  },
  {
    label: "Reports · dashboards · alerts",
    detail: "What a clinician or operator actually reviews.",
    strong: true,
  },
] as const;

export function ResearchToProduct() {
  return (
    <section id="research-to-product" className="section">
      <div className="container-wide">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] lg:gap-20">
          <div>
            <span className="eyebrow">
              <span className="h-1 w-6 rounded-full bg-gradient-brand" />
              From research to product
            </span>
            <h2 className="mt-5 font-display text-[1.75rem] leading-[1.15] tracking-[-0.02em] text-balance text-soft-white sm:text-[2.125rem]">
              Where the record ends and{" "}
              <span className="text-gradient">the platform begins.</span>
            </h2>
            <p className="mt-5 max-w-prose text-[0.9375rem] leading-relaxed text-soft-gray">
              Research establishes the methodological foundation.
              Product-specific validation establishes fitness for a particular
              use.
            </p>
            <Link
              href="/#how"
              className="group mt-7 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300 transition-colors hover:text-cyan-200"
            >
              See how the platform works
              <span
                aria-hidden="true"
                className="transition-transform duration-300 group-hover:translate-x-0.5"
              >
                →
              </span>
            </Link>
          </div>

          <ol className="lg:pt-2">
            {chain.map((step) => (
              <li
                key={step.label}
                className={`${styles.chainStep} ${
                  step.strong ? styles.chainStepStrong : ""
                }`}
              >
                <p
                  className={`font-display text-[1.0625rem] leading-snug ${
                    step.strong ? "text-soft-white" : "text-soft-gray"
                  }`}
                >
                  {step.label}
                </p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-soft-mute">
                  {step.detail}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
