import "server-only";

import { apiFetch } from "./client";
import type { EpisodeRm } from "../types/episode";
import type { MediaAssetDto, ResolvedMedia } from "../types/media";

const EPISODES_PATH =
    process.env.POLISH_RADIO_EPISODES_PATH ??
    "/podcast-episodes/read-models";
const AUDIO_PATH =
    process.env.POLISH_RADIO_AUDIO_PATH ?? "/audio";
const VIDEO_PATH =
    process.env.POLISH_RADIO_VIDEO_PATH ?? "/video";
const DEFAULT_MEDIA_CDN_BASE_URL = "https://cdn6.polskieradio.pl";

type MediaKind = "audio" | "video";
export interface GetEpisodesOptions {
    pageNumber: number;
    pageSize: number;
}

export interface EpisodesPage {
    items: EpisodeRm[];
    hasNextPage: boolean;
    nextPage?: GetEpisodesOptions;
}

export interface ResolveMediaOptions {
    externalAudioId?: string | null;
    externalVideoId?: string | null;
}

interface EpisodesApiResponse {
    data: EpisodeRm[];
    total: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
}

function isNullableString(value: unknown): value is string | null {
    return value === null || typeof value === "string";
}

function isNullableNumber(value: unknown): value is number | null {
    return value === null || typeof value === "number";
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

function isEpisodeRm(value: unknown): value is EpisodeRm {
    if (!value || typeof value !== "object") {
        return false;
    }

    const episode = value as Record<string, unknown>;
    const mainImage = episode.mainImage;

    return (
        isNonEmptyString(episode.id) &&
        isNonEmptyString(episode.title) &&
        isNonEmptyString(episode.slug) &&
        isNonEmptyString(episode.podcastSlug) &&
        isNonEmptyString(episode.podcastTitle) &&
        isNullableNumber(episode.audioDuration) &&
        isNullableNumber(episode.videoDuration) &&
        isNullableString(episode.externalAudioId) &&
        isNullableString(episode.externalVideoId) &&
        (mainImage === null ||
            (typeof mainImage === "object" &&
                isNonEmptyString((mainImage as Record<string, unknown>).uri) &&
                typeof (mainImage as Record<string, unknown>).title === "string"))
    );
}

function getMediaCdnBaseUrl(): URL {
    const configuredUrl =
        process.env.POLISH_RADIO_MEDIA_CDN_BASE_URL ??
        DEFAULT_MEDIA_CDN_BASE_URL;

    try {
        return new URL(configuredUrl.endsWith("/") ? configuredUrl : `${configuredUrl}/`);
    } catch (cause) {
        throw new PolishRadioApiError(
            "POLISH_RADIO_MEDIA_CDN_BASE_URL is not a valid URL",
            undefined,
            { cause },
        );
    }
}

function replaceWithMediaCdn(uri: string): URL {
    let source: URL;

    try {
        source = new URL(uri);
    } catch (cause) {
        throw new PolishRadioApiError("Polish Radio API returned an invalid media URI", undefined, {
            cause,
        });
    }

    const cdn = getMediaCdnBaseUrl();
    const cdnPath = cdn.pathname.replace(/\/+$/, "");
    const sourcePath = source.pathname.startsWith("/")
        ? source.pathname
        : `/${source.pathname}`;
    const result = new URL(cdn);

    result.pathname = `${cdnPath}${sourcePath}`;
    result.search = source.search;
    result.hash = source.hash;

    return result;
}

export function normalizePlaybackUri(uri: string, type: MediaKind): string {
    const result = replaceWithMediaCdn(uri);

    if (type === "audio") {
        result.pathname = result.pathname.replace(/\.wav$/i, ".mp3");
    }

    return result.toString();
}

function normalizeSubtitleUri(asset: MediaAssetDto): string | null {
    if (!asset.transcription?.vttUri) {
        return null;
    }

    const result = replaceWithMediaCdn(asset.uri);
    result.pathname = result.pathname.replace(/[^/]+$/, "transcription.vtt");
    result.search = "";
    result.hash = "";

    return result.toString();
}

export class PolishRadioApiError extends Error {
    constructor(
        message: string,
        readonly status?: number,
        options?: ErrorOptions,
    ) {
        super(message, options);
        this.name = "PolishRadioApiError";
    }
}

async function readJson(response: Response, operation: string): Promise<unknown> {
    if (!response.ok) {
        let details: string;

        try {
            details = await response.text();
        } catch (cause) {
            throw new PolishRadioApiError(
                `Polish Radio API failed to ${operation} (${response.status} ${response.statusText}); the error response could not be read`,
                response.status,
                { cause },
            );
        }

        const suffix = details;

        throw new PolishRadioApiError(
            `Polish Radio API failed to ${operation} (${response.status} ${response.statusText})${suffix}`,
            response.status,
        );
    }

    try {
        return await response.json();
    } catch (cause) {
        throw new PolishRadioApiError(
            `Polish Radio API returned invalid JSON while trying to ${operation}`,
            response.status,
            { cause },
        );
    }
}

export async function getEpisodes(options: GetEpisodesOptions) : Promise<EpisodesPage> {
    const { pageNumber, pageSize } = options;

    const query = new URLSearchParams({
        pageNumber: String(pageNumber),
        pageSize: String(pageSize)
    });

    const payload = await readJson(
        await apiFetch(`${EPISODES_PATH}?${query}`, { cache: "no-store" }),
        "fetch podcast episodes",
    );

    if (!payload || typeof payload !== "object") {
        throw new PolishRadioApiError(
            "Polish Radio API returned an unexpected episodes response",
        );
    }

    const data = payload as EpisodesApiResponse;
    if (
        !Array.isArray(data.data) ||
        !data.data.every(isEpisodeRm) ||
        typeof data.total !== "number" ||
        typeof data.pageNumber !== "number" ||
        typeof data.pageSize !== "number" ||
        typeof data.totalPages !== "number"
    ) {
        throw new PolishRadioApiError(
            "Polish Radio API returned an invalid episodes page",
        );
    }

    const hasNextPage = data.pageNumber < data.totalPages;
    const nextPage = hasNextPage
        ? {
            pageNumber: data.pageNumber + 1,
            pageSize: data.pageSize,
        }
        : undefined;

    return { items: data.data, hasNextPage, nextPage };
}

export async function resolveMedia({
                                       externalAudioId,
                                       externalVideoId,
                                   }: ResolveMediaOptions): Promise<ResolvedMedia> {
    const type = externalAudioId ? "audio" : externalVideoId ? "video" : null;
    const externalId = externalAudioId ?? externalVideoId;

    if (!type || !externalId) {
        throw new PolishRadioApiError(
            "resolveMedia requires externalAudioId or externalVideoId",
        );
    }

    const path = type === "audio" ? AUDIO_PATH : VIDEO_PATH;
    const payload = await readJson(
        await apiFetch(`${path}/${encodeURIComponent(externalId)}`, {
            cache: "no-store",
        }),
        `resolve ${type} media`,
    );

    if (
        !payload ||
        typeof payload !== "object" ||
        !("data" in payload) ||
        !payload.data ||
        typeof payload.data !== "object"
    ) {
        throw new PolishRadioApiError(
            `Polish Radio API returned an invalid ${type} media response`,
        );
    }

    const asset = payload.data as Partial<MediaAssetDto>;
    if (
        typeof asset.id !== "string" ||
        typeof asset.title !== "string" ||
        typeof asset.uri !== "string" ||
        asset.uri.length === 0 ||
        typeof asset.durationSeconds !== "number"
    ) {
        throw new PolishRadioApiError(
            `Polish Radio API returned an invalid ${type} media asset`,
        );
    }

    if (
        asset.transcription !== null &&
        (typeof asset.transcription !== "object" ||
            (asset.transcription.vttUri !== null &&
                typeof asset.transcription.vttUri !== "string"))
    ) {
        throw new PolishRadioApiError(
            `Polish Radio API returned an invalid ${type} media transcription`,
        );
    }

    const mediaAsset = asset as MediaAssetDto;

    return {
        type,
        asset: mediaAsset,
        playbackUri: normalizePlaybackUri(mediaAsset.uri, type),
        subtitleUri: normalizeSubtitleUri(mediaAsset),
    };
}
