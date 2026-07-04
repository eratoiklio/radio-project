export default function Loading() {
    return (
        <main
            className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-10 sm:px-10"
            aria-busy="true"
            aria-live="polite"
        >
            <header className="mb-10 border-b border-zinc-200 pb-6 dark:border-zinc-800">
                <h1 className="text-3xl font-semibold tracking-tight">Polskie Radio</h1>
                <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                    Ładowanie listy odcinków…
                </p>
            </header>

            <section aria-label="Ładowanie odcinków">
                <div className="mb-5 h-7 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                <ul className="grid gap-4" aria-hidden="true">
                    {Array.from({ length: 10 }, (_, index) => (
                        <li
                            key={index}
                            className="h-32 animate-pulse rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
                        />
                    ))}
                </ul>
            </section>
        </main>
    );
}
