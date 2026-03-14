// ============================================================
// LangGraph Agent Utilities
// ============================================================

import { AIMessage } from "@langchain/core/messages";
import { z } from "zod";
import { recordLlmInvokeMetric } from "@/lib/agent/observability";

const TECHNICAL_TERM_REPLACEMENTS: Array<{
  pattern: RegExp;
  replacement: string;
}> = [
  { pattern: /\bJSON\b/gi, replacement: "format data" },
  { pattern: /\bAPI\b/gi, replacement: "layanan" },
  { pattern: /\berror\s*\d{3}\b/gi, replacement: "kendala teknis" },
];

const REASONING_LINE_PATTERN =
  /^\s*(analysis|reasoning|chain\s*-?of\s*-?thought|internal\s*notes?|catatan\s*internal|analisis\s*internal)\s*:\s*.*$/gim;

const MANUAL_PAYMENT_PATTERN =
  /\b(transfer|rekening|bank\s*manual|gopay|ovo|dana|e-?wallet)\b/i;

function normalizeWhitespace(content: string): string {
  return content
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function enforceUserFacingOutputPolicy(content: string): string {
  let cleaned = content;

  cleaned = cleaned
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<think>[\s\S]*$/gi, "")
    .replace(/<\/?think>/gi, "")
    .replace(REASONING_LINE_PATTERN, "");

  for (const entry of TECHNICAL_TERM_REPLACEMENTS) {
    cleaned = cleaned.replace(entry.pattern, entry.replacement);
  }

  cleaned = normalizeWhitespace(cleaned);

  const hasManualPaymentInstruction = MANUAL_PAYMENT_PATTERN.test(cleaned);
  const hasOfficialLinkSignal =
    /https?:\/\//i.test(cleaned) || /\bmayar\b/i.test(cleaned);
  if (hasManualPaymentInstruction && !hasOfficialLinkSignal) {
    cleaned = `${cleaned}\n\nGunakan hanya tautan pembayaran resmi yang disediakan di aplikasi untuk menjaga keamanan donasi.`;
  }

  return normalizeWhitespace(cleaned);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`LLM request timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((result) => {
        clearTimeout(timeout);
        resolve(result);
      })
      .catch((error: unknown) => {
        clearTimeout(timeout);
        reject(error);
      });
  });
}

function isTransientLlmError(error: unknown): boolean {
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message?: unknown }).message).toLowerCase()
      : String(error).toLowerCase();

  return (
    message.includes("timeout") ||
    message.includes("timed out") ||
    message.includes("rate limit") ||
    message.includes("429") ||
    message.includes("temporarily unavailable") ||
    message.includes("econnreset") ||
    message.includes("socket hang up") ||
    message.includes("network")
  );
}

export interface LlmInvokeRuntimeOptions {
  timeoutMs: number;
  maxRetries: number;
  initialRetryDelayMs: number;
  backoffMultiplier?: number;
  operationName?: string;
  correlationId?: string;
}

export async function invokeWithRetryAndTimeout<T>(
  operation: () => Promise<T>,
  options: LlmInvokeRuntimeOptions,
): Promise<T> {
  const backoffMultiplier = options.backoffMultiplier ?? 2;
  const invokeStartedAtMs = Date.now();
  let attempts = 0;
  let timeoutDetected = false;

  for (let attempt = 0; ; attempt += 1) {
    attempts += 1;
    try {
      const result = await withTimeout(operation(), options.timeoutMs);
      recordLlmInvokeMetric({
        timestamp: new Date().toISOString(),
        operationName: options.operationName ?? "unknown_operation",
        correlationId: options.correlationId ?? null,
        timeoutMs: options.timeoutMs,
        durationMs: Date.now() - invokeStartedAtMs,
        attempts,
        retryCount: Math.max(0, attempts - 1),
        timeoutDetected,
        outcome: "success",
      });
      return result;
    } catch (error) {
      const message =
        typeof error === "object" && error !== null && "message" in error
          ? String((error as { message?: unknown }).message).toLowerCase()
          : String(error).toLowerCase();
      if (message.includes("timeout") || message.includes("timed out")) {
        timeoutDetected = true;
      }

      const canRetry =
        attempt < options.maxRetries && isTransientLlmError(error);
      if (!canRetry) {
        recordLlmInvokeMetric({
          timestamp: new Date().toISOString(),
          operationName: options.operationName ?? "unknown_operation",
          correlationId: options.correlationId ?? null,
          timeoutMs: options.timeoutMs,
          durationMs: Date.now() - invokeStartedAtMs,
          attempts,
          retryCount: Math.max(0, attempts - 1),
          timeoutDetected,
          outcome: "failure",
        });
        throw error;
      }

      const delayMs = Math.round(
        options.initialRetryDelayMs * Math.pow(backoffMultiplier, attempt),
      );
      await sleep(delayMs);
    }
  }
}

export function sanitizeModelOutput(content: string): string {
  if (!content) return "";

  return enforceUserFacingOutputPolicy(content);
}

export function parseJsonWithSchema<T>(
  raw: string,
  schema: z.ZodSchema<T>,
): T | null {
  try {
    const parsedUnknown: unknown = JSON.parse(raw);
    const parsed = schema.safeParse(parsedUnknown);
    if (!parsed.success) {
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

/**
 * Build a named AIMessage for a specific agent node.
 * Using `name` appears in LangSmith traces as the node label.
 *
 * @param content - Message text to display/log
 * @param nodeName - UPPER_SNAKE_CASE node name (e.g. "INTAKE", "CALCULATE")
 */
export function buildAgentMessage(
  content: string,
  nodeName: string,
): AIMessage {
  return new AIMessage({
    content: sanitizeModelOutput(content),
    name: nodeName,
  });
}
