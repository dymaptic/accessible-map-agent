import Anthropic from "@anthropic-ai/sdk";

// Use a getter function to ensure the API key is read at runtime, not build time
let anthropicInstance: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (!anthropicInstance) {
    anthropicInstance = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicInstance;
}
