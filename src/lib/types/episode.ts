export interface EpisodeRm {
    id: string;
    title: string;
    slug: string;
    podcastSlug: string;
    podcastTitle: string;
    audioDuration: number | null;
    videoDuration: number | null;
    externalAudioId: string | null;
    externalVideoId: string | null;
    mainImage: { uri: string; title: string } | null;
}