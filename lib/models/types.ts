export const SUPPORTED_GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "qwen/qwen3-32b",
] as const;

export type GroqModelId = (typeof SUPPORTED_GROQ_MODELS)[number];

export type ModelTier = "reasoning" | "balanced" | "economy";

export type AiModelTask =
  | "agent_supervisor_classifier"
  | "agent_intake_conversational"
  | "agent_intake_extraction"
  | "agent_recommend_personalization"
  | "agent_recommend_diversity"
  | "agent_fraud_narrative"
  | "dashboard_daily_nudge"
  | "dashboard_impact_narrative"
  | "campaign_summary"
  | "eval_runner";

export interface AiModelCatalog {
  reasoning: GroqModelId;
  balanced: GroqModelId;
  economy: GroqModelId;
}
