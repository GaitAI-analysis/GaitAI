"use client";

/**
 * Content Studio — create, edit and curate every post shown on the public
 * Insights and Publications pages. Saving goes through the panel adapter
 * (local today, Firebase later) — no fetch calls, no server dependency.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  ExternalLink,
  Eye,
  FileText,
  Pencil,
  PenLine,
  Plus,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { CATEGORY_META, type Category, type Post } from "@/lib/posts";
import type { PostAttachment } from "@/lib/media";
import { deletePostMedia } from "@/lib/media-storage";
import { CategoryBadge } from "@/components/posts/CategoryBadge";
import { genId, slugifyTitle } from "@/lib/admin/panel-store";
import { ConfirmDialog, EmptyState, formatDate } from "./ui";
import {
  PostMediaEditor,
  type CoverImageValue,
} from "./PostMediaEditor";

const CATEGORIES = Object.keys(CATEGORY_META) as Category[];

type Mode = { view: "list" } | { view: "editor"; post?: Post };

export function ContentView({
  posts,
  onSave,
  onDelete,
}: {
  posts: Post[];
  onSave: (post: Post) => Promise<boolean>;
  onDelete: (id: string) => void;
}) {
  const [mode, setMode] = useState<Mode>({ view: "list" });
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = posts;
    if (category !== "all") list = list.filter((p) => p.category === category);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((p) =>
        `${p.title} ${p.summary} ${p.tags.join(" ")}`.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  }, [posts, query, category]);

  if (mode.view === "editor") {
    return (
      <PostComposer
        initial={mode.post}
        onCancel={() => setMode({ view: "list" })}
        onSave={onSave}
        onComplete={() => setMode({ view: "list" })}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl text-soft-white sm:text-3xl">
            Content Studio
          </h2>
          <p className="mt-1 text-sm text-soft-mute">
            Everything published to the Insights &amp; Publications pages.
          </p>
        </div>
        <button
          onClick={() => setMode({ view: "editor" })}
          className="btn-primary self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          New post
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {(["all", ...CATEGORIES] as const).map((c) => {
            const active = category === c;
            return (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                  active
                    ? "border-cyan-300/50 bg-cyan-300/[0.08] text-cyan-300"
                    : "border-white/10 bg-white/[0.02] text-soft-mute hover:border-white/20 hover:text-soft-white"
                }`}
              >
                {c === "all" ? "All" : CATEGORY_META[c].label}
              </button>
            );
          })}
        </div>
        <label className="relative inline-flex w-full max-w-xs items-center">
          <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-soft-mute" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts…"
            className="w-full rounded-full border border-white/10 bg-white/[0.02] py-2 pl-9 pr-3 text-sm text-soft-white placeholder:text-soft-mute focus:border-cyan-300/50 focus:outline-none focus:ring-2 focus:ring-cyan-300/15"
          />
        </label>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-5 w-5" />}
          title="No posts match"
          body="Try a different search or category — or create something new."
          action={
            <button
              onClick={() => setMode({ view: "editor" })}
              className="btn-primary text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              New post
            </button>
          }
        />
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-white/8">
          {filtered.map((p) => (
            <li
              key={p.id}
              className="group grid grid-cols-1 gap-3 border-b border-white/5 bg-white/[0.01] p-4 transition-colors last:border-0 hover:bg-white/[0.03] sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6 sm:px-6 sm:py-5"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <CategoryBadge category={p.category} />
                  {p.featured && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-300/[0.08] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-amber-300 ring-1 ring-amber-300/30">
                      <Star className="h-2.5 w-2.5" />
                      Featured
                    </span>
                  )}
                  <span className="text-[11px] text-soft-mute">
                    {formatDate(p.publishedAt)} · {p.author}
                  </span>
                </div>
                <h3 className="mt-2 truncate font-display text-lg text-soft-white">
                  {p.title}
                </h3>
                <p className="mt-1 line-clamp-1 text-sm text-soft-mute">
                  {p.summary}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/publications/${p.slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.02] px-2.5 py-1.5 text-xs text-soft-mute hover:border-white/20 hover:text-soft-white"
                >
                  <ExternalLink className="h-3 w-3" />
                  View
                </Link>
                <button
                  onClick={() => setMode({ view: "editor", post: p })}
                  className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-soft-white hover:border-cyan-300/40 hover:text-cyan-300"
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </button>
                <button
                  onClick={() => setConfirmDelete(p.id)}
                  className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-soft-white hover:border-red-300/40 hover:text-red-300"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Delete this post?"
        body="It will disappear from the panel's dataset immediately. This cannot be undone."
        confirmLabel="Delete post"
        onConfirm={() => {
          if (confirmDelete) onDelete(confirmDelete);
          setConfirmDelete(null);
        }}
        onClose={() => setConfirmDelete(null)}
      />
    </div>
  );
}

/* ========================================================== PostComposer == */

