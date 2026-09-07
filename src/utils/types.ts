export interface RequestHeader {
  name: string;
  value: string;
}

export interface ResponseData {
  status: number;
  status_text: string;
  headers: Record<string, string>;
  cookies: string | null;
  body: string;
  duration_ms: number;
}
