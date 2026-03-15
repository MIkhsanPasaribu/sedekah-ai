import { getAiModelRuntimeConfig } from "@/lib/env";
import type {
  AiModelCatalog,
  AiModelTask,
  GroqModelId,
  ModelTier,
} from "@/lib/models/types";

const TASK_MODEL_TIER: Record<AiModelTask, ModelTier> = {
  agent_supervisor_classifier: "balanced",
  agent_intake_conversational: "balanced",
  agent_intake_extraction: "reasoning",
  agent_recommend_personalization: "reasoning",
  agent_recommend_diversity: "economy",
  agent_fraud_narrative: "reasoning",
  dashboard_daily_nudge: "economy",
  dashboard_impact_narrative: "balanced",
  campaign_summary: "economy",
  eval_runner: "reasoning",
};

export function getAiModelCatalog(): AiModelCatalog {
  return getAiModelRuntimeConfig();
}

export function getModelForTask(task: AiModelTask): AiModelCatalog[ModelTier] {
  const catalog = getAiModelCatalog();
  return catalog[TASK_MODEL_TIER[task]];
}

export function getModelTierForTask(task: AiModelTask): ModelTier {
  return TASK_MODEL_TIER[task];
}

function getFallbackTierOrder(primaryTier: ModelTier): ModelTier[] {
  switch (primaryTier) {
    case "reasoning":
      return ["reasoning", "balanced", "economy"];
    case "balanced":
      return ["balanced", "reasoning", "economy"];
    case "economy":
      return ["economy", "balanced", "reasoning"];
    default:
      return ["balanced", "reasoning", "economy"];
  }
}

export function getFallbackModelsForTask(task: AiModelTask): GroqModelId[] {
  const catalog = getAiModelCatalog();
  const primaryTier = getModelTierForTask(task);
  const orderedTiers = getFallbackTierOrder(primaryTier);

  const orderedModels = orderedTiers.map((tier) => catalog[tier]);
  return [...new Set(orderedModels)];
}
