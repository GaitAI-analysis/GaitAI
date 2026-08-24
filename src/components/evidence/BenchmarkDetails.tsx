import type { BenchmarkRecord } from "@/data/platform";

const fieldLabels: Record<Exclude<keyof BenchmarkRecord, "title" | "publicationUrl">, string> = {
  dataset: "Dataset",
  sampleSize: "Sample size",
  subjects: "Subjects",
  evaluationProtocol: "Evaluation protocol",
  model: "Model",
  modelVersion: "Model version",
  metric: "Metric",
  hardware: "Hardware",
  result: "Result",
  evaluationDate: "Evaluation date",
};

export function BenchmarkDetails({ record }: { record: BenchmarkRecord }) {
  const fields = Object.entries(fieldLabels)
    .map(([key, label]) => ({ label, value: record[key as keyof BenchmarkRecord] }))
    .filter((field) => Boolean(field.value));

  if (fields.length === 0 && !record.publicationUrl) return null;

  return (
    <details className="group border-t border-white/10 pt-4">
      <summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60">
        Methodology
        <span className="ml-2 inline-block transition-transform group-open:rotate-45">+</span>
      </summary>
      {fields.length > 0 && (
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field.label}>
              <dt className="font-mono text-[9px] uppercase tracking-[0.16em] text-soft-mute">{field.label}</dt>
              <dd className="mt-1 text-sm text-soft-gray">{field.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {record.publicationUrl && (
        <a
          href={record.publicationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex text-xs font-semibold text-cyan-300 underline decoration-cyan-300/30 underline-offset-4"
        >
          Related publication
        </a>
      )}
    </details>
  );
}
