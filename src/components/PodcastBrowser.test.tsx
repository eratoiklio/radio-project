import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EpisodesPage } from "@/lib/api/polishRadioApi";
import type { EpisodeRm } from "@/lib/types/episode";
import { PodcastBrowser } from "./PodcastBrowser";

const loadMoreEpisodesMock = vi.fn();

vi.mock("../app/actions", () => ({
    loadMoreEpisodes: (...args: unknown[]) => loadMoreEpisodesMock(...args),
}));

function episode(index: number): EpisodeRm {
    return {
        id: `episode-${index}`,
        title: `Odcinek ${index}`,
        slug: `odcinek-${index}`,
        podcastSlug: "podcast",
        podcastTitle: "Podcast",
        audioDuration: 60,
        videoDuration: null,
        externalAudioId: `audio-${index}`,
        externalVideoId: null,
        mainImage: null,
    };
}

beforeEach(() => {
    loadMoreEpisodesMock.mockReset();
});

describe("PodcastBrowser", () => {

    it("shows all episodes from the loaded page", () => {
        const page: EpisodesPage = {
            items: Array.from({ length: 10 }, (_, index) => episode(index + 1)),
            hasNextPage: false,
        };
        render(<PodcastBrowser episodesPage={page} />);

        expect(screen.getByText("Odcinek 10")).toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: "Pokaż więcej" }),
        ).not.toBeInTheDocument();
        expect(loadMoreEpisodesMock).not.toHaveBeenCalled();
    });

    it("loads and appends the next API page", async () => {
        const page: EpisodesPage = {
            items: Array.from({ length: 10 }, (_, index) => episode(index + 1)),
            hasNextPage: true,
            nextPage: { pageNumber: 2, pageSize: 10 },
        };
        loadMoreEpisodesMock.mockResolvedValueOnce({
            items: [episode(11)],
            hasNextPage: false,
        });
        render(<PodcastBrowser episodesPage={page} />);

        fireEvent.click(screen.getByRole("button", { name: "Pokaż więcej" }));

        await screen.findByText("Odcinek 11");
        expect(loadMoreEpisodesMock).toHaveBeenCalledWith(page.nextPage);
    });

    it("shows a retryable message when loading another page fails", async () => {
        const page: EpisodesPage = {
            items: Array.from({ length: 10 }, (_, index) => episode(index + 1)),
            hasNextPage: true,
            nextPage: { pageNumber: 2, pageSize: 10 },
        };
        loadMoreEpisodesMock.mockRejectedValueOnce(new Error("network"));
        render(<PodcastBrowser episodesPage={page} />);

        fireEvent.click(screen.getByRole("button", { name: "Pokaż więcej" }));

        await waitFor(() =>
            expect(
                screen.getByText(/Nie udało się pobrać kolejnych odcinków/),
            ).toBeInTheDocument(),
        );
        expect(
            screen.getByRole("button", { name: "Pokaż więcej" }),
        ).toBeEnabled();
    });
});
