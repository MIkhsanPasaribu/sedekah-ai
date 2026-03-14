// ============================================================
// LangSmith Evaluation Runner — SEDEKAH.AI
// ============================================================
// Upload dataset + run evaluations against the agent.
//
// Usage:
//   npx tsx lib/eval/run-eval.ts
//
// Prerequisites:
//   LANGCHAIN_API_KEY set in .env
//   LANGCHAIN_TRACING_V2=true
//   GROQ_API_KEY set in .env

import { Client } from "langsmith";
import { evaluate } from "langsmith/evaluation";
import { EVAL_DATASET } from "./dataset";
import type { EvalTestCase } from "./dataset";
import type { Run, Example } from "langsmith/schemas";

// ── Evaluator Types ────────────────────────────────────────────────────────
interface EvaluationResult {
  key: string;
  score: number;
  comment?: string;
}

// ── Evaluator 1: Zakat Accuracy (±5% tolerance) ───────────────────────────
export function zakatAccuracyEvaluator(
  run: Run,
  example?: Example,
): EvaluationResult {
  const expectedAmount = (
    example?.outputs as Record<string, unknown> | undefined
  )?.zakatAmount as number | undefined;
  if (expectedAmount === undefined) {
    return {
      key: "zakat_accuracy",
      score: 1,
      comment: "N/A — no expected amount",
    };
  }

  // Extract the first Rupiah amount from the agent's output text
  const outputText = String(
    (run.outputs as Record<string, unknown> | undefined)?.output ?? "",
  );
  const match = outputText.match(/Rp\s?([\d.,]+)/);
  if (!match) {
    return {
      key: "zakat_accuracy",
      score: 0,
      comment: `No Rupiah amount found in output. Expected: Rp ${expectedAmount.toLocaleString("id-ID")}`,
    };
  }
  const actualAmount = Number(match[1].replace(/\./g, "").replace(",", "."));
  const tolerance = expectedAmount * 0.05;
  const pass = Math.abs(actualAmount - expectedAmount) <= tolerance;

  return {
    key: "zakat_accuracy",
    score: pass ? 1 : 0,
    comment: `Expected ≈ Rp ${expectedAmount.toLocaleString("id-ID")}, got Rp ${actualAmount.toLocaleString("id-ID")} (${pass ? "PASS" : "FAIL"} ±5%)`,
  };
}

// ── Evaluator 2: Tone Keywords (≥50% keyword match) ───────────────────────
export function toneKeywordEvaluator(
  run: Run,
  example?: Example,
): EvaluationResult {
  const expectedKeywords = (
    example?.outputs as Record<string, unknown> | undefined
  )?.toneKeywords as string[] | undefined;
  if (!expectedKeywords || expectedKeywords.length === 0) {
    return {
      key: "tone_keywords",
      score: 1,
      comment: "N/A — no keywords expected",
    };
  }

  const outputText = String(
    (run.outputs as Record<string, unknown> | undefined)?.output ?? "",
  ).toLowerCase();
  const matched = expectedKeywords.filter((kw) =>
    outputText.includes(kw.toLowerCase()),
  );
  const score = matched.length / expectedKeywords.length;

  return {
    key: "tone_keywords",
    score,
    comment: `${matched.length}/${expectedKeywords.length} keywords found: [${matched.join(", ")}]`,
  };
}

// ── Evaluator 3: Forbidden Words (score=0 if any found) ───────────────────
export function forbiddenWordsEvaluator(
  run: Run,
  example?: Example,
): EvaluationResult {
  const forbidden = (example?.outputs as Record<string, unknown> | undefined)
    ?.mustNotContain as string[] | undefined;
  if (!forbidden || forbidden.length === 0) {
    return {
      key: "forbidden_words",
      score: 1,
      comment: "N/A — no forbidden words",
    };
  }

  const outputText = String(
    (run.outputs as Record<string, unknown> | undefined)?.output ?? "",
  ).toLowerCase();
  const found = forbidden.filter((w) => outputText.includes(w.toLowerCase()));

  return {
    key: "forbidden_words",
    score: found.length === 0 ? 1 : 0,
    comment:
      found.length === 0
        ? "No forbidden words found"
        : `Forbidden words detected: [${found.join(", ")}]`,
  };
}

const DATASET_NAME = "sedekah-ai-eval-v1";

