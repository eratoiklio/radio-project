"use client";

import { useEffect, useRef } from "react";
import { formatPlaybackTime } from "@/lib/helpers/episodeHelpers";
import type { EpisodeMediaKind } from "@/lib/helpers/episodeHelpers";
import type { ResolvedMedia } from "@/lib/types/media";
import type { MediaPlaybackController } from "./useMediaPlaybackController";

interface MiniMediaPlayerProps {
    title: string;
    resolvedMedia: ResolvedMedia;
    controller: MediaPlaybackController;
    hasAudio: boolean;
    hasVideo: boolean;
    activeFormat: EpisodeMediaKind;
    onFormatChange: (format: EpisodeMediaKind) => void;
    isCollapsed: boolean;
    onToggleCollapsed: () => void;
}

export function MiniMediaPlayer({
                                    title,
                                    resolvedMedia,
                                    controller,
                                    hasAudio,
                                    hasVideo,
                                    activeFormat,
                                    onFormatChange,
                                    isCollapsed,
                                    onToggleCollapsed,
                                }: MiniMediaPlayerProps) {
    const videoPreviewRef = useRef<HTMLCanvasElement>(null);
    const { renderVideoFrame } = controller;

    useEffect(() => {
        if (resolvedMedia.type !== "video") {
            return;
        }

        let animationFrame: number;

        function renderFrame() {
            if (videoPreviewRef.current) {
                renderVideoFrame(videoPreviewRef.current);
            }
            animationFrame = requestAnimationFrame(renderFrame);
        }

        animationFrame = requestAnimationFrame(renderFrame);

        return () => cancelAnimationFrame(animationFrame);
    }, [renderVideoFrame, resolvedMedia.type]);

    return (
        <section
            role="region"
            aria-label="Mini odtwarzacz"
            className={`fixed inset-x-3 bottom-3 z-50 overflow-hidden rounded-lg border border-zinc-200 bg-white/95 p-4 shadow-2xl backdrop-blur transition-transform duration-300 ease-out sm:inset-x-auto sm:right-5 sm:w-[26rem] dark:border-zinc-800 dark:bg-zinc-950/95 ${
                isCollapsed
                    ? "translate-x-[calc(100%-3.5rem)]"
                    : "translate-x-0"
            }`}
        >
            <button
                type="button"
                onClick={onToggleCollapsed}
                aria-label={
                    isCollapsed ? "Pokaż mini odtwarzacz" : "Ukryj mini odtwarzacz"
                }
                aria-expanded={!isCollapsed}
                className="absolute left-2 top-2 z-10 flex h-10 w-10 items-center justify-center rounded-md border border-zinc-300 bg-white hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:bg-zinc-900"
            >
                <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    {isCollapsed ? (
                        <path d="m15 18-6-6 6-6" />
                    ) : (
                        <path d="m9 18 6-6-6-6" />
                    )}
                </svg>
            </button>

            <div
                className={`w-full pl-11 transition-opacity duration-200 ${
                    isCollapsed ? "opacity-0" : "opacity-100"
                }`}
                inert={isCollapsed ? true : undefined}
                aria-hidden={isCollapsed}
            >
                {resolvedMedia.type === "video" && (
                    <canvas
                        ref={videoPreviewRef}
                        aria-label="Podgląd aktualnego video"
                        className="mb-4 aspect-video w-full rounded-md bg-black object-contain"
                    />
                )}

                <div className="mb-4 min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Odtwarzanie · {resolvedMedia.type}
                    </p>
                    <p className="mt-1 truncate font-medium">{title}</p>
                </div>

                {hasAudio && hasVideo && (
                    <div
                        className="mb-4 flex gap-2"
                        aria-label="Format odtwarzania mini playera"
                    >
                        {(["audio", "video"] as const).map((format) => (
                            <button
                                key={format}
                                type="button"
                                onClick={() => onFormatChange(format)}
                                aria-pressed={activeFormat === format}
                                className="min-h-11 flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm capitalize aria-pressed:bg-zinc-900 aria-pressed:text-white dark:border-zinc-700 dark:aria-pressed:bg-zinc-100 dark:aria-pressed:text-zinc-900"
                            >
                                {format}
                            </button>
                        ))}
                    </div>
                )}

                <div className="grid gap-3">
                    <button
                        type="button"
                        onClick={controller.togglePlayback}
                        aria-label={
                            controller.isPlaying
                                ? "Wstrzymaj odtwarzanie"
                                : "Rozpocznij odtwarzanie"
                        }
                        className="min-h-11 w-full rounded-md bg-zinc-900 px-4 py-2 font-medium text-white sm:w-fit dark:bg-zinc-100 dark:text-zinc-900"
                    >
                        {controller.isPlaying ? "Pauza" : "Odtwórz"}
                    </button>

                    <div className="flex items-center gap-3">
            <span className="w-12 text-sm tabular-nums">
              {formatPlaybackTime(controller.currentTime)}
            </span>
                        <input
                            type="range"
                            min={0}
                            max={controller.duration || 0}
                            step={0.1}
                            value={Math.min(
                                controller.currentTime,
                                controller.duration || 0,
                            )}
                            onChange={(event) =>
                                controller.seekTo(Number(event.target.value))
                            }
                            disabled={controller.duration === 0}
                            aria-label="Pozycja odtwarzania mini playera"
                            className="h-11 min-w-0 flex-1 cursor-pointer"
                        />
                        <span className="w-12 text-right text-sm tabular-nums">
              {formatPlaybackTime(controller.duration)}
            </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={controller.toggleMute}
                            aria-label={controller.isMuted ? "Włącz dźwięk" : "Wycisz"}
                            className="min-h-11 rounded-md border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
                        >
                            {controller.isMuted ? "Włącz dźwięk" : "Wycisz"}
                        </button>
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={controller.isMuted ? 0 : controller.volume}
                            onChange={(event) =>
                                controller.changeVolume(Number(event.target.value))
                            }
                            aria-label="Głośność mini playera"
                            className="h-11 min-w-0 flex-1 cursor-pointer"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
