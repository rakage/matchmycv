import { AnalysisResult, EditAction, AIProvider } from "../types";
import { OpenAIProvider } from "./providers/openai";
import { AnthropicProvider } from "./providers/anthropic";

export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER || "openai";

  switch (provider) {
    case "openai":
      return new OpenAIProvider();
    case "anthropic":
      return new AnthropicProvider();
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

export { type AIProvider, type AnalysisResult, type EditAction };
