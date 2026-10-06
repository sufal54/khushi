import { fetch } from "@tauri-apps/plugin-http";
import type { RequestHeader, ResponseData } from "./types";

const KHUSHI_USER_AGENT = "Khushi/0.1.4";

export async function sendRequest(
  method: string,
  url: string,
  headers: RequestHeader[],
  body?: string | null,
): Promise<ResponseData> {
  const headerMap: Record<string, string> = {};

  for (const h of headers) {
    if (!h.name?.trim()) continue;
    headerMap[h.name.trim()] = h.value?.trim() ?? "";
  }

  const userAgentKey = Object.keys(headerMap).find(
    (key) => key.toLowerCase() === "user-agent",
  );

  if (userAgentKey) {
    headerMap[userAgentKey] = KHUSHI_USER_AGENT;
  } else {
    headerMap["User-Agent"] = KHUSHI_USER_AGENT;
  }

  const options: RequestInit = {
    method: method.toUpperCase(),
    headers: headerMap,
  };

  if (body && body.length > 0) {
    options.body = body;
  }

  const start = performance.now();

  let response: Response;
  try {
    response = await fetch(url, options);
  } catch (e: any) {
    throw new Error(e);
  }

  const duration_ms = Math.round(performance.now() - start);

  const headersOut: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headersOut[key] = value;
  });

  const setCookie = response.headers.get("set-cookie");
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
    cookies: setCookie ? setCookie : null,
    body: bodyText,
    duration_ms,
  };
}
