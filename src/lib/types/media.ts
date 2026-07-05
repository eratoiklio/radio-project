export interface MediaAssetDto {
    id: string;
    title: string;
    uri: string;
    durationSeconds: number;
    transcription?: {
        vttUri?: string;
    };
}

interface ResolvedMediaBase {
    asset: MediaAssetDto;
    playbackUri: string;
    subtitleUri: string | null;
}

export interface ResolvedAudio extends ResolvedMediaBase {
    type: "audio";
}

export interface ResolvedVideo extends ResolvedMediaBase {
    type: "video";
}

export type ResolvedMedia = ResolvedAudio | ResolvedVideo;
