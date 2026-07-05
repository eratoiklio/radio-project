"use client"

import {EpisodeList} from "@/components/EpisodeList";
import {EpisodesPage, GetEpisodesOptions} from "@/lib/api/polishRadioApi";
import {useRef, useState} from "react";
import {loadMoreEpisodes} from "@/app/actions";
import {MediaPlayer} from "@/components/MediaPlayer";
import {EpisodeRm} from "@/lib/types/episode";
import {EpisodeMediaKind} from "@/lib/helpers/episodeHelpers";
import {ResolvedMedia} from "@/lib/types/media";

interface PodcastBrowserProps {
    episodesPage: EpisodesPage;
}

export function PodcastBrowser({episodesPage}: PodcastBrowserProps) {
    const [episodes, setEpisodes] = useState(episodesPage.items);
    const [hasNextPage, setHasNextPage] = useState(episodesPage.hasNextPage);
    const [nextPage, setNextPage] = useState<GetEpisodesOptions | undefined>(
        episodesPage.nextPage,
    );
    const [activeEpisode, setActiveEpisode] = useState<EpisodeRm | null>(null);
    const [activeFormat, setActiveFormat] =
        useState<EpisodeMediaKind>("audio");
    const [resolvedMedia, setResolvedMedia] = useState<ResolvedMedia | null>(null);
    const [isLoadingMedia, setIsLoadingMedia] = useState(false);
    const [mediaError, setMediaError] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [loadMoreError, setLoadMoreError] = useState(false);
    const mediaRequest = useRef<AbortController | null>(null);
    const canShowMore = hasNextPage && nextPage !== undefined;

    async function resolveEpisodeMedia(
        episode: EpisodeRm,
        preferredKind: EpisodeMediaKind,
    ) {
        mediaRequest.current?.abort();
        const controller = new AbortController();
        mediaRequest.current = controller;
        const query = new URLSearchParams({ preferredKind });

        if (episode.externalAudioId) {
            query.set("externalAudioId", episode.externalAudioId);
        }
        if (episode.externalVideoId) {
            query.set("externalVideoId", episode.externalVideoId);
        }

        setIsLoadingMedia(true);
        setMediaError(false);
        setResolvedMedia(null);

        try {
            const response = await fetch(`/api/media?${query}`, {
                signal: controller.signal,
            });

            if (!response.ok) {
                setMediaError(true);
                return;
            }

            const media = (await response.json()) as ResolvedMedia;
            setResolvedMedia(media);
            setActiveFormat(media.type);
        } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") {
                return;
            }

            setMediaError(true);
        } finally {
            if (mediaRequest.current === controller) {
                setIsLoadingMedia(false);
            }
        }
    }

    function handlePlay(episode: EpisodeRm) {
        const preferredKind: EpisodeMediaKind = episode.externalVideoId
            ? "video"
            : "audio";

        setActiveEpisode(episode);
        setActiveFormat(preferredKind);
        void resolveEpisodeMedia(episode, preferredKind);
    }

    function handleFormatChange(format: EpisodeMediaKind) {
        if (activeEpisode) {
            setActiveFormat(format);
            void resolveEpisodeMedia(activeEpisode, format);
        }
    }

    async function handleShowMore() {
        setLoadMoreError(false);

        if (!hasNextPage || !nextPage) {
            return;
        }

        setIsLoadingMore(true);

        try {
            const result = await loadMoreEpisodes(nextPage);
            setEpisodes((current) => [...current, ...result.items]);
            setHasNextPage(result.hasNextPage);
            setNextPage(result.nextPage);
        } catch {
            setLoadMoreError(true);
        } finally {
            setIsLoadingMore(false);
        }
    }

    return (
        <section aria-labelledby="episodes-heading">
            <h2 id="episodes-heading" className="mb-5 text-xl font-semibold">
                Odcinki
            </h2>
            {resolvedMedia && <MediaPlayer
                          resolvedMedia={resolvedMedia}
                          hasAudio={Boolean(activeEpisode?.externalAudioId)}
                          hasVideo={Boolean(activeEpisode?.externalVideoId)}
                          activeFormat={activeFormat}
                          onFormatChange={handleFormatChange}/>}
            <div className="min-w-0">
                {episodes.length === 0 ? (
                    <p className="text-zinc-600 dark:text-zinc-400">
                        Brak dostępnych odcinków.
                    </p>
                ) : (
                    <EpisodeList episodes={episodes} onPlay={handlePlay}/>
                )}

                {loadMoreError && (
                    <p className="mt-4 text-sm text-red-700" role="alert">
                        Nie udało się pobrać kolejnych odcinków. Spróbuj ponownie.
                    </p>
                )}

                {canShowMore && (
                    <button
                        type="button"
                        onClick={handleShowMore}
                        disabled={isLoadingMore}
                        className="mt-6 min-h-11 rounded-md border border-zinc-300 px-5 py-2 font-medium hover:bg-zinc-100 disabled:cursor-wait disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-900"
                    >
                        {isLoadingMore ? "Ładowanie…" : "Pokaż więcej"}
                    </button>
                )}
            </div>
        </section>)
}
