import {apiFetch} from "./client";
import {EpisodeRm} from "@/lib/types/episode";
const EPISODES_PATH =
    process.env.POLISH_RADIO_EPISODES_PATH ??
    "/podcast-episodes/read-models";

export interface GetEpisodesOptions {
    pageNumber: number;
    pageSize: number;
}

export interface EpisodesPage {
    items: EpisodeRm[];
    hasNextPage: boolean;
    nextPage?: GetEpisodesOptions;
}

interface EpisodesApiResponse {
    data: EpisodeRm[];
    total: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
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

    const response = await apiFetch(
        `${EPISODES_PATH}?${query}`,
        { cache: "no-store" }
    );

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