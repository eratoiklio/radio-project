import {beforeEach, describe, expect, it, vi} from "vitest";
import {getEpisodes,} from "./polishRadioApi";
import {apiFetch} from "./client";

vi.mock("./client", () => ({
    apiFetch: vi.fn(),
}));

beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL =
        "https://cms-gateway.polskieradio.pl/dev-proxy";
    delete process.env.POLISH_RADIO_MEDIA_CDN_BASE_URL;
});

describe("getEpisodes", () => {
    it("requests episodes", async () => {
        vi.mocked(apiFetch).mockResolvedValueOnce(
            new Response(
                JSON.stringify({
                    data: [{id: "episode-1", title: "Episode"}]
                }),
                {status: 200}
            )
        );

        const data = await getEpisodes({
            pageNumber: 1,
            pageSize: 10,
        });

        expect(data).toEqual({
            data: [{id: "episode-1", title: "Episode"}]
        });

        expect(vi.mocked(apiFetch)).toHaveBeenCalledWith(
            expect.stringContaining("/podcast-episodes/read-models"),
            {cache: "no-store"}
        );
    });

    it("throws when API returns invalid payload", async () => {
        vi.mocked(apiFetch).mockResolvedValueOnce(
            new Response(JSON.stringify(null), {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                },
            }) as any
        );

        await expect(
            getEpisodes({pageNumber: 1, pageSize: 10})
        ).rejects.toThrow(
            "Polish Radio API returned an unexpected episodes response"
        );
    });
})
;