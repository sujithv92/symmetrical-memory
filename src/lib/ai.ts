import { getProvider } from "./providers";
import { AiError, type AppSettings, type Thought, type ThoughtDraft } from "../types";

const SYSTEM = `You are Thoughtforge, a private thinking partner for a visual brainstorming canvas.
Return ONLY valid JSON. No markdown fences. No preamble.
Keep titles under 7 words. Bodies are 1–3 crisp sentences.
Be concrete, surprising, and useful — never generic filler.`;

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fence ? fence[1] : trimmed;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new AiError("The model did not return JSON.", "parse");
  }
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    throw new AiError("Could not parse the model response.", "parse");
  }
}

function classifyHttpError(status: number, body: string): AiError {
  const lower = body.toLowerCase();
  if (status === 401 || status === 403 || lower.includes("invalid api key") || lower.includes("incorrect api key")) {
    return new AiError("That API key was rejected. Check the key and try again.", "invalid_key", status);
  }
  if (status === 402 || lower.includes("billing") || lower.includes("quota") || lower.includes("insufficient")) {
    return new AiError("The provider reports a billing or quota problem.", "billing", status);
  }
  if (status === 429 || lower.includes("rate limit")) {
    return new AiError("Rate limited. Wait a moment, then retry.", "rate_limit", status);
  }
  if (status === 404 || lower.includes("model")) {
    return new AiError("That model is unavailable for this key.", "model", status);
  }
  return new AiError(body.slice(0, 220) || `Provider error (${status}).`, "unknown", status);
}

function classifyFetchError(err: unknown): AiError {
  if (err instanceof AiError) return err;
  const message = err instanceof Error ? err.message : String(err);
  const lower = message.toLowerCase();
  if (lower.includes("failed to fetch") || lower.includes("networkerror") || lower.includes("cors") || lower.includes("load failed")) {
    return new AiError(
      "The browser could not reach the provider. This is often a CORS block — OpenRouter is the most reliable choice from a client-only app.",
      "cors",
    );
  }
  return new AiError(message || "Unknown request error.", "network");
}

async function postJson(url: string, headers: Record<string, string>, body: unknown): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw classifyFetchError(err);
  }
  const text = await res.text();
  if (!res.ok) throw classifyHttpError(res.status, text);
  try {
    return JSON.parse(text);
  } catch {
    throw new AiError("Provider returned non-JSON.", "parse", res.status);
  }
}

function chatCompletionsUrl(settings: AppSettings): string {
  if (settings.customEndpoint.trim()) return settings.customEndpoint.trim();
  if (settings.provider === "openai") return "https://api.openai.com/v1/chat/completions";
  if (settings.provider === "mistral") return "https://api.mistral.ai/v1/chat/completions";
  return "https://openrouter.ai/api/v1/chat/completions";
}

async function completeChat(settings: AppSettings, key: string, user: string): Promise<string> {
  const model = settings.model || getProvider(settings.provider).defaultModel;

  if (settings.provider === "gemini" && !settings.customEndpoint.trim()) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
    const data = await postJson(
      url,
      {},
      {
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { temperature: 0.8, responseMimeType: "application/json" },
      },
    ) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
      error?: { message?: string };
    };
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    if (!text) throw new AiError(data.error?.message || "Empty Gemini response.", "unknown");
    return text;
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
  };
  if (settings.provider === "openrouter") {
    headers["HTTP-Referer"] = typeof window !== "undefined" ? window.location.origin : "https://thoughtforge.app";
    headers["X-Title"] = "Thoughtforge";
  }

  const data = await postJson(chatCompletionsUrl(settings), headers, {
    model,
    temperature: 0.8,
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: user },
    ],
    response_format: settings.provider === "mistral" ? undefined : { type: "json_object" },
  }) as {
    choices?: { message?: { content?: string } }[];
    error?: { message?: string };
  };

  const text = data.choices?.[0]?.message?.content ?? "";
  if (!text) throw new AiError(data.error?.message || "Empty model response.", "unknown");
  return text;
}

function asDrafts(raw: unknown, fallbackKind: ThoughtDraft["kind"]): ThoughtDraft[] {
  const obj = raw as { thoughts?: unknown; title?: unknown; body?: unknown; kind?: unknown };
  const list = Array.isArray(obj.thoughts) ? obj.thoughts : [obj];
  const drafts: ThoughtDraft[] = [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const rec = item as { title?: unknown; body?: unknown; kind?: unknown };
    const title = typeof rec.title === "string" ? rec.title.trim() : "";
    const body = typeof rec.body === "string" ? rec.body.trim() : "";
    if (!title || !body) continue;
    const kind = rec.kind === "question" || rec.kind === "insight" || rec.kind === "idea" || rec.kind === "merge" || rec.kind === "brief"
      ? rec.kind
      : fallbackKind;
    drafts.push({ title: title.slice(0, 80), body: body.slice(0, 600), kind });
  }
  if (!drafts.length) throw new AiError("The model response was missing title/body.", "parse");
  return drafts;
}

