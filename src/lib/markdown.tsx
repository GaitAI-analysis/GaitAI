/* eslint-disable @next/next/no-img-element */

import { Fragment, type ReactNode } from "react";
import { isSafeMediaUrl, resolveVideoEmbed } from "@/lib/media";
import { assetPath } from "@/lib/paths";

const INLINE_TOKEN = /(`[^`]+`|\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*)/g;
const IMAGE_LINE = /^!\[([^\]]*)\]\((\S+?)(?:\s+["']([^"']*)["'])?\)$/;
const VIDEO_LINE = /^@\[video\]\((\S+?)(?:\s+["']([^"']*)["'])?\)$/i;

function safeUrl(value: string): string | null {
  const decoded = value.replace(/&amp;/g, "&").trim();
  return isSafeMediaUrl(decoded) ? assetPath(decoded) : null;
}

function safeLinkUrl(value: string): string | null {
  const decoded = value.replace(/&amp;/g, "&").trim();
  if (decoded.startsWith("#")) return decoded;
  if (/^(mailto|tel):/i.test(decoded)) return decoded;
  return safeUrl(decoded);
}

function Inline({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  let cursor = 0;

  for (const match of text.matchAll(INLINE_TOKEN)) {
    const token = match[0];
    const index = match.index ?? 0;
    if (index > cursor) nodes.push(text.slice(cursor, index));

    if (token.startsWith("`")) {
      nodes.push(
        <code key={index} className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[0.85em] text-cyan-200">
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("[")) {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      const href = link ? safeLinkUrl(link[2]) : null;
      const external = Boolean(href && /^https?:/i.test(href));
      nodes.push(
        href ? (
          <a key={index} href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} className="text-cyan-300 underline decoration-cyan-300/40 underline-offset-4 transition hover:decoration-cyan-300">
            {link?.[1]}
          </a>
        ) : (
          token
        ),
      );
    } else if (token.startsWith("**")) {
      nodes.push(<strong key={index} className="font-semibold text-soft-white">{token.slice(2, -2)}</strong>);
    } else {
      nodes.push(<em key={index}>{token.slice(1, -1)}</em>);
    }
    cursor = index + token.length;
  }

  if (cursor < text.length) nodes.push(text.slice(cursor));
  return <>{nodes}</>;
}

function splitTableRow(line: string): string[] {
  return line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
}

