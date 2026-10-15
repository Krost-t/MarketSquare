import { HttpError } from "../utils/http-error.ts";

const USER_AGENT = "MarketSquare/0.1 (+https://github.com/Krost-t/MarketSquare)";

interface CacheEntry {
    expiresAt: number;
    value: unknown;
}

const cache = new Map<string, CacheEntry>();
const MAX_CACHE_ENTRIES = 500;

const fetchJson = async <T>(url: string, init: RequestInit & { timeoutMs?: number } = {}): Promise<T> => {
    const { timeoutMs = 15000, ...options } = init;
    const response = await fetch(url, {
        ...options,
        headers: { "User-Agent": USER_AGENT, Accept: "application/json", ...options.headers },
        signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
        throw new HttpError(502, `Upstream service error (${response.status})`);
    }
    return (await response.json()) as T;
};

const cached = async <T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> => {
    const hit = cache.get(key);
    if (hit && hit.expiresAt > Date.now()) {
        return hit.value as T;
    }

    const value = await loader();
    if (cache.size >= MAX_CACHE_ENTRIES) {
        const oldest = cache.keys().next().value;
        if (oldest !== undefined) cache.delete(oldest);
    }
    cache.set(key, { value, expiresAt: Date.now() + ttlMs });
    return value;
};

const firstSuccessful = async <T>(loaders: (() => Promise<T>)[]): Promise<T> => {
    let lastError: unknown;
    for (const loader of loaders) {
        try {
            return await loader();
        } catch (error) {
            lastError = error;
        }
    }
    throw lastError instanceof HttpError ? lastError : new HttpError(502, "External services unavailable");
};

export { fetchJson, cached, firstSuccessful };
