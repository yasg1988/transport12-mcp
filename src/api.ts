export type QueryValue = string | number | boolean | undefined;

export interface ApiClientOptions {
  baseUrl: string;
  userAgent?: string;
}

export interface ApiCheck {
  name: string;
  ok: boolean;
  status?: number;
  durationMs: number;
  error?: string;
}

export class Transport12ApiClient {
  private readonly baseUrl: string;
  private readonly userAgent: string;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.userAgent = options.userAgent || "transport12-mcp/0.1";
  }

  buildUrl(path: string, query: Record<string, QueryValue> = {}): string {
    const url = new URL(path, `${this.baseUrl}/`);
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
    }
    return url.toString();
  }

  async get(path: string, query: Record<string, QueryValue> = {}): Promise<unknown> {
    const response = await fetch(this.buildUrl(path, query), {
      headers: {
        Accept: "application/json",
        "User-Agent": this.userAgent,
      },
    });

    const text = await response.text();
    if (!response.ok) {
      throw new Error(`transport12 API HTTP ${response.status}: ${text.slice(0, 500)}`);
    }

    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  async check(name: string, path: string, query: Record<string, QueryValue> = {}): Promise<ApiCheck> {
    const startedAt = Date.now();
    try {
      const response = await fetch(this.buildUrl(path, query), {
        headers: {
          Accept: "application/json",
          "User-Agent": this.userAgent,
        },
      });
      await response.arrayBuffer();
      return {
        name,
        ok: response.ok,
        status: response.status,
        durationMs: Date.now() - startedAt,
        error: response.ok ? undefined : `HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        name,
        ok: false,
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

export function sanitizeHealth(data: unknown): unknown {
  if (!data || typeof data !== "object" || Array.isArray(data)) return data;
  const { source: _source, ...rest } = data as Record<string, unknown>;
  return rest;
}