interface Draft {
  title: string;
  category: Category;
  summary: string;
  body: string;
  coverImage?: CoverImageValue;
  attachments: PostAttachment[];
  tags: string[];
  externalUrl: string;
  author: string;
  featured: boolean;
  subscriberOnly: boolean;
  verifiedForPublic: boolean;
  publishedAt: string;
}

function PostComposer({
  initial,
  onCancel,
  onSave,
  onComplete,
}: {
  initial?: Post;
  onCancel: () => void;
  onSave: (p: Post) => Promise<boolean>;
  onComplete: () => void;
}) {
  const [postId] = useState(() => initial?.id ?? genId("post"));
  const [draft, setDraft] = useState<Draft>({
    title: initial?.title ?? "",
    category: initial?.category ?? "blog",
    summary: initial?.summary ?? "",
    body: initial?.body ?? "",
    coverImage: initial?.coverImageUrl
      ? {
          url: initial.coverImageUrl,
          storagePath: initial.coverImagePath ?? "",
          alt: initial.coverImageAlt ?? "",
          name: initial.coverImageName ?? "Cover image",
          size: initial.coverImageSize ?? 0,
          width: initial.coverImageWidth,
          height: initial.coverImageHeight,
        }
      : undefined,
    attachments: initial?.attachments ?? [],
    tags: initial?.tags ?? [],
    externalUrl: initial?.externalUrl ?? "",
    author: initial?.author ?? "GaitAI",
    featured: Boolean(initial?.featured),
    subscriberOnly: Boolean(initial?.subscriberOnly),
    verifiedForPublic: initial?.publicationStatus === "verified",
    publishedAt: initial?.publishedAt ?? new Date().toISOString(),
  });
  const [tagInput, setTagInput] = useState("");
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadFailed, setUploadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const sessionUploadedPaths = useRef(new Set<string>());
  const pendingDeletePaths = useRef(new Set<string>());

  const discardSessionUploads = useCallback(async () => {
    const paths = [...sessionUploadedPaths.current];
    sessionUploadedPaths.current.clear();
    await Promise.allSettled(paths.map((path) => deletePostMedia(path)));
  }, []);

  const cancel = useCallback(async () => {
    if (uploadBusy) {
      setError(
        uploadFailed
          ? "Retry or dismiss failed media uploads before leaving the editor."
          : "Wait for active media uploads to finish before leaving the editor.",
      );
      return;
    }
    await discardSessionUploads();
    onCancel();
  }, [discardSessionUploads, onCancel, uploadBusy, uploadFailed]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") void cancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cancel]);

  const update = <K extends keyof Draft>(k: K, v: Draft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !draft.tags.includes(t)) update("tags", [...draft.tags, t]);
    setTagInput("");
  };

  const queueStorageRemoval = (storagePath: string) => {
    if (!storagePath) return;
    if (sessionUploadedPaths.current.has(storagePath)) {
      sessionUploadedPaths.current.delete(storagePath);
      void deletePostMedia(storagePath).catch(() => undefined);
      return;
    }
    pendingDeletePaths.current.add(storagePath);
  };

  const save = async () => {
    if (!draft.title.trim() || !draft.summary.trim()) {
      setError("Title and summary are required.");
      return;
    }
    if (uploadBusy) {
      setError(
        uploadFailed
          ? "Retry or dismiss failed media uploads before saving."
          : "Media is still uploading. Wait for every upload to finish before saving.",
      );
      return;
    }
    setError(null);
    setSaving(true);
    const saved = await onSave({
      id: postId,
      slug: initial?.slug ?? slugifyTitle(draft.title),
      title: draft.title.trim(),
      category: draft.category,
      summary: draft.summary.trim(),
      body: draft.body,
      coverImageUrl: draft.coverImage?.url,
      coverImagePath: draft.coverImage?.storagePath,
      coverImageAlt: draft.coverImage?.alt.trim() || undefined,
      coverImageName: draft.coverImage?.name,
      coverImageSize: draft.coverImage?.size || undefined,
      coverImageWidth: draft.coverImage?.width,
      coverImageHeight: draft.coverImage?.height,
      attachments: draft.attachments,
      tags: draft.tags,
      externalUrl: draft.externalUrl.trim() || undefined,
      attachmentUrl: initial?.attachmentUrl,
      attachmentName: initial?.attachmentName,
      publishedAt: draft.publishedAt,
      author: draft.author.trim() || "GaitAI",
      featured: draft.featured,
      subscriberOnly: draft.subscriberOnly || undefined,
      publicationStatus: draft.verifiedForPublic ? "verified" : "draft",
    });
    if (saved) {
      sessionUploadedPaths.current.clear();
      const oldPaths = [...pendingDeletePaths.current];
      pendingDeletePaths.current.clear();
      await Promise.allSettled(oldPaths.map((path) => deletePostMedia(path)));
      onComplete();
      return;
    }
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Composer header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => void cancel()}
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-soft-mute transition-colors hover:text-soft-white"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to studio
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreview((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs transition-all ${
              preview
                ? "border-cyan-300/50 bg-cyan-300/[0.08] text-cyan-300"
                : "border-white/10 bg-white/[0.02] text-soft-mute hover:border-white/20 hover:text-soft-white"
            }`}
          >
            {preview ? (
              <PenLine className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
            {preview ? "Write" : "Preview"}
          </button>
          <button
            onClick={() => void save()}
            disabled={saving || uploadBusy}
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            {uploadBusy
              ? uploadFailed
                ? "Resolve media upload"
                : "Uploading media…"
              : saving
                ? "Saving…"
                : initial
                  ? "Save changes"
                  : "Save record"}
          </button>
        </div>
      </div>

      <h2 className="mt-6 font-display text-2xl text-soft-white sm:text-3xl">
        {initial ? "Edit post" : "New post"}
      </h2>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        {/* Main column */}
        <div className="space-y-5">
          <Field label="Title" required>
            <input
              autoFocus
              value={draft.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="Give it a clear, confident title"
              className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 font-display text-lg text-soft-white placeholder:text-soft-mute focus:border-cyan-300/50 focus:outline-none focus:ring-2 focus:ring-cyan-300/15"
            />
          </Field>

          <Field label="Summary" required>
            <textarea
              value={draft.summary}
              onChange={(e) => update("summary", e.target.value)}
              rows={3}
              placeholder="A short 1–2 line summary shown on cards and the detail header."
              className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-soft-white placeholder:text-soft-mute focus:border-cyan-300/50 focus:outline-none focus:ring-2 focus:ring-cyan-300/15"
            />
          </Field>

          <PostMediaEditor
            postId={postId}
            cover={draft.coverImage}
            attachments={draft.attachments}
            body={draft.body}
            preview={preview}
            onCoverChange={(coverImage) => update("coverImage", coverImage)}
            onAttachmentsChange={(attachments) =>
              update("attachments", attachments)
            }
            onBodyChange={(body) => update("body", body)}
            onPreviewChange={setPreview}
            onUploadBusyChange={(busy, failed) => {
              setUploadBusy(busy);
              setUploadFailed(failed);
            }}
            onUploaded={(storagePath) =>
              sessionUploadedPaths.current.add(storagePath)
            }
            onRemoveStoragePath={queueStorageRemoval}
          />
        </div>

        {/* Side column */}
        <aside className="space-y-5">
          <Field label="Category">
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((c) => {
                const active = draft.category === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => update("category", c)}
                    className={`rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition-all ${
                      active
                        ? "border-cyan-300/50 bg-cyan-300/[0.08] text-cyan-300"
                        : "border-white/10 bg-white/[0.02] text-soft-mute hover:border-white/20 hover:text-soft-white"
                    }`}
                  >
                    {CATEGORY_META[c].label}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Author">
            <input
              value={draft.author}
              onChange={(e) => update("author", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm text-soft-white placeholder:text-soft-mute focus:border-cyan-300/50 focus:outline-none focus:ring-2 focus:ring-cyan-300/15"
            />
          </Field>

          <Field label="Tags">
            {draft.tags.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {draft.tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-soft-gray"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() =>
                        update("tags", draft.tags.filter((x) => x !== t))
                      }
                      className="text-soft-mute hover:text-red-300"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Add tag + Enter"
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-soft-white placeholder:text-soft-mute focus:border-cyan-300/50 focus:outline-none focus:ring-2 focus:ring-cyan-300/15"
              />
              <button
                type="button"
                onClick={addTag}
                className="rounded-xl border border-white/10 bg-white/[0.02] px-3 text-xs text-soft-white hover:border-white/20"
              >
                Add
              </button>
            </div>
          </Field>

          <Field label="External URL" hint="Optional">
            <input
              value={draft.externalUrl}
              onChange={(e) => update("externalUrl", e.target.value)}
              placeholder="https://"
              className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm text-soft-white placeholder:text-soft-mute focus:border-cyan-300/50 focus:outline-none focus:ring-2 focus:ring-cyan-300/15"
            />
          </Field>

          <Field label="Record date">
            <input
              type="datetime-local"
              value={new Date(draft.publishedAt).toISOString().slice(0, 16)}
              onChange={(e) =>
                update("publishedAt", new Date(e.target.value).toISOString())
              }
              className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm text-soft-white focus:border-cyan-300/50 focus:outline-none focus:ring-2 focus:ring-cyan-300/15"
            />
          </Field>

          <div className="card space-y-3 p-4">
            <Toggle
              label="Verified for public"
              hint="Publish only after claim and source review"
              checked={draft.verifiedForPublic}
              onChange={(v) => update("verifiedForPublic", v)}
            />
            <Toggle
              label="Featured"
              hint="Pin to the top of the site"
              checked={draft.featured}
              onChange={(v) => update("featured", v)}
            />
            <Toggle
              label="Subscriber-only discussion"
              hint="Locks the comment thread"
              checked={draft.subscriberOnly}
              onChange={(v) => update("subscriberOnly", v)}
            />
          </div>
        </aside>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-red-400/30 bg-red-400/[0.06] px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}
    </motion.div>
  );
}

/* ----------------------------------------------------------- primitives -- */

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-soft-mute">
          {label} {required && <span className="text-cyan-300">*</span>}
        </span>
        {hint && (
          <span className="truncate text-[11px] text-soft-mute/80">{hint}</span>
        )}
      </div>
      {children}
    </label>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 text-left"
    >
      <span>
        <span className="block text-sm text-soft-white">{label}</span>
        <span className="block text-[11px] text-soft-mute">{hint}</span>
      </span>
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
          checked ? "bg-cyan-400/80" : "bg-white/10"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
            checked ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}
