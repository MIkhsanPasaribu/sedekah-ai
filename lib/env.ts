import { z } from "zod";
import type { AiModelCatalog } from "@/lib/models/types";
import { SUPPORTED_GROQ_MODELS } from "@/lib/models/types";

const appUrlSchema = z
  .string()
  .url("NEXT_PUBLIC_APP_URL harus berupa URL valid")
  .optional();

const mayarBaseUrlSchema = z
  .string()
  .url("MAYAR_BASE_URL harus berupa URL valid")
  .optional();

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

export interface MayarRuntimeConfig {
  apiKey: string;
  isSandbox: boolean;
  baseUrl: string;
}

export interface AiRuntimeConfig {
  llmTimeoutMs: number;
  llmMaxRetries: number;
  llmInitialRetryDelayMs: number;
  sseHeartbeatMs: number;
  fraudAnalysisTopN: number;
  enableTokenStream: boolean;
}

const groqModelSchema = z.enum(SUPPORTED_GROQ_MODELS);

const DEFAULT_AI_MODEL_CATALOG: AiModelCatalog = {
  reasoning: "llama-3.3-70b-versatile",
  balanced: "meta-llama/llama-4-scout-17b-16e-instruct",
  economy: "qwen/qwen3-32b",
};

function parseIntegerEnv(
  name: string,
  fallback: number,
  options: { min: number; max?: number },
): number {
  const rawValue = process.env[name]?.trim();
  if (!rawValue) {
    return fallback;
  }

  const parsed = Number.parseInt(rawValue, 10);
  const max = options.max ?? Number.MAX_SAFE_INTEGER;
  if (Number.isNaN(parsed) || parsed < options.min || parsed > max) {
    return fallback;
  }

  return parsed;
}

function parseGroqModelEnv(
  envName: string,
  fallback: AiModelCatalog[keyof AiModelCatalog],
): AiModelCatalog[keyof AiModelCatalog] {
  const rawValue = process.env[envName]?.trim();
  if (!rawValue) {
    return fallback;
  }

  const parsed = groqModelSchema.safeParse(rawValue);
  if (!parsed.success) {
    throw new Error(
      `${envName} tidak valid. Gunakan salah satu: ${SUPPORTED_GROQ_MODELS.join(
        ", ",
      )}`,
    );
  }

  return parsed.data;
}

export function getMayarRuntimeConfig(): MayarRuntimeConfig {
  const apiKey = process.env.MAYAR_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("MAYAR_API_KEY belum dikonfigurasi");
  }

  const isSandbox = process.env.MAYAR_SANDBOX === "true";
  const overrideBaseUrl = mayarBaseUrlSchema.parse(process.env.MAYAR_BASE_URL);
  const baseUrl =
    overrideBaseUrl ??
    (isSandbox ? "https://api.mayar.club/hl/v1" : "https://api.mayar.id/hl/v1");

  return {
    apiKey,
    isSandbox,
    baseUrl: trimTrailingSlash(baseUrl),
  };
}

export function getRequiredAppBaseUrl(): string {
  const envAppUrl = appUrlSchema.parse(process.env.NEXT_PUBLIC_APP_URL);
  if (envAppUrl) {
    return trimTrailingSlash(envAppUrl);
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return `https://${trimTrailingSlash(vercelUrl)}`;
  }

  throw new Error("NEXT_PUBLIC_APP_URL belum dikonfigurasi");
}

export function getAuthEmailRedirectUrl(nextPath = "/chat"): string {
  const safeNextPath = nextPath.startsWith("/") ? nextPath : "/chat";
  const callbackUrl = new URL("/callback", getRequiredAppBaseUrl());
  callbackUrl.searchParams.set("next", safeNextPath);
  return callbackUrl.toString();
}

export function getAutopilotProductId(): string | null {
  const productId =
    process.env.MAYAR_CREDIT_PRODUCT_ID?.trim() ??
    process.env.MAYAR_AUTOPILOT_PRODUCT_ID?.trim() ??
    null;
  return productId && productId.length > 0 ? productId : null;
}

export function getAiRuntimeConfig(): AiRuntimeConfig {
  return {
    llmTimeoutMs: parseIntegerEnv("AI_LLM_TIMEOUT_MS", 8_000, {
      min: 1_000,
      max: 60_000,
    }),
    llmMaxRetries: parseIntegerEnv("AI_LLM_MAX_RETRIES", 1, {
      min: 0,
      max: 5,
    }),
    llmInitialRetryDelayMs: parseIntegerEnv("AI_LLM_RETRY_DELAY_MS", 600, {
      min: 100,
      max: 10_000,
    }),
    sseHeartbeatMs: parseIntegerEnv("AI_SSE_HEARTBEAT_MS", 15_000, {
      min: 5_000,
      max: 60_000,
    }),
    fraudAnalysisTopN: parseIntegerEnv("FRAUD_ANALYSIS_TOP_N", 8, {
      min: 1,
      max: 50,
    }),
    enableTokenStream: process.env.AI_ENABLE_TOKEN_STREAM === "true",
  };
}

export function getAiModelRuntimeConfig(): AiModelCatalog {
  return {
    reasoning: parseGroqModelEnv(
      "AI_MODEL_REASONING",
      DEFAULT_AI_MODEL_CATALOG.reasoning,
    ),
    balanced: parseGroqModelEnv(
      "AI_MODEL_BALANCED",
      DEFAULT_AI_MODEL_CATALOG.balanced,
    ),
    economy: parseGroqModelEnv(
      "AI_MODEL_ECONOMY",
      DEFAULT_AI_MODEL_CATALOG.economy,
    ),
  };
}

export function getFraudAnalysisTopN(): number {
  return getAiRuntimeConfig().fraudAnalysisTopN;
}
