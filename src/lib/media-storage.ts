"use client";

import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { storage } from "@/lib/firebase";
import {
  buildStoragePath,
  uploadContentType,
  type UploadedMediaFile,
  type UploadMediaKind,
} from "@/lib/media";

async function readImageDimensions(file: File): Promise<{
  width?: number;
  height?: number;
}> {
  if (!file.type.startsWith("image/")) return {};
  const objectUrl = URL.createObjectURL(file);
  try {
    const dimensions = await new Promise<{ width: number; height: number }>(
      (resolve, reject) => {
        const image = new Image();
        image.onload = () =>
          resolve({ width: image.naturalWidth, height: image.naturalHeight });
        image.onerror = () => reject(new Error("Could not read image dimensions."));
        image.src = objectUrl;
      },
    );
    return dimensions;
  } catch {
    return {};
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function uploadPostMedia({
  postId,
  kind,
  file,
  onProgress,
}: {
  postId: string;
  kind: UploadMediaKind;
  file: File;
  onProgress: (progress: number) => void;
}): Promise<UploadedMediaFile> {
  const storagePath = buildStoragePath(postId, kind, file.name);
  const storageRef = ref(storage, storagePath);
  const mimeType = uploadContentType(file);
  const dimensions = kind === "cover" || kind === "image" ? await readImageDimensions(file) : {};

  const task = uploadBytesResumable(storageRef, file, {
    contentType: mimeType,
    customMetadata: { originalName: file.name },
  });

  await new Promise<void>((resolve, reject) => {
    task.on(
      "state_changed",
      (snapshot) => {
        const progress = snapshot.totalBytes
          ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
          : 0;
        onProgress(progress);
      },
      reject,
      resolve,
    );
  });

  const url = await getDownloadURL(task.snapshot.ref);
  return {
    name: file.name,
    originalName: file.name,
    url,
    storagePath,
    mimeType,
    size: file.size,
    ...dimensions,
  };
}

export async function deletePostMedia(storagePath: string): Promise<void> {
  if (!storagePath.startsWith("insights/posts/")) return;
  try {
    await deleteObject(ref(storage, storagePath));
  } catch (error) {
    if ((error as { code?: string })?.code !== "storage/object-not-found") throw error;
  }
}
