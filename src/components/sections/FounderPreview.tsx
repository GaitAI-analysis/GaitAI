import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, GraduationCap } from "lucide-react";
import { assetPath } from "@/lib/paths";

export function FounderPreview() {
  return (
    <section id="company" className="section bg-obsidian-300/40">
      <div className="container-wide">
        <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.025]">
            <Image
              src={assetPath("/brand/founder-anubha-parashar.png")}
              alt="Dr. Anubha Parashar, Founder and CEO of GaitAI"
              fill
              sizes="(min-width: 1024px) 420px, 90vw"
              className="object-cover object-top"
            />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-obsidian via-obsidian/50 to-transparent" />
            <div className="absolute bottom-5 left-5 right-5">
              <div className="font-display text-xl text-white">Dr. Anubha Parashar</div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-cyan-300">Founder &amp; CEO · AI Research Scientist</div>
            </div>
          </div>

          <div>
            <div className="eyebrow">
              <span className="h-1 w-6 rounded-full bg-gradient-brand" />
              Company and founder
            </div>
            <h2 className="mt-5 max-w-3xl font-display text-display-xl text-soft-white">
              Research depth, translated into <span className="text-gradient">a focused company.</span>
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-soft-gray sm:text-lg">
              GaitAI is led by Dr. Anubha Parashar, whose research record spans gait recognition, biometrics, deep learning and privacy-preserving movement analysis. The company connects that work to MobilityCare and SecureVision.
            </p>
            <div className="mt-8 grid gap-4 border-y border-white/10 py-6 sm:grid-cols-3">
              <Fact label="Foundation" value="10+ years" />
              <Fact label="Research output" value="50+ publications" />
              <Fact label="Intellectual property" value="Granted patent" />
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/about#founder" className="btn-primary">
                Read the GaitAI story
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link href="/publications" className="btn-ghost">
                <GraduationCap className="h-4 w-4" />
                Research portfolio
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-soft-mute">{label}</div>
      <div className="mt-2 font-display text-lg text-soft-white">{value}</div>
    </div>
  );
}
