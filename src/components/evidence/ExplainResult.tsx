import { ChevronRight, CircleHelp, FileSearch } from "lucide-react";

export interface ExplainResultProps {
  title: string;
  result?: string;
  contributors?: string[];
  methodologyHref?: string;
  researchHref?: string;
}

export function ExplainResult({
  title,
  result,
  contributors = [],
  methodologyHref,
  researchHref,
}: ExplainResultProps) {
  return (
    <article className="rounded-2xl border border-white/10 bg-obsidian-200/70 p-6" aria-label={`${title} explainability pattern`}>
      <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-soft-mute">Inspectable result</div>
          <h3 className="mt-1 font-display text-xl text-soft-white">{title}</h3>
        </div>
        <div className="rounded-full border border-white/10 bg-white/[0.025] px-3 py-1 text-xs text-soft-mute">
          {result ?? "No result loaded"}
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-soft-white">
          <CircleHelp className="h-4 w-4 text-cyan-300" />
          Why this result?
        </div>
        {contributors.length > 0 ? (
          <ul className="mt-3 space-y-2 text-sm text-soft-gray">
            {contributors.map((contributor) => (
              <li key={contributor} className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-cyan-300" />
                {contributor}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-soft-mute">
            Contributing signals appear here only when explanation data is supplied by the product result.
          </p>
        )}
      </div>

      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        {methodologyHref ? (
          <a href={methodologyHref} className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2 text-xs text-soft-gray">
            How calculated <ChevronRight className="h-3.5 w-3.5" />
          </a>
        ) : (
          <span className="flex items-center justify-between rounded-xl border border-white/[0.06] px-3 py-2 text-xs text-soft-mute" aria-disabled="true">
            How calculated <span>—</span>
          </span>
        )}
        {researchHref ? (
          <a href={researchHref} className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2 text-xs text-soft-gray">
            Research basis <FileSearch className="h-3.5 w-3.5" />
          </a>
        ) : (
          <span className="flex items-center justify-between rounded-xl border border-white/[0.06] px-3 py-2 text-xs text-soft-mute" aria-disabled="true">
            Research basis <span>—</span>
          </span>
        )}
      </div>
    </article>
  );
}
