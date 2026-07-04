"use client"

import {EpisodeList} from "@/components/EpisodeList";
import {EpisodesPage, GetEpisodesOptions} from "@/lib/api/polishRadioApi";
import {useState} from "react";
import {loadMoreEpisodes} from "@/app/actions";

interface PodcastBrowserProps {
    episodesPage: EpisodesPage;
}

export function PodcastBrowser({episodesPage}: PodcastBrowserProps) {
    const [episodes, setEpisodes] = useState(episodesPage.items);
    const [hasNextPage, setHasNextPage] = useState(episodesPage.hasNextPage);
    const [nextPage, setNextPage] = useState<GetEpisodesOptions | undefined>(
        episodesPage.nextPage,
    );
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [loadMoreError, setLoadMoreError] = useState(false);
    const canShowMore = hasNextPage && nextPage !== undefined;

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

            <div className="min-w-0">
                {episodes.length === 0 ? (
                    <p className="text-zinc-600 dark:text-zinc-400">
                        Brak dostępnych odcinków.
                    </p>
                ) : (
                    <EpisodeList episodes={episodes}/>
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