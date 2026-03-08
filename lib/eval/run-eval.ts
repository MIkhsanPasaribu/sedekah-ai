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
import { EVAL_DATASET } from "./dataset";
import type { EvalTestCase } from "./dataset";

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

  console.log(`\n🎉 Done! ${EVAL_DATASET.length} examples uploaded to "${DATASET_NAME}".`);
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
    console.log(
      `   Keywords: ${tc.expectedOutput.toneKeywords.join(", ")}`,
    );
  }
}

main().catch(console.error);
