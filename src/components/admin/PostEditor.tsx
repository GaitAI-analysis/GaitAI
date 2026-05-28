"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Loader2,
  Paperclip,
  Save,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { CATEGORY_META, Category, Post } from "@/lib/posts";

const CATEGORIES: Category[] = [
  "announcement",
  "research",
  "documentation",
  "approval",
  "blog",
  "demo",
];

export interface DraftPost {
  title: string;
  category: Category;
  summary: string;
  body: string;
  tags: string[];
  externalUrl?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  author: string;
  featured: boolean;
  publishedAt?: string;
}

export function PostEditor({
  initial,
  onCancel,
  onSaved,
}: {
  initial?: Post;
  onCancel: () => void;
  onSaved: (p: Post) => void;
}) {
  const [draft, setDraft] = useState<DraftPost>({
    title: initial?.title || "",
    category: initial?.category || "announcement",
    summary: initial?.summary || "",
    body: initial?.body || "",
    tags: initial?.tags || [],
    externalUrl: initial?.externalUrl || "",
    attachmentUrl: initial?.attachmentUrl || "",
    attachmentName: initial?.attachmentName || "",
    author: initial?.author || "GaitAI",
    featured: Boolean(initial?.featured),
    publishedAt: initial?.publishedAt,
  });
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ESC closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const update = <K extends keyof DraftPost>(k: K, v: DraftPost[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !draft.tags.includes(t)) {
      update("tags", [...draft.tags, t]);
    }
    setTagInput("");
  };

  const removeTag = (t: string) => update("tags", draft.tags.filter((x) => x !== t));

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }
      const data = await res.json();
      update("attachmentUrl", data.url);
      update("attachmentName", data.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!draft.title.trim() || !draft.summary.trim()) {
      setError("Title and summary are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const url = initial ? `/api/posts/${initial.id}` : `/api/posts`;
      const method = initial ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Save failed");
      }
      const data = await res.json();
      onSaved(data.post);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="container-wide pb-20"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-soft-mute transition-colors hover:text-soft-white"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to dashboard
        </button>
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 text-xs text-soft-mute">
            <input
              type="checkbox"
              checked={draft.featured}
              onChange={(e) => update("featured", e.target.checked)}
              className="h-4 w-4 cursor-pointer rounded border-white/15 bg-transparent accent-cyan-300"
            />
            Featured
          </label>
          <button
            onClick={save}
            disabled={saving}
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {initial ? "Save changes" : "Publish"}
          </button>
        </div>
      </div>

      <h2 className="mt-8 font-display text-3xl text-soft-white">
        {initial ? "Edit publication" : "New publication"}
      </h2>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
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
              placeholder="A short 1-2 line summary that appears on the publication card and the detail header."
              className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-soft-white placeholder:text-soft-mute focus:border-cyan-300/50 focus:outline-none focus:ring-2 focus:ring-cyan-300/15"
            />
          </Field>

          <Field
            label="Body"
            hint="Supports ##/### headings, **bold**, *italic*, `code`, bullets, `>` quotes, ```fenced code```, [links](url)."
          >
            <textarea
              value={draft.body}
              onChange={(e) => update("body", e.target.value)}
              rows={14}
              placeholder={`## Section heading

Your paragraph here.

- Bullet point
- Another bullet

[Link text](https://example.com)`}
              className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 font-mono text-[13px] leading-relaxed text-soft-white placeholder:text-soft-mute focus:border-cyan-300/50 focus:outline-none focus:ring-2 focus:ring-cyan-300/15"
            />
          </Field>
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
              placeholder="GaitAI"
              className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm text-soft-white placeholder:text-soft-mute focus:border-cyan-300/50 focus:outline-none focus:ring-2 focus:ring-cyan-300/15"
            />
          </Field>

          <Field label="Tags">
            <div className="flex flex-wrap gap-1.5">
              {draft.tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-soft-gray"
                >
                  {t}
                  <button
                    type="button"
                    onClick={() => removeTag(t)}
                    className="text-soft-mute hover:text-red-300"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
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

          <Field label="Attachment" hint="PDFs, images, docs — up to 25MB.">
            {draft.attachmentUrl ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5">
                <a
                  href={draft.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 truncate text-xs text-cyan-300 hover:underline"
                >
                  <Paperclip className="h-3 w-3 shrink-0" />
                  <span className="truncate">
                    {draft.attachmentName || draft.attachmentUrl}
                  </span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    update("attachmentUrl", "");
                    update("attachmentName", "");
                  }}
                  className="text-soft-mute hover:text-red-300"
                  aria-label="Remove attachment"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f);
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-3 py-3 text-xs text-soft-mute transition-all hover:border-cyan-300/40 hover:bg-cyan-300/[0.04] hover:text-cyan-300 disabled:opacity-60"
                >
                  {uploading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Paperclip className="h-3.5 w-3.5" />
                  )}
                  {uploading ? "Uploading…" : "Upload a file"}
                </button>
              </>
            )}
          </Field>

          <Field label="External URL" hint="Optional — link to a paper, demo, etc.">
            <input
              value={draft.externalUrl || ""}
              onChange={(e) => update("externalUrl", e.target.value)}
              placeholder="https://"
              className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm text-soft-white placeholder:text-soft-mute focus:border-cyan-300/50 focus:outline-none focus:ring-2 focus:ring-cyan-300/15"
            />
          </Field>

          <Field label="Publish date">
            <input
              type="datetime-local"
              value={
                draft.publishedAt
                  ? new Date(draft.publishedAt).toISOString().slice(0, 16)
                  : new Date().toISOString().slice(0, 16)
              }
              onChange={(e) =>
                update(
                  "publishedAt",
                  new Date(e.target.value).toISOString()
                )
              }
              className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm text-soft-white placeholder:text-soft-mute focus:border-cyan-300/50 focus:outline-none focus:ring-2 focus:ring-cyan-300/15"
            />
          </Field>
        </aside>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-red-400/30 bg-red-400/[0.06] px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
        <div className="flex items-center gap-2 text-xs text-soft-mute">
          <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
          Use the body to write the publication in markdown.
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-white/10 px-4 py-2 text-xs text-soft-mute hover:border-white/20 hover:text-soft-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            {initial ? "Save changes" : "Publish"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

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
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-soft-mute">
          {label} {required && <span className="text-cyan-300">*</span>}
        </span>
        {hint && <span className="text-[11px] text-soft-mute/80">{hint}</span>}
      </div>
      {children}
    </label>
  );
}
