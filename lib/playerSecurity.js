export const SERVER_PRIORITY = [
  "VIDSRC RU",
  "VIDSRC SU",
  "VIDSRCME RU",
  "VIDSRCME SU",
  "VIDSRC-ME RU",
  "VIDSRC-ME SU",
  "VSRC SU",
  "TurboVIP",
  "ST",
  "TVP",
  "VDZ",
  "MD",
  "HYDRAX",
];

const SERVER_PRIORITY_KEYS = SERVER_PRIORITY.map((name) => name.toUpperCase());

const ALLOWED_EMBED_HOSTS = [
  "short.icu",
  "streamtape.com",
  "emturbovid.com",
  "turbovidhls.com",
  "vidoza.net",
  "mxdrop.to",

  // VidSrc
  "vidsrc-embed.ru",
  "vidsrc-embed.su",
  "vsrc.su",
  "vidsrc-me.su",
  "vidsrc-me.ru",
  "vidsrcme.su",
  "vidsrcme.ru",
];

const ALLOWED_VIDEO_HOSTS = [
  "dramaboxdb.com",
];

function hostnameMatches(hostname, allowedHost) {
  return hostname === allowedHost || hostname.endsWith(`.${allowedHost}`);
}

function toSafeHttpsUrl(value, allowedHosts) {
  if (typeof value !== "string") return null;

  try {
    const url = new URL(value.trim());

    if (url.protocol !== "https:") return null;
    if (url.username || url.password) return null;

    const hostname = url.hostname.toLowerCase();
    const allowed = allowedHosts.some((host) =>
      hostnameMatches(hostname, host)
    );

    return allowed ? url.href : null;
  } catch {
    return null;
  }
}

export function sanitizeEmbedUrl(value) {
  return toSafeHttpsUrl(value, ALLOWED_EMBED_HOSTS);
}

export function sanitizeVideoUrl(value) {
  return toSafeHttpsUrl(value, ALLOWED_VIDEO_HOSTS);
}

export function sanitizeSourceUrl(value) {
  return toSafeHttpsUrl(value, [
    "idflix.my.id",
    "themoviedb.org",
    "image.tmdb.org",
    "vidsrc-embed.ru",
    "vidsrc-embed.su",
    "vsrc.su",
    "vidsrc-me.su",
    "vidsrc-me.ru",
    "vidsrcme.su",
    "vidsrcme.ru",
  ]);
}

export function getVideoSourceKind(value) {
  if (typeof value !== "string") return "unknown";

  try {
    const url = new URL(value.trim());
    const pathname = url.pathname.toLowerCase();

    if (pathname.endsWith(".m3u8")) return "hls";
    if (pathname.endsWith(".mp4")) return "mp4";
    if (pathname.endsWith(".webm")) return "webm";
    if (pathname.endsWith(".ogg") || pathname.endsWith(".ogv")) return "ogg";

    return "unknown";
  } catch {
    return "unknown";
  }
}

export function sanitizeServers(servers) {
  if (!Array.isArray(servers)) return [];

  return servers
    .map((server) => {
      const name =
        String(server?.name || "SERVER")
          .replace(/[^\w -]/g, "")
          .slice(0, 24) || "SERVER";
      const embedCandidate = server?.embedUrl || server?.embed_url;
      const streamCandidate =
        server?.streamUrl || server?.stream_url || server?.url;
      const embedUrl =
        sanitizeEmbedUrl(embedCandidate) || sanitizeEmbedUrl(streamCandidate);
      const url = embedUrl ? null : sanitizeVideoUrl(streamCandidate);

      return {
        name,
        ...(embedUrl ? { embedUrl } : {}),
        ...(url ? { url } : {}),
      };
    })
    .filter((server) => server.embedUrl || server.url);
}

export function getServerRank(name) {
  const rank = SERVER_PRIORITY_KEYS.indexOf(String(name).toUpperCase());
  return rank === -1 ? SERVER_PRIORITY_KEYS.length : rank;
}

export function sortServers(servers) {
  return [...sanitizeServers(servers)].sort(
    (a, b) => getServerRank(a.name) - getServerRank(b.name)
  );
}
