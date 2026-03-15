// ============================================================
// LangGraph Node: SUPERVISOR — Intent-Based Routing
// ============================================================
// Routes incoming messages to appropriate sub-workflows:
// - Donation flow: full pipeline (INTAKE → ... → IMPACT_TRACKER)
// - Edit allocation: jump to RECOMMEND_EDIT (skip INTAKE/CALCULATE/RESEARCH/FRAUD)
// - Follow-up: questions about previous donations → INTAKE with context
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
    .enum(["donation", "info", "greeting", "edit_allocation", "follow_up"])
    .describe(
      "Intent user: 'donation' jika ingin donasi/zakat/sedekah/infaq/wakaf, 'edit_allocation' jika ingin mengubah alokasi/persentase/kampanye tujuan donasi, 'follow_up' jika menanyakan status donasi sebelumnya atau lanjutan percakapan, 'info' jika bertanya tentang fitur/cara kerja tanpa niat donasi, 'greeting' jika hanya menyapa",
    ),
  confidence: z.number().min(0).max(1).describe("Confidence level 0-1"),
});

const classifierLlm = createTaskLlm("agent_supervisor_classifier", {
  temperature: 0,
}).withStructuredOutput(intentSchema);

const CLASSIFIER_PROMPT = `Kamu adalah classifier intent untuk aplikasi donasi SEDEKAH.AI.

Klasifikasikan pesan user ke salah satu intent:
- "donation": User ingin berdonasi, bayar zakat, sedekah, infaq, wakaf, bantuan bencana, atau menyebutkan data keuangan
- "edit_allocation": User ingin mengubah alokasi donasi, ganti persentase, pindah kampanye, ubah nominal, atau mengatakan "ubah alokasi", "ganti ke", "pindah ke kampanye"
- "follow_up": User bertanya tentang status donasi sebelumnya, riwayat pembayaran, atau melanjutkan percakapan donasi yang tertunda
- "info": User bertanya tentang cara kerja, fitur, kampanye, tanpa niat donasi langsung
- "greeting": User hanya menyapa (Assalamu'alaikum, halo, dll) tanpa menyebutkan donasi

Panduan tambahan:
- Jika ragu antara donation dan info, pilih donation (lebih aman)
- Jika user menyebut "ubah", "ganti", "pindah" terkait alokasi/kampanye → edit_allocation
- Jika user menyebut "status", "bagaimana donasi saya", "lanjutkan" → follow_up`;

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

  // Quick heuristic: detect edit allocation intent without LLM
  const editAllocationPatterns = [
    /\bubah\s*(alokasi|kampanye|persentase)\b/i,
    /\bganti\s*(ke|alokasi|kampanye)\b/i,
    /\bpindah\s*(ke|kampanye)\b/i,
    /\b(100|[1-9]\d?)%\s*(ke|untuk)\b/i,
    /\bke\s*satu\s*(tempat|kampanye)\b/i,
  ];

  const isEditAllocation = editAllocationPatterns.some((p) =>
    p.test(content.trim()),
  );
  if (isEditAllocation) {
    return { supervisorIntent: "edit_allocation" };
  }

  // Quick heuristic: detect follow-up intent without LLM
  const followUpPatterns = [
    /\bstatus\s*(donasi|pembayaran|invoice)\b/i,
    /\bbagaimana\s*(donasi|pembayaran)\s*saya\b/i,
    /\blanjutkan\b/i,
    /\briwayat\s*(donasi|pembayaran)\b/i,
  ];

  const isFollowUp = followUpPatterns.some((p) => p.test(content.trim()));
  if (isFollowUp) {
    return { supervisorIntent: "follow_up" };
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
