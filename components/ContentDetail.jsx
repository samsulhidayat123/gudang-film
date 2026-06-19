import Link from "next/link";
import { getTypeLabel } from "@/lib/contentRoutes";
import { getPosterUrl } from "@/lib/poster";
import PlaybackRefreshButton from "@/components/PlaybackRefreshButton";

function releaseYearOf(item) {
  if (item?.year) return item.year;
  if (!item?.releaseDate) return "N/A";

  const year = new Date(item.releaseDate).getFullYear();
  return Number.isFinite(year) ? year : "N/A";
}

function episodeCountOf(item) {
  if (Array.isArray(item?.episodes) && item.episodes.length > 0) {
    return Math.min(item.episodes.length, 120);
  }

  const count = Number(item?.totalEpisodes || item?.chapterCount || 0);
  if (Number.isFinite(count) && count > 0) return Math.min(count, 60);

  const hasPlayableIdentity = Boolean(
    item?.vidsrcId ||
      item?.tmdbId ||
      item?.imdbId ||
      item?.target_id ||
      item?.targetId ||
      item?.slug ||
      item?.id ||
      item?.source === "tmdb"
  );
  return hasPlayableIdentity ? 1 : 0;
}

function genresOf(item) {
  return Array.isArray(item?.genres) ? item.genres : item?.tags || [];
}

function playableLabel(item, serverCount, episodeCount) {
  const hasExternalId = Boolean(item.vidsrcId || item.tmdbId || item.imdbId || item.source === "tmdb");
  const playable =
    item.type === "movie"
      ? item.playable === true || serverCount > 0 || hasExternalId
      : episodeCount > 0 || item.playable === true;

  return playable ? "Bisa Play" : "Belum Tersedia";
}

function groupedEpisodesOf(item, episodeCount) {
  const episodes = Array.isArray(item.episodes) ? item.episodes : [];
  const source =
    episodes.length > 0
      ? episodes
      : Array.from({ length: episodeCount }, (_, index) => ({
          episodeNumber: index + 1,
          seasonNumber: 1,
          generated: true,
        }));

  return source.reduce((groups, episode) => {
    const seasonNumber = episode.seasonNumber || 1;
    const current = groups.get(seasonNumber) || [];
    current.push(episode);
    groups.set(seasonNumber, current);
    return groups;
  }, new Map());
}

function watchIdOf(item) {
  return (
    item.playbackTargetId ||
    item.target_id ||
    item.targetId ||
    item.vidsrcId ||
    item.tmdbId ||
    item.imdbId ||
    item.id ||
    item.slug ||
    item._id
  );
}

function watchTypeOf(item) {
  if (item.type === "series") return "series";
  if (["anime", "dracin", "kdrama", "netflix"].includes(item.type)) {
    return item.type;
  }
  return "series";
}

function isEpisodePlayable(episode) {
  if (!episode || episode.generated) return false;
  if (episode.playable === false) return false;

  return !["blocked", "missing_source", "no_server"].includes(
    String(episode.playbackStatus || "")
  );
}

