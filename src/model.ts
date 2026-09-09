export const WORKERS_AI_MODEL = "@cf/google/gemma-4-26b-a4b-it";

export function extractAiText(value: unknown): string {
  if (!value || typeof value !== "object") {
    return "The model response could not be rendered. Please retry.";
  }

  const result = value as {
    response?: unknown;
    choices?: Array<{ message?: { content?: unknown } }>;
  };
  if (typeof result.response === "string" && result.response.trim()) {
    return result.response.trim();
  }

  const content = result.choices?.[0]?.message?.content;
  return typeof content === "string" && content.trim()
    ? content.trim()
    : "The model response could not be rendered. Please retry.";
}

export function sessionName(value: string | null): string {
  return value && /^[a-zA-Z0-9_-]{8,64}$/.test(value) ? value : "anonymous";
}
