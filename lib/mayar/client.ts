// ============================================================
// Mayar API — Base HTTP Client (Singleton)
// ============================================================

import { getMayarRuntimeConfig } from "@/lib/env";

const { apiKey: MAYAR_API_KEY, baseUrl: MAYAR_BASE_URL } =
  getMayarRuntimeConfig();

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 20_000;

interface MayarRequestOptions {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  body?: Record<string, unknown>;
  params?: Record<string, string>;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Base HTTP client untuk Mayar API.
 * Menangani auth, retry-after pada 429, dan error handling.
 */
export async function mayarFetch<T>(options: MayarRequestOptions): Promise<T> {
  const { method, path, body, params } = options;
  const requestId = crypto.randomUUID();

  const url = new URL(`${MAYAR_BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const start = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url.toString(), {
        method,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${MAYAR_API_KEY}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      clearTimeout(timeoutId);

      // Handle rate limiting (429)
      if (response.status === 429) {
        const retryAfter = response.headers.get("retry-after");
        const delayMs = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);

        console.warn(
          `[Mayar:${requestId}] Rate limited (429). Retrying in ${delayMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`,
        );
        await sleep(delayMs);
        continue;
      }

      // Handle server errors with retry
      if (response.status >= 500) {
        const delayMs = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
        console.warn(
          `[Mayar:${requestId}] Server error (${response.status}). Retrying in ${delayMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`,
        );
        await sleep(delayMs);
        continue;
      }

      // Handle client errors (no retry)
      if (!response.ok) {
        const errorBody = await response.text();
        throw new MayarApiError(
          `Mayar API error ${response.status}: ${errorBody}`,
          response.status,
        );
      }

      const data = (await response.json()) as T;
      console.info(
        `[Mayar:${requestId}] ${method} ${path} success in ${Date.now() - start}ms`,
      );
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof MayarApiError) {
        throw error;
      }

      if (error instanceof DOMException && error.name === "AbortError") {
        lastError = new Error(
          `Timeout ${REQUEST_TIMEOUT_MS}ms saat menghubungi Mayar`,
        );
      } else {
        lastError = error as Error;
      }
      if (attempt < MAX_RETRIES - 1) {
        const delayMs = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
        console.warn(
          `[Mayar:${requestId}] Network error. Retrying in ${delayMs}ms (attempt ${attempt + 1}/${MAX_RETRIES}):`,
          lastError.message,
        );
        await sleep(delayMs);
      }
    }
  }

  throw new MayarApiError(
    `Mayar API request failed after ${MAX_RETRIES} retries: ${lastError?.message ?? "Unknown error"}`,
    0,
  );
}

/**
 * Custom error class untuk Mayar API errors.
 */
export class MayarApiError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "MayarApiError";
    this.statusCode = statusCode;
  }
}
