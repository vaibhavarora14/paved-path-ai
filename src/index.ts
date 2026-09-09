import { DurableObject } from "cloudflare:workers";
import { buildReviewPrompt, evaluateGuardrails, normalizeRequest, type ReviewRequest } from "./guardrails";
import { extractAiText, sessionName } from "./model";

interface Env {
  AI: Ai;
  ASSETS: Fetcher;
  SESSIONS: DurableObjectNamespace<ReviewSession>;
}

interface HistoryEntry {
  id: string;
  createdAt: string;
  request: ReviewRequest;
  decision: ReturnType<typeof evaluateGuardrails>["decision"];
  checks: ReturnType<typeof evaluateGuardrails>["checks"];
  guidance: string;
}

const jsonHeaders = { "content-type": "application/json; charset=utf-8" };

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), { status, headers: jsonHeaders });
}

export class ReviewSession extends DurableObject<Env> {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/history" && request.method === "GET") {
      return json({ history: (await this.ctx.storage.get<HistoryEntry[]>("history")) ?? [] });
    }

    if (url.pathname !== "/review" || request.method !== "POST") {
      return json({ error: "not_found" }, 404);
    }

    const declaredLength = Number(request.headers.get("content-length") ?? "0");
    if (declaredLength > 8_192) return json({ error: "payload_too_large" }, 413);

    try {
      const raw = await request.text();
      if (raw.length > 8_192) return json({ error: "payload_too_large" }, 413);

      const input = normalizeRequest(JSON.parse(raw));
      const guardrails = evaluateGuardrails(input);
      const aiResult = await this.env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
        messages: [
          { role: "system", content: "Follow the review contract exactly." },
          { role: "user", content: buildReviewPrompt(input, guardrails) },
        ],
      });
      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        request: input,
        decision: guardrails.decision,
        checks: guardrails.checks,
        guidance: extractAiText(aiResult),
      };

      const history = (await this.ctx.storage.get<HistoryEntry[]>("history")) ?? [];
      await this.ctx.storage.put("history", [entry, ...history].slice(0, 12));
      return json(entry);
    } catch (error) {
      const message = error instanceof Error ? error.message : "invalid_request";
      return json({ error: message.slice(0, 200) }, 400);
    }
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/healthz") return json({ ok: true });

    if (url.pathname === "/api/review" || url.pathname === "/api/history") {
      const name = sessionName(request.headers.get("x-session-id"));
      const stub = env.SESSIONS.getByName(name);
      const target = new URL(request.url);
      target.pathname = url.pathname.replace("/api", "");
      return stub.fetch(new Request(target, request));
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
