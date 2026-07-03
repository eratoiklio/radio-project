import "server-only"

function getApiBaseUrl(): string {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    if(!apiBaseUrl) {
        throw new Error(
            "Missing required environment variable: NEXT_PUBLIC_API_BASE_URL"
        )
    }
    return apiBaseUrl.replace(/\+$/, "")
}

export async function apiFetch(
    path: string,
    init?: RequestInit) : Promise<Response> {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`
    return fetch(`${getApiBaseUrl()}${normalizedPath}`, init)
}