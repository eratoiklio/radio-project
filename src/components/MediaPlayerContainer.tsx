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
}

export function MediaPlayerContainer({
                                         title,
                                         resolvedMedia,
                                         hasAudio,
                                         hasVideo,
                                         activeFormat,
                                         onFormatChange,
                                     }: MediaPlayerContainerProps) {
    const mainPlayerRef = useRef<HTMLDivElement>(null);
    const [isMainPlayerVisible, setIsMainPlayerVisible] = useState(true);
    const controller = useMediaPlaybackController(resolvedMedia);

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
                showMiniPlayer
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
                />
            )}
        </div>
    );
}
