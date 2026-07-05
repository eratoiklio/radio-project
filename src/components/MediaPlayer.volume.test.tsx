import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MediaPlayerContainer } from "./MediaPlayerContainer";

describe("MediaPlayer volume", () => {
    it("changes volume and toggles mute", () => {
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
                hasVideo={false}
                activeFormat="audio"
                onFormatChange={vi.fn()}
            />,
        );
        const audio = document.querySelector("audio")!;
        fireEvent.change(screen.getByLabelText("Głośność"), {
            target: { value: "0.4" },
        });
        expect(audio.volume).toBe(0.4);
        fireEvent.click(screen.getByRole("button", { name: "Wycisz" }));
        expect(audio.muted).toBe(true);
    });
});
