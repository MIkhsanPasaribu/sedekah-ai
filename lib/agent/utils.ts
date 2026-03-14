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

export function sanitizeCardNarrativeOutput(content: string): string {
  if (!content) return "";

  const cleaned = sanitizeModelOutput(content)
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .replace(/^\s*[>#]+\s?/gm, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return cleaned;
}

export interface StreamTokenSanitizerResult {
  cleaned: string;
  droppedChars: number;
}

export function createStreamTokenSanitizer(): (
  token: string,
) => StreamTokenSanitizerResult {
  let rawBuffer = "";
  let previousSanitized = "";

  function sanitizeStreamingBuffer(content: string): string {
    return content
      .replace(/<think>[\s\S]*?<\/think>/gi, "")
      .replace(/<think>[\s\S]*$/gi, "")
      .replace(/<\/?think>/gi, "");
  }

  function longestCommonPrefixLength(a: string, b: string): number {
    const max = Math.min(a.length, b.length);
    let i = 0;
    while (i < max && a[i] === b[i]) {
      i += 1;
    }
    return i;
  }

  return (token: string): StreamTokenSanitizerResult => {
    if (!token) {
      return { cleaned: "", droppedChars: 0 };
    }

    rawBuffer += token;

    const sanitizedFull = sanitizeStreamingBuffer(rawBuffer);
    const lcp = longestCommonPrefixLength(previousSanitized, sanitizedFull);
    const cleaned = sanitizedFull.slice(lcp);

    previousSanitized = sanitizedFull;

    // Keep memory bounded while preserving enough context for partial tag matching.
    if (rawBuffer.length > 20_000) {
      rawBuffer = rawBuffer.slice(-10_000);
      previousSanitized = sanitizeStreamingBuffer(rawBuffer);
    }

    const droppedChars = Math.max(0, token.length - cleaned.length);

    return {
      cleaned,
      droppedChars,
    };
  };
}

export function extractTextFromChatStreamChunk(chunk: unknown): string {
  if (!chunk || typeof chunk !== "object") {
    return "";
  }

  const maybeContent = (chunk as { content?: unknown }).content;
  if (typeof maybeContent === "string") {
    return maybeContent;
  }

  if (Array.isArray(maybeContent)) {
    return maybeContent
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }
        if (
          typeof item === "object" &&
          item !== null &&
          "text" in item &&
          typeof (item as { text?: unknown }).text === "string"
        ) {
          return (item as { text: string }).text;
        }
        return "";
      })
      .join("");
  }

  const maybeText = (chunk as { text?: unknown }).text;
  return typeof maybeText === "string" ? maybeText : "";
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
