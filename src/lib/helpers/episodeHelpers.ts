import {EpisodeRm} from "@/lib/types/episode";

const EPISODE_PAGE_URL = "https://www.polskieradio.pl/podcasty";

export type EpisodeMediaKind = "audio" | "video";

export function hasAudio(
    episode: Partial<Pick<EpisodeRm, "externalAudioId">>,
): boolean {
    return Boolean(episode.externalAudioId?.trim());
}

export function hasVideo(
    episode: Partial<Pick<EpisodeRm, "externalVideoId">>,
): boolean {
    return Boolean(episode.externalVideoId?.trim());
}

export function getAvailableMediaKinds(
    episode: Partial<
        Pick<EpisodeRm, "externalAudioId" | "externalVideoId">
    >,
): EpisodeMediaKind[] {
    const kinds: EpisodeMediaKind[] = [];

    if (hasAudio(episode)) {
        kinds.push("audio");
    }
    if (hasVideo(episode)) {
        kinds.push("video");
    }

    return kinds;
}

export function buildEpisodePageUrl(
    episode: Partial<Pick<EpisodeRm, "podcastSlug" | "slug">>,
): string | null {
    if (!episode.podcastSlug || !episode.slug) {
        return null;
    }

    return `${EPISODE_PAGE_URL}/${episode.podcastSlug}/${episode.slug}`;
}

function formatSeconds(value: number | null | undefined): string {
    const totalSeconds =
        typeof value === "number"
            ? Math.max(0, Math.floor(value))
            : 0;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }

    return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function formatDuration(
    durationSeconds: number | null | undefined,
): string {
    return formatSeconds(durationSeconds);
}