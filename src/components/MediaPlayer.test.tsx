import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MediaPlayerContainer } from "./MediaPlayerContainer";
import type { ResolvedMedia } from "@/lib/types/media";

const hlsInstances: Array<{
    loadSource: ReturnType<typeof vi.fn>;
    destroy: ReturnType<typeof vi.fn>;
}> = [];

vi.mock("hls.js", () => {
    class HlsMock {
        static Events = { MEDIA_ATTACHED: "mediaAttached", ERROR: "error" };
        static isSupported = vi.fn(() => true);
        attachMedia = vi.fn();
        loadSource = vi.fn();
        destroy = vi.fn();
        on = vi.fn((event: string, callback: () => void) => {
            if (event === "mediaAttached") callback();
        });
        constructor() {
            hlsInstances.push(this);
        }
    }
    return { default: HlsMock };
});

const audioMedia: ResolvedMedia = {
    type: "audio",
    playbackUri: "https://media.example.test/audio.mp3",
    subtitleUri: null,
    asset: {
        id: "audio-id",
        title: "Audio",
        uri: "https://dev-cms-gateway.polskieradio.pl/cms/dev/audio.wav",
        durationSeconds: 120
    },
};

beforeEach(() => {
    hlsInstances.length = 0;
});

describe("MediaPlayer playback", () => {
    it("loads a compatible source and toggles playback", () => {
        render(
            <MediaPlayerContainer
                title="Test audio"
                resolvedMedia={audioMedia}
                hasAudio
                hasVideo={false}
                activeFormat="audio"
                onFormatChange={vi.fn()}
            />,
        );
        expect(document.querySelector("audio")?.src).toBe(audioMedia.playbackUri);
        fireEvent.click(screen.getByRole("button", { name: "Odtwórz" }));
        expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();
    });

    it("updates progress and seeks", () => {
        render(
            <MediaPlayerContainer
                title="Test audio"
                resolvedMedia={audioMedia}
                hasAudio
                hasVideo={false}
                activeFormat="audio"
                onFormatChange={vi.fn()}
            />,
        );
        const audio = document.querySelector("audio")!;
        Object.defineProperties(audio, {
            duration: { configurable: true, value: 120 },
            currentTime: { configurable: true, writable: true, value: 30 },
        });
        fireEvent.loadedMetadata(audio);
        fireEvent.timeUpdate(audio);
        expect(screen.getByText("0:30")).toBeInTheDocument();
        expect(screen.getByText("2:00")).toBeInTheDocument();
        fireEvent.change(screen.getByLabelText("Pozycja odtwarzania"), {
            target: { value: "45" },
        });
        expect(audio.currentTime).toBe(45);
    });

    it("uses and cleans up hls.js", async () => {
        const media: ResolvedMedia = {
            type: "video",
            playbackUri: "https://example.test/video.m3u8",
            subtitleUri: null,
            asset: {
                id: "video",
                title: "HLS",
                uri: "https://gateway.example.test/raw-video.m3u8",
                durationSeconds: 10
            },
        };
        const { unmount } = render(
            <MediaPlayerContainer
                title="Test video"
                resolvedMedia={media}
                hasAudio={false}
                hasVideo
                activeFormat="video"
                onFormatChange={vi.fn()}
            />,
        );
        await waitFor(() => expect(hlsInstances).toHaveLength(1));
        expect(hlsInstances[0].loadSource).toHaveBeenCalledWith(media.playbackUri);
        unmount();
        expect(hlsInstances[0].destroy).toHaveBeenCalled();
    });
});
