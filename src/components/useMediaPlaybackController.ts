"use client";

import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import type { ResolvedMedia } from "@/lib/types/media";

export interface MediaPlaybackController {
    setAudioElement: (element: HTMLAudioElement | null) => void;
    setVideoElement: (element: HTMLVideoElement | null) => void;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    isMuted: boolean;
    playbackError: string | null;
    togglePlayback: () => Promise<void>;
    pause: () => void;
    seekTo: (value: number) => void;
    changeVolume: (value: number) => void;
    toggleMute: () => void;
    renderVideoFrame: (canvas: HTMLCanvasElement) => boolean;
    mediaEventHandlers: {
        onLoadedMetadata: () => void;
        onTimeUpdate: () => void;
        onPlay: () => void;
        onPause: () => void;
        onVolumeChange: () => void;
        onError: () => void;
    };
}

export function useMediaPlaybackController(
    resolvedMedia: ResolvedMedia,
): MediaPlaybackController {
    const audioRef = useRef<HTMLAudioElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackError, setPlaybackError] = useState<string | null>(null);

    const getMediaElement = () =>
        resolvedMedia.type === "audio" ? audioRef.current : videoRef.current;

    useEffect(() => {
        const element =
            resolvedMedia.type === "audio" ? audioRef.current : videoRef.current;

        if (!element) {
            return;
        }

        const activeElement = element;
        let disposed = false;
        const { playbackUri } = resolvedMedia;

        function startPlayback() {
            void activeElement.play().catch(() => {
                if (!disposed) {
                    setPlaybackError(
                        "Przeglądarka zablokowała automatyczne odtwarzanie. Kliknij Odtwórz.",
                    );
                }
            });
        }

        element.pause();
        element.removeAttribute("src");
        element.load();
        queueMicrotask(() => {
            if (!disposed) {
                setIsPlaying(false);
                setCurrentTime(0);
                setDuration(0);
                setPlaybackError(null);
            }
        });

            element.src = playbackUri;
            element.load();
            startPlayback();

        return () => {
            disposed = true;
            element.pause();
            element.removeAttribute("src");
            element.load();
        };
    }, [resolvedMedia]);

    useEffect(() => {
        const element =
            resolvedMedia.type === "audio" ? audioRef.current : videoRef.current;

        if (element) {
            element.volume = volume;
            element.muted = isMuted;
        }
    }, [isMuted, resolvedMedia.type, volume]);

    function handleLoadedMetadata() {
        const element = getMediaElement();
        setDuration(
            element && Number.isFinite(element.duration) ? element.duration : 0,
        );
    }

    function handleTimeUpdate() {
        setCurrentTime(getMediaElement()?.currentTime ?? 0);
    }

    function handleVolumeChange() {
        const element = getMediaElement();

        if (element) {
            setVolume(element.volume);
            setIsMuted(element.muted);
        }
    }

    async function togglePlayback() {
        const element = getMediaElement();

        if (!element) {
            return;
        }

        setPlaybackError(null);

        if (element.paused) {
            try {
                await element.play();
            } catch (error) {
                console.error("Media playback failed", error);
                setPlaybackError("Nie udało się rozpocząć odtwarzania.");
            }
        } else {
            element.pause();
        }
    }

    function seekTo(value: number) {
        const element = getMediaElement();

        if (element) {
            element.currentTime = value;
            setCurrentTime(value);
        }
    }

    function changeVolume(value: number) {
        const element = getMediaElement();

        if (element) {
            element.volume = value;
            element.muted = false;
        }
    }

    function toggleMute() {
        const element = getMediaElement();

        if (element) {
            element.muted = !element.muted;
        }
    }

    function pause() {
        getMediaElement()?.pause();
    }

    const renderVideoFrame = useCallback((canvas: HTMLCanvasElement): boolean => {
        const video = videoRef.current;

        if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
            return false;
        }

        const context = canvas.getContext("2d");
        if (!context) {
            return false;
        }

        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;

        try {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            return true;
        } catch {
            return false;
        }
    }, []);

    return {
        setAudioElement: (element) => {
            audioRef.current = element;
        },
        setVideoElement: (element) => {
            videoRef.current = element;
        },
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        playbackError,
        togglePlayback,
        pause,
        seekTo,
        changeVolume,
        toggleMute,
        renderVideoFrame,
        mediaEventHandlers: {
            onLoadedMetadata: handleLoadedMetadata,
            onTimeUpdate: handleTimeUpdate,
            onPlay: () => setIsPlaying(true),
            onPause: () => setIsPlaying(false),
            onVolumeChange: handleVolumeChange,
            onError: () =>
                setPlaybackError("Nie udało się odtworzyć tego materiału."),
        },
    };
}
