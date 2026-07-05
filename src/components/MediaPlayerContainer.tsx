"use client";

import { useEffect, useRef, useState } from "react";
import type { EpisodeMediaKind } from "@/lib/helpers/episodeHelpers";
import type { ResolvedMedia } from "@/lib/types/media";
import { MediaPlayer } from "./MediaPlayer";
import { MiniMediaPlayer } from "./MiniMediaPlayer";
import { useMediaPlaybackController } from "./useMediaPlaybackController";

interface MediaPlayerContainerProps {
    title: string;
    resolvedMedia: ResolvedMedia;
    hasAudio: boolean;
    hasVideo: boolean;
    activeFormat: EpisodeMediaKind;
    onFormatChange: (format: EpisodeMediaKind) => void;
    onReturn?: () => void;
}

export function MediaPlayerContainer({
                                         title,
                                         resolvedMedia,
                                         hasAudio,
                                         hasVideo,
                                         activeFormat,
                                         onFormatChange,
                                         onReturn = () => undefined,
                                     }: MediaPlayerContainerProps) {
    const mainPlayerRef = useRef<HTMLDivElement>(null);
    const [isMainPlayerVisible, setIsMainPlayerVisible] = useState(true);
    const [isMiniPlayerCollapsed, setIsMiniPlayerCollapsed] = useState(false);
    const controller = useMediaPlaybackController(resolvedMedia);

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            const target = event.target;

            if (
                target instanceof HTMLElement &&
                (target.isContentEditable ||
                    target.matches("button, input, textarea, select, a"))
            ) {
                return;
            }

            if (event.code === "Space") {
                event.preventDefault();
                void controller.togglePlayback();
            } else if (event.key === "ArrowLeft") {
                event.preventDefault();
                controller.seekBy(-5);
            } else if (event.key === "ArrowRight") {
                event.preventDefault();
                controller.seekBy(5);
            } else if (event.key.toLowerCase() === "m") {
                event.preventDefault();
                controller.toggleMute();
            }
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [controller]);

    useEffect(() => {
        const element = mainPlayerRef.current;

        if (!element) {
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => setIsMainPlayerVisible(entry.isIntersecting),
            { threshold: 0.1 },
        );

        observer.observe(element);

        return () => observer.disconnect();
    }, []);

    const showMiniPlayer = !isMainPlayerVisible;

    return (
        <div
            className={
                showMiniPlayer && !isMiniPlayerCollapsed
                    ? "pb-72 lg:pb-0"
                    : undefined
            }
        >
            <div ref={mainPlayerRef} data-testid="main-media-player">
                <MediaPlayer
                    resolvedMedia={resolvedMedia}
                    hasAudio={hasAudio}
                    hasVideo={hasVideo}
                    activeFormat={activeFormat}
                    onFormatChange={onFormatChange}
                    onReturn={onReturn}
                    controller={controller}
                />
            </div>

            {showMiniPlayer && (
                <MiniMediaPlayer
                    title={title}
                    resolvedMedia={resolvedMedia}
                    controller={controller}
                    hasAudio={hasAudio}
                    hasVideo={hasVideo}
                    activeFormat={activeFormat}
                    onFormatChange={onFormatChange}
                    isCollapsed={isMiniPlayerCollapsed}
                    onToggleCollapsed={() =>
                        setIsMiniPlayerCollapsed((collapsed) => !collapsed)
                    }
                />
            )}
        </div>
    );
}
