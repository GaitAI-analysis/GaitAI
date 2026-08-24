import Link from "next/link";
import { ArrowUpRight, HeartPulse, ShieldCheck } from "lucide-react";
import { flagshipCapabilityIds } from "@/data/platform";
import { productById } from "@/data/products";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";

const groups = [
  {
    id: "mobilitycare",
    label: "MobilityCare",
    description: "Movement intelligence for healthcare, mobility, rehabilitation, performance and elderly care.",
    icon: HeartPulse,
    accent: "text-teal-300",
    border: "border-teal-300/25",
    ids: flagshipCapabilityIds.mobilitycare,
    href: "/mobilitycare",
  },
  {
    id: "securevision",
    label: "SecureVision",
    description: "Movement intelligence for safety, behavior, crowd understanding, security and operational awareness.",
    icon: ShieldCheck,
    accent: "text-royal-300",
    border: "border-royal-300/25",
    ids: flagshipCapabilityIds.securevision,
    href: "/securevision",
  },
] as const;

export function CapabilityShowcase() {
  return (
    <section id="flagship-capabilities" className="section bg-obsidian-300/40">
      <div className="container-wide">
        <SectionHeading
          eyebrow="Flagship capabilities"
          title={
            <>
              Specialized modules. <span className="text-gradient">One movement engine.</span>
            </>
          }
          description="Six representative capabilities show how the shared platform becomes focused health, performance, safety and operations workflows."
          align="left"
        />

        <div className="mt-14 grid gap-12 lg:grid-cols-2 lg:gap-16">
          {groups.map((group, groupIndex) => {
            const Icon = group.icon;
            const products = group.ids.map((id) => productById(id)).filter(Boolean);
            return (
              <Reveal key={group.id} delay={groupIndex * 0.08}>
                <article>
                  <div className="flex items-start gap-4 border-b border-white/10 pb-6">
                    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border bg-white/[0.025] ${group.border} ${group.accent}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-display text-2xl text-soft-white">{group.label}</h3>
                      <p className="mt-2 max-w-xl text-sm leading-relaxed text-soft-mute">{group.description}</p>
                    </div>
                  </div>

                  <div className="divide-y divide-white/[0.07]">
                    {products.map((product, index) => {
                      if (!product) return null;
                      const ProductIcon = product.icon;
                      return (
                        <Link
                          key={product.id}
                          href={`/${product.vertical}#${product.id}`}
                          className="group grid grid-cols-[auto_1fr_auto] items-start gap-4 py-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
                        >
                          <span className="font-mono text-[10px] text-soft-mute">0{index + 1}</span>
                          <span>
                            <span className="flex items-center gap-2 font-display text-xl text-soft-white">
                              <ProductIcon className={`h-4 w-4 ${group.accent}`} />
                              {product.short}
                            </span>
                            <span className="mt-1.5 block text-sm leading-relaxed text-soft-mute">{product.label}.</span>
                          </span>
                          <ArrowUpRight className="mt-1 h-4 w-4 text-soft-mute transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-cyan-300" />
                        </Link>
                      );
                    })}
                  </div>

                  <Link href={group.href} className={`mt-5 inline-flex items-center gap-2 text-sm font-semibold ${group.accent}`}>
                    Explore {group.label}
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </article>
              </Reveal>
            );
          })}
        </div>

        <div className="mt-14 border-t border-white/10 pt-8">
          <Link href="/products" className="btn-ghost">
            Explore all capabilities
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
