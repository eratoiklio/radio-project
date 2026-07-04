import {getEpisodes} from "@/lib/api/polishRadioApi";
import {PodcastBrowser} from "@/components/PodcastBrowser";

export default async function Home() {
    const episodesPageData = await getEpisodes({pageNumber: 1, pageSize: 10});
    return (<main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-10 sm:px-10">
            <header className="mb-10 border-b border-zinc-200 pb-6 dark:border-zinc-800">
                <h1 className="text-3xl font-semibold tracking-tight">Polskie Radio</h1>
                <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                    Przeglądaj najnowsze odcinki podcastów.
                </p>
            </header>
            <PodcastBrowser episodesPage={episodesPageData} />
        </main>
    );
}
