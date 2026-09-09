import Link from "next/link";
import type { PublishedBenchmark } from "@/data/benchmarks";
import { ContextLimitations } from "./ContextLimitations";

export function BenchmarkPanel({ record, empty = "pending" }: {
  record?: PublishedBenchmark;
  empty?: "pending" | "hide";
}) {
  if (!record) {
    return empty === "hide" ? null : (
      <p className="text-sm leading-relaxed text-soft-gray">
        Validation pending publication. Published evaluations will identify
        the dataset, sample count, hardware, environment, method and limitations
        alongside any accuracy or runtime measurements.
      </p>
    );
  }
  return (
    <div>
      <p className="text-sm font-semibold text-soft-white">{record.title}</p>
      <dl className="mt-4 grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
        {[
          ["Dataset", record.dataset], ["Sample count", String(record.sampleCount)],
          ["Environment", record.environment], ["Hardware", record.hardware],
          ["Evaluation method", record.method],
          ...record.metrics.map((metric) => [metric.label, `${metric.value}${metric.confidenceInterval ? ` (CI: ${metric.confidenceInterval})` : ""}`]),
        ].map(([label, value]) => <div key={label}><dt className="text-soft-mute">{label}</dt><dd className="mt-1 text-soft-white">{value}</dd></div>)}
      </dl>
      <p className="my-4 text-xs text-soft-mute">
        <Link href={record.source.href} className="text-cyan-300 underline underline-offset-4">{record.source.label}</Link>
        {" · "}Reviewed <time dateTime={record.reviewedAt}>{record.reviewedAt}</time>
      </p>
      <ContextLimitations context={record.limitations} />
    </div>
  );
}
