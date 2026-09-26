"use client";

/* eslint-disable @next/next/no-img-element */

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ExternalLink,
  FileCode2,
  FileText,
  Film,
  Image as ImageIcon,
  Link2,
  LoaderCircle,
  Paperclip,
  Play,
  Plus,
  RefreshCw,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { renderMarkdown } from "@/lib/markdown";
import {
  DOCUMENT_ACCEPT,
  IMAGE_ACCEPT,
  MAX_POST_ATTACHMENTS,
  VIDEO_ACCEPT,
  classifyMediaFile,
  createAttachmentId,
  documentTypeLabel,
  formatFileSize,
  resolveVideoEmbed,
  validateMediaFile,
  type PostAttachment,
  type StoredMediaKind,
  type UploadedMediaFile,
  type UploadMediaKind,
} from "@/lib/media";
import { uploadPostMedia } from "@/lib/media-storage";

export interface CoverImageValue {
  url: string;
  storagePath: string;
  alt: string;
  name: string;
  size: number;
  width?: number;
  height?: number;
}

interface UploadState {
  id: string;
  file: File;
  kind: UploadMediaKind;
  progress: number;
  status: "uploading" | "error";
  error?: string;
  replaceId?: string;
}

const MEDIA_TOOL_BUTTON =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.025] px-3 py-1.5 text-xs text-soft-mute transition-colors hover:border-cyan-300/35 hover:bg-cyan-300/[0.05] hover:text-cyan-200";
const MEDIA_MENU_BUTTON =
  "flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-soft-gray transition-colors hover:bg-white/[0.05] hover:text-soft-white";
const MEDIA_CARD_ACTION =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.025] px-2.5 py-1.5 text-[11px] text-soft-mute transition-colors hover:border-white/20 hover:text-soft-white";
const MEDIA_CARD_ACTION_PRIMARY = `${MEDIA_CARD_ACTION} border-cyan-300/25 bg-cyan-300/[0.06] text-cyan-200 hover:border-cyan-300/45 hover:bg-cyan-300/[0.1]`;
const MEDIA_CARD_ACTION_DANGER = `${MEDIA_CARD_ACTION} border-red-300/15 text-red-200/80 hover:border-red-300/35 hover:bg-red-300/[0.06] hover:text-red-200`;

