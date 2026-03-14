// ============================================================
// Eval Smoke — Local deterministic checks for AI pipeline guards
// ============================================================

import { sanitizeModelOutput, parseJsonWithSchema } from "@/lib/agent/utils";
import { EVAL_DATASET } from "./dataset";
import { z } from "zod";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function runSanitizationSmoke(): void {
  const raw = [
    "<think>private reasoning</think>",
    "Analysis: internal detail",
    "Gunakan JSON API untuk transfer bank manual",
  ].join("\n");

  const cleaned = sanitizeModelOutput(raw);

  assert(!/think/i.test(cleaned), "Sanitizer gagal menghapus think trace.");
  assert(
    !/analysis\s*:/i.test(cleaned),
    "Sanitizer gagal menghapus reasoning line.",
  );
  assert(!/\bJSON\b/i.test(cleaned), "Istilah JSON belum dinormalisasi.");
  assert(!/\bAPI\b/i.test(cleaned), "Istilah API belum dinormalisasi.");
  assert(
    cleaned.includes("tautan pembayaran resmi"),
    "Guard pembayaran manual tidak aktif.",
  );
}

function runJsonSchemaSmoke(): void {
  const schema = z.object({
    success: z.boolean(),
    value: z.number(),
  });

  const valid = parseJsonWithSchema('{"success":true,"value":42}', schema);
  const invalid = parseJsonWithSchema('{"success":"yes","value":42}', schema);
  const malformed = parseJsonWithSchema("{invalid-json}", schema);

  assert(
    valid?.success === true && valid.value === 42,
    "Parser schema gagal pada payload valid.",
  );
  assert(invalid === null, "Parser schema harus null untuk payload invalid.");
  assert(malformed === null, "Parser schema harus null untuk JSON malformed.");
}

function runDatasetSmoke(): void {
  assert(
    EVAL_DATASET.length >= 8,
    "Dataset evaluasi kurang dari minimum 8 test case.",
  );

  const uniqueIds = new Set(EVAL_DATASET.map((t) => t.id));
  assert(
    uniqueIds.size === EVAL_DATASET.length,
    "Dataset evaluasi memiliki ID duplikat.",
  );

  const hasZakat = EVAL_DATASET.some((t) => t.category === "zakat_calculation");
  const hasTone = EVAL_DATASET.some((t) => t.category === "emotional_tone");
  assert(
    hasZakat,
    "Dataset evaluasi tidak memiliki skenario zakat_calculation.",
  );
  assert(hasTone, "Dataset evaluasi tidak memiliki skenario emotional_tone.");
}

function main(): void {
  runSanitizationSmoke();
  runJsonSchemaSmoke();
  runDatasetSmoke();
  console.log("✅ Eval smoke passed.");
}

main();
