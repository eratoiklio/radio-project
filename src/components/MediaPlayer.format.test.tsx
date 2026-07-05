import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MediaPlayerContainer } from "./MediaPlayerContainer";

describe("MediaPlayer format switching", () => {
    it("offers a switch only when both formats exist", () => {
        const onFormatChange = vi.fn();
        render(
            <MediaPlayerContainer
                title="Test audio"
                resolvedMedia={{
                    type: "audio",
                    playbackUri: "https://example.test/audio.mp3",
                    subtitleUri: null,
                    asset: {
                        id: "audio",
                        title: "Audio",
                        uri: "https://example.test/audio.mp3",
                        durationSeconds: 10
                    },
                }}
                hasAudio
                hasVideo
                activeFormat="audio"
                onFormatChange={onFormatChange}
            />,
        );
        fireEvent.click(screen.getByRole("button", { name: "video" }));
        expect(onFormatChange).toHaveBeenCalledWith("video");
    });
});
