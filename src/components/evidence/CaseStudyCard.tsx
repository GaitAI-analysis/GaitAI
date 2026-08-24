export interface CaseStudyData {
  title: string;
  problem?: string;
  environment?: string;
  capability?: string;
  evidence?: string;
  outcome?: string;
}

/**
 * Reusable validation story. It intentionally renders only fields supplied by
 * a verified content source; no sample case studies are shipped by default.
 */
export function CaseStudyCard({ data }: { data: CaseStudyData }) {
  const fields = [
    ["Problem", data.problem],
    ["Environment", data.environment],
    ["GaitAI", data.capability],
    ["Evidence", data.evidence],
    ["Outcome", data.outcome],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  if (fields.length === 0) return null;

  return (
    <article className="border-y border-white/10 py-8">
      <h3 className="font-display text-2xl text-soft-white">{data.title}</h3>
      <dl className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {fields.map(([label, value]) => (
          <div key={label}>
            <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-300">{label}</dt>
            <dd className="mt-2 text-sm leading-relaxed text-soft-gray">{value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
