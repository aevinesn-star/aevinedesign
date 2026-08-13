/** Site base path. `/` locally, `/aevinedesign/` on GitHub Pages. */
export const BASE_URL = import.meta.env.BASE_URL || "/";

export function withBase(path) {
  if (!path) return path;
  if (/^(https?:|data:|blob:|mailto:|#)/i.test(path)) return path;
  const base = BASE_URL.endsWith("/") ? BASE_URL : `${BASE_URL}/`;
  return `${base}${String(path).replace(/^\//, "")}`;
}
