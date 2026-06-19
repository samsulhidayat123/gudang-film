import Link from "next/link";
import UniversalPlayer from "@/components/UniversalPlayer";
import { checkIdflixEpisodePlayback } from "@/lib/idflixPlayback";
import { getContentByTargetIdAndType } from "@/lib/movies";
import { createVidSrcEpisodeServers } from "@/lib/vidsrc";
import { searchTmdbTvId, slugToSearchTitle } from "@/lib/tmdb";
import { sortServers } from "@/lib/playerSecurity";

function findEpisode(item, seasonNumber, episodeNumber) {
  const episodes = Array.isArray(item?.episodes) ? item.episodes : [];

  return episodes.find((episode) => {
    const sameEpisode = Number(episode.episodeNumber) === Number(episodeNumber);
    const sameSeason = Number(episode.seasonNumber || 1) === Number(seasonNumber || 1);
    return sameEpisode && sameSeason;
  });
}

function isValidVidSrcId(id) {
  if (!id) return false;
  const value = String(id).trim();
  return /^tt\d+$/i.test(value) || /^\d+$/.test(value);
}

async function getVidSrcTvId(id, item) {
  const candidates = [
    item?.vidsrcId,
    item?.imdbId,
    item?.tmdbId,
    id,
  ];

  const directId = candidates.find(isValidVidSrcId);
  if (directId) return String(directId).trim();

  const title = item?.title || item?.name || item?.slug || id;
  if (title) {
    const tmdbId = await searchTmdbTvId(slugToSearchTitle(title));
    if (tmdbId) {
      console.log("Resolved TMDB TV ID:", { title, tmdbId });
      return tmdbId;
    }
  }
  return null;
}

function mergeServers(...serverGroups) {
  const seen = new Set();
  return serverGroups
    .flat()
    .filter(Boolean)
    .filter((server) => {
      const key = server.embedUrl || server.url || server.name;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function serversOf(value) {
  return Array.isArray(value) ? value : [];
}

export default async function EpisodePlayerPage({
  type,
  id,
  season = 1,
  episode,
}) {
  let item = await getContentByTargetIdAndType(id, type).catch((error) => {
    console.error(`Fetch ${type} from MongoDB error:`, error.message);
    return null;
  });

  // Fallback untuk TMDB yang belum masuk ke database
  if (!item && id) {
    item = { title: slugToSearchTitle(id) || id, slug: id, type: type };
  }

  if (!item) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-black p-6 text-center text-white">
        <h1 className="mb-3 text-3xl font-black uppercase">Konten tidak ditemukan</h1>
        <Link
          href="/"
          className="rounded-sm bg-red-600 px-6 py-3 text-sm font-bold uppercase tracking-widest text-white hover:bg-red-500"
        >
          Kembali
        </Link>
      </main>
    );
  }

  const episodeData = findEpisode(item, season, episode);
  const storedEpisodeServers = serversOf(episodeData?.playbackServers);
  const storedItemServers = serversOf(item?.playbackServers);
  
  let idflixServers = [];
  let playbackStatus = "no_server";
  
  if (episodeData?.episodeId) {
    const playback = await checkIdflixEpisodePlayback(type, episodeData.episodeId).catch(() => ({}));
    idflixServers = playback?.playbackServers || [];
    playbackStatus = playback?.playbackStatus || "no_server";
  }
  const vidsrcTvId = await getVidSrcTvId(id, item);
  const vidsrcServers = createVidSrcEpisodeServers(vidsrcTvId, season, episode);
  const finalServers = sortServers(
    mergeServers(
      storedEpisodeServers,
      storedItemServers,
      idflixServers,
      vidsrcServers
    )
  );

  const backHref = `/${type}/${item.slug}`;
  const title = `${item.title} Episode ${episode}`;

  return (
    <main className="min-h-screen bg-black p-4 text-white md:p-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href={backHref}
          className="mb-6 inline-flex text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-white"
        >
          Back to details
        </Link>

        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-2xl font-black md:text-4xl">{title}</h1>
          <span className="rounded-sm border border-zinc-800 px-3 py-1 text-xs font-black uppercase tracking-widest text-zinc-400">
            {finalServers.length > 0 ? "available" : playbackStatus}
          </span>
        </div>

        <UniversalPlayer
          servers={finalServers}
          directSources={[]}
          title={title}
          sourceUrl={null}
        />
      </div>
    </main>
  );
}
