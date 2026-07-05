"use client";

import {EpisodeRm} from "@/lib/types/episode";
import {buildEpisodePageUrl, formatDuration, getAvailableMediaKinds} from "@/lib/helpers/episodeHelpers";

type EpisodeProps = {
    episode: EpisodeRm;
    onPlay: (episode: EpisodeRm) => void;
    index: number;
}

function getMediaLabel(episode: EpisodeRm): string {
    const mediaKinds = getAvailableMediaKinds(episode);

    if (mediaKinds.length === 0) {
        return "Brak mediów";
    }

    return mediaKinds.join(" + ");
}

export function Episode({episode, onPlay}: EpisodeProps) {
    const episodePageUrl = buildEpisodePageUrl(episode);
    const mediaLabel = getMediaLabel(episode);
    const hasMedia = mediaLabel.length > 0;
    return <>
        <div
            className="aspect-square w-20 shrink-0 overflow-hidden rounded-md bg-zinc-100 sm:w-24 dark:bg-zinc-900">
            {episode.mainImage ? (
                <img src={episode.mainImage?.uri}
                     alt={episode.mainImage?.title}
                     className="h-full w-full pbject-cover"
                     loading="lazy"/>
            ) : (
                <div className="flex h-full items-center justify-center text-xs text-zinc-500"
                     aria-label="Brak miniatury"
                >
                    Brak zdjęcia
                </div>
            )}
        </div>

        <div className="min-w-0 flex-1">
            <p className="text-sm text-zinc-500">
                {episode.podcastTitle ?? "Podcast Polskiego Radia"}
            </p>
            <h3 className="mt-1 wrap-break-word font-medium">
                {episodePageUrl ? (
                    <a
                        href={episodePageUrl}
                        className="hover:underline"
                        rel="noopener norefferrer">
                        {episode.title ?? "Odcinek bez tytułu"}
                    </a>) : (
                    <span>{episode.title ?? "Odcinek bez tytułu"}</span>
                )}
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                {formatDuration(episode.audioDuration ?? episode.videoDuration)}{" "}
                · {mediaLabel}
            </p>
            <button
                type="button"
                onClick={() => onPlay(episode)}
                disabled={!hasMedia}
                className="mt-3 min-h-11 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500">
                Odtwórz
            </button>
        </div>
    </>;
}