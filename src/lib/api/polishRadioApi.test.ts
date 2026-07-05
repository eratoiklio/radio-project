import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    getEpisodes,
    normalizePlaybackUri,
    PolishRadioApiError,
    resolveMedia,
} from "./polishRadioApi";

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL =
        "https://cms-gateway.polskieradio.pl/dev-proxy";
    delete process.env.POLISH_RADIO_MEDIA_CDN_BASE_URL;
    vi.stubGlobal("fetch", fetchMock);
});

describe("getEpisodes", () => {
    const episode = {
        id: "episode-1",
        title: "Episode",
        slug: "episode",
        podcastSlug: "podcast",
        podcastTitle: "Podcast",
        audioDuration: 120,
        videoDuration: null,
        externalAudioId: "audio-id",
        externalVideoId: null,
        mainImage: null,
    };

    it("uses the requested page size and returns API pagination", async () => {
        fetchMock.mockResolvedValueOnce(
            new Response(
                JSON.stringify({
                    data: [episode],
                    total: 30,
                    pageNumber: 1,
                    pageSize: 5,
                    totalPages: 6,
                }),
                { status: 200 },
            ),
        );

        await expect(getEpisodes({ pageNumber: 1, pageSize: 5 })).resolves.toEqual({
            items: [episode],
            hasNextPage: true,
            nextPage: { pageNumber: 2, pageSize: 5 },
        });

        expect(fetchMock).toHaveBeenCalledWith(
            "https://cms-gateway.polskieradio.pl/dev-proxy/podcast-episodes/read-models?pageNumber=1&pageSize=5",
            { cache: "no-store" },
        );
    });

    it("reports the final page", async () => {
        fetchMock.mockResolvedValueOnce(
            new Response(
                JSON.stringify({
                    data: [],
                    total: 10,
                    pageNumber: 2,
                    pageSize: 10,
                    totalPages: 2,
                }),
            ),
        );

        await expect(getEpisodes({pageNumber: 2,
            pageSize: 10})).resolves.toEqual({
            items: [],
            hasNextPage: false,
            nextPage: undefined,
        });
    });


    it("throws a useful error for an upstream failure", async () => {
        fetchMock.mockResolvedValueOnce(
            new Response("upstream unavailable", {
                status: 503,
                statusText: "Service Unavailable",
            }),
        );

        await expect(getEpisodes({pageNumber: 1,
            pageSize: 10})).rejects.toMatchObject({
            name: "PolishRadioApiError",
            status: 503,
            message: expect.stringContaining("fetch podcast episodes"),
        });
    });

    it("rejects an invalid response shape", async () => {
        fetchMock.mockResolvedValueOnce(
            new Response(JSON.stringify({ items: [] })),
        );

        await expect(getEpisodes({pageNumber: 1,
            pageSize: 10})).rejects.toBeInstanceOf(PolishRadioApiError);
    });

    it("rejects an episode without its required id", async () => {
        fetchMock.mockResolvedValueOnce(
            new Response(
                JSON.stringify({
                    data: [{ ...episode, id: "" }],
                    total: 1,
                    pageNumber: 1,
                    pageSize: 10,
                    totalPages: 1,
                }),
            ),
        );

        await expect(getEpisodes({pageNumber: 1,
            pageSize: 10})).rejects.toBeInstanceOf(PolishRadioApiError);
    });
});

describe("resolveMedia", () => {
    const asset = {
        id: "audio-id",
        title: "Audio title",
        uri: "https://example.test/audio.wav",
        durationSeconds: 120,
        transcription: { vttUri: "https://example.test/transcription.vtt" },
    };

    it("resolves an audio DTO without renaming API fields", async () => {
        fetchMock.mockResolvedValueOnce(
            new Response(JSON.stringify({ data: asset })),
        );

        await expect(
            resolveMedia({ externalAudioId: "audio/id" }),
        ).resolves.toEqual({
            type: "audio",
            asset,
            playbackUri: "https://cdn6.polskieradio.pl/audio.mp3",
            subtitleUri: "https://cdn6.polskieradio.pl/transcription.vtt",
        });
        expect(fetchMock).toHaveBeenCalledWith(
            "https://cms-gateway.polskieradio.pl/dev-proxy/audio/audio%2Fid",
            { cache: "no-store" },
        );
    });

    it("uses video when audio is absent", async () => {
        fetchMock.mockResolvedValueOnce(
            new Response(JSON.stringify({ data: { ...asset, id: "video-id" } })),
        );

        await expect(
            resolveMedia({ externalVideoId: "video-id" }),
        ).resolves.toMatchObject({
            type: "video",
            asset: { uri: asset.uri },
            playbackUri: "https://cdn6.polskieradio.pl/audio.wav",
        });
    });

    it("keeps the raw DTO URI and uses a configured CDN for playback", async () => {
        process.env.POLISH_RADIO_MEDIA_CDN_BASE_URL =
            "https://media.example.test/polish-radio";
        fetchMock.mockResolvedValueOnce(
            new Response(JSON.stringify({ data: asset })),
        );

        const result = await resolveMedia({ externalAudioId: "audio-id" });

        expect(result.asset.uri).toBe("https://example.test/audio.wav");
        expect(result.playbackUri).toBe(
            "https://media.example.test/polish-radio/audio.mp3",
        );
        expect(result.subtitleUri).toBe(
            "https://media.example.test/polish-radio/transcription.vtt",
        );
    });

    it("requires at least one external media ID", async () => {
        await expect(resolveMedia({})).rejects.toThrow(
            "requires externalAudioId or externalVideoId",
        );
    });

    it("rejects an asset without uri", async () => {
        fetchMock.mockResolvedValueOnce(
            new Response(JSON.stringify({ data: { ...asset, uri: undefined } })),
        );

        await expect(
            resolveMedia({ externalAudioId: "audio-id" }),
        ).rejects.toThrow("invalid audio media asset");
    });

    it("treats a null transcription as missing subtitles", async () => {
        fetchMock.mockResolvedValueOnce(
            new Response(
                JSON.stringify({ data: { ...asset, transcription: null } }),
            ),
        );

        const result = await resolveMedia({ externalAudioId: "audio-id" });

        expect(result.asset.uri).toBe(asset.uri);
        expect(result.asset.transcription).toBeNull();
        expect(result.subtitleUri).toBeNull();
    });
});

describe("normalizePlaybackUri", () => {
    it("replaces the origin and converts an audio WAV path to MP3", () => {
        expect(
            normalizePlaybackUri(
                "https://cdn6.polskieradio.pl/cms/dev/audio.wav?token=1",
                "audio",
            ),
        ).toBe("https://cdn6.polskieradio.pl/cms/dev/audio.mp3?token=1");
    });

    it("does not change a video file extension", () => {
        expect(
            normalizePlaybackUri(
                "https://cdn6.polskieradio.pl/cms/dev/video.m3u8",
                "video",
            ),
        ).toBe("https://cdn6.polskieradio.pl/cms/dev/video.m3u8");
    });
});
