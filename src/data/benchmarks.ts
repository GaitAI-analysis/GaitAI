/** A published evaluation, never populated from illustrative demo values. */
export interface PublishedBenchmark {
  title: string;
  source: { label: string; href: string };
  reviewedAt: string;
  dataset: string;
  sampleCount: number;
  environment: string;
  hardware: string;
  method: string;
  metrics: { label: string; value: string; confidenceInterval?: string }[];
  limitations: string[];
}

/** Add a module record only after its evaluation and source are published. */
export const benchmarksByProduct: Readonly<Record<string, PublishedBenchmark>> = {};
