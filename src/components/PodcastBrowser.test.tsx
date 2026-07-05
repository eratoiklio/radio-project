import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EpisodesPage } from "@/lib/api/polishRadioApi";
import type { EpisodeRm } from "@/lib/types/episode";
import { PodcastBrowser } from "./PodcastBrowser";

const loadMoreEpisodesMock = vi.fn();

vi.mock("../app/actions", () => ({
    loadMoreEpisodes: (...args: unknown[]) => loadMoreEpisodesMock(...args),
}));

vi.mock("./MediaPlayerContainer", () => ({
    MediaPlayerContainer: ({
                               title,
                               onReturn,
                           }: {
        title: string;
        onReturn: () => void;
    }) => (
        <div data-testid="wide-media-player">
            {title}
            <button type="button" onClick={onReturn}>
                Powrót
            </button>
        </div>
    ),
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
    it("renders the selected episode in a wide panel above the list", async () => {
        const episodeWithVideo = {
            ...episode(1),
            externalVideoId: "video-1",
        };
        const page: EpisodesPage = {
            items: [episodeWithVideo],
            hasNextPage: false,
        };
        const fetchMock = vi.fn().mockResolvedValueOnce(
            new Response(
                JSON.stringify({
                    type: "video",
                    playbackUri: "https://media.example.test/video.mp4",
                    subtitleUri: null,
                    asset: {
                        id: "video-1",
                        title: "Video",
                        uri: "https://gateway.example.test/video.mp4",
                        durationSeconds: 60,
                    },
                }),
            ),
        );
        vi.stubGlobal(
            "fetch",
            fetchMock,
        );
        render(<PodcastBrowser episodesPage={page} />);

        fireEvent.click(screen.getByRole("button", { name: "Odtwórz" }));

        const panel = await screen.findByTestId("wide-media-player");
        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining("preferredKind=video"),
            expect.objectContaining({ signal: expect.any(AbortSignal) }),
        );
        const list = document.querySelector("ul")!;
        expect(screen.getByTestId("now-playing-panel")).toBeInTheDocument();
        expect(
            panel.compareDocumentPosition(list) &
            Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy();

        await waitFor(() =>
            expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({
                behavior: "smooth",
                block: "start",
            }),
        );

        vi.mocked(HTMLElement.prototype.scrollIntoView).mockClear();
        fireEvent.click(
            screen.getByRole("button", {
                name: "Powrót",
            }),
        );
        expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({
            behavior: "smooth",
            block: "center",
        });
    });

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
