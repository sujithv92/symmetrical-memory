export type ProviderId = "openrouter" | "openai" | "gemini" | "mistral";

export type ThoughtKind = "seed" | "idea" | "question" | "insight" | "merge" | "brief";

export type ThoughtSource = "ai" | "user" | "demo";

export interface Thought {
  id: string;
  kind: ThoughtKind;
  title: string;
  body: string;
  x: number;
  y: number;
  parentIds: string[];
  createdAt: number;
  source: ThoughtSource;
}

export interface Viewport {
  zoom: number;
  panX: number;
  panY: number;
}

export interface Project {
  id: string;
  name: string;
  notes: string;
  thoughts: Thought[];
  viewport: Viewport;
  createdAt: number;
  updatedAt: number;
}

export interface AppSettings {
  provider: ProviderId;
  model: string;
  rememberKey: boolean;
  customEndpoint: string;
}

export interface ProviderInfo {
  id: ProviderId;
  name: string;
  hint: string;
  defaultModel: string;
  models: { id: string; label: string }[];
  keyPlaceholder: string;
  docs: string;
}

export interface ThoughtDraft {
  title: string;
  body: string;
  kind: ThoughtKind;
}

export type AiErrorCode =
  | "invalid_key"
  | "billing"
  | "rate_limit"
  | "cors"
  | "network"
  | "model"
  | "parse"
  | "unknown";

export class AiError extends Error {
  code: AiErrorCode;
  status?: number;
  constructor(message: string, code: AiErrorCode, status?: number) {
    super(message);
    this.name = "AiError";
    this.code = code;
    this.status = status;
  }
}

export interface PendingAiAction {
  kind: "expand" | "challenge" | "merge" | "compose" | "prompt";
  prompt: string;
  thoughtIds: string[];
}

export interface Toast {
  id: string;
  tone: "info" | "ok" | "warn" | "err";
  message: string;
}
