import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { resolveMediaMock } = vi.hoisted(() => ({
    resolveMediaMock: vi.fn(),
}));

vi.mock("../../../lib/api/polishRadioApi", async (importOriginal) => {
    const original =
        await importOriginal<typeof import("../../../lib/api/polishRadioApi")>();
    return { ...original, resolveMedia: resolveMediaMock };
});

import { PolishRadioApiError } from "@/lib/api/polishRadioApi";
import { GET } from "./route";

function request(query = "") {
    return new NextRequest(`http://localhost/api/media${query}`);
}

beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("GET /api/media", () => {
    it("returns 400 when the episode has no media IDs", async () => {
        const response = await GET(request());

        expect(response.status).toBe(400);
        await expect(response.json()).resolves.toEqual({
            error: "Odcinek nie zawiera dostępnych mediów.",
        });
    });

    it("returns 400 for an invalid preferred kind", async () => {
        const response = await GET(
            request("?externalAudioId=audio-id&preferredKind=text"),
        );

        expect(response.status).toBe(400);
        expect(resolveMediaMock).not.toHaveBeenCalled();
    });

    it("prefers the requested video and returns ResolvedMedia", async () => {
        const media = {
            type: "video",
            playbackUri: "https://cdn6.polskieradio.pl/video.mp4",
            subtitleUri: null,
            asset: {
                id: "video-id",
                title: "Video",
                uri: "https://example.test/video.mp4",
                durationSeconds: 60,
            },
        };
        resolveMediaMock.mockResolvedValueOnce(media);

        const response = await GET(
            request(
                "?externalAudioId=audio-id&externalVideoId=video-id&preferredKind=video",
            ),
        );

        expect(resolveMediaMock).toHaveBeenCalledWith({
            externalVideoId: "video-id",
        });
        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual(media);
    });

    it("maps an upstream 404 to a safe 404 response", async () => {
        resolveMediaMock.mockRejectedValueOnce(
            new PolishRadioApiError("technical details", 404),
        );

        const response = await GET(request("?externalAudioId=missing"));

        expect(response.status).toBe(404);
        await expect(response.json()).resolves.toEqual({
            error: "Nie znaleziono medium dla tego odcinka.",
        });
        expect(console.error).toHaveBeenCalled();
    });

    it("maps technical failures to a safe 502 response", async () => {
        resolveMediaMock.mockRejectedValueOnce(new Error("secret details"));

        const response = await GET(request("?externalAudioId=broken"));

        expect(response.status).toBe(502);
        expect(await response.text()).not.toContain("secret details");
        expect(console.error).toHaveBeenCalled();
    });
});
