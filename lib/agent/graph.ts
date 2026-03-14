// ============================================================
// LangGraph — Graph Assembly (StateGraph)
// ============================================================
// 8-node flow: SUPERVISOR → INTAKE → CALCULATE → RESEARCH →
// FRAUD_DETECTOR → RECOMMEND → PAYMENT_EXECUTOR → IMPACT_TRACKER
// With supervisor-based intent routing and interrupt before PAYMENT_EXECUTOR

import {
  StateGraph,
  START,
  END,
  interrupt,
  MemorySaver,
} from "@langchain/langgraph";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { AIMessage } from "@langchain/core/messages";
import { SedekahStateAnnotation } from "./state";
import type { SedekahState } from "./state";

// Async checkpointer: try PostgresSaver first, fall back to in-memory MemorySaver
async function getCheckpointer(): Promise<MemorySaver> {
  try {
    const saver = PostgresSaver.fromConnString(process.env.DATABASE_URL!);
    await saver.setup();
    console.log("[LangGraph] Postgres checkpointer initialized");
    return saver as unknown as MemorySaver;
  } catch (error) {
    console.warn(
      "[LangGraph] Postgres checkpointer unavailable, using MemorySaver:",
      error,
    );
    return new MemorySaver();
  }
}

// Eagerly initialize at module load so first request is fast
const _checkpointerPromise = getCheckpointer();

// Import all nodes
import { intakeNode } from "./nodes/intake";
import { calculateNode } from "./nodes/calculate";
import { researchNode } from "./nodes/research";
import { fraudDetectorNode } from "./nodes/fraud";
import { recommendNode } from "./nodes/recommend";
import { paymentExecutorNode } from "./nodes/payment";
import { impactTrackerNode } from "./nodes/impact";
import { supervisorNode } from "./nodes/supervisor";

// ---------- Router Functions ----------

/**
 * Router after INTAKE: if financial data is complete, go to CALCULATE.
 * Otherwise, loop back to handle more user input.
 */
function routeAfterIntake(state: SedekahState): string {
  if (state.userFinancialData) {
    return "CALCULATE";
  }
  // Jika donorIntent ada tapi tanpa data keuangan (sedekah/infaq)
  if (
    state.donorIntent &&
    ["sedekah", "infaq", "wakaf", "bencana"].includes(state.donorIntent)
  ) {
    return "CALCULATE";
  }
  return END; // Wait for more user input
}

/**
 * Router after RECOMMEND: interrupt for human approval.
 * User must choose "Bayar Sekarang" or "Ubah Alokasi".
 */
function routeAfterRecommend(state: SedekahState): string {
  if (state.recommendation && state.recommendation.allocations.length > 0) {
    return "PAYMENT_APPROVAL";
  }
  return END;
}

/**
 * Human-in-the-loop approval node.
 * Single interrupt point before PAYMENT_EXECUTOR.
 */
function paymentApprovalNode(state: SedekahState): Partial<SedekahState> {
  // interrupt() halts execution and waits for human resume
  const approval = interrupt({
    type: "payment_approval",
    recommendation: state.recommendation,
    message: "Silakan pilih: Bayar Sekarang atau Ubah Alokasi",
  });

  // If user chose "edit", clear recommendation so they can restart
  if (approval === "edit") {
    return {
      messages: [
        new AIMessage({
          content:
            "Baik, silakan sampaikan perubahan alokasi yang Anda inginkan. 🤲",
          name: "PAYMENT_APPROVAL",
        }),
      ],
      recommendation: null,
    };
  }

  // "approve" — proceed to PAYMENT_EXECUTOR
  return {};
}

/**
 * Router after PAYMENT_APPROVAL: if user chose "edit", go to END.
 */
function routeAfterApproval(state: SedekahState): string {
  if (!state.recommendation) {
    return END;
  }
  return "PAYMENT_EXECUTOR";
}

/**
 * Router after PAYMENT_EXECUTOR: always go to IMPACT_TRACKER to show projected/confirmed impact.
 */
function routeAfterPayment(state: SedekahState): string {
  if (state.paymentStatus === "failed") {
    return END;
  }
  return "IMPACT_TRACKER"; // Show projected impact even if still "pending"
}

// ---------- Resilience + Latency Instrumentation ----------

/** User-friendly fallback messages per node (Bahasa Indonesia) */
const NODE_FALLBACK_MESSAGES: Record<string, string> = {
  INTAKE:
    "Mohon maaf, saya belum bisa memproses pesan Anda saat ini. Silakan coba lagi. 🤲",
  CALCULATE:
    "Mohon maaf, terjadi kendala saat menghitung zakat. Silakan ulangi dengan data yang sama. 🤲",
  RESEARCH:
    "Mohon maaf, pencarian kampanye sedang terganggu. Saya tetap melanjutkan proses. 🤲",
  FRAUD_DETECTOR:
    "Analisis keamanan kampanye sedang tidak tersedia. Saya tetap menampilkan rekomendasi. 🤲",
  RECOMMEND:
    "Mohon maaf, terjadi kendala saat menyusun rekomendasi. Silakan coba lagi. 🤲",
  PAYMENT_EXECUTOR:
    "Mohon maaf, terjadi kendala saat memproses pembayaran. Silakan coba beberapa saat lagi. 🤲",
  IMPACT_TRACKER:
    "Laporan dampak sedang tidak tersedia. Anda bisa melihatnya nanti di Dashboard. 🤲",
};

