import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MediaPlayerContainer } from "./MediaPlayerContainer";

describe("MediaPlayer subtitles", () => {
    it("shows WebVTT controls when a transcription is available", () => {
        render(
            <MediaPlayerContainer
                title="Test audio"
                resolvedMedia={{
                    type: "audio",
                    playbackUri: "https://cdn6.polskieradio.pl/cms/dev/audio.mp3",
                    subtitleUri:
                        "https://cdn6.polskieradio.pl/cms/dev/transcription.vtt",
                    asset: {
                        id: "audio",
                        title: "Audio",
                        uri: "https://dev-cms-gateway.polskieradio.pl/cms/dev/audio.wav",
                        durationSeconds: 10,
                        transcription: {
                            vttUri:
                                "https://dev-cms-gateway.polskieradio.pl/transcription.vtt",
                        },
                    },
                }}
                hasAudio
                hasVideo={false}
                activeFormat="audio"
                onFormatChange={vi.fn()}
            />,
        );
        expect(
            screen.getByRole("button", { name: "Włącz napisy" }),
        ).toBeInTheDocument();
        expect(document.querySelector("track")).toHaveAttribute(
            "src",
            "https://cdn6.polskieradio.pl/cms/dev/transcription.vtt",
        );
    });

    it("reports when a transcription is not available", () => {
        render(
            <MediaPlayerContainer
                title="Test audio"
                resolvedMedia={{
                    type: "audio",
                    playbackUri: "https://cdn6.polskieradio.pl/audio.mp3",
                    subtitleUri: null,
                    asset: {
                        id: "audio",
                        title: "Audio",
                        uri: "https://gateway.example.test/audio.mp3",
                        durationSeconds: 10
                    },
                }}
                hasAudio
                hasVideo={false}
                activeFormat="audio"
                onFormatChange={vi.fn()}
            />,
        );

        expect(screen.getByText("Napisy niedostępne")).toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: "Włącz napisy" }),
        ).not.toBeInTheDocument();
    });
});
