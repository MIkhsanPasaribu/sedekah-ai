import { z } from "zod";

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

export function getAutopilotProductId(): string | null {
  const productId =
    process.env.MAYAR_CREDIT_PRODUCT_ID?.trim() ??
    process.env.MAYAR_AUTOPILOT_PRODUCT_ID?.trim() ??
    null;
  return productId && productId.length > 0 ? productId : null;
}