function isTableDivider(line: string): boolean {
  const cells = splitTableRow(line);
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function renderFigure(line: string): ReactNode | null {
  const match = line.trim().match(IMAGE_LINE);
  if (!match) return null;
  const src = safeUrl(match[2]);
  if (!src) return null;
  const alt = match[1].trim();
  const caption = match[3]?.trim();
  return (
    <figure className="my-9 sm:my-11">
      <a href={src} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70">
        <img src={src} alt={alt} loading="lazy" className="mx-auto h-auto max-h-[720px] max-w-full object-contain" />
      </a>
      {caption && <figcaption className="mx-auto mt-3 max-w-2xl text-center text-xs leading-relaxed text-soft-mute sm:text-sm">{caption}</figcaption>}
    </figure>
  );
}

function renderVideo(line: string): ReactNode | null {
  const match = line.trim().match(VIDEO_LINE);
  if (!match) return null;
  const url = safeUrl(match[1]);
  if (!url) return null;
  const caption = match[2]?.trim();
  const embed = resolveVideoEmbed(url);
  return (
    <figure className="my-9 sm:my-11">
      <div className="aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_18px_55px_rgba(0,0,0,0.22)]">
        {embed ? (
          <iframe
            src={embed.embedUrl}
            title={caption || `${embed.provider} video`}
            loading="lazy"
            allow="accelerometer; encrypted-media; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="h-full w-full"
          />
        ) : (
          <video src={url} controls preload="metadata" playsInline className="h-full w-full bg-black object-contain">
            Your browser does not support embedded video.
          </video>
        )}
      </div>
      {caption && <figcaption className="mx-auto mt-3 max-w-2xl text-center text-xs leading-relaxed text-soft-mute sm:text-sm">{caption}</figcaption>}
    </figure>
  );
}

function isSpecialLine(lines: string[], index: number): boolean {
  const line = lines[index] ?? "";
  return (
    line.trim() === "" ||
    line.trim() === "---" ||
    line.startsWith("#") ||
    line.startsWith("> ") ||
    line.startsWith("```") ||
    /^\s*-\s+/.test(line) ||
    /^\s*\d+\.\s+/.test(line) ||
    IMAGE_LINE.test(line.trim()) ||
    VIDEO_LINE.test(line.trim()) ||
    (line.includes("|") && isTableDivider(lines[index + 1] ?? ""))
  );
}

/** A deliberately small, HTML-free Markdown renderer for Insights posts. */
export function renderMarkdown(body: string): ReactNode {
  if (!body) return null;
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const nodes: ReactNode[] = [];
  let index = 0;
  let key = 0;
  const push = (node: ReactNode) => nodes.push(<Fragment key={key++}>{node}</Fragment>);

  while (index < lines.length) {
    const line = lines[index];
    const figure = renderFigure(line);
    if (figure) {
      push(figure);
      index += 1;
      continue;
    }
    const video = renderVideo(line);
    if (video) {
      push(video);
      index += 1;
      continue;
    }
    if (line.startsWith("```")) {
      const language = line.slice(3).trim();
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith("```")) code.push(lines[index++]);
      if (index < lines.length) index += 1;
      push(
        <div className="my-7 overflow-hidden rounded-2xl border border-white/10 bg-obsidian-300">
          {language && <div className="border-b border-white/8 px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-soft-mute">{language}</div>}
          <pre className="overflow-x-auto p-5 text-[13px] leading-relaxed text-soft-gray"><code className="font-mono whitespace-pre">{code.join("\n")}</code></pre>
        </div>,
      );
      continue;
    }
    if (line.trim() === "---") {
      push(<hr className="divider my-10 border-0" />);
      index += 1;
      continue;
    }
    if (line.startsWith("### ")) {
      push(<h3 className="mb-3 mt-9 font-display text-xl text-soft-white sm:text-2xl"><Inline text={line.slice(4)} /></h3>);
      index += 1;
      continue;
    }
    if (line.startsWith("## ")) {
      push(<h2 className="mb-4 mt-12 font-display text-2xl text-soft-white sm:text-3xl"><Inline text={line.slice(3)} /></h2>);
      index += 1;
      continue;
    }
    if (line.startsWith("# ")) {
      push(<h1 className="mb-5 mt-12 font-display text-3xl text-soft-white sm:text-4xl"><Inline text={line.slice(2)} /></h1>);
      index += 1;
      continue;
    }
    if (line.startsWith("> ")) {
      const quote: string[] = [];
      while (index < lines.length && lines[index].startsWith("> ")) quote.push(lines[index++].slice(2));
      push(<blockquote className="my-8 rounded-r-xl border-l-2 border-cyan-300/45 bg-white/[0.02] py-4 pl-5 pr-4 italic text-soft-gray"><Inline text={quote.join(" ")} /></blockquote>);
      continue;
    }
    if (/^\s*-\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*-\s+/.test(lines[index])) items.push(lines[index++].replace(/^\s*-\s+/, ""));
      push(<ul className="my-6 space-y-2.5 pl-5">{items.map((item, itemIndex) => <li key={itemIndex} className="relative pl-1 text-soft-gray before:absolute before:-left-4 before:top-2.5 before:h-1.5 before:w-1.5 before:rounded-full before:bg-cyan-300"><Inline text={item} /></li>)}</ul>);
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) items.push(lines[index++].replace(/^\s*\d+\.\s+/, ""));
      push(<ol className="my-6 list-decimal space-y-2.5 pl-6 marker:text-cyan-300">{items.map((item, itemIndex) => <li key={itemIndex} className="pl-1 text-soft-gray"><Inline text={item} /></li>)}</ol>);
      continue;
    }
    if (line.includes("|") && isTableDivider(lines[index + 1] ?? "")) {
      const headers = splitTableRow(line);
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length && lines[index].includes("|") && lines[index].trim()) rows.push(splitTableRow(lines[index++]));
      push(
        <div className="my-8 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[520px] border-collapse text-left text-sm">
            <thead className="bg-white/[0.04] text-soft-white"><tr>{headers.map((header, cell) => <th key={cell} className="border-b border-white/10 px-4 py-3 font-semibold"><Inline text={header} /></th>)}</tr></thead>
            <tbody>{rows.map((row, rowIndex) => <tr key={rowIndex} className="border-b border-white/[0.06] last:border-0">{headers.map((_, cell) => <td key={cell} className="px-4 py-3 align-top text-soft-gray"><Inline text={row[cell] ?? ""} /></td>)}</tr>)}</tbody>
          </table>
        </div>,
      );
      continue;
    }
    if (!line.trim()) {
      index += 1;
      continue;
    }

    const paragraph: string[] = [];
    while (index < lines.length && !isSpecialLine(lines, index)) paragraph.push(lines[index++]);
    if (paragraph.length) {
      push(<p className="my-5 text-[15px] leading-7 text-soft-gray sm:text-base sm:leading-8"><Inline text={paragraph.join(" ")} /></p>);
    } else {
      index += 1;
    }
  }

  return <>{nodes}</>;
}
