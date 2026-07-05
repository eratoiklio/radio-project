"use client";

import { useEffect, useRef, useState } from "react";
import { loadMoreEpisodes } from "@/app/actions";
import type {
    EpisodesPage,
    GetEpisodesOptions,
} from "@/lib/api/polishRadioApi";
import type { EpisodeMediaKind } from "@/lib/helpers/episodeHelpers";
import type { EpisodeRm } from "@/lib/types/episode";
import type { ResolvedMedia } from "@/lib/types/media";
import { EpisodeList } from "./EpisodeList";
import { MediaPlayerContainer } from "./MediaPlayerContainer";

interface PodcastBrowserProps {
    episodesPage: EpisodesPage;
}

export function PodcastBrowser({ episodesPage }: PodcastBrowserProps) {
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
    const nowPlayingRef = useRef<HTMLElement>(null);
    const returnScrollPosition = useRef(0);
    const returnEpisodeId = useRef<string | null>(null);

    const canShowMore = hasNextPage && nextPage !== undefined;

    useEffect(() => {
        if (!activeEpisode) {
            return;
        }

        const animationFrame = requestAnimationFrame(() => {
            nowPlayingRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        });

        return () => cancelAnimationFrame(animationFrame);
    }, [activeEpisode]);

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

        returnScrollPosition.current = window.scrollY;
        returnEpisodeId.current = episode.id;
        setActiveEpisode(episode);
        setActiveFormat(preferredKind);
        void resolveEpisodeMedia(episode, preferredKind);
    }

    function returnToEpisode() {
        const episodeElement = returnEpisodeId.current
            ? document.getElementById(
                `episode-card-${returnEpisodeId.current}`,
            )
            : null;

        if (episodeElement) {
            episodeElement.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
            return;
        }

        window.scrollTo({
            top: returnScrollPosition.current,
            behavior: "smooth",
        });
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

            {activeEpisode && (
                <section
                    ref={nowPlayingRef}
                    className="mb-10 scroll-mt-6"
                    aria-labelledby="now-playing-heading"
                    data-testid="now-playing-panel"
                >
                    <div className="mb-4 flex items-start justify-between gap-4">
                        <div>
                            <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
                                Teraz odtwarzane
                            </p>
                            <h3
                                id="now-playing-heading"
                                className="mt-1 text-2xl font-semibold tracking-tight"
                            >
                                {activeEpisode.title}
                            </h3>
                        </div>
                    </div>

                    {isLoadingMedia && (
                        <div
                            className="flex min-h-72 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 p-8 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900"
                            aria-live="polite"
                        >
                            Ładowanie medium…
                        </div>
                    )}

                    {mediaError && (
                        <div
                            className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100"
                            role="alert"
                        >
                            <p>Nie udało się załadować medium.</p>
                            <button
                                type="button"
                                onClick={() =>
                                    resolveEpisodeMedia(activeEpisode, activeFormat)
                                }
                                className="mt-3 min-h-11 rounded-md border border-red-300 px-4 py-2 font-medium dark:border-red-800"
                            >
                                Ponów próbę
                            </button>
                        </div>
                    )}

                    {resolvedMedia && (
                        <MediaPlayerContainer
                            title={activeEpisode.title}
                            resolvedMedia={resolvedMedia}
                            hasAudio={Boolean(activeEpisode.externalAudioId)}
                            hasVideo={Boolean(activeEpisode.externalVideoId)}
                            activeFormat={activeFormat}
                            onFormatChange={handleFormatChange}
                            onReturn={returnToEpisode}
                        />
                    )}
                </section>
            )}

            <div className="min-w-0">
                {episodes.length === 0 ? (
                    <p className="text-zinc-600 dark:text-zinc-400">
                        Brak dostępnych odcinków.
                    </p>
                ) : (
                    <EpisodeList episodes={episodes} onPlay={handlePlay} />
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
        </section>
    );
}
