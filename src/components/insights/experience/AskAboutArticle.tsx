"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ASK_EVENT, type AskEventDetail } from "@/components/assistant/config";
import { trackInsightEvent } from "@/lib/insight-events";
import styles from "./experience.module.css";

/**
 * "Ask GaitAI about this article" — opens the site assistant with a question
 * built ONLY from public context: the article title and the section heading
 * nearest the top of the viewport when the button is pressed. Nothing the
 * reader typed, selected or uploaded is included.
 */
export function AskAboutArticle({
  slug,
  title,
  sections,
}: {
  slug: string;
  title: string;
  sections: Array<{ id: string; title: string }>;
}) {
  const ask = () => {
    let current: string | undefined;
    const line = Math.max(140, window.innerHeight * 0.35);
    for (const section of sections) {
      const element = document.getElementById(section.id);
      if (element && element.getBoundingClientRect().top <= line) current = section.title;
    }
    const question = current
      ? `In the GaitAI Insights article "${title}", what does the section "${current}" mean in practice?`
      : `What are the key ideas in the GaitAI Insights article "${title}"?`;
    window.dispatchEvent(new CustomEvent<AskEventDetail>(ASK_EVENT, { detail: { question } }));
    trackInsightEvent("ask_gaitai_from_article", { article: slug, section: current ? "current" : "none" });
  };

  return (
    <button type="button" onClick={ask} className={`${styles.root} ${styles.share} mt-3`}>
      Ask GaitAI about this article →
    </button>
  );
}

export function EvidenceLinkTracker({
  href,
  article,
  publication,
  className,
  children,
}: {
  href: string;
  article: string;
  publication: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => trackInsightEvent("evidence_link_clicked", { article, publication })}
    >
      {children}
    </Link>
  );
}
