"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  ExternalLink,
  Tag,
} from "lucide-react";
import {
  FOUNDER_NAME,
  publisherAccent,
  type Publication,
} from "@/data/publications";
import { assetPath } from "@/lib/paths";

interface ExplorerProps {
  papers: Publication[];
}

export function PublicationsExplorer({ papers }: ExplorerProps) {
  const years = useMemo(
    () =>
      Array.from(new Set(papers.map((p) => p.year))).sort((a, b) => b - a),
    [papers]
  );
  const publishers = useMemo(
    () => Array.from(new Set(papers.map((p) => p.publisher))).sort(),
    [papers]
  );

  const [year, setYear] = useState<number | "all">("all");
  const [pub, setPub] = useState<string>("all");

  const filtered = useMemo(() => {
    return papers.filter(
      (p) => (year === "all" || p.year === year) && (pub === "all" || p.publisher === pub)
    );
  }, [papers, year, pub]);

  return (
    <div>
      {/* Filters */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-soft-mute">
            Year
          </span>
          <Pill active={year === "all"} onClick={() => setYear("all")}>
            All · {papers.length}
          </Pill>
          {years.map((y) => {
            const count = papers.filter((p) => p.year === y).length;
            return (
              <Pill key={y} active={year === y} onClick={() => setYear(y)}>
                {y} · {count}
              </Pill>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-soft-mute">
            Publisher
          </span>
          <Pill active={pub === "all"} onClick={() => setPub("all")}>
            All
          </Pill>
          {publishers.map((p) => (
            <Pill key={p} active={pub === p} onClick={() => setPub(p)}>
              {p}
            </Pill>
          ))}
        </div>
      </div>

      {/* Grid */}
      <motion.div layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((p, i) => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, scale: 0.96, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{
                duration: 0.55,
                delay: (i % 6) * 0.05,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <PaperCard pub={p} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {filtered.length === 0 && (
        <div className="mt-12 rounded-2xl border border-white/8 bg-white/[0.02] p-10 text-center">
          <div className="text-sm text-soft-mute">
            No publications match the selected filters.
          </div>
        </div>
      )}
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative rounded-full border px-3.5 py-1.5 text-[11.5px] font-medium transition-all ${
        active
          ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-200 shadow-[0_0_24px_-6px_rgba(79,209,255,0.5)]"
          : "border-white/8 bg-white/[0.02] text-soft-mute hover:border-white/20 hover:text-soft-white"
      }`}
    >
      {children}
    </button>
  );
}

function PaperCard({ pub }: { pub: Publication }) {
  const a = publisherAccent[pub.publisher];
  const founderIndex = pub.authors.findIndex(
    (x) => x.includes(FOUNDER_NAME)
  );

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent transition-all hover:border-white/15 hover:bg-white/[0.04]`}
    >
      {/* Cover */}
      <div className="relative aspect-[3/4] w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-obsidian-200/95" />
        <Image
          src={assetPath(pub.cover)}
          alt={`${pub.title} — ${pub.venue}`}
          fill
          sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
          className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
        />
        {/* Vignette */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-obsidian-200/85 via-transparent to-transparent" />

        {/* Top-left publisher pill */}
        <div
          className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] backdrop-blur-md ${a.pill}`}
          style={{ background: "rgba(7,11,20,0.65)" }}
        >
          <BookOpen className="h-3 w-3" />
          {pub.publisher}
        </div>
        {/* Top-right year */}
        <div
          className="absolute right-3 top-3 rounded-full border border-white/15 bg-obsidian/70 px-2.5 py-1 text-[10px] font-mono tracking-[0.16em] text-soft-white backdrop-blur-md"
        >
          {pub.year}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <div className={`text-[10.5px] font-semibold uppercase tracking-[0.18em] ${a.text}`}>
          {pub.venue}
        </div>
        <h3 className="mt-2 font-display text-base font-semibold leading-snug text-soft-white">
          {pub.title}
        </h3>

        {/* Authors */}
        <div className="mt-3 space-y-0.5 text-[12px] leading-relaxed">
          <div>
            <span className="font-semibold text-soft-white">
              Dr. {pub.authors[founderIndex >= 0 ? founderIndex : 0]}
            </span>
            <span className="text-soft-mute"> · Founder &amp; CEO</span>
          </div>
          {pub.authors.length > 1 && (
            <div className="text-[11.5px] text-soft-mute">
              with{" "}
              {pub.authors
                .filter((_, i) => i !== (founderIndex >= 0 ? founderIndex : 0))
                .join(", ")}
            </div>
          )}
        </div>

        {/* Date */}
        {pub.date && (
          <div className="mt-3 text-[10.5px] uppercase tracking-[0.16em] text-soft-mute">
            {pub.date}
          </div>
        )}

        {/* Keywords */}
        {pub.keywords && pub.keywords.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {pub.keywords.slice(0, 4).map((k) => (
              <span
                key={k}
                className="inline-flex items-center gap-1 rounded-full border border-white/8 bg-white/[0.025] px-2 py-0.5 text-[10px] font-medium text-soft-gray"
              >
                <Tag className="h-2.5 w-2.5 opacity-60" />
                {k}
              </span>
            ))}
            {pub.keywords.length > 4 && (
              <span className="text-[10px] text-soft-mute">
                +{pub.keywords.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* DOI / publisher tag */}
        <div className="mt-5 border-t border-white/8 pt-3 text-[10.5px] font-mono text-soft-mute">
          {pub.doi ? `DOI · ${pub.doi}` : pub.publisher}
        </div>

        {/* Verified external research record. Local PDFs are not bundled. */}
        <div className="mt-3">
          <Link
            href={pub.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex w-full items-center justify-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10.5px] font-semibold transition-all hover:border-white/30 ${a.pill}`}
          >
            <ExternalLink className="h-3 w-3" />
            Open paper
          </Link>
        </div>
      </div>
    </article>
  );
}
