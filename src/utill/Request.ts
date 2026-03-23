import type { RequestHeader, ResponseData } from "./types";

/**
 * TypeScript equivalent of the Rust `send_request` command
 */
export async function sendRequest(
    method: string,
    url: string,
    headers: RequestHeader[],
    body?: string | null
): Promise<ResponseData> {
    const headerMap: Record<string, string> = {};

    for (const h of headers) {
        if (!h.name?.trim()) continue;
        headerMap[h.name.trim()] = h.value?.trim() ?? "";
    }

    const options: RequestInit = {
        method: method.toUpperCase(),
        headers: headerMap
    };

    if (body && body.length > 0) {
        options.body = body;
    }

    const start = performance.now();

    let response: Response;
    try {
        response = await fetch(url, options);
    } catch (e: any) {
        throw new Error(`Request error: ${e.message}`);
    }

    const duration_ms = Math.round(performance.now() - start);

    const headersOut: Record<string, string> = {};
    response.headers.forEach((value, key) => {
        headersOut[key] = value;
    });

    let bodyText: string;
    try {
        bodyText = await response.text();
    } catch (e: any) {
        throw new Error(`Read body error: ${e.message}`);
    }

    return {
        status: response.status,
        status_text: response.statusText,
        headers: headersOut,
        body: bodyText,
        duration_ms
    };
}