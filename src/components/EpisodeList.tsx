"use client"

import type {EpisodeRm} from '@/lib/types/episode';
import {Episode} from "./Episode"

export interface EpisodeListProps {
    episodes: EpisodeRm[]
    onPlay: (episode: EpisodeRm) => void;
}

export function EpisodeList({episodes, onPlay}: EpisodeListProps) {
    return (
        <ul className="grid gap-4">
            {episodes.map((episode, index) => {
                return <li key={episode.id}
                        className="flex min-w-0 gap-3 rounded-lg border border-zinc-200 p-3 sm:gap-4 sm:p-4 dark:border-zinc-800">
                    <Episode
                        index={index}
                        episode={episode}
                        onPlay={onPlay}
                    /></li>
            })}
        </ul>
    )
}