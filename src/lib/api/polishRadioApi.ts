import {apiFetch} from "@/lib/api/client";
const EPISODES_PATH =
    process.env.POLISH_RADIO_EPISODES_PATH ??
    "/podcast-episodes/read-models";

export interface GetEpisodesOptions {
    pageNumber?: number;
    pageSize?: number;
}
export async function getEpisodes(options: GetEpisodesOptions = {}) {
    const {pageNumber, pageSize} = options
    const query = new URLSearchParams({
        pageNumber: String(pageNumber),
        pageSize: String(pageSize)
    });

    const payload = await apiFetch(`${EPISODES_PATH}?${query}`, { cache: "no-store" });
    if (!payload || typeof payload !== "object") {
        throw new Error(
            "Polish Radio API returned an unexpected episodes response",
        );
    }
 return payload;

}