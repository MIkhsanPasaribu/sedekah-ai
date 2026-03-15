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

function isAllowedMayarHost(hostname: string): boolean {
  const normalizedHost = hostname.toLowerCase();

  if (
    ALLOWED_MAYAR_HOSTS.includes(
      normalizedHost as (typeof ALLOWED_MAYAR_HOSTS)[number],
    )
  ) {
    return true;
  }

  return (
    normalizedHost.endsWith(".mayar.id") ||
    normalizedHost.endsWith(".mayar.club")
  );
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

  if (!isAllowedMayarHost(url.hostname)) {
    return { success: false, error: "Domain pembayaran tidak dikenali" };
  }

  if (!url.pathname || url.pathname === "/") {
    return { success: false, error: "Path link pembayaran tidak valid" };
  }

  return { success: true, url: url.toString() };
}
