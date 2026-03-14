// ============================================================
// Agent Observability Store (In-Memory)
// ============================================================

export interface AgentStreamMetric {
  timestamp: string;
  correlationId: string;
  threadId: string;
  durationMs: number;
  result: "completed" | "errored" | "client_disconnected";
  action: "approve" | "edit" | null;
  needsApproval: boolean | null;
  metrics: Record<string, unknown>;
}

export interface LlmInvokeMetric {
  timestamp: string;
  operationName: string;
  correlationId: string | null;
  timeoutMs: number;
  durationMs: number;
  attempts: number;
  retryCount: number;
  timeoutDetected: boolean;
  outcome: "success" | "failure";
}

interface AgentObservabilityStore {
  startedAt: string;
  agentStream: {
    total: number;
    completed: number;
    errored: number;
    clientDisconnected: number;
  };
  llmInvoke: {
    total: number;
    success: number;
    failure: number;
    timeoutDetected: number;
    totalRetries: number;
  };
  recentAgentStreams: AgentStreamMetric[];
  recentLlmInvocations: LlmInvokeMetric[];
}

const MAX_RECENT_ITEMS = 120;

const store: AgentObservabilityStore = {
  startedAt: new Date().toISOString(),
  agentStream: {
    total: 0,
    completed: 0,
    errored: 0,
    clientDisconnected: 0,
  },
  llmInvoke: {
    total: 0,
    success: 0,
    failure: 0,
    timeoutDetected: 0,
    totalRetries: 0,
  },
  recentAgentStreams: [],
  recentLlmInvocations: [],
};

function pushRecent<T>(list: T[], value: T): void {
  list.unshift(value);
  if (list.length > MAX_RECENT_ITEMS) {
    list.length = MAX_RECENT_ITEMS;
  }
}

export function recordAgentStreamMetric(metric: AgentStreamMetric): void {
  store.agentStream.total += 1;
  if (metric.result === "completed") {
    store.agentStream.completed += 1;
  } else if (metric.result === "errored") {
    store.agentStream.errored += 1;
  } else {
    store.agentStream.clientDisconnected += 1;
  }

  pushRecent(store.recentAgentStreams, metric);
}

export function recordLlmInvokeMetric(metric: LlmInvokeMetric): void {
  store.llmInvoke.total += 1;
  store.llmInvoke.totalRetries += metric.retryCount;

  if (metric.timeoutDetected) {
    store.llmInvoke.timeoutDetected += 1;
  }

  if (metric.outcome === "success") {
    store.llmInvoke.success += 1;
  } else {
    store.llmInvoke.failure += 1;
  }

  pushRecent(store.recentLlmInvocations, metric);
}

export function getAgentOpsSnapshot(): Record<string, unknown> {
  const llmTotal = store.llmInvoke.total;
  const streamTotal = store.agentStream.total;
  const recentStreamMetrics = store.recentAgentStreams;

  let streamsWithTokens = 0;
  let totalTokenEvents = 0;
  let totalTokenChars = 0;
  let totalTokenDropped = 0;

  for (const stream of recentStreamMetrics) {
    const rawMetrics = stream.metrics;
    const tokenEvents = Number(rawMetrics.tokenEvents ?? 0);
    const tokenCharsSent = Number(rawMetrics.tokenCharsSent ?? 0);
    const tokenDroppedByPolicy = Number(rawMetrics.tokenDroppedByPolicy ?? 0);

    if (tokenEvents > 0) {
      streamsWithTokens += 1;
    }
    totalTokenEvents += Math.max(0, tokenEvents);
    totalTokenChars += Math.max(0, tokenCharsSent);
    totalTokenDropped += Math.max(0, tokenDroppedByPolicy);
  }

  const totalTokenObserved = totalTokenChars + totalTokenDropped;

  return {
    startedAt: store.startedAt,
    generatedAt: new Date().toISOString(),
    counters: {
      agentStream: {
        ...store.agentStream,
        successRate:
          streamTotal > 0 ? store.agentStream.completed / streamTotal : 0,
      },
      llmInvoke: {
        ...store.llmInvoke,
        successRate: llmTotal > 0 ? store.llmInvoke.success / llmTotal : 0,
        avgRetryPerInvoke:
          llmTotal > 0 ? store.llmInvoke.totalRetries / llmTotal : 0,
      },
      tokenStream: {
        streamsWithTokens,
        totalTokenEvents,
        totalTokenChars,
        totalTokenDropped,
        avgTokenCharsPerStream:
          streamsWithTokens > 0 ? totalTokenChars / streamsWithTokens : 0,
        policyDropRate:
          totalTokenObserved > 0 ? totalTokenDropped / totalTokenObserved : 0,
      },
    },
    recent: {
      agentStreams: store.recentAgentStreams,
      llmInvocations: store.recentLlmInvocations,
    },
  };
}
