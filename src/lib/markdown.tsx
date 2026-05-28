import { Fragment } from "react";

/* Tiny markdown renderer — supports the subset we care about for posts:
   ## H2, ### H3
   **bold**, *italic*, `code`, [link](url)
   - bullets, 1. numbered
   > blockquotes
   ```fenced code```
   --- horizontal rule
   Auto-paragraphs on blank lines.
*/

function inlineHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="text-cyan-300 underline decoration-cyan-300/40 underline-offset-4 transition hover:decoration-cyan-300" target="_blank" rel="noopener noreferrer">$1</a>'
    )
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
    .replace(
      /`([^`]+)`/g,
      '<code class="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[0.85em] text-cyan-200">$1</code>'
    );
}

export function renderMarkdown(body: string): React.ReactNode {
  if (!body) return null;

  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const nodes: React.ReactNode[] = [];

  let i = 0;
  let key = 0;
  const push = (n: React.ReactNode) => nodes.push(<Fragment key={key++}>{n}</Fragment>);

  while (i < lines.length) {
    const line = lines[i];

    // fenced code
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        code.push(lines[i]);
        i++;
      }
      i++;
      push(
        <pre className="my-6 overflow-x-auto rounded-2xl border border-white/8 bg-obsidian-300 p-5 text-[13px] leading-relaxed text-soft-gray">
          <code className="font-mono whitespace-pre">
            {code.join("\n")}
          </code>
          {lang && (
            <span className="float-right -mt-2 text-[10px] uppercase tracking-[0.18em] text-soft-mute">
              {lang}
            </span>
          )}
        </pre>
      );
      continue;
    }

    // horizontal rule
    if (line.trim() === "---") {
      push(<hr className="my-10 border-0 divider" />);
      i++;
      continue;
    }

    // headings
    if (line.startsWith("### ")) {
      push(
        <h3 className="mt-10 mb-3 font-display text-xl text-soft-white">
          {line.slice(4)}
        </h3>
      );
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      push(
        <h2 className="mt-12 mb-4 font-display text-2xl text-soft-white sm:text-3xl">
          {line.slice(3)}
        </h2>
      );
      i++;
      continue;
    }
    if (line.startsWith("# ")) {
      push(
        <h1 className="mb-4 font-display text-3xl text-soft-white sm:text-4xl">
          {line.slice(2)}
        </h1>
      );
      i++;
      continue;
    }

    // blockquote
    if (line.startsWith("> ")) {
      const quote: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        quote.push(lines[i].slice(2));
        i++;
      }
      push(
        <blockquote className="my-8 border-l-2 border-cyan-300/40 bg-white/[0.02] py-4 pl-5 pr-4 text-soft-gray">
          <span dangerouslySetInnerHTML={{ __html: inlineHtml(quote.join(" ")) }} />
        </blockquote>
      );
      continue;
    }

    // unordered list
    if (/^\s*-\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*-\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*-\s+/, ""));
        i++;
      }
      push(
        <ul className="my-5 space-y-2 pl-5">
          {items.map((it, k) => (
            <li
              key={k}
              className="relative pl-1 text-soft-gray before:absolute before:-left-4 before:top-2 before:h-1.5 before:w-1.5 before:rounded-full before:bg-cyan-300"
              dangerouslySetInnerHTML={{ __html: inlineHtml(it) }}
            />
          ))}
        </ul>
      );
      continue;
    }

    // ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      push(
        <ol className="my-5 space-y-2 pl-6 list-decimal marker:text-cyan-300">
          {items.map((it, k) => (
            <li
              key={k}
              className="pl-1 text-soft-gray"
              dangerouslySetInnerHTML={{ __html: inlineHtml(it) }}
            />
          ))}
        </ol>
      );
      continue;
    }

    // empty line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // paragraph — collect contiguous non-empty, non-special lines
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].startsWith("##") &&
      !lines[i].startsWith("> ") &&
      !/^\s*-\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !lines[i].startsWith("```") &&
      lines[i].trim() !== "---"
    ) {
      para.push(lines[i]);
      i++;
    }
    if (para.length) {
      push(
        <p
          className="my-5 text-[15px] leading-relaxed text-soft-gray sm:text-base"
          dangerouslySetInnerHTML={{ __html: inlineHtml(para.join(" ")) }}
        />
      );
    }
  }

  return <>{nodes}</>;
}