/**
 * Wrap a node function with resilience (error recovery) + performance timing.
 * On success: logs latency.
 * On failure: logs error, returns a fallback AIMessage so the chain can continue
 * or end gracefully instead of crashing.
 */
function withResilience<S extends { messages?: unknown[] }, R>(
  name: string,
  fn: (state: S) => R,
): (state: S) => Promise<Partial<SedekahState>> {
  return (async (state: S) => {
    const start = performance.now();
    try {
      const result = await fn(state);
      const ms = Math.round(performance.now() - start);
      console.log(`[Node] ${name}: ${ms}ms`);
      return result;
    } catch (error) {
      const ms = Math.round(performance.now() - start);
      const errorMsg =
        error instanceof Error ? error.message : "Unknown error";
      console.error(
        `[Node] ${name}: FAILED after ${ms}ms — ${errorMsg}`,
        error,
      );

      const fallbackText =
        NODE_FALLBACK_MESSAGES[name] ??
        "Mohon maaf, terjadi kendala teknis. Silakan coba lagi. 🤲";

      // Return a fallback partial state with a friendly message
      return {
        messages: [
          new AIMessage({
            content: fallbackText,
            name,
          }),
        ],
      } as Partial<SedekahState>;
    }
  }) as never;
}

// ---------- Build Graph ----------

export function buildSedekahGraph(checkpointer: MemorySaver) {
  const graph = new StateGraph(SedekahStateAnnotation)
    // Add nodes (wrapped with resilience instrumentation)
    .addNode("SUPERVISOR", withResilience("SUPERVISOR", supervisorNode))
    .addNode("INTAKE", withResilience("INTAKE", intakeNode))
    .addNode("CALCULATE", withResilience("CALCULATE", calculateNode))
    .addNode("RESEARCH", withResilience("RESEARCH", researchNode))
    .addNode("FRAUD_DETECTOR", withResilience("FRAUD_DETECTOR", fraudDetectorNode))
    .addNode("RECOMMEND", withResilience("RECOMMEND", recommendNode))
    .addNode("PAYMENT_APPROVAL", paymentApprovalNode)
    .addNode(
      "PAYMENT_EXECUTOR",
      withResilience("PAYMENT_EXECUTOR", paymentExecutorNode),
    )
    .addNode("IMPACT_TRACKER", withResilience("IMPACT_TRACKER", impactTrackerNode))

    // Add edges — SUPERVISOR routes based on intent
    .addEdge(START, "SUPERVISOR")
    .addEdge("SUPERVISOR", "INTAKE")
    .addConditionalEdges("INTAKE", routeAfterIntake, {
      CALCULATE: "CALCULATE",
      [END]: END,
    })
    .addEdge("CALCULATE", "RESEARCH")
    .addEdge("RESEARCH", "FRAUD_DETECTOR")
    .addEdge("FRAUD_DETECTOR", "RECOMMEND")
    .addConditionalEdges("RECOMMEND", routeAfterRecommend, {
      PAYMENT_APPROVAL: "PAYMENT_APPROVAL",
      [END]: END,
    })
    .addConditionalEdges("PAYMENT_APPROVAL", routeAfterApproval, {
      PAYMENT_EXECUTOR: "PAYMENT_EXECUTOR",
      [END]: END,
    })
    .addConditionalEdges("PAYMENT_EXECUTOR", routeAfterPayment, {
      IMPACT_TRACKER: "IMPACT_TRACKER",
      [END]: END,
    })
    .addEdge("IMPACT_TRACKER", END);

  return graph.compile({
    checkpointer,
  });
}

// Async singleton compiled graph
let _compiledGraphPromise: Promise<
  ReturnType<typeof buildSedekahGraph>
> | null = null;

export async function getSedekahGraph(): Promise<
  ReturnType<typeof buildSedekahGraph>
> {
  if (!_compiledGraphPromise) {
    _compiledGraphPromise = (async () => {
      const tracingEnabled = process.env.LANGCHAIN_TRACING_V2 === "true";
      const project = process.env.LANGCHAIN_PROJECT ?? "(default)";
      console.log(
        `[LangGraph] Tracing: ${
          tracingEnabled ? "ENABLED" : "DISABLED"
        } | Project: ${project}`,
      );
      const checkpointer = await _checkpointerPromise;
      return buildSedekahGraph(checkpointer);
    })();
  }
  return _compiledGraphPromise;
}