export function PostMediaEditor({
  postId,
  cover,
  attachments,
  body,
  preview,
  onCoverChange,
  onAttachmentsChange,
  onBodyChange,
  onPreviewChange,
  onUploadBusyChange,
  onUploaded,
  onRemoveStoragePath,
}: {
  postId: string;
  cover?: CoverImageValue;
  attachments: PostAttachment[];
  body: string;
  preview: boolean;
  onCoverChange: (cover?: CoverImageValue) => void;
  onAttachmentsChange: (attachments: PostAttachment[]) => void;
  onBodyChange: (body: string) => void;
  onPreviewChange: (preview: boolean) => void;
  onUploadBusyChange: (busy: boolean, failed: boolean) => void;
  onUploaded: (storagePath: string) => void;
  onRemoveStoragePath: (storagePath: string) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const externalFormRef = useRef<HTMLDivElement>(null);
  const attachmentsRef = useRef(attachments);
  const [uploads, setUploads] = useState<Record<string, UploadState>>({});
  const [dropActive, setDropActive] = useState(false);
  const [videoMenu, setVideoMenu] = useState(false);
  const [externalOpen, setExternalOpen] = useState(false);
  const [externalUrl, setExternalUrl] = useState("");
  const [externalCaption, setExternalCaption] = useState("");
  const [externalError, setExternalError] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const hasFailedUpload = Object.values(uploads).some(
    (upload) => upload.status === "error",
  );
  const hasUnresolvedUpload = Object.keys(uploads).length > 0;
  const coverUpload = Object.values(uploads).find(
    (upload) => upload.kind === "cover",
  );
  const attachmentUploads = Object.values(uploads).filter(
    (upload) => upload.kind !== "cover",
  );

  useEffect(() => {
    onUploadBusyChange(hasUnresolvedUpload, hasFailedUpload);
  }, [hasFailedUpload, hasUnresolvedUpload, onUploadBusyChange]);

  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  const commitAttachments = (next: PostAttachment[]) => {
    attachmentsRef.current = next;
    onAttachmentsChange(next);
  };

  const updateUpload = (id: string, patch: Partial<UploadState>) => {
    setUploads((current) => ({
      ...current,
      [id]: { ...current[id], ...patch },
    }));
  };

  const dismissUpload = (id: string) => {
    setUploads((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  };

  const startUpload = async (
    file: File,
    kind: UploadMediaKind,
    replaceId?: string,
    existingUploadId?: string,
  ) => {
    const validationError = validateMediaFile(file, kind);
    if (validationError) {
      setMediaError(validationError);
      return;
    }
    if (
      kind !== "cover" &&
      !replaceId &&
      attachmentsRef.current.length >= MAX_POST_ATTACHMENTS
    ) {
      setMediaError(`A post can contain up to ${MAX_POST_ATTACHMENTS} media items.`);
      return;
    }

    setMediaError(null);
    const uploadId = existingUploadId ?? createAttachmentId("upload");
    setUploads((current) => ({
      ...current,
      [uploadId]: {
        id: uploadId,
        file,
        kind,
        progress: 0,
        status: "uploading",
        replaceId,
      },
    }));

    try {
      const uploaded = await uploadPostMedia({
        postId,
        kind,
        file,
        onProgress: (progress) => updateUpload(uploadId, { progress }),
      });
      onUploaded(uploaded.storagePath);

      if (kind === "cover") {
        if (cover?.storagePath) onRemoveStoragePath(cover.storagePath);
        onCoverChange({
          url: uploaded.url,
          storagePath: uploaded.storagePath,
          alt: cover?.alt ?? "",
          name: uploaded.name,
          size: uploaded.size,
          width: uploaded.width,
          height: uploaded.height,
        });
      } else {
        const latestAttachments = attachmentsRef.current;
        const current = replaceId
          ? latestAttachments.find((attachment) => attachment.id === replaceId)
          : undefined;
        const nextAttachment = toAttachment(
          uploaded,
          kind,
          current?.id ?? createAttachmentId(kind),
          current,
        );
        if (current?.storagePath) onRemoveStoragePath(current.storagePath);
        commitAttachments(
          current
            ? latestAttachments.map((attachment) =>
                attachment.id === current.id ? nextAttachment : attachment,
              )
            : [...latestAttachments, nextAttachment],
        );
      }

      dismissUpload(uploadId);
    } catch (error) {
      updateUpload(uploadId, {
        status: "error",
        error: readableUploadError(error),
      });
    }
  };

  const handleAttachmentFiles = (files: FileList | File[]) => {
    Array.from(files).forEach((file) => {
      const kind = classifyMediaFile(file);
      if (!kind) {
        setMediaError(`${file.name} is not a supported media or document type.`);
        return;
      }
      void startUpload(file, kind);
    });
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDropActive(false);
    if (event.dataTransfer.files.length) {
      handleAttachmentFiles(event.dataTransfer.files);
    }
  };

  const removeAttachment = (attachment: PostAttachment) => {
    if (attachment.storagePath) onRemoveStoragePath(attachment.storagePath);
    commitAttachments(
      attachmentsRef.current.filter(
        (candidate) => candidate.id !== attachment.id,
      ),
    );
  };

  const updateAttachment = (
    id: string,
    patch: Partial<PostAttachment>,
  ) => {
    commitAttachments(
      attachmentsRef.current.map((attachment) =>
        attachment.id === id ? { ...attachment, ...patch } : attachment,
      ),
    );
  };

  const insertAtCursor = (syntax: string) => {
    onPreviewChange(false);
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? body.length;
    const end = textarea?.selectionEnd ?? body.length;
    const prefix = start > 0 && !body.slice(0, start).endsWith("\n\n") ? "\n\n" : "";
    const suffix = end < body.length && !body.slice(end).startsWith("\n\n") ? "\n\n" : "";
    const inserted = `${prefix}${syntax}${suffix}`;
    onBodyChange(`${body.slice(0, start)}${inserted}${body.slice(end)}`);
    requestAnimationFrame(() => {
      const nextCursor = start + inserted.length;
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(nextCursor, nextCursor);
    });
  };

  const insertAttachment = (attachment: PostAttachment) => {
    if (attachment.type === "image") {
      const alt = markdownText(attachment.alt || attachment.name.replace(/\.[^.]+$/, ""));
      const caption = attachment.caption
        ? ` "${markdownTitle(attachment.caption)}"`
        : "";
      insertAtCursor(`![${alt}](${attachment.url}${caption})`);
      return;
    }
    if (attachment.type === "video" || attachment.type === "external-video") {
      const caption = attachment.caption
        ? ` "${markdownTitle(attachment.caption)}"`
        : "";
      insertAtCursor(`@[video](${attachment.url}${caption})`);
      return;
    }
    insertAtCursor(`[${markdownText(attachment.name)}](${attachment.url})`);
  };

  const openExternalMedia = () => {
    setExternalOpen(true);
    requestAnimationFrame(() => {
      externalFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  };

  const addExternalVideo = () => {
    const parsed = resolveVideoEmbed(externalUrl.trim());
    if (!parsed) {
      setExternalError("Enter a supported YouTube or Vimeo URL.");
      return;
    }
    if (attachmentsRef.current.length >= MAX_POST_ATTACHMENTS) {
      setExternalError(`A post can contain up to ${MAX_POST_ATTACHMENTS} media items.`);
      return;
    }
    const providerName = parsed.provider === "youtube" ? "YouTube" : "Vimeo";
    commitAttachments([
      ...attachmentsRef.current,
      {
        id: createAttachmentId("embed"),
        name: `${providerName} video`,
        originalName: `${providerName} video`,
        url: externalUrl.trim(),
        mimeType: "text/uri-list",
        type: "external-video",
        size: 0,
        provider: parsed.provider,
        caption: externalCaption.trim() || undefined,
      },
    ]);
    setExternalUrl("");
    setExternalCaption("");
    setExternalError(null);
    setExternalOpen(false);
    setVideoMenu(false);
  };

  return (
    <div className="space-y-5">
      <SectionField
        label="Cover image"
        hint="Optional · JPG, PNG, WebP, GIF or AVIF · 10 MB max"
      >
        {cover ? (
          <div className="space-y-3">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
              <div className="relative aspect-[16/7] min-h-44 overflow-hidden bg-obsidian-300">
                <img
                  src={cover.url}
                  alt={cover.alt || "Cover preview"}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-obsidian/65 via-transparent to-transparent" />
              </div>
              <div className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-soft-white">
                    {cover.name}
                  </p>
                  <p className="mt-1 text-xs text-soft-mute">
                    {cover.width && cover.height
                      ? `${cover.width} × ${cover.height} · `
                      : ""}
                    {formatFileSize(cover.size)}
                  </p>
                  <label className="mt-3 block">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-soft-mute">
                      Alt text
                    </span>
                    <input
                      value={cover.alt}
                      maxLength={300}
                      onChange={(event) =>
                        onCoverChange({ ...cover, alt: event.target.value })
                      }
                      placeholder="Describe the cover image"
                      className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/10 px-3 py-2 text-sm text-soft-white placeholder:text-soft-mute focus:border-cyan-300/50 focus:outline-none focus:ring-2 focus:ring-cyan-300/15"
                    />
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  <UploadLabel accept={IMAGE_ACCEPT} label="Replace">
                    {(file) => void startUpload(file, "cover")}
                  </UploadLabel>
                  <button
                    type="button"
                    onClick={() => {
                      onRemoveStoragePath(cover.storagePath);
                      onCoverChange(undefined);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-red-300/20 bg-red-300/[0.04] px-3 py-2 text-xs text-red-200 transition hover:border-red-300/40 hover:bg-red-300/[0.08]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>
              </div>
            </div>
            {coverUpload && (
              <UploadProgressCard
                upload={coverUpload}
                onRetry={() =>
                  void startUpload(
                    coverUpload.file,
                    "cover",
                    undefined,
                    coverUpload.id,
                  )
                }
                onDismiss={() => dismissUpload(coverUpload.id)}
              />
            )}
          </div>
        ) : coverUpload ? (
          <UploadProgressCard
            upload={coverUpload}
            onRetry={() =>
              void startUpload(
                coverUpload.file,
                "cover",
                undefined,
                coverUpload.id,
              )
            }
            onDismiss={() => dismissUpload(coverUpload.id)}
          />
        ) : (
          <DropUpload
            accept={IMAGE_ACCEPT}
            label="Drop a cover image or browse"
            detail="A restrained 16:9 or wide image works best"
            onFile={(file) => void startUpload(file, "cover")}
          />
        )}
      </SectionField>

      <SectionField
        label={preview ? "Body — live preview" : "Body"}
        hint="Markdown with headings, figures, video, tables, code and links"
      >
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.015]">
          <div className="flex flex-wrap items-center gap-2 border-b border-white/8 px-3 py-2.5">
            <QuickUpload
              accept={IMAGE_ACCEPT}
              icon={<ImageIcon className="h-3.5 w-3.5" />}
              label="Image"
              onFile={(file) => void startUpload(file, "image")}
            />
            <div className="relative">
              <button
                type="button"
                onClick={() => setVideoMenu((current) => !current)}
                className={MEDIA_TOOL_BUTTON}
              >
                <Film className="h-3.5 w-3.5" />
                Video
              </button>
              <AnimatePresence>
                {videoMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="absolute left-0 top-full z-20 mt-2 w-52 rounded-xl border border-white/10 bg-obsidian-200 p-2 shadow-2xl"
                  >
                    <QuickUpload
                      accept={VIDEO_ACCEPT}
                      icon={<UploadCloud className="h-3.5 w-3.5" />}
                      label="Upload video"
                      menu
                      onFile={(file) => {
                        setVideoMenu(false);
                        void startUpload(file, "video");
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        openExternalMedia();
                        setVideoMenu(false);
                      }}
                      className={MEDIA_MENU_BUTTON}
                    >
                      <Play className="h-3.5 w-3.5" />
                      Embed YouTube / Vimeo
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <QuickUpload
              accept={DOCUMENT_ACCEPT}
              icon={<Paperclip className="h-3.5 w-3.5" />}
              label="Attachment"
              onFile={(file) => void startUpload(file, "document")}
            />
            <button
              type="button"
              onClick={() => setExternalOpen((current) => !current)}
              className={MEDIA_TOOL_BUTTON}
            >
              <Link2 className="h-3.5 w-3.5" />
              External media
            </button>
            <span className="ml-auto hidden text-[10px] text-soft-mute sm:inline">
              Inserted at cursor
            </span>
          </div>

          <AnimatePresence>
            {externalOpen && (
              <motion.div
                ref={externalFormRef}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-b border-white/8"
              >
                <div className="grid gap-3 bg-violet-400/[0.025] p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,0.65fr)_auto] md:items-end">
                  <label className="min-w-0">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-soft-mute">
                      YouTube or Vimeo URL
                    </span>
                    <input
                      value={externalUrl}
                      onChange={(event) => setExternalUrl(event.target.value)}
                      placeholder="https://youtube.com/watch?v=…"
                      className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/10 px-3 py-2 text-sm text-soft-white placeholder:text-soft-mute focus:border-violet-300/50 focus:outline-none"
                    />
                  </label>
                  <label className="min-w-0">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-soft-mute">
                      Optional caption
                    </span>
                    <input
                      value={externalCaption}
                      onChange={(event) => setExternalCaption(event.target.value)}
                      placeholder="What viewers will see"
                      className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/10 px-3 py-2 text-sm text-soft-white placeholder:text-soft-mute focus:border-violet-300/50 focus:outline-none"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={addExternalVideo}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-violet-400/15 px-4 py-2 text-sm font-medium text-violet-200 ring-1 ring-violet-300/30 hover:bg-violet-400/20"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add embed
                  </button>
                  {externalError && (
                    <p className="text-xs text-red-300 md:col-span-3">
                      {externalError}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {preview ? (
              <motion.div
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="min-h-[360px] px-5 py-5"
              >
                {body.trim() ? (
                  <div className="max-w-none text-sm leading-relaxed text-soft-gray">
                    {renderMarkdown(body)}
                  </div>
                ) : (
                  <p className="text-sm text-soft-mute">
                    Nothing to preview yet — switch back to Write and add some content.
                  </p>
                )}
              </motion.div>
            ) : (
              <motion.textarea
                ref={textareaRef}
                key="write"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                value={body}
                onChange={(event) => onBodyChange(event.target.value)}
                rows={18}
                placeholder={`## Section heading\n\nYour paragraph here.\n\n- Bullet point\n- Another bullet\n\n[Link text](https://example.com)`}
                className="block w-full resize-y border-0 bg-transparent px-4 py-4 font-mono text-[13px] leading-relaxed text-soft-white outline-none placeholder:text-soft-mute focus:ring-0"
              />
            )}
          </AnimatePresence>
        </div>
      </SectionField>

      <SectionField
        label="Media & attachments"
        hint={`${attachments.length}/${MAX_POST_ATTACHMENTS} attached`}
      >
        <div
          onDragEnter={(event) => {
            event.preventDefault();
            setDropActive(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            if (event.currentTarget === event.target) setDropActive(false);
          }}
          onDrop={handleDrop}
          className={`rounded-2xl border p-4 transition-colors sm:p-5 ${
            dropActive
              ? "border-cyan-300/50 bg-cyan-300/[0.05]"
              : "border-white/10 bg-white/[0.015]"
          }`}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-soft-white">
                Drop files here or choose a media type
              </p>
              <p className="mt-1 text-xs leading-relaxed text-soft-mute">
                Images 10 MB · videos 100 MB · documents 25 MB
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <QuickUpload
                accept={IMAGE_ACCEPT}
                icon={<ImageIcon className="h-3.5 w-3.5" />}
                label="Add image"
                onFile={(file) => void startUpload(file, "image")}
              />
              <QuickUpload
                accept={VIDEO_ACCEPT}
                icon={<Film className="h-3.5 w-3.5" />}
                label="Add video"
                onFile={(file) => void startUpload(file, "video")}
              />
              <QuickUpload
                accept={DOCUMENT_ACCEPT}
                icon={<FileText className="h-3.5 w-3.5" />}
                label="Add document"
                onFile={(file) => void startUpload(file, "document")}
              />
              <button
                type="button"
                onClick={openExternalMedia}
                className={MEDIA_TOOL_BUTTON}
              >
                <Link2 className="h-3.5 w-3.5" />
                Add external media
              </button>
            </div>
          </div>

          {mediaError && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-300/20 bg-red-300/[0.05] px-3 py-2.5 text-xs text-red-200">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{mediaError}</span>
              <button
                type="button"
                onClick={() => setMediaError(null)}
                className="ml-auto text-red-200/70 hover:text-red-100"
                aria-label="Dismiss upload error"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {attachmentUploads.length > 0 && (
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {attachmentUploads.map((upload) => (
                <UploadProgressCard
                  key={upload.id}
                  upload={upload}
                  onRetry={() =>
                    void startUpload(
                      upload.file,
                      upload.kind,
                      upload.replaceId,
                      upload.id,
                    )
                  }
                  onDismiss={() => dismissUpload(upload.id)}
                />
              ))}
            </div>
          )}

          {attachments.length > 0 ? (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {attachments.map((attachment) => (
                <MediaCard
                  key={attachment.id}
                  attachment={attachment}
                  onChange={(patch) => updateAttachment(attachment.id, patch)}
                  onInsert={() => insertAttachment(attachment)}
                  onRemove={() => removeAttachment(attachment)}
                  onReplace={(file) => {
                    const kind =
                      attachment.type === "external-video"
                        ? "video"
                        : attachment.type;
                    void startUpload(file, kind, attachment.id);
                  }}
                />
              ))}
            </div>
          ) : (
            attachmentUploads.length === 0 && (
              <div className="mt-5 rounded-xl border border-dashed border-white/10 px-4 py-8 text-center">
                <UploadCloud className="mx-auto h-5 w-5 text-soft-mute" />
                <p className="mt-2 text-sm text-soft-mute">
                  Uploaded images, videos and documents will appear here.
                </p>
              </div>
            )
          )}
        </div>
      </SectionField>
    </div>
  );
}

function toAttachment(
  uploaded: UploadedMediaFile,
  kind: StoredMediaKind,
  id: string,
  current?: PostAttachment,
): PostAttachment {
  return {
    id,
    name: uploaded.name,
    originalName: uploaded.originalName,
    url: uploaded.url,
    storagePath: uploaded.storagePath,
    mimeType: uploaded.mimeType,
    type: kind,
    size: uploaded.size,
    description: current?.description,
    alt: current?.alt,
    caption: current?.caption,
    width: uploaded.width,
    height: uploaded.height,
  };
}

function readableUploadError(error: unknown): string {
  const code = (error as { code?: string })?.code ?? "";
  if (code === "storage/unauthorized") {
    return "Storage rejected this upload. Confirm storage.rules are published and you are still signed in.";
  }
  if (code === "storage/canceled") return "Upload cancelled.";
  if (code === "storage/retry-limit-exceeded") {
    return "The upload timed out. Check your connection and retry.";
  }
  return (error as Error)?.message || "Upload failed. Please retry.";
}

function markdownText(value: string): string {
  return value.replace(/[\[\]]/g, "").trim();
}

function markdownTitle(value: string): string {
  return value.replace(/"/g, "'").trim();
}

function SectionField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-[11px] font-medium uppercase tracking-[0.18em] text-soft-mute">
          {label}
        </h3>
        {hint && <p className="text-[11px] text-soft-mute/80">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function DropUpload({
  accept,
  label,
  detail,
  onFile,
}: {
  accept: string;
  label: string;
  detail: string;
  onFile: (file: File) => void;
}) {
  const [active, setActive] = useState(false);
  return (
    <label
      onDragEnter={(event) => {
        event.preventDefault();
        setActive(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={() => setActive(false)}
      onDrop={(event) => {
        event.preventDefault();
        setActive(false);
        const file = event.dataTransfer.files[0];
        if (file) onFile(file);
      }}
      className={`flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-5 py-7 text-center transition ${
        active
          ? "border-cyan-300/60 bg-cyan-300/[0.06]"
          : "border-white/12 bg-white/[0.015] hover:border-cyan-300/35 hover:bg-cyan-300/[0.025]"
      }`}
    >
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-300/[0.07] text-cyan-300 ring-1 ring-cyan-300/20">
        <UploadCloud className="h-4 w-4" />
      </span>
      <span className="mt-3 text-sm font-medium text-soft-white">{label}</span>
      <span className="mt-1 text-xs text-soft-mute">{detail}</span>
      <input
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.currentTarget.value = "";
        }}
      />
    </label>
  );
}

function QuickUpload({
  accept,
  icon,
  label,
  onFile,
  menu = false,
}: {
  accept: string;
  icon: React.ReactNode;
  label: string;
  onFile: (file: File) => void;
  menu?: boolean;
}) {
  return (
    <label className={menu ? MEDIA_MENU_BUTTON : MEDIA_TOOL_BUTTON}>
      {icon}
      {label}
      <input
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.currentTarget.value = "";
        }}
      />
    </label>
  );
}

function UploadLabel({
  accept,
  label,
  children,
}: {
  accept: string;
  label: string;
  children: (file: File) => void;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-soft-white transition hover:border-cyan-300/35 hover:text-cyan-200">
      <RefreshCw className="h-3.5 w-3.5" />
      {label}
      <input
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) children(file);
          event.currentTarget.value = "";
        }}
      />
    </label>
  );
}

function UploadProgressCard({
  upload,
  onRetry,
  onDismiss,
}: {
  upload: UploadState;
  onRetry: () => void;
  onDismiss: () => void;
}) {
  const failed = upload.status === "error";
  return (
    <div className="rounded-xl border border-white/10 bg-black/10 p-4">
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
            failed
              ? "bg-red-300/[0.08] text-red-300"
              : "bg-cyan-300/[0.08] text-cyan-300"
          }`}
        >
          {failed ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-soft-white">
            {failed ? "Upload failed" : `Uploading ${upload.file.name}`}
          </p>
          <p className="mt-0.5 truncate text-xs text-soft-mute">
            {failed ? upload.error : `${formatFileSize(upload.file.size)} · ${upload.progress}%`}
          </p>
          {!failed && (
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div
                className="h-full rounded-full bg-gradient-brand"
                animate={{ width: `${upload.progress}%` }}
              />
            </div>
          )}
          {failed && (
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={onRetry} className={MEDIA_CARD_ACTION}>
                <RefreshCw className="h-3 w-3" />
                Retry
              </button>
              <button type="button" onClick={onDismiss} className={MEDIA_CARD_ACTION}>
                Dismiss
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MediaCard({
  attachment,
  onChange,
  onInsert,
  onReplace,
  onRemove,
}: {
  attachment: PostAttachment;
  onChange: (patch: Partial<PostAttachment>) => void;
  onInsert: () => void;
  onReplace: (file: File) => void;
  onRemove: () => void;
}) {
  const isImage = attachment.type === "image";
  const isVideo = attachment.type === "video";
  const isExternalVideo = attachment.type === "external-video";
  const isDocument = attachment.type === "document";
  const embed = isExternalVideo ? resolveVideoEmbed(attachment.url) : null;
  const accept = isImage ? IMAGE_ACCEPT : isVideo || isExternalVideo ? VIDEO_ACCEPT : DOCUMENT_ACCEPT;

  return (
    <article className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-black/10">
      <div className="relative flex min-h-32 items-center justify-center overflow-hidden bg-obsidian-300/70">
        {isImage && (
          <img
            src={attachment.url}
            alt={attachment.alt || "Image preview"}
            className="max-h-52 w-full object-contain"
          />
        )}
        {isVideo && (
          <video
            src={attachment.url}
            controls
            preload="metadata"
            className="max-h-52 w-full bg-black object-contain"
          />
        )}
        {embed && (
          <div className="aspect-video w-full">
            <iframe
              src={embed.embedUrl}
              title={attachment.caption || attachment.name}
              loading="lazy"
              allow="accelerometer; encrypted-media; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        )}
        {isDocument && (
          <div className="flex flex-col items-center py-7 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-400/[0.08] text-violet-200 ring-1 ring-violet-300/20">
              {documentTypeLabel(attachment) === "MD" ? (
                <FileCode2 className="h-5 w-5" />
              ) : (
                <FileText className="h-5 w-5" />
              )}
            </span>
            <span className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-200">
              {documentTypeLabel(attachment)}
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-soft-white" title={attachment.name}>
              {attachment.name}
            </p>
            <p className="mt-1 text-xs text-soft-mute">
              {isExternalVideo
                ? `${attachment.provider === "vimeo" ? "Vimeo" : "YouTube"} embed`
                : formatFileSize(attachment.size)}
              {attachment.width && attachment.height
                ? ` · ${attachment.width} × ${attachment.height}`
                : ""}
            </p>
          </div>
          <span className="rounded-full bg-white/[0.04] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-soft-mute ring-1 ring-white/10">
            {isExternalVideo ? "embed" : attachment.type}
          </span>
        </div>

        {isImage && (
          <div className="mt-4 grid gap-3">
            <CompactInput
              label="Alt text"
              value={attachment.alt ?? ""}
              placeholder="Describe this image"
              onChange={(value) => onChange({ alt: value })}
            />
            <CompactInput
              label="Caption"
              value={attachment.caption ?? ""}
              placeholder="Optional figure caption"
              onChange={(value) => onChange({ caption: value })}
            />
          </div>
        )}
        {(isVideo || isExternalVideo) && (
          <div className="mt-4">
            <CompactInput
              label="Caption"
              value={attachment.caption ?? ""}
              placeholder="Optional video caption"
              onChange={(value) => onChange({ caption: value })}
            />
          </div>
        )}
        {isDocument && (
          <div className="mt-4">
            <CompactInput
              label="Description"
              value={attachment.description ?? ""}
              placeholder="Research methodology and results"
              onChange={(value) => onChange({ description: value })}
            />
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {!isDocument && (
            <button type="button" onClick={onInsert} className={MEDIA_CARD_ACTION_PRIMARY}>
              <Plus className="h-3 w-3" />
              Insert into article
            </button>
          )}
          {isDocument && (
            <a
              href={attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              className={MEDIA_CARD_ACTION}
            >
              <ExternalLink className="h-3 w-3" />
              Preview
            </a>
          )}
          {isDocument && (
            <button type="button" onClick={onInsert} className={MEDIA_CARD_ACTION}>
              <Paperclip className="h-3 w-3" />
              Insert link
            </button>
          )}
          {!isExternalVideo && (
            <UploadLabel accept={accept} label="Replace">
              {onReplace}
            </UploadLabel>
          )}
          <button type="button" onClick={onRemove} className={MEDIA_CARD_ACTION_DANGER}>
            <Trash2 className="h-3 w-3" />
            Remove
          </button>
        </div>
      </div>
    </article>
  );
}

function CompactInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block min-w-0">
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-soft-mute">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full min-w-0 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-soft-white placeholder:text-soft-mute focus:border-cyan-300/40 focus:outline-none"
      />
    </label>
  );
}
