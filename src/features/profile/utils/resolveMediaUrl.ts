export function resolveMediaUrl(url?: string | null) {
  if (!url) return null;
  // Keep previews/data URLs intact; stored mock media is always local.
  if (url.startsWith("data:") || url.startsWith("blob:") || url.startsWith("/")) {
    return url;
  }
  return `/images/${url.split("/").pop() ?? "white.png"}`;
}
