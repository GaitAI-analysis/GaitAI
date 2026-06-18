export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Prefix root-relative public assets for the GitHub Pages project path. */
export function assetPath(path: string): string {
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  if (basePath && (path === basePath || path.startsWith(`${basePath}/`))) {
    return path;
  }
  return `${basePath}${path}`;
}
