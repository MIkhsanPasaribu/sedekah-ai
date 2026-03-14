// ============================================================
// LangGraph Agent Utilities
// ============================================================

import { AIMessage } from "@langchain/core/messages";

/**
 * Build a named AIMessage for a specific agent node.
 * Using `name` appears in LangSmith traces as the node label.
 *
 * @param content - Message text to display/log
 * @param nodeName - UPPER_SNAKE_CASE node name (e.g. "INTAKE", "CALCULATE")
 */
export function buildAgentMessage(
  content: string,
  nodeName: string,
): AIMessage {
  return new AIMessage({ content, name: nodeName });
}
