/* CLIENT-SAFE media types, validation, and URL helpers. */

export const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif", "avif"] as const;
export const VIDEO_EXTENSIONS = ["mp4", "webm"] as const;
export const DOCUMENT_EXTENSIONS = [
  "pdf",
  "md",
  "txt",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "xls",
  "xlsx",
  "csv",
] as const;

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
export const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024;
export const MAX_POST_ATTACHMENTS = 30;

export type StoredMediaKind = "image" | "video" | "document";
export type PostAttachmentType = StoredMediaKind | "external-video";
export type UploadMediaKind = "cover" | StoredMediaKind;
export type VideoProvider = "youtube" | "vimeo";

export interface PostAttachment {
  id: string;
  name: string;
  originalName: string;
  url: string;
  storagePath?: string;
  mimeType: string;
  type: PostAttachmentType;
  size: number;
  description?: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
  provider?: VideoProvider;
}

export interface UploadedMediaFile {
  name: string;
  originalName: string;
  url: string;
  storagePath: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
}

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
  mp4: "video/mp4",
  webm: "video/webm",
  pdf: "application/pdf",
  md: "text/markdown",
  txt: "text/plain",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  csv: "text/csv",
};

export const IMAGE_ACCEPT = IMAGE_EXTENSIONS.map((ext) => `.${ext}`).join(",");
export const VIDEO_ACCEPT = VIDEO_EXTENSIONS.map((ext) => `.${ext}`).join(",");
export const DOCUMENT_ACCEPT = DOCUMENT_EXTENSIONS.map((ext) => `.${ext}`).join(",");

export function fileExtension(name: string): string {
  const match = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] ?? "";
}

export function classifyMediaFile(file: File): StoredMediaKind | null {
  const extension = fileExtension(file.name);
  if ((IMAGE_EXTENSIONS as readonly string[]).includes(extension)) return "image";
  if ((VIDEO_EXTENSIONS as readonly string[]).includes(extension)) return "video";
  if ((DOCUMENT_EXTENSIONS as readonly string[]).includes(extension)) return "document";
  return null;
}

export function uploadContentType(file: File): string {
  return (MIME_BY_EXTENSION[fileExtension(file.name)] ?? file.type) || "application/octet-stream";
}

export function validateMediaFile(file: File, kind: UploadMediaKind): string | null {
  const extension = fileExtension(file.name);
  const effectiveKind = kind === "cover" ? "image" : kind;
  const allowed =
    effectiveKind === "image"
      ? (IMAGE_EXTENSIONS as readonly string[])
      : effectiveKind === "video"
        ? (VIDEO_EXTENSIONS as readonly string[])
        : (DOCUMENT_EXTENSIONS as readonly string[]);

  if (!allowed.includes(extension)) {
    return `Unsupported ${effectiveKind} type. Choose ${allowed.map((ext) => `.${ext}`).join(", ")}.`;
  }

  const maxBytes =
    effectiveKind === "image"
      ? MAX_IMAGE_BYTES
      : effectiveKind === "video"
        ? MAX_VIDEO_BYTES
        : MAX_DOCUMENT_BYTES;

  if (file.size <= 0) return "The selected file is empty.";
  if (file.size > maxBytes) {
    return `${file.name} is larger than the ${formatFileSize(maxBytes)} limit.`;
  }

  return null;
}

export function buildStoragePath(
  postId: string,
  kind: UploadMediaKind,
  originalName: string,
): string {
  const folder = kind === "image" ? "images" : kind === "video" ? "videos" : kind === "document" ? "documents" : "cover";
  const extension = fileExtension(originalName) || "bin";
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  const safePostId = postId.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 120);
  return `insights/posts/${safePostId}/${folder}/${Date.now()}-${id}.${extension}`;
}

export function formatFileSize(bytes: number | undefined): string {
  if (!bytes || bytes < 1) return "Size unavailable";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value >= 10 || exponent === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[exponent]}`;
}

export function documentTypeLabel(attachment: Pick<PostAttachment, "name" | "mimeType">): string {
  const extension = fileExtension(attachment.name).toUpperCase();
  if (extension) return extension;
  if (attachment.mimeType === "application/pdf") return "PDF";
  return "FILE";
}

export function isSafeMediaUrl(value: string): boolean {
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function resolveVideoEmbed(value: string): {
  provider: VideoProvider;
  embedUrl: string;
} | null {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    let id = "";

    if (host === "youtu.be") id = url.pathname.split("/").filter(Boolean)[0] ?? "";
    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      if (url.pathname === "/watch") id = url.searchParams.get("v") ?? "";
      else id = url.pathname.match(/^\/(?:embed|shorts)\/([^/?]+)/)?.[1] ?? "";
    }
    if (/^[a-zA-Z0-9_-]{6,20}$/.test(id)) {
      return {
        provider: "youtube",
        embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
      };
    }

    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const vimeoId = url.pathname.match(/(?:\/video)?\/(\d+)/)?.[1] ?? "";
      if (/^\d+$/.test(vimeoId)) {
        return {
          provider: "vimeo",
          embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
        };
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function createAttachmentId(prefix = "media"): string {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${id}`;
}
