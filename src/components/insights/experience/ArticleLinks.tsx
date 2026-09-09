import Link from "next/link";
import { allPublications } from "@/data/publications";
import type { ArticleExperience } from "@/data/insight-experiences";
import { AskAboutArticle } from "./AskAboutArticle";
import { EvidenceLinkTracker } from "./AskAboutArticle";

/**
 * The doors an article opens onto the rest of the site — the evidence behind
 * it, the concepts in GaitScape, the Movement Intelligence Lab, and Ask GaitAI.
 *
 * Listed once, at the end, in one quiet panel: not sprinkled through the
 * prose as calls to action. Every link is to something that exists, and the
 * evidence line is explicit that a research connection is a connection —
 * never product validation.
 */
export function ArticleLinks({
  experience,
  articleTitle,
  sections,
}: {
  experience: ArticleExperience;
  articleTitle: string;
  sections: Array<{ id: string; title: string }>;
}) {
  const { links, slug } = experience;
  const evidence = (links.evidence ?? [])
    .map((entry) => ({ entry, publication: allPublications.find((p) => p.id === entry.publication) }))
    .filter((item) => item.publication);

  return (
    <aside aria-label="Explore further" className="mt-14 grid gap-8 border-t border-white/[0.07] pt-10 md:grid-cols-2">
      {evidence.length > 0 && (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-300">Explore the evidence →</p>
          <p className="mt-2 text-[0.8125rem] leading-relaxed text-soft-mute">
            Peer-reviewed work this essay draws on. A research connection is context for the argument — it is
            not validation of any product.
          </p>
          <ul className="mt-4 grid gap-3">
            {evidence.map(({ entry, publication }) => (
              <li key={entry.publication}>
                <EvidenceLinkTracker
                  href={`/publications/${publication!.id}/`}
                  article={slug}
                  publication={publication!.id}
                  className="group block rounded-xl border border-white/10 p-4 transition-colors hover:border-cyan-300/50 focus-visible:border-cyan-300/50 focus-visible:outline-none"
                >
                  <span className="block font-mono text-[9px] uppercase tracking-[0.18em] text-soft-mute">
                    {publication!.venue} · {publication!.year}
                  </span>
                  <span className="mt-1.5 block text-[0.9375rem] font-medium leading-snug text-soft-white group-hover:text-cyan-300">
                    {publication!.title}
                  </span>
                  <span className="mt-1.5 block text-[0.8125rem] leading-relaxed text-soft-gray">{entry.why}</span>
                </EvidenceLinkTracker>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-6">
        {links.gaitscape && links.gaitscape.length > 0 && (
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-300">See this concept in GaitScape</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {links.gaitscape.map((node) => (
                <Link
                  key={node.node}
                  href={`/gaitscape/?focus=${encodeURIComponent(node.node)}`}
                  className="inline-flex min-h-[40px] items-center rounded-full border border-white/10 px-3.5 py-1.5 text-[12px] text-soft-gray transition-colors hover:border-cyan-300/50 hover:text-soft-white"
                >
                  {node.label} <span aria-hidden="true" className="ml-1.5">→</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {links.lab && (
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-300">Movement Intelligence Lab</p>
            <Link
              href="/movement-lab/"
              className="mt-2 block text-[0.9375rem] leading-relaxed text-soft-gray underline decoration-white/15 underline-offset-4 transition-colors hover:text-soft-white hover:decoration-cyan-300"
            >
              {links.lab.label} →
            </Link>
          </div>
        )}

        {links.ask && (
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-300">Ask GaitAI</p>
            <p className="mt-2 text-[0.8125rem] leading-relaxed text-soft-mute">
              Ask about this article. The assistant receives only the article&apos;s public title and the
              section you are in — never anything you have typed or selected.
            </p>
            <AskAboutArticle slug={slug} title={articleTitle} sections={sections} />
          </div>
        )}
      </div>
    </aside>
  );
}
