"use client";

/**
 * THE ANSWER, RENDERED SAFELY
 * =============================================================================
 * A deliberately small markdown subset — paragraphs, bullets, numbered lists,
 * bold, inline code and internal links. Nothing else is recognised, and nothing
 * is ever passed to `dangerouslySetInnerHTML`: every node below is a real React
 * element, so a model that emits `<img onerror=…>` produces the literal text
 * `<img onerror=…>` and not an element.
 *
 * LINKS ARE VALIDATED TWICE. The server strips any href that is not a real
 * GaitAI route before the answer is stored; this does it again at render time,
 * because the rule that matters is the one applied closest to the DOM. A link
 * that fails degrades to its own label rather than disappearing, so the reader
 * still gets the sentence.
 *
 * The site's own `renderMarkdown` is not reused here on purpose: it supports
 * images and video embeds, which a model's output must never be able to reach.
 */

import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./assistant.module.css";

/** Route shapes the assistant is allowed to link to. Mirrors the server's
 *  allowlist, expressed as prefixes because the client has no corpus. */
const ROUTE_PATTERN =
  /^\/(?:$|#contact$|(?:mobilitycare|securevision|products|use-cases|publications|insights|research|gaitscape|movement-lab|trust|investors|legal)(?:\/[a-z0-9-]+)*\/?(?:[?#][\w=&#-]*)?$)/i;

function safeHref(href: string): string | null {
  const value = href.trim();
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return ROUTE_PATTERN.test(value) ? value : null;
}

/* The link target allows one level of nested parentheses, so a target that
   itself contains a ")" is consumed whole rather than ending early and leaving
   the remainder as stray punctuation once the href is rejected. */
const INLINE =
  /(\*\*[^*\n]+?\*\*|`[^`\n]+`|\[[^\]\n]+\]\((?:[^\s()]|\([^\s()]*\))+\))/g;

/**
 * Bold and links nest, and the model reaches for both together — a product
 * recommendation is naturally written `**[WalkScan](/mobilitycare/walkscan/)**`.
 * Matching bold first and then rendering its contents as plain text printed the
 * raw markdown source inside a bold span. `Inline` therefore recurses into a
 * bold token instead, which is also what makes `**bold with `code`**` work.
 */
function Inline({ text }: { text: string }): ReactNode {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let key = 0;

  for (const match of text.matchAll(INLINE)) {
    const token = match[0];
    const index = match.index ?? 0;
    if (index > cursor) nodes.push(text.slice(cursor, index));

    if (token.startsWith("**")) {
      nodes.push(
        <strong key={key++}>
          <Inline text={token.slice(2, -2)} />
        </strong>,
      );
    } else if (token.startsWith("`")) {
      nodes.push(
        <code key={key++} className={styles.code}>
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      const parsed = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      const href = parsed ? safeHref(parsed[2]) : null;
      nodes.push(
        href ? (
          <Link key={key++} href={href} className={styles.inlineLink}>
            {parsed?.[1]}
          </Link>
        ) : (
          (parsed?.[1] ?? token)
        ),
      );
    }
    cursor = index + token.length;
  }

  if (cursor < text.length) nodes.push(text.slice(cursor));
  return <>{nodes}</>;
}

/** A heading the model emitted (`## Something`) is rendered as a lead line, not
 *  as an <h2>: the panel already sits inside the page's heading outline and a
 *  real heading there would corrupt it for a screen reader. */
export function AnswerText({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  const lines = text.split("\n");
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let key = 0;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push(
      <p key={key++}>
        <Inline text={paragraph.join(" ")} />
      </p>,
    );
    paragraph = [];
  };

  const flushList = () => {
    if (!list) return;
    const items = list.items.map((item, index) => (
      <li key={index}>
        <Inline text={item} />
      </li>
    ));
    blocks.push(
      list.ordered ? (
        <ol key={key++} className={styles.answerList}>
          {items}
        </ol>
      ) : (
        <ul key={key++} className={styles.answerList}>
          {items}
        </ul>
      ),
    );
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);

    if (bullet || numbered) {
      flushParagraph();
      const ordered = Boolean(numbered);
      if (!list || list.ordered !== ordered) {
        flushList();
        list = { ordered, items: [] };
      }
      list.items.push((bullet?.[1] ?? numbered?.[1] ?? "").trim());
      continue;
    }

    const heading = line.match(/^#{1,6}\s+(.*)$/);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push(
        <p key={key++} className={styles.answerLead}>
          <Inline text={heading[1]} />
        </p>,
      );
      continue;
    }

    flushList();
    paragraph.push(line.trim());
  }

  flushParagraph();
  flushList();

  return <div className={styles.answerBody}>{blocks}</div>;
}
