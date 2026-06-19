"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Hls from "hls.js";
import {
  getVideoSourceKind,
  sanitizeSourceUrl,
  sanitizeVideoUrl,
  sortServers,
} from "@/lib/playerSecurity";

function normalizeServers(servers) {
  const seen = new Set();

  return sortServers(servers).filter((server) => {
    const key = server.embedUrl || server.url;

    if (!key || seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

function DirectVideoPlayer({ src, title }) {
  const videoRef = useRef(null);
  const [error, setError] = useState("");
  const sourceKind = useMemo(() => getVideoSourceKind(src), [src]);

  useEffect(() => {
    const video = videoRef.current;
    const safeSrc = sanitizeVideoUrl(src);
    if (!video || !safeSrc) return undefined;

    setError("");

    if (sourceKind === "hls" && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
      });

      hls.loadSource(safeSrc);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data?.fatal) {
          setError("Stream HLS gagal dimuat.");
        }
      });

      return () => hls.destroy();
    }

    video.src = safeSrc;
    return () => {
      video.removeAttribute("src");
      video.load();
    };
  }, [src, sourceKind]);

  if (!sourceKind || sourceKind === "dash") {
    return (
      <div className="flex aspect-video w-full items-center justify-center bg-[#111] p-6 text-center text-sm font-bold text-zinc-400">
        Format video belum didukung player ini.
      </div>
    );
  }

  return (
    <div className="bg-black">
      <video
        ref={videoRef}
        title={title}
        className="aspect-video w-full bg-black"
        controls
        playsInline
        preload="metadata"
        onError={() => setError("Video gagal dimuat. Coba server lain.")}
      />
      {error && (
        <div className="border-t border-red-950 bg-red-950/30 px-4 py-3 text-sm font-semibold text-red-100">
          {error}
        </div>
      )}
    </div>
  );
}

export default function UniversalPlayer({
  servers,
  directSources,
  title,
  sourceUrl,
}) {
  const playableServers = useMemo(() => normalizeServers(servers), [servers]);
  const playableDirectSources = useMemo(
    () =>
      (directSources || [])
        .map((source) => ({
          name: String(source?.name || "DIRECT").slice(0, 24),
          url: sanitizeVideoUrl(source?.url),
        }))
        .filter((source) => source.url),
    [directSources]
  );
  const safeSourceUrl = useMemo(() => sanitizeSourceUrl(sourceUrl), [sourceUrl]);
  const sources = [
    ...playableServers.map((server) => ({
      type: server.embedUrl ? "embed" : "direct",
      ...server,
    })),
    ...playableDirectSources.map((source) => ({ type: "direct", ...source })),
  ];
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSource = sources[activeIndex];

  useEffect(() => {
    setActiveIndex(0);
  }, [servers, directSources]);

  if (!activeSource) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 bg-[#111] p-6 text-center">
        <p className="text-lg font-bold text-white">Player tidak tersedia</p>
        <p className="max-w-xl text-sm text-gray-400">
          Tidak ada server video yang bisa dimuat untuk film ini.
        </p>
        {safeSourceUrl && (
          <a
            href={safeSourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-sm bg-red-600 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white hover:bg-red-500"
          >
            Buka sumber
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-gray-800 bg-black">
      {activeSource.type === "embed" ? (
        <div className="aspect-video w-full bg-black">
          <iframe
            key={activeSource.embedUrl}
            src={activeSource.embedUrl}
            title={`${title} - ${activeSource.name}`}
            className="h-full w-full"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </div>
      ) : (
        <DirectVideoPlayer src={activeSource.url} title={`${title} - ${activeSource.name}`} />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-900 bg-[#111] px-4 py-3">
        {sources.length > 1 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-sm text-gray-400">Servers:</span>
            {sources.map((source, index) => (
              <button
                key={`${source.type}-${source.name}-${source.embedUrl || source.url}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`rounded-sm px-3 py-1 text-xs font-bold transition-colors ${
                  index === activeIndex
                    ? "bg-red-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {source.name}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Server: {activeSource.name}</p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {activeIndex < sources.length - 1 && (
            <button
              type="button"
              onClick={() => setActiveIndex((index) => index + 1)}
              className="rounded-sm bg-gray-800 px-3 py-1 text-xs font-bold text-gray-300 hover:bg-gray-700"
            >
              Coba server lain
            </button>
          )}

          <a
            href={activeSource.embedUrl || activeSource.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="rounded-sm bg-red-600 px-3 py-1 text-xs font-bold text-white hover:bg-red-500"
          >
            Buka server
          </a>
        </div>
      </div>
    </div>
  );
}
