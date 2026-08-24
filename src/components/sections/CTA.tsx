import Link from "next/link";
import { ArrowRight, Mail, Microscope } from "lucide-react";

export function CTA() {
  return (
    <section id="contact" className="section relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[1200px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-radial-glow opacity-50 blur-3xl" />
      </div>

      <div className="container-wide">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-white/[0.045] to-transparent px-6 py-14 sm:px-12 sm:py-20 lg:px-20 lg:py-24">
          <div className="ring-grid pointer-events-none absolute inset-0 opacity-35" />
          <div className="noise" />
          <div className="relative mx-auto max-w-4xl text-center">
            <div className="eyebrow justify-center">
              <span className="h-1 w-6 rounded-full bg-gradient-brand" />
              Start a conversation
            </div>
            <h2 className="mt-6 font-display text-display-xl text-balance text-soft-white">
              Bring movement intelligence to <span className="text-gradient">your organization.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-soft-gray sm:text-lg">
              Discuss MobilityCare, SecureVision, research collaboration, product validation or investment with the GaitAI team.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href="mailto:hello@gaitai.com?subject=GaitAI%20demo%20enquiry"
                className="btn-primary"
              >
                <Mail className="h-4 w-4" />
                Request demo
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link href="/publications" className="btn-ghost">
                <Microscope className="h-4 w-4" />
                Explore the research
              </Link>
            </div>
            <p className="mt-5 text-xs text-soft-mute">
              Email opens in your preferred mail application. No form data is stored on this site.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
