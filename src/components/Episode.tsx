import {EpisodeRm} from "@/lib/types/episode";

type EpisodeProps = {
    episode: EpisodeRm,
    index: number
}

export function Episode({episode, index}: EpisodeProps) {
    const productionUrl = `https://www.polskieradio.pl/podcasty/${episode.podcastSlug}/${episode.slug}`
    return <>
        <div
            className="aspect-square w-20 shrink-0 overflow-hidden rounded-md bg-zinc-100 sm:w-24 dark:bg-zinc-900">
            {episode.mainImage?.uri ? (
                <img src={episode.mainImage.uri}
                     alt={episode.mainImage.title}
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
                {productionUrl ? (
                    <a
                        href={productionUrl}
                        className="hover:underline"
                        rel="noopener norefferrer">
                        {episode.title ?? "Odcinek bez tytułu"}
                    </a>) : (
                    <span>{episode.title ?? "Odcinek bez tytułu"}</span>
                )}
            </h3>
        </div>
    </>
}