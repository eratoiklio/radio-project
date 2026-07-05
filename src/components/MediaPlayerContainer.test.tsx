import {
    act,
    fireEvent,
    render,
    screen,
} from "@testing-library/react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import {MediaPlayerContainer} from "./MediaPlayerContainer";
import type {ResolvedMedia} from "@/lib/types/media";

const media: ResolvedMedia = {
    type: "audio",
    playbackUri: "https://media.example.test/audio.mp3",
    subtitleUri: null,
    asset: {
        id: "audio-id",
        title: "Asset title",
        uri: "https://gateway.example.test/audio.wav",
        durationSeconds: 120,
    },
};

let observerCallback: IntersectionObserverCallback;

class ControlledIntersectionObserver implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = "0px";
    readonly thresholds = [0.1];

    constructor(callback: IntersectionObserverCallback) {
        observerCallback = callback;
    }

    disconnect = vi.fn();
    observe = vi.fn();
    takeRecords = vi.fn(() => []);
    unobserve = vi.fn();
}

function renderContainer() {
    return render(
        <MediaPlayerContainer
            title="Aktualny odcinek"
            resolvedMedia={media}
            hasAudio
            hasVideo={false}
            activeFormat="audio"
            onFormatChange={vi.fn()}
        />,
    );
}

function setMainPlayerVisibility(isIntersecting: boolean) {
    act(() => {
        observerCallback(
            [{isIntersecting} as IntersectionObserverEntry],
            {} as IntersectionObserver,
        );
    });
}

beforeEach(() => {
    vi.stubGlobal("IntersectionObserver", ControlledIntersectionObserver);
});

describe("MediaPlayerContainer", () => {
    it("starts playback automatically after media is resolved", () => {
        renderContainer();

        expect(HTMLMediaElement.prototype.play).toHaveBeenCalledOnce();
    });

    it("renders the main player as a wide prominent panel", () => {
        renderContainer();

        expect(
            screen.getByRole("region", {name: "Odtwarzacz multimediów"}),
        ).toHaveClass("w-full", "rounded-2xl");
    });

    it("does not show the mini player while the main player is visible", () => {
        renderContainer();

        setMainPlayerVisibility(true);
        expect(
            screen.queryByRole("region", {name: "Mini odtwarzacz"}),
        ).not.toBeInTheDocument();
    });

    it("shows the fixed mini player when the main player leaves the viewport", () => {
        renderContainer();

        setMainPlayerVisibility(false);
        expect(
            screen.getByRole("region", {name: "Mini odtwarzacz"}),
        ).toHaveClass("fixed", "bottom-3", "sm:right-5", "z-50");
        expect(screen.getByText("Aktualny odcinek")).toBeInTheDocument();
    });

    it("uses the same playback controller from the mini player", () => {
        renderContainer();
        setMainPlayerVisibility(false);

        const miniPlayer = screen.getByRole("region", {
            name: "Mini odtwarzacz",
        });
        vi.mocked(HTMLMediaElement.prototype.play).mockClear();
        fireEvent.click(
            miniPlayer.querySelector(
                "button[aria-label='Rozpocznij odtwarzanie']",
            )!,
        );

        expect(HTMLMediaElement.prototype.play).toHaveBeenCalledOnce();
    });

    it("seeks the single media element from the mini player", () => {
        renderContainer();
        const audio = document.querySelector("audio")!;
        Object.defineProperties(audio, {
            duration: {configurable: true, value: 120},
            currentTime: {configurable: true, writable: true, value: 0},
        });
        fireEvent.loadedMetadata(audio);
        setMainPlayerVisibility(false);

        fireEvent.change(
            screen.getByLabelText("Pozycja odtwarzania mini playera"),
            {target: {value: "42"}},
        );

        expect(audio.currentTime).toBe(42);
        expect(screen.getAllByText("0:42")).toHaveLength(2);
    });

    it("renders only one real media element", () => {
        renderContainer();
        setMainPlayerVisibility(false);

        expect(document.querySelectorAll("audio, video")).toHaveLength(1);
        expect(
            screen.getByRole("region", {name: "Mini odtwarzacz"}).querySelector(
                "audio, video",
            ),
        ).toBeNull();
    });

    it("shows a canvas video preview without creating a second video", () => {
        render(
            <MediaPlayerContainer
                title="Odcinek video"
                resolvedMedia={{
                    type: "video",
                    playbackUri: "https://media.example.test/video.mp4",
                    subtitleUri: null,
                    asset: {
                        id: "video-id",
                        title: "Video",
                        uri: "https://gateway.example.test/video.mp4",
                        durationSeconds: 120,
                    },
                }}
                hasAudio={false}
                hasVideo
                activeFormat="video"
                onFormatChange={vi.fn()}
            />,
        );
        setMainPlayerVisibility(false);

        expect(
            screen.getByLabelText("Podgląd aktualnego video"),
        ).toBeInTheDocument();
        expect(document.querySelectorAll("video")).toHaveLength(1);
        expect(
            screen.getByRole("region", {name: "Mini odtwarzacz"}).querySelector(
                "video",
            ),
        ).toBeNull();
    });

    it("supports basic keyboard playback controls", () => {
        renderContainer();
        const audio = document.querySelector("audio")!;
        Object.defineProperties(audio, {
            duration: {configurable: true, value: 120},
            currentTime: {configurable: true, writable: true, value: 20},
            muted: {configurable: true, writable: true, value: false},
        });
        vi.mocked(HTMLMediaElement.prototype.play).mockClear();

        fireEvent.keyDown(window, {code: "Space", key: " "});
        expect(HTMLMediaElement.prototype.play).toHaveBeenCalledOnce();

        fireEvent.keyDown(window, {key: "ArrowRight"});
        expect(audio.currentTime).toBe(25);

        fireEvent.keyDown(window, {key: "ArrowLeft"});
        expect(audio.currentTime).toBe(20);

        fireEvent.keyDown(window, {key: "m"});
        expect(audio.muted).toBe(true);
    });

    it("does not override keyboard behavior on interactive controls", () => {
        renderContainer();
        const audio = document.querySelector("audio")!;
        Object.defineProperty(audio, "currentTime", {
            configurable: true,
            writable: true,
            value: 20,
        });

        fireEvent.keyDown(screen.getByLabelText("Pozycja odtwarzania"), {
            key: "ArrowRight",
        });

        expect(audio.currentTime).toBe(20);
    });

});
