import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { InsightBlock } from "@/data/insights";

/* ─────────────────────────────────────────────────────────────────────────
   Inline text — a deliberately tiny subset: **bold** and [label](/href).
   Article copy is authored in `data/insights.ts`, so the surface stays small
   on purpose; anything richer belongs in a block type rather than in prose.
   ───────────────────────────────────────────────────────────────────────── */

const INLINE_TOKEN = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;

export function Inline({ text }: { text: string }): ReactNode {
  const nodes: ReactNode[] = [];
  let cursor = 0;

  for (const match of text.matchAll(INLINE_TOKEN)) {
    const token = match[0];
    const index = match.index ?? 0;
    if (index > cursor) nodes.push(text.slice(cursor, index));

    if (token.startsWith("**")) {
      nodes.push(
        <strong key={index} className="font-semibold text-soft-white">
          {token.slice(2, -2)}
        </strong>,
      );
    } else {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      const href = link?.[2] ?? "";
      const external = /^https?:/i.test(href);
      nodes.push(
        external ? (
          <a
            key={index}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-cyan-300 underline decoration-cyan-300/35 underline-offset-4 transition hover:decoration-cyan-300"
          >
            {link?.[1]}
          </a>
        ) : (
          <Link
            key={index}
            href={href}
            className="font-medium text-cyan-300 underline decoration-cyan-300/35 underline-offset-4 transition hover:decoration-cyan-300"
          >
            {link?.[1]}
          </Link>
        ),
      );
    }
    cursor = index + token.length;
  }

  if (cursor < text.length) nodes.push(text.slice(cursor));
  return <>{nodes}</>;
}

/* ─────────────────────────────────────────────────────────────────────────
   Block renderer
   ───────────────────────────────────────────────────────────────────────── */

const TONE = {
  cyan: {
    dot: "bg-cyan-300",
    border: "border-cyan-300/25",
    tint: "bg-cyan-300/[0.05]",
    label: "text-cyan-300",
  },
  violet: {
    dot: "bg-violet-300",
    border: "border-violet-300/25",
    tint: "bg-violet-400/[0.06]",
    // violet-300 (not -200) so the light-theme override in globals.css applies.
    label: "text-violet-300",
  },
} as const;

function Block({ block }: { block: InsightBlock }) {
  switch (block.type) {
    case "lead":
      return (
        <p className="insight-lead text-[1.2rem] leading-[1.65] text-soft-white sm:text-[1.35rem]">
          <Inline text={block.text} />
        </p>
      );

    case "p":
      return (
        <p className="mt-6 text-[1.0625rem] leading-[1.8] text-soft-gray">
          <Inline text={block.text} />
        </p>
      );

    case "h3":
      return (
        <h3 className="mt-12 font-display text-xl leading-snug text-soft-white sm:text-2xl">
          {block.text}
        </h3>
      );

    case "list": {
      const tone = TONE[block.tone ?? "cyan"];
      return (
        <ul className="mt-7 space-y-3.5">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3.5 text-[1.0625rem] leading-[1.75] text-soft-gray">
              <span
                aria-hidden
                className={`mt-[0.7em] h-1.5 w-1.5 shrink-0 rounded-full ${tone.dot}`}
              />
              <span>
                <Inline text={item} />
              </span>
            </li>
          ))}
        </ul>
      );
    }

    case "quote":
      return (
        <figure className="my-11 lg:-mx-10">
          <blockquote className="relative pl-6 sm:pl-8">
            <span
              aria-hidden
              className="absolute left-0 top-1 h-[calc(100%-0.5rem)] w-px bg-gradient-to-b from-cyan-300/70 via-royal-400/40 to-transparent"
            />
            <p className="font-display text-[1.4rem] leading-[1.45] text-balance text-soft-white sm:text-[1.7rem]">
              {block.text}
            </p>
          </blockquote>
        </figure>
      );

    case "callout": {
      const tone = TONE[block.tone];
      return (
        <aside
          className={`my-10 rounded-2xl border ${tone.border} ${tone.tint} p-6 sm:p-7`}
        >
          <p
            className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${tone.label}`}
          >
            {block.title}
          </p>
          <p className="mt-3 text-[1.0125rem] leading-[1.75] text-soft-gray">
            <Inline text={block.text} />
          </p>
        </aside>
      );
    }

    case "flow":
      return (
        <figure className="my-10">
          <div
            className={
              block.layout === "row"
                ? "flex flex-wrap items-center gap-x-3 gap-y-3"
                : "flex flex-col gap-2.5"
            }
          >
            {block.steps.map((step, i) => (
              <Fragment key={i}>
                {i > 0 && block.layout === "row" && (
                  <ArrowRight aria-hidden className="h-3.5 w-3.5 shrink-0 text-cyan-300/60" />
                )}
                {i > 0 && block.layout !== "row" && (
                  <span
                    aria-hidden
                    className="ml-[1.35rem] h-4 w-px bg-gradient-to-b from-cyan-300/40 to-cyan-300/10"
                  />
                )}
                <div
                  className={
                    block.layout === "row"
                      ? "rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-soft-white"
                      : "flex items-center gap-3.5 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3"
                  }
                >
                  {block.layout !== "row" && (
                    <span className="font-mono text-[11px] tabular-nums text-cyan-300/70">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  )}
                  <span className={block.layout === "row" ? "" : "text-[0.95rem] text-soft-white"}>
                    {step}
                  </span>
                </div>
              </Fragment>
            ))}
          </div>
          {block.caption && (
            <figcaption className="mt-4 text-[0.8125rem] leading-relaxed text-soft-mute">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );

    case "compare":
      return (
        <figure className="my-11 lg:-mx-10">
          <div className="grid gap-4 sm:grid-cols-2">
            {block.columns.map((column, i) => {
              const tone = TONE[column.tone ?? "cyan"];
              return (
                <div
                  key={i}
                  className={`rounded-2xl border ${tone.border} ${tone.tint} p-6`}
                >
                  <p
                    className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${tone.label}`}
                  >
                    {column.label}
                  </p>
                  <p className="mt-2.5 font-display text-lg text-soft-white">
                    {column.title}
                  </p>
                  <ul className="mt-4 space-y-2.5">
                    {column.points.map((point, j) => (
                      <li
                        key={j}
                        className="flex gap-2.5 text-[0.9375rem] leading-relaxed text-soft-gray"
                      >
                        <span
                          aria-hidden
                          className={`mt-[0.65em] h-1 w-1 shrink-0 rounded-full ${tone.dot}`}
                        />
                        <span>
                          <Inline text={point} />
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          {block.caption && (
            <figcaption className="mt-4 text-[0.8125rem] leading-relaxed text-soft-mute">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );

    case "note":
      return (
        <p className="mt-7 border-l border-soft-mute/25 pl-5 text-[0.9375rem] leading-[1.7] text-soft-mute">
          <Inline text={block.text} />
        </p>
      );

    default:
      return null;
  }
}

export function InsightProse({ blocks }: { blocks: InsightBlock[] }) {
  return (
    <>
      {blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </>
  );
}
