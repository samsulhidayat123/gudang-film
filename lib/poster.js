const ALLOWED_POSTER_HOSTS = new Set([
  "gold-tmdb.b-cdn.net",
  "image.tmdb.org",
  "cineb.mx",
  "cineb.sx",
  "static.tvmaze.com",
  "cdn.myanimelist.net",
  "hwztchapter.dramaboxdb.com",
]);

export function getPosterUrl(poster, fallback = "/placeholder.png") {
  if (!poster) return fallback;

  if (poster.startsWith("/")) return poster;

  try {
    const url = new URL(poster);
    if (!["http:", "https:"].includes(url.protocol)) return fallback;
    if (!ALLOWED_POSTER_HOSTS.has(url.hostname)) return fallback;

    return `/api/image?url=${encodeURIComponent(url.toString())}`;
  } catch {
    return fallback;
  }
}

export { ALLOWED_POSTER_HOSTS };
