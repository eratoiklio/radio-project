import { NextRequest, NextResponse } from "next/server";
import {
    PolishRadioApiError,
    resolveMedia,
    type ResolveMediaOptions,
} from "@/lib/api/polishRadioApi";
import type { ResolvedMedia } from "@/lib/types/media";

type PreferredKind = "audio" | "video";

function getMediaOptions(
    externalAudioId: string | undefined,
    externalVideoId: string | undefined,
    preferredKind: PreferredKind | undefined,
): ResolveMediaOptions {
    if (preferredKind === "audio" && externalAudioId) {
        return { externalAudioId };
    }

    if (preferredKind === "video" && externalVideoId) {
        return { externalVideoId };
    }

    return { externalAudioId, externalVideoId };
}

export async function GET(request: NextRequest) {
    const externalAudioId =
        request.nextUrl.searchParams.get("externalAudioId")?.trim() || undefined;
    const externalVideoId =
        request.nextUrl.searchParams.get("externalVideoId")?.trim() || undefined;
    const preferredKindParam =
        request.nextUrl.searchParams.get("preferredKind")?.trim() || undefined;

    if (!externalAudioId && !externalVideoId) {
        return NextResponse.json(
            { error: "Odcinek nie zawiera dostępnych mediów." },
            { status: 400 },
        );
    }

    if (
        preferredKindParam !== undefined &&
        preferredKindParam !== "audio" &&
        preferredKindParam !== "video"
    ) {
        return NextResponse.json(
            { error: "Nieprawidłowy preferowany rodzaj medium." },
            { status: 400 },
        );
    }

    try {
        const media: ResolvedMedia = await resolveMedia(
            getMediaOptions(
                externalAudioId,
                externalVideoId,
                preferredKindParam,
            ),
        );

        return NextResponse.json(media);
    } catch (error) {
        console.error("Failed to resolve Polish Radio media", error);

        if (error instanceof PolishRadioApiError && error.status === 404) {
            return NextResponse.json(
                { error: "Nie znaleziono medium dla tego odcinka." },
                { status: 404 },
            );
        }

        return NextResponse.json(
            { error: "Nie udało się pobrać medium. Spróbuj ponownie później." },
            { status: 502 },
        );
    }
}
