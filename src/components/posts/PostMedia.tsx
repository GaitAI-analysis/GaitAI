/* eslint-disable @next/next/no-img-element */

import {
  ArrowUpRight,
  Download,
  ExternalLink,
  FileCode2,
  FileSpreadsheet,
  FileText,
  Presentation,
} from "lucide-react";
import type { Post } from "@/lib/posts";
import {
  documentTypeLabel,
  formatFileSize,
  isSafeMediaUrl,
  type PostAttachment,
} from "@/lib/media";
import { assetPath } from "@/lib/paths";

export function PostCoverImage({ post }: { post: Post }) {
  if (!post.coverImageUrl || !isSafeMediaUrl(post.coverImageUrl)) return null;
  const src = assetPath(post.coverImageUrl);
  return (
    <figure className="container-wide relative z-10 -mt-5 mb-10 sm:-mt-9 sm:mb-14">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] shadow-[0_24px_80px_rgba(0,0,0,0.24)] sm:rounded-3xl">
        <img
          src={src}
          alt={post.coverImageAlt || ""}
          width={post.coverImageWidth}
          height={post.coverImageHeight}
          className="mx-auto h-auto max-h-[680px] w-full object-cover"
        />
      </div>
    </figure>
  );
}

export function PostResources({ post }: { post: Post }) {
  const documents = documentAttachments(post);
  const showExternal = Boolean(post.externalUrl && isSafeMediaUrl(post.externalUrl));
  if (documents.length === 0 && !showExternal) return null;

  return (
    <section className="mt-14 border-t border-white/8 pt-10 sm:mt-16 sm:pt-12" aria-labelledby="post-resources-heading">
      <div className="mb-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">Resources &amp; attachments</p>
        <h2 id="post-resources-heading" className="mt-2 font-display text-2xl text-soft-white">Continue with the source material</h2>
      </div>
      <div className="grid gap-3">
        {documents.map((attachment) => (
          <ResourceCard key={attachment.id} attachment={attachment} />
        ))}
        {showExternal && post.externalUrl && (
          <a
            href={post.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group grid min-w-0 gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition hover:border-violet-300/30 hover:bg-violet-300/[0.035] sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-violet-400/[0.08] text-violet-200 ring-1 ring-violet-300/20"><ExternalLink className="h-4 w-4" /></span>
            <span className="min-w-0">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200">External reference</span>
              <span className="mt-1 block truncate text-sm text-soft-white">{post.externalUrl}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-200">Open <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span>
          </a>
        )}
      </div>
    </section>
  );
}

function ResourceCard({ attachment }: { attachment: PostAttachment }) {
  if (!isSafeMediaUrl(attachment.url)) return null;
  const href = assetPath(attachment.url);
  const label = documentTypeLabel(attachment);
  return (
    <article className="grid min-w-0 gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition hover:border-cyan-300/25 hover:bg-cyan-300/[0.025] sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-cyan-300/[0.07] text-cyan-200 ring-1 ring-cyan-300/20">
        <ResourceIcon label={label} />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-200">{label}</p>
        <h3 className="mt-1 truncate text-sm font-medium text-soft-white" title={attachment.name}>{attachment.name}</h3>
        <p className="mt-1 text-xs leading-relaxed text-soft-mute">
          {attachment.description || resourceDescription(label)}
          {attachment.size > 0 ? ` · ${formatFileSize(attachment.size)}` : ""}
        </p>
      </div>
      <div className="flex flex-wrap gap-2 sm:justify-end">
        <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-2 text-xs text-soft-gray transition hover:border-cyan-300/35 hover:text-cyan-200">
          View file <ArrowUpRight className="h-3 w-3" />
        </a>
        <a href={href} download={attachment.originalName || attachment.name} className="inline-flex items-center gap-1.5 rounded-full bg-cyan-300/[0.08] px-3 py-2 text-xs text-cyan-200 ring-1 ring-cyan-300/20 transition hover:bg-cyan-300/[0.13]">
          Download <Download className="h-3 w-3" />
        </a>
      </div>
    </article>
  );
}

function documentAttachments(post: Post): PostAttachment[] {
  const documents = (post.attachments ?? []).filter((attachment) => attachment.type === "document");
  if (!post.attachmentUrl || documents.some((attachment) => attachment.url === post.attachmentUrl)) return documents;
  return [
    ...documents,
    {
      id: `legacy-${post.id}`,
      name: post.attachmentName || "Attached document",
      originalName: post.attachmentName || "Attached document",
      url: post.attachmentUrl,
      mimeType: "application/octet-stream",
      type: "document",
      size: 0,
      description: "Legacy post attachment",
    },
  ];
}

function ResourceIcon({ label }: { label: string }) {
  if (label === "MD" || label === "TXT" || label === "CSV") return <FileCode2 className="h-4 w-4" />;
  if (label === "XLS" || label === "XLSX") return <FileSpreadsheet className="h-4 w-4" />;
  if (label === "PPT" || label === "PPTX") return <Presentation className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
}

function resourceDescription(label: string): string {
  if (label === "PDF") return "PDF document";
  if (label === "MD") return "Markdown source";
  if (label === "TXT") return "Text document";
  if (label === "CSV") return "CSV dataset";
  if (label === "DOC" || label === "DOCX") return "Word document";
  if (label === "PPT" || label === "PPTX") return "Presentation";
  if (label === "XLS" || label === "XLSX") return "Spreadsheet";
  return "Attached document";
}