async function main(): Promise<void> {
  const apiKey = process.env.LANGCHAIN_API_KEY;
  if (!apiKey) {
    console.error("❌ LANGCHAIN_API_KEY is not set. Aborting.");
    process.exit(1);
  }

  const client = new Client({ apiKey });

  // 1. Create or get dataset
  console.log(`\n📦 Creating dataset: ${DATASET_NAME}`);

  let dataset;
  try {
    dataset = await client.readDataset({ datasetName: DATASET_NAME });
    console.log(`   Dataset already exists (id: ${dataset.id})`);
  } catch {
    dataset = await client.createDataset(DATASET_NAME, {
      description:
        "SEDEKAH.AI evaluation — 5 zakat calculations + 3 emotional tone checks",
    });
    console.log(`   Created new dataset (id: ${dataset.id})`);
  }

  // 2. Upload examples
  console.log(`\n📝 Uploading ${EVAL_DATASET.length} test cases...`);

  for (const tc of EVAL_DATASET) {
    await client.createExample(
      { input: tc.input, category: tc.category, id: tc.id },
      { expected: tc.expectedOutput, description: tc.description },
      { datasetId: dataset.id },
    );
    console.log(`   ✅ ${tc.id}: ${tc.description.slice(0, 60)}...`);
  }

  console.log(
    `\n🎉 Done! ${EVAL_DATASET.length} examples uploaded to "${DATASET_NAME}".`,
  );
  console.log(
    `   View at: https://smith.langchain.com/datasets — look for "${DATASET_NAME}"`,
  );

  // 3. Print summary for manual evaluation
  console.log("\n" + "=".repeat(60));
  console.log("EVALUATION SUMMARY — Run these manually or via LangSmith UI:");
  console.log("=".repeat(60));

  const zakatCases = EVAL_DATASET.filter(
    (tc) => tc.category === "zakat_calculation",
  );
  const toneCases = EVAL_DATASET.filter(
    (tc) => tc.category === "emotional_tone",
  );

  console.log(`\n🧮 Zakat Calculation (${zakatCases.length} cases):`);
  for (const tc of zakatCases) {
    printTestCase(tc);
  }

  console.log(`\n💚 Emotional Tone (${toneCases.length} cases):`);
  for (const tc of toneCases) {
    printTestCase(tc);
  }
}

function printTestCase(tc: EvalTestCase): void {
  console.log(`\n   [${tc.id}] ${tc.description}`);
  console.log(`   Input: "${tc.input.slice(0, 80)}..."`);
  if (tc.expectedOutput.zakatAmount !== undefined) {
    console.log(
      `   Expected: Rp ${tc.expectedOutput.zakatAmount.toLocaleString("id-ID")} | Nisab: ${tc.expectedOutput.memenuhiNisab}`,
    );
  }
  if (tc.expectedOutput.toneKeywords) {
    console.log(`   Keywords: ${tc.expectedOutput.toneKeywords.join(", ")}`);
  }
}

main().catch(console.error);

// ── Run Programmatic Evaluation (call after uploading dataset) ────────────
/**
 * Run evaluations against the LangSmith dataset using the three graders.
 * Pass `targetFn` — an async function that takes an input string and returns
 * the agent's output string. Example:
 *
 *   await runEvaluation(async (input) => {
 *     const graph = await getSedekahGraph();
 *     // ... invoke graph and collect AIMessage content
 *     return outputText;
 *   });
 */
export async function runEvaluation(
  targetFn: (
    input: Record<string, unknown>,
  ) => Promise<Record<string, unknown>>,
): Promise<void> {
  const apiKey = process.env.LANGCHAIN_API_KEY;
  if (!apiKey) {
    console.error("❌ LANGCHAIN_API_KEY is not set. Aborting.");
    process.exit(1);
  }

  console.log(`\n🧪 Running evaluation on dataset: ${DATASET_NAME}`);

  const results = await evaluate(targetFn, {
    data: DATASET_NAME,
    evaluators: [
      zakatAccuracyEvaluator,
      toneKeywordEvaluator,
      forbiddenWordsEvaluator,
    ],
    experimentPrefix: "sedekah-ai",
    metadata: {
      version: "1.0",
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
    },
  });

  console.log(`\n✅ Evaluation complete. Results summary:`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const result of results as unknown as any[]) {
    console.log(`   ${result.key}: ${result.score}`);
  }
}
