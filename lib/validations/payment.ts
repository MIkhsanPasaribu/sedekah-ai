import { z } from "zod";

const mayarPaymentUrlSchema = z
  .string()
  .trim()
  .url("Link pembayaran tidak valid");

const ALLOWED_MAYAR_HOSTS = [
  "mayar.id",
  "www.mayar.id",
  "mayar.club",
  "www.mayar.club",
] as const;

const MAYAR_HOST_SUFFIXES = [
  ".mayar.id",
  ".mayar.club",
  ".mayar.co.id",
  ".mayar.com",
] as const;

function getConfiguredAllowedPaymentHosts(): string[] {
  const raw = process.env.MAYAR_ALLOWED_PAYMENT_HOSTS?.trim();
  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 0);
}

function getMayarApiHostFromEnv(): string | null {
  const rawBaseUrl = process.env.MAYAR_BASE_URL?.trim();
  if (!rawBaseUrl) {
    return null;
  }

  try {
    return new URL(rawBaseUrl).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function allowUnknownPaymentHost(): boolean {
  return process.env.MAYAR_ALLOW_UNKNOWN_PAYMENT_HOSTS === "true";
}

function isAllowedMayarHost(hostname: string): boolean {
  const normalizedHost = hostname.toLowerCase();
  const envAllowedHosts = getConfiguredAllowedPaymentHosts();
  const mayarApiHost = getMayarApiHostFromEnv();

  if (
    ALLOWED_MAYAR_HOSTS.includes(
      normalizedHost as (typeof ALLOWED_MAYAR_HOSTS)[number],
    )
  ) {
    return true;
  }

  if (MAYAR_HOST_SUFFIXES.some((suffix) => normalizedHost.endsWith(suffix))) {
    return true;
  }

  if (normalizedHost.includes(".mayar.")) {
    return true;
  }

  if (mayarApiHost && normalizedHost === mayarApiHost) {
    return true;
  }

  if (envAllowedHosts.includes(normalizedHost)) {
    return true;
  }

  return false;
}

export function validateMayarPaymentLink(
  input: string,
): { success: true; url: string } | { success: false; error: string } {
  const parsed = mayarPaymentUrlSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Link pembayaran tidak valid",
    };
  }

  const url = new URL(parsed.data);

  if (url.protocol !== "https:") {
    return { success: false, error: "Link pembayaran harus menggunakan HTTPS" };
  }

  if (!url.pathname || url.pathname === "/") {
    return { success: false, error: "Path link pembayaran tidak valid" };
  }

  if (!isAllowedMayarHost(url.hostname)) {
    if (process.env.NODE_ENV !== "production" || allowUnknownPaymentHost()) {
      // Dev mode: keep flow unblocked while still enforcing HTTPS + proper URL shape.
      return { success: true, url: url.toString() };
    }

    return { success: false, error: "Domain pembayaran tidak dikenali" };
  }

  return { success: true, url: url.toString() };
}
