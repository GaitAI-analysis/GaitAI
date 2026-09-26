import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { InsightBlock } from "@/data/insights";
import type { InsightTerm } from "@/data/insight-terms";
import { GaitCycleDiagram, StateStrip, TrendTrack } from "./diagrams";
import { InspectableTerm } from "./experience/InspectableTerm";
import styles from "./journal.module.css";

/* ─────────────────────────────────────────────────────────────────────────
   Inline text — a deliberately tiny subset: **bold** and [label](/href).
   Article copy is authored in `data/insights.ts`, so the surface stays small
   on purpose; anything richer belongs in a block type rather than in prose.

   INSPECTABLE TERMS are not authored into the copy. A short list of terms
   (data/insight-terms.ts) is handed in per section by the article's
   experience record, and the FIRST occurrence of each inside this run of
   blocks becomes an InspectableTerm. The text itself is unchanged — the
   term is a button around the same words — so search engines and readers
   without JavaScript see the prose exactly as written.
   ───────────────────────────────────────────────────────────────────────── */

const INLINE_TOKEN = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;

interface TermContext {
  terms: InsightTerm[];
  /** Ids already wrapped in this run — mutated as blocks render. */
  used: Set<string>;
  articleSlug?: string;
}

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Wrap the first matching term phrase in a plain-text run. */
function withTerms(text: string, keyBase: number, ctx?: TermContext): ReactNode {
  if (!ctx || ctx.terms.length === 0) return text;
  for (const term of ctx.terms) {
    if (ctx.used.has(term.id)) continue;
    const phrases = [term.term, ...(term.aliases ?? [])];
    for (const phrase of phrases) {
      const pattern = new RegExp(`(^|[^\\w-])(${escapeRegExp(phrase)})(?![\\w-])`, "i");
      const match = pattern.exec(text);
      if (!match || match.index === undefined) continue;
      const start = match.index + match[1].length;
      const end = start + match[2].length;
      ctx.used.add(term.id);
      return (
        <Fragment key={`t${keyBase}`}>
          {text.slice(0, start)}
          <InspectableTerm term={term} articleSlug={ctx.articleSlug}>
            {text.slice(start, end)}
          </InspectableTerm>
          {withTerms(text.slice(end), keyBase + 1, ctx)}
        </Fragment>
      );
    }
  }
  return text;
}

export function Inline({ text, ctx }: { text: string; ctx?: TermContext }): ReactNode {
  const nodes: ReactNode[] = [];
  let cursor = 0;

  for (const match of text.matchAll(INLINE_TOKEN)) {
    const token = match[0];
    const index = match.index ?? 0;
    if (index > cursor) nodes.push(withTerms(text.slice(cursor, index), index, ctx));

    if (token.startsWith("**")) {
      nodes.push(
        <strong key={index} className="font-semibold text-soft-white">
          {withTerms(token.slice(2, -2), index + 1, ctx)}
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

  if (cursor < text.length) nodes.push(withTerms(text.slice(cursor), cursor, ctx));
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

function Block({ block, ctx }: { block: InsightBlock; ctx?: TermContext }) {
  switch (block.type) {
    case "lead":
      return (
        <p className="insight-lead text-[1.2rem] leading-[1.65] text-soft-white sm:text-[1.35rem]">
          <Inline text={block.text} ctx={ctx} />
        </p>
      );

    case "p":
      return (
        <p className="mt-6 text-[1.0625rem] leading-[1.8] text-soft-gray">
          <Inline text={block.text} ctx={ctx} />
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
                <Inline text={item} ctx={ctx} />
              </span>
            </li>
          ))}
        </ul>
      );
    }

    case "quote":
      // A pull quote is a pause in the reading, so it gets space and scale
      // instead of a box: centred, wider than the column, no quote marks.
      return (
        <figure className={styles.pull}>
          <blockquote>
            <p className={styles.pullText}>{block.text}</p>
          </blockquote>
          <span aria-hidden className={styles.pullRule} />
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
            <Inline text={block.text} ctx={ctx} />
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
                    <span aria-hidden="true" className="font-mono text-[11px] tabular-nums text-cyan-300/70">
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

    case "matters":
      return (
        <aside className={styles.matters}>
          <p className={styles.mattersLabel}>Why this matters</p>
          <p className={styles.mattersText}>
            <Inline text={block.text} ctx={ctx} />
          </p>
        </aside>
      );

    case "gaitcycle":
      return <GaitCycleDiagram caption={block.caption} />;

    case "states":
      return <StateStrip items={block.items} caption={block.caption} />;

    case "trend":
      return <TrendTrack points={block.points} caption={block.caption} />;

    case "note":
      return (
        <p className="mt-7 border-l border-soft-mute/25 pl-5 text-[0.9375rem] leading-[1.7] text-soft-mute">
          <Inline text={block.text} ctx={ctx} />
        </p>
      );

    default:
      return null;
  }
}

export function InsightProse({
  blocks,
  terms,
  articleSlug,
}: {
  blocks: InsightBlock[];
  /** Terms to make inspectable within this run of blocks (first occurrence). */
  terms?: InsightTerm[];
  articleSlug?: string;
}) {
  /* One context per render of this run, so "first occurrence" is scoped to
     the section the page handed the terms to. */
  const ctx: TermContext | undefined =
    terms && terms.length > 0 ? { terms, used: new Set(), articleSlug } : undefined;
  return (
    <>
      {blocks.map((block, i) => (
        <Block key={i} block={block} ctx={ctx} />
      ))}
    </>
  );
}
