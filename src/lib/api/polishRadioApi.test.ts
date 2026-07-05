import {beforeEach, describe, expect, it, vi} from "vitest";
import {getEpisodes, PolishRadioApiError,} from "./polishRadioApi";

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL =
        "https://cms-gateway.polskieradio.pl/dev-proxy";
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

        await expect(getEpisodes({pageNumber: 10,
            pageSize: 10})).resolves.toEqual({
            items: [],
            hasNextPage: false,
            nextPage: undefined,
        });
    });

    it("throws a useful error", async () => {
        fetchMock.mockResolvedValueOnce(
            new Response(null, { status: 503 })
        );

        await expect(getEpisodes({pageNumber: 10, pageSize: 10})).rejects.toMatchObject({
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
});