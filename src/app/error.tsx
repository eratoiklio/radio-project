"use client";

interface ErrorPageProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function ErrorPage({ reset }: ErrorPageProps) {
    return (
        <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-10 sm:px-10">
            <section
                className="w-full rounded-lg border border-red-200 bg-red-50 p-6 text-red-950 dark:border-red-900 dark:bg-red-950 dark:text-red-50"
                role="alert"
            >
                <h1 className="text-2xl font-semibold">Nie udało się pobrać odcinków</h1>
                <p className="mt-2">
                    Serwis Polskiego Radia jest chwilowo niedostępny. Spróbuj ponownie.
                </p>
                <button
                    type="button"
                    onClick={reset}
                    className="mt-6 rounded-md bg-red-900 px-4 py-2 font-medium text-white hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-900 dark:bg-red-100 dark:text-red-950 dark:hover:bg-white"
                >
                    Ponów próbę
                </button>
            </section>
        </main>
    );
}
