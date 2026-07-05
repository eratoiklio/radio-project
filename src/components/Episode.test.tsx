import {fireEvent, render, screen} from "@testing-library/react";
import {describe, expect, it, vi} from "vitest";
import {Episode} from "./Episode";

import {EpisodeRm} from "@/lib/types/episode";

const playableEpisode: EpisodeRm = {
    id: "episode-1",
    title: "Testowy odcinek",
    podcastTitle: "Testowy podcast",
    podcastSlug: "testowy-podcast",
    slug: "testowy-odcinek",
    audioDuration: 65,
    videoDuration: 65,
    externalAudioId: "audio-id",
    externalVideoId: "video-id",
    mainImage: {
        title: "Opis okładki",
        uri: "https://example.test/image.jpg",
    },
};

describe("Episode", () => {
    it("renders episode metadata and the production link", () => {
        render(<Episode index={1} episode={playableEpisode} onPlay={vi.fn()}/>);

        expect(
            screen.getByRole("link", {name: "Testowy odcinek"}),
        ).toHaveAttribute(
            "href",
            "https://www.polskieradio.pl/podcasty/testowy-podcast/testowy-odcinek",
        );
        expect(screen.getByText("Testowy podcast")).toBeInTheDocument();
        expect(screen.getByText("1:05 · audio + video")).toBeInTheDocument();
        expect(screen.getByAltText("Opis okładki")).toHaveAttribute(
            "src",
            playableEpisode.mainImage?.uri,
        );
    });
});