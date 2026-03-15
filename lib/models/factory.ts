import { ChatGroq } from "@langchain/groq";
import { getAiRuntimeConfig } from "@/lib/env";
import {
  getAiModelCatalog,
  getFallbackModelsForTask,
  getModelForTask,
} from "@/lib/models/config";
import type { AiModelTask } from "@/lib/models/types";
import { invokeWithRetryAndTimeout } from "@/lib/agent/utils";

interface CreateTaskLlmOptions {
  temperature: number;
  maxRetries?: number;
}

interface InvokeTaskWithFallbackOptions {
  temperature: number;
  timeoutMs: number;
  maxRetries: number;
  initialRetryDelayMs: number;
  operationName: string;
  correlationId?: string;
}

export function createTaskLlm(
  task: AiModelTask,
  options: CreateTaskLlmOptions,
): ChatGroq {
  const aiRuntime = getAiRuntimeConfig();

  return new ChatGroq({
    model: getModelForTask(task),
    temperature: options.temperature,
    apiKey: process.env.GROQ_API_KEY,
    maxRetries: options.maxRetries ?? aiRuntime.llmMaxRetries,
  });
}

function getModelTierFromCatalog(modelId: string): string {
  const catalog = getAiModelCatalog();
  if (catalog.reasoning === modelId) return "reasoning";
  if (catalog.balanced === modelId) return "balanced";
  if (catalog.economy === modelId) return "economy";
  return "unknown";
}

export async function invokeTaskWithModelFallback<T>(
  task: AiModelTask,
  options: InvokeTaskWithFallbackOptions,
  operation: (llm: ChatGroq) => Promise<T>,
): Promise<T> {
  const fallbackModels = getFallbackModelsForTask(task);
  let lastError: unknown = null;

  for (let index = 0; index < fallbackModels.length; index += 1) {
    const modelId = fallbackModels[index];
    const llm = new ChatGroq({
      model: modelId,
      temperature: options.temperature,
      apiKey: process.env.GROQ_API_KEY,
      maxRetries: options.maxRetries,
    });

    try {
      return await invokeWithRetryAndTimeout(() => operation(llm), {
        timeoutMs: options.timeoutMs,
        maxRetries: options.maxRetries,
        initialRetryDelayMs: options.initialRetryDelayMs,
        operationName: options.operationName,
        correlationId: options.correlationId,
        task,
        modelId,
        modelTier: getModelTierFromCatalog(modelId),
        fallbackAttempt: index,
        isFallback: index > 0,
      });
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error(`Semua fallback model gagal untuk task ${task}`);
}
