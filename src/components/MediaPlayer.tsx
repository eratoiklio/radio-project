"use client";

import type { ResolvedMedia } from "@/lib/types/media";
import {EpisodeMediaKind, formatPlaybackTime} from "@/lib/helpers/episodeHelpers";
import {useMediaPlaybackController} from "@/components/useMediaPlaybackController";


export interface MediaPlayerProps {
    resolvedMedia: ResolvedMedia;
    hasAudio: boolean;
    hasVideo: boolean;
    activeFormat: EpisodeMediaKind;
    onFormatChange: (format: EpisodeMediaKind) => void;
}

export function MediaPlayer({
                                resolvedMedia,
                                hasAudio,
                                hasVideo,
                                activeFormat,
                                onFormatChange,
                            }: MediaPlayerProps) {
    const controller = useMediaPlaybackController(resolvedMedia);

    function changeFormat(format: EpisodeMediaKind) {
        if (format === activeFormat) {
            return;
        }

        controller.pause();
        onFormatChange(format);
    }

    return (
        <section
            className="w-full min-w-0 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 shadow-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-900"
            aria-label="Odtwarzacz multimediów"
        >
            {hasAudio && hasVideo && (
                <div
                    className="mb-6 flex max-w-sm gap-2"
                    aria-label="Format odtwarzania"
                >
                    {(["audio", "video"] as const).map((format) => (
                        <button
                            key={format}
                            type="button"
                            onClick={() => changeFormat(format)}
                            aria-pressed={activeFormat === format}
                            className="min-h-11 flex-1 rounded-md border border-zinc-300 px-4 py-2 text-sm capitalize aria-pressed:bg-zinc-900 aria-pressed:text-white dark:border-zinc-700 dark:aria-pressed:bg-zinc-100 dark:aria-pressed:text-zinc-900"
                        >
                            {format}
                        </button>
                    ))}
                </div>
            )}

            {resolvedMedia.type === "audio" && (
                <audio
                    ref={controller.setAudioElement}
                    preload="metadata"
                    crossOrigin="anonymous"
                    {...controller.mediaEventHandlers}
                >
                </audio>
            )}

            <div
                className={
                    resolvedMedia.type === "video"
                        ? "grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,1fr)] lg:items-center"
                        : "flex min-h-56 items-center"
                }
            >
                {resolvedMedia.type === "video" && (
                    <video
                        ref={controller.setVideoElement}
                        preload="metadata"
                        playsInline
                        crossOrigin="anonymous"
                        className="h-64 w-full rounded-xl bg-black object-contain sm:h-72 lg:h-80"
                        {...controller.mediaEventHandlers}
                    >
                    </video>
                )}

                <div className="grid w-full gap-4">
                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={controller.togglePlayback}
                            className="min-h-11 flex-1 rounded-md bg-zinc-900 px-4 py-2 font-medium text-white sm:flex-none dark:bg-zinc-100 dark:text-zinc-900"
                        >
                            {controller.isPlaying ? "Pauza" : "Odtwórz"}
                        </button>

                    </div>

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
                            className="h-11 min-w-0 flex-1 cursor-pointer"
                            aria-label="Pozycja odtwarzania"
                        />
                        <span className="w-12 text-right text-sm tabular-nums">
            {formatPlaybackTime(controller.duration)}
          </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
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
                            className="h-11 min-w-32 flex-1 cursor-pointer"
                            aria-label="Głośność"
                        />
                    </div>

                </div>
            </div>


            {controller.playbackError && (
                <p className="mt-4 text-sm text-red-700" role="alert">
                    {controller.playbackError}
                </p>
            )}
        </section>
    );
}
