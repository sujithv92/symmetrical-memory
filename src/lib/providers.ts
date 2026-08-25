import type { ProviderId, ProviderInfo } from "../types";

export const PROVIDERS: ProviderInfo[] = [
  {
    id: "openrouter",
    name: "OpenRouter",
    hint: "Best browser-friendly option. One key, many models.",
    defaultModel: "openai/gpt-4o-mini",
    models: [
      { id: "openai/gpt-4o-mini", label: "GPT-4o mini" },
      { id: "openai/gpt-4o", label: "GPT-4o" },
      { id: "google/gemini-2.0-flash-001", label: "Gemini 2.0 Flash" },
      { id: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
      { id: "mistralai/mistral-small", label: "Mistral Small" },
    ],
    keyPlaceholder: "sk-or-v1-…",
    docs: "https://openrouter.ai/keys",
  },
  {
    id: "openai",
    name: "OpenAI",
    hint: "Direct OpenAI API. Some browsers block this with CORS.",
    defaultModel: "gpt-4o-mini",
    models: [
      { id: "gpt-4o-mini", label: "GPT-4o mini" },
      { id: "gpt-4o", label: "GPT-4o" },
      { id: "gpt-4.1-mini", label: "GPT-4.1 mini" },
    ],
    keyPlaceholder: "sk-…",
    docs: "https://platform.openai.com/api-keys",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    hint: "Uses Gemini’s native generateContent endpoint.",
    defaultModel: "gemini-2.0-flash",
    models: [
      { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
      { id: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash Lite" },
      { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
    ],
    keyPlaceholder: "AIza…",
    docs: "https://aistudio.google.com/apikey",
  },
  {
    id: "mistral",
    name: "Mistral",
    hint: "Mistral’s chat API. CORS may block some browsers.",
    defaultModel: "mistral-small-latest",
    models: [
      { id: "mistral-small-latest", label: "Mistral Small" },
      { id: "mistral-medium-latest", label: "Mistral Medium" },
      { id: "mistral-large-latest", label: "Mistral Large" },
    ],
    keyPlaceholder: "…",
    docs: "https://console.mistral.ai/api-keys",
  },
];

export function getProvider(id: ProviderId): ProviderInfo {
  return PROVIDERS.find((p) => p.id === id) ?? PROVIDERS[0];
}

export const DEFAULT_SETTINGS = {
  provider: "openrouter" as ProviderId,
  model: PROVIDERS[0].defaultModel,
  rememberKey: false,
  customEndpoint: "",
};
