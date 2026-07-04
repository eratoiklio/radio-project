"use server";

import {
    getEpisodes,
    type EpisodesPage,
    type GetEpisodesOptions,
} from "../lib/api/polishRadioApi";

export async function loadMoreEpisodes(
    nextPage: GetEpisodesOptions,
): Promise<EpisodesPage> {
    return getEpisodes(nextPage);
}