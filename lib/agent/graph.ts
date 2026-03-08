// ============================================================
// LangGraph — Graph Assembly (StateGraph)
// ============================================================
// 7-node sequential flow: INTAKE → CALCULATE → RESEARCH →
// FRAUD_DETECTOR → RECOMMEND → PAYMENT_EXECUTOR → IMPACT_TRACKER
// With interrupt before PAYMENT_EXECUTOR

import {
  StateGraph,
  START,
  END,
  interrupt,
  MemorySaver,
} from "@langchain/langgraph";
import { AIMessage } from "@langchain/core/messages";
import { SedekahStateAnnotation } from "./state";
import type { SedekahState } from "./state";

// Singleton in-memory checkpointer — required for interrupt() to work
let _checkpointer: MemorySaver | null = null;
function getCheckpointer(): MemorySaver {
  if (!_checkpointer) _checkpointer = new MemorySaver();
  return _checkpointer;
}

// Import all nodes
import { intakeNode } from "./nodes/intake";
import { calculateNode } from "./nodes/calculate";
import { researchNode } from "./nodes/research";
import { fraudDetectorNode } from "./nodes/fraud";
import { recommendNode } from "./nodes/recommend";
import { paymentExecutorNode } from "./nodes/payment";
import { impactTrackerNode } from "./nodes/impact";

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
 * Router after PAYMENT_EXECUTOR: if paid, go to IMPACT_TRACKER.
 */
function routeAfterPayment(state: SedekahState): string {
  if (state.paymentStatus === "paid") {
    return "IMPACT_TRACKER";
  }
  if (state.paymentStatus === "failed") {
    return END;
  }
  return END; // pending — wait for webhook
}

// ---------- Latency Instrumentation ----------

/**
 * Wrap a node function with performance timing.
 * Logs [Node] INTAKE: 1234ms to console (and LangSmith captures via trace).
 */
function withLatency<S, R>(
  name: string,
  fn: (state: S) => R,
): (state: S) => R extends Promise<infer U> ? Promise<U> : Promise<R> {
  return (async (state: S) => {
    const start = performance.now();
    try {
      const result = await fn(state);
      const ms = Math.round(performance.now() - start);
      console.log(`[Node] ${name}: ${ms}ms`);
      return result;
    } catch (error) {
      const ms = Math.round(performance.now() - start);
      console.error(`[Node] ${name}: FAILED after ${ms}ms`);
      throw error;
    }
  }) as never;
}

// ---------- Build Graph ----------

export function buildSedekahGraph() {
  const graph = new StateGraph(SedekahStateAnnotation)
    // Add nodes (wrapped with latency instrumentation)
    .addNode("INTAKE", withLatency("INTAKE", intakeNode))
    .addNode("CALCULATE", withLatency("CALCULATE", calculateNode))
    .addNode("RESEARCH", withLatency("RESEARCH", researchNode))
    .addNode("FRAUD_DETECTOR", withLatency("FRAUD_DETECTOR", fraudDetectorNode))
    .addNode("RECOMMEND", withLatency("RECOMMEND", recommendNode))
    .addNode("PAYMENT_APPROVAL", paymentApprovalNode)
    .addNode(
      "PAYMENT_EXECUTOR",
      withLatency("PAYMENT_EXECUTOR", paymentExecutorNode),
    )
    .addNode("IMPACT_TRACKER", withLatency("IMPACT_TRACKER", impactTrackerNode))

    // Add edges
    .addEdge(START, "INTAKE")
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
    checkpointer: getCheckpointer(),
  });
}

// Singleton compiled graph
let _compiledGraph: ReturnType<typeof buildSedekahGraph> | null = null;

export function getSedekahGraph(): ReturnType<typeof buildSedekahGraph> {
  if (!_compiledGraph) {
    // Konfirmasi LangSmith tracing saat graph pertama kali dibuat
    const tracingEnabled = process.env.LANGCHAIN_TRACING_V2 === "true";
    const project = process.env.LANGCHAIN_PROJECT ?? "(default)";
    console.log(
      `[LangGraph] Tracing: ${tracingEnabled ? "ENABLED" : "DISABLED"} | Project: ${project}`,
    );

    _compiledGraph = buildSedekahGraph();
  }
  return _compiledGraph;
}