function packThoughts(thoughts: Thought[]): string {
  return thoughts
    .map((t, i) => `${i + 1}. [${t.kind}] ${t.title}\n${t.body}`)
    .join("\n\n");
}

export async function expandThought(
  settings: AppSettings,
  key: string,
  thought: Thought,
  extra = "",
): Promise<ThoughtDraft[]> {
  const text = await completeChat(
    settings,
    key,
    `Branch this thought into 3 distinct child ideas. Vary the angles (one practical, one unexpected, one risk or constraint).
${extra ? `User direction: ${extra}\n` : ""}
Thought:
Title: ${thought.title}
Body: ${thought.body}

JSON shape: {"thoughts":[{"title":"","body":"","kind":"idea|insight|question"}]}`,
  );
  return asDrafts(extractJson(text), "idea").slice(0, 4);
}

export async function challengeThought(
  settings: AppSettings,
  key: string,
  thought: Thought,
  extra = "",
): Promise<ThoughtDraft[]> {
  const text = await completeChat(
    settings,
    key,
    `Challenge this thought with 2 sharp questions or counterpoints a skeptical partner would ask.
${extra ? `User direction: ${extra}\n` : ""}
Thought:
Title: ${thought.title}
Body: ${thought.body}

JSON shape: {"thoughts":[{"title":"","body":"","kind":"question"}]}`,
  );
  return asDrafts(extractJson(text), "question").slice(0, 3);
}

export async function mergeThoughts(
  settings: AppSettings,
  key: string,
  thoughts: Thought[],
): Promise<ThoughtDraft> {
  const text = await completeChat(
    settings,
    key,
    `Synthesize these thoughts into one stronger idea. Keep the tension; do not flatten disagreement.
${packThoughts(thoughts)}

JSON shape: {"title":"","body":"","kind":"merge"}`,
  );
  return asDrafts(extractJson(text), "merge")[0];
}

export async function composeProject(
  settings: AppSettings,
  key: string,
  thoughts: Thought[],
  projectName: string,
): Promise<ThoughtDraft> {
  const text = await completeChat(
    settings,
    key,
    `Compose a concise project brief from this brainstorming canvas named "${projectName}".
Cover: intent, strongest ideas, open questions, and a next step.
${packThoughts(thoughts)}

JSON shape: {"title":"","body":"","kind":"brief"}`,
  );
  return asDrafts(extractJson(text), "brief")[0];
}

export async function promptThoughts(
  settings: AppSettings,
  key: string,
  prompt: string,
  context: Thought[],
): Promise<ThoughtDraft[]> {
  const ctx = context.length
    ? `Selected context:\n${packThoughts(context)}\n`
    : "No node is selected — treat this as a free prompt on a blank area of the canvas.\n";
  const text = await completeChat(
    settings,
    key,
    `${ctx}
User prompt: ${prompt}

Reply with 1–3 thoughts that advance the work.
JSON shape: {"thoughts":[{"title":"","body":"","kind":"idea|question|insight"}]}`,
  );
  return asDrafts(extractJson(text), "idea").slice(0, 3);
}

export async function testConnection(settings: AppSettings, key: string): Promise<string> {
  const text = await completeChat(
    settings,
    key,
    `Reply with JSON: {"title":"ok","body":"Connection works.","kind":"insight"}`,
  );
  const draft = asDrafts(extractJson(text), "insight")[0];
  return draft.title || "ok";
}

export function demoDrafts(kind: ThoughtDraft["kind"], seed: string): ThoughtDraft[] {
  const topic = seed.trim() || "this idea";
  if (kind === "question") {
    return [
      {
        title: "What would break first?",
        body: `If ${topic} had to fail in public, which assumption collapses first — and who notices?`,
        kind: "question",
      },
    ];
  }
  if (kind === "merge") {
    return [
      {
        title: "A tighter synthesis",
        body: `Hold the selected thoughts together: keep the tension around ${topic}, then name the smallest experiment that would prove the combined idea.`,
        kind: "merge",
      },
    ];
  }
  if (kind === "brief") {
    return [
      {
        title: "Working brief",
        body: `Intent: explore ${topic}. Strongest thread: make the idea tangible. Open question: who is this actually for? Next step: write the one-sentence promise.`,
        kind: "brief",
      },
    ];
  }
  return [
    {
      title: "A sharper cut",
      body: `Take ${topic} and strip it to a single user, a single moment, and a single constraint. That smaller version is easier to test.`,
      kind: "idea",
    },
    {
      title: "The opposite bet",
      body: `What if the valuable part of ${topic} is the friction you were trying to remove?`,
      kind: "insight",
    },
  ];
}
