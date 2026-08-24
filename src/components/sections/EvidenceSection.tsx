import Link from "next/link";
import { ArrowUpRight, BookOpen, FileCheck2, SearchCheck } from "lucide-react";
import { papers, patent } from "@/data/publications";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ExplainResult } from "@/components/evidence/ExplainResult";

const doiPapers = papers.filter((paper) => paper.doi);

export function EvidenceSection() {
  return (
    <section id="evidence" className="section">
      <div className="container-wide">
        <SectionHeading
          eyebrow="Evidence and explainability"
          title={
            <>
              Claims should be <span className="text-gradient">inspectable.</span>
            </>
          }
          description="GaitAI publishes technical figures only when the supporting dataset, protocol and evaluation context can be inspected. The current public evidence centers on patent and publication records."
          align="left"
        />

        <div className="mt-14 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="border-y border-white/10">
            <EvidenceRow
              icon={FileCheck2}
              label="Granted intellectual property"
              title={`Indian Patent No. ${patent.patentNumber}`}
              description={`${patent.title}. Granted ${patent.grantDate}.`}
              href="/publications#patent"
            />
            <EvidenceRow
              icon={BookOpen}
              label="Peer-reviewed research"
              title={`${papers.length} selected papers surfaced on this site`}
              description={`${doiPapers.length} records include verified DOI links; the remaining records link to exact-title Scholar searches.`}
              href="/publications#papers"
            />
            <EvidenceRow
              icon={SearchCheck}
              label="Public benchmark dossiers"
              title="Not published in the current public material"
              description="Dataset, sample size, protocol, model version, hardware and evaluation date fields remain hidden until reliable source data is supplied."
            />
          </div>

          <div>
            <ExplainResult title="Fall-risk result pattern" researchHref="/publications" />
            <p className="mt-4 text-xs leading-relaxed text-soft-mute">
              No risk level, contributing factor, formula or clinical interpretation appears until a real result supplies it.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function EvidenceRow({
  icon: Icon,
  label,
  title,
  description,
  href,
}: {
  icon: typeof BookOpen;
  label: string;
  title: string;
  description: string;
  href?: string;
}) {
  return (
    <article className="grid gap-4 border-b border-white/[0.07] py-7 last:border-b-0 sm:grid-cols-[auto_1fr_auto] sm:items-start">
      <span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-300/[0.05] text-cyan-300">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-soft-mute">{label}</div>
        <h3 className="mt-2 font-display text-xl text-soft-white">{title}</h3>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-soft-mute">{description}</p>
      </div>
      {href && (
        <Link href={href} aria-label={`Open ${title}`} className="text-cyan-300">
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      )}
    </article>
  );
}
