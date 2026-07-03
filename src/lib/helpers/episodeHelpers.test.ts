import { describe, expect, it } from "vitest";
import {
    buildEpisodePageUrl,
    formatDuration,
    getAvailableMediaKinds,
    hasAudio,
    hasVideo,
} from "./episodeHelpers";
import type { EpisodeRm } from "../types/episode";

describe("episodeHelpers", () => {
    it("builds a production URL from API slugs", () => {
        expect(
            buildEpisodePageUrl({
                podcastSlug: "nazwa-podcastu",
                slug: "nazwa-odcinka",
            }),
        ).toBe(
            "https://www.polskieradio.pl/podcasty/nazwa-podcastu/nazwa-odcinka",
        );
    });

    it.each([
        [{ slug: "episode" }, null],
        [{ podcastSlug: "podcast" }, null],
        [{ podcastSlug: "", slug: "episode" }, null],
    ] satisfies Array<
        [Partial<Pick<EpisodeRm, "podcastSlug" | "slug">>, null]
    >)(
        "returns null when a slug is missing",
        (episode, expected) => {
            expect(buildEpisodePageUrl(episode)).toBe(expected);
        },
    );

    it("detects available media and ignores blank IDs", () => {
        const episode = {
            externalAudioId: " audio-id ",
            externalVideoId: " ",
        };

        expect(hasAudio(episode)).toBe(true);
        expect(hasVideo(episode)).toBe(false);
        expect(getAvailableMediaKinds(episode)).toEqual(["audio"]);
    });

    it("returns audio and video in a stable order", () => {
        expect(
            getAvailableMediaKinds({
                externalAudioId: "audio-id",
                externalVideoId: "video-id",
            }),
        ).toEqual(["audio", "video"]);
    });

    it.each([
        [undefined, "0:00"],
        [-1, "0:00"],
        [65.9, "1:05"],
        [3661, "1:01:01"],
    ])("formats duration %s as %s", (seconds, expected) => {
        expect(formatDuration(seconds)).toBe(expected);
    });
});