export default function ContentDetail({ item, expectedType }) {
  const typeLabel = getTypeLabel(item.type);
  const releaseYear = releaseYearOf(item);
  const genres = genresOf(item);
  const episodeCount = episodeCountOf(item);
  const isMovie = ["movie", "film_indo"].includes(item.type);
  const isCineb = item.source === "cineb";
  const poster = getPosterUrl(item.poster, "/placeholder.png");
  const sourceUrl = item.detail_url || item.source_url || item.playbackSourceUrl || null;
  const watchTargetId = watchIdOf(item);
  const serverCount = Array.isArray(item.playbackServers)
    ? item.playbackServers.length
    : 0;
  const statusLabel = playableLabel(item, serverCount, episodeCount);
  const canPlayMovie = isMovie && Boolean(watchTargetId);
  const episodeGroups = groupedEpisodesOf(item, episodeCount);
  const metadata = [
    ["Tipe", typeLabel],
    ["Status", statusLabel],
    ["Rilis", releaseYear],
    item.quality ? ["Kualitas", item.quality] : null,
    item.rating ? ["Rating", Number(item.rating).toFixed(1)] : null,
    isMovie ? ["Server", `${serverCount} tersedia`] : ["Episode", `${episodeCount} tersedia`],
    item.source ? ["Sumber", item.source] : null,
  ].filter(Boolean);

  return (
    <main className="min-h-screen bg-black p-4 text-white md:p-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="mb-8 inline-flex text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-white"
        >
          Back to Home
        </Link>

        <section className="grid gap-8 md:grid-cols-[280px_1fr] md:items-center">
          <div className="relative aspect-[2/3] overflow-hidden rounded-md bg-[#181818] shadow-2xl">
            <img
              src={poster}
              alt={item.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>

          <div>
            <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-gray-400">
              <span className="rounded-sm bg-red-600 px-2 py-1 text-xs font-black uppercase text-white">
                {typeLabel}
              </span>
              <span
                className={`rounded-sm px-2 py-1 text-xs font-black uppercase text-white ${
                  statusLabel === "Bisa Play" ? "bg-emerald-600" : "bg-zinc-700"
                }`}
              >
                {statusLabel}
              </span>
              {item.playbackStatus && (
                <span className="rounded-sm border border-white/10 px-2 py-1 text-xs uppercase">
                  {item.playbackStatus}
                </span>
              )}
            </div>

            <h1 className="mb-6 break-words text-3xl font-black uppercase leading-tight sm:text-4xl md:text-6xl">
              {item.title}
            </h1>

            {genres.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-2">
                {genres.slice(0, 8).map((genre) => (
                  <span
                    key={genre}
                    className="rounded-sm border border-zinc-700 px-3 py-1 text-xs font-bold uppercase text-zinc-300"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            <dl className="mb-7 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {metadata.map(([label, value]) => (
                <div
                  key={label}
                  className="border border-zinc-800 bg-[#111] px-3 py-2"
                >
                  <dt className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    {label}
                  </dt>
                  <dd className="mt-1 truncate text-sm font-bold text-zinc-100">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>

            {isMovie ? (
              <div>
                {canPlayMovie ? (
                  <Link
                    href={`/watch/movie/${watchTargetId}?slug=${item.slug}`}
                    className="inline-flex min-h-12 items-center rounded-sm bg-red-600 px-8 text-sm font-black uppercase tracking-widest text-white hover:bg-red-500"
                  >
                    Watch Now
                  </Link>
                ) : item.source === "tmdb" ? (
                  <div className="space-y-4">
                    {item.trailer_url ? (
                      <div className="overflow-hidden rounded-md border border-gray-800">
                        <div className="aspect-video w-full">
                          <iframe
                            src={item.trailer_url}
                            title={`${item.title} - Trailer`}
                            className="h-full w-full"
                            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                            allowFullScreen
                            loading="lazy"
                          />
                        </div>
                      </div>
                    ) : (
                      <a
                        href={`https://www.themoviedb.org/tv/${item.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-12 items-center rounded-sm bg-blue-600 px-8 text-sm font-black uppercase tracking-widest text-white hover:bg-blue-500"
                      >
                        Lihat di TMDB
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="inline-flex rounded-sm border border-zinc-700 px-6 py-3 text-sm font-black uppercase tracking-widest text-zinc-400">
                      Player belum tersedia: {item.playbackStatus || "metadata_only"}
                  {watchTargetId && (
                    <Link
                      href={`/watch/movie/${watchTargetId}`}
                      className="mt-4 inline-flex rounded-sm bg-red-600 px-6 py-3 text-sm font-black uppercase tracking-widest text-white transition hover:bg-red-700"
                    >
                      Nonton Sekarang
                    </Link>
                  )}
                    </div>
                    {sourceUrl && (
                      <a
                        href={sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="inline-flex min-h-12 items-center rounded-sm bg-zinc-800 px-6 text-sm font-black uppercase tracking-widest text-white hover:bg-zinc-700"
                      >
                        Lihat sumber
                      </a>
                    )}
                  </div>
                )}
                {!isCineb && (item.source !== "tmdb" || Boolean(watchTargetId)) && (
                  <PlaybackRefreshButton targetId={item.target_id} />
                )}
              </div>
            ) : item.source === "tmdb" && !watchTargetId && episodeCount === 0 ? (
              <div className="space-y-4">
                {item.overview && (
                  <p className="max-w-2xl text-sm leading-6 text-zinc-300">
                    {item.overview}
                  </p>
                )}
                {item.trailer_url ? (
                  <div className="overflow-hidden rounded-md border border-gray-800">
                    <div className="aspect-video w-full">
                      <iframe
                        src={item.trailer_url}
                        title={`${item.title} - Trailer`}
                        className="h-full w-full"
                        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                        allowFullScreen
                        loading="lazy"
                      />
                    </div>
                  </div>
                ) : (
                  <a
                    href={`https://www.themoviedb.org/tv/${item.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-12 items-center rounded-sm bg-blue-600 px-8 text-sm font-black uppercase tracking-widest text-white hover:bg-blue-500"
                  >
                    Lihat di TMDB
                  </a>
                )}
              </div>
            ) : (
              <div className="rounded-sm border border-zinc-800 bg-zinc-950 p-5">
                <p className="text-sm font-bold uppercase tracking-widest text-zinc-300">
                  {episodeCount} episode tersedia
                </p>
                <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500">
                  Pilih episode di bawah untuk membuka player {expectedType || typeLabel.toLowerCase()}.
                </p>
              </div>
            )}
          </div>
        </section>

        {!isMovie && (item.source !== "tmdb" || Boolean(watchTargetId) || episodeCount > 0) && (
          <section className="mt-12">
            <h2 className="mb-5 text-2xl font-black uppercase">Episode</h2>
            {episodeCount > 0 ? (
              <div className="space-y-8">
                {[...episodeGroups.entries()].map(([seasonNumber, episodes]) => (
                  <div key={seasonNumber}>
                    {item.type === "series" && (
                      <h3 className="mb-3 text-sm font-black uppercase tracking-widest text-zinc-400">
                        Season {seasonNumber}
                      </h3>
                    )}

                    <div className="grid grid-cols-3 gap-3 min-[420px]:grid-cols-4 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10">
                      {episodes.map((episode) => {
                        const episodeNumber = episode.episodeNumber;
                        const playable = isEpisodePlayable(episode);
                        const seriesWatchId = watchIdOf(item);

                        const resolvedSeriesWatchId =
                          String(seriesWatchId || "").includes("euphoria")
                            ? "tt8772296"
                            : seriesWatchId;

                        const safeSeriesWatchId = encodeURIComponent(
                          String(resolvedSeriesWatchId || "")
                        );

                        const watchType = watchTypeOf(item);
                        const href =
                          watchType === "series"
                            ? `/watch/series/${safeSeriesWatchId}/${seasonNumber}/${episodeNumber}`
                            : `/watch/${watchType}/${safeSeriesWatchId}/${episodeNumber}`;
                        const className =
                          "flex aspect-video min-h-12 items-center justify-center rounded-sm border text-sm font-black transition";

                        if (!playable) {
                          return (
                            <Link
                              key={`${seasonNumber}-${episodeNumber}`}
                              href={href}
                              className={`${className} border-yellow-700/60 bg-yellow-950/30 text-yellow-400 hover:border-yellow-500 hover:bg-yellow-900/40 hover:text-yellow-200`}
                              title="Coba buka via VidSrc"
                            >
                              {episodeNumber}
                            </Link>
                          );
                        }

                        return (
                          <Link
                            key={`${seasonNumber}-${episodeNumber}`}
                            href={href}
                            className={`${className} border-zinc-800 bg-[#111] text-zinc-200 hover:border-red-600 hover:bg-red-600`}
                          >
                            {episodeNumber}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-zinc-800 bg-[#111] p-6 text-sm text-zinc-500">
                Data episode belum tersedia di MongoDB.
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
