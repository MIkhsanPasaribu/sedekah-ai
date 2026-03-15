// ============================================================
// LangGraph Node: SUPERVISOR — Intent-Based Routing
// ============================================================
// Routes incoming messages to appropriate sub-workflows:
// - Donation flow: full pipeline (INTAKE → ... → IMPACT_TRACKER)
// - Info query: lightweight FAQ/info response
// - Greeting: warm Islamic greeting without triggering full pipeline
//
// This prevents the full 7-node pipeline from running when the user
// just wants to ask a question or say "Assalamu'alaikum".

import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { z } from "zod";
import { createTaskLlm } from "@/lib/models/factory";
import type { SedekahState } from "../state";

const intentSchema = z.object({
  intent: z
    .enum(["donation", "info", "greeting"])
    .describe(
      "Intent user: 'donation' jika ingin donasi/zakat/sedekah/infaq/wakaf, 'info' jika bertanya tentang fitur/cara kerja/kampanye tanpa niat donasi, 'greeting' jika hanya menyapa",
    ),
  confidence: z.number().min(0).max(1).describe("Confidence level 0-1"),
});

const classifierLlm = createTaskLlm("agent_supervisor_classifier", {
  temperature: 0,
}).withStructuredOutput(intentSchema);

const CLASSIFIER_PROMPT = `Kamu adalah classifier intent untuk aplikasi donasi SEDEKAH.AI.

Klasifikasikan pesan user ke salah satu intent:
- "donation": User ingin berdonasi, bayar zakat, sedekah, infaq, wakaf, bantuan bencana, atau menyebutkan data keuangan
- "info": User bertanya tentang cara kerja, fitur, kampanye, tanpa niat donasi langsung
- "greeting": User hanya menyapa (Assalamu'alaikum, halo, dll) tanpa menyebutkan donasi

Jika ragu antara donation dan info, pilih donation (lebih aman).`;

/**
 * Classify user intent to determine routing.
 * Returns the detected intent as part of state for the router to use.
 */
export async function supervisorNode(
  state: SedekahState,
): Promise<Partial<SedekahState>> {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];
  const content =
    typeof lastMessage?.content === "string" ? lastMessage.content : "";

  // Quick heuristic: if message is very short greeting, skip LLM call
  const greetingPatterns = [
    /^assalamu.?alaikum$/i,
    /^halo$/i,
    /^hai$/i,
    /^hi$/i,
    /^selamat (pagi|siang|sore|malam)$/i,
  ];

  const isGreeting = greetingPatterns.some((p) => p.test(content.trim()));
  if (isGreeting) {
    return { supervisorIntent: "greeting" };
  }

  // Use LLM for more complex classification
  try {
    const result = await classifierLlm.invoke([
      new SystemMessage(CLASSIFIER_PROMPT),
      new HumanMessage(content),
    ]);

    return {
      supervisorIntent: result.intent,
    };
  } catch {
    // Default to donation flow on error (safer — won't miss a donation request)
    return { supervisorIntent: "donation" };
  }
}
