import { describe, expect, it } from "vitest";
import { extractAiText, sessionName, WORKERS_AI_MODEL } from "../src/model";

describe("Workers AI configuration", () => {
  it("uses the currently supported Cloudflare tutorial model", () => {
    expect(WORKERS_AI_MODEL).toBe("@cf/google/gemma-4-26b-a4b-it");
  });
});

describe("extractAiText", () => {
  it("supports Workers AI response objects", () => {
    expect(extractAiText({ response: "Review complete" })).toBe("Review complete");
  });

  it("supports chat-completion response objects", () => {
    expect(
      extractAiText({ choices: [{ message: { content: "Use a canary rollout" } }] }),
    ).toBe("Use a canary rollout");
  });

  it("returns a safe fallback for malformed model output", () => {
    expect(extractAiText({ unexpected: true })).toContain("could not be rendered");
  });
});

describe("sessionName", () => {
  it("accepts bounded opaque session identifiers", () => {
    expect(sessionName("team-alpha_42")).toBe("team-alpha_42");
  });

  it("falls back when identifiers contain unsafe characters", () => {
    expect(sessionName("../../shared")).toBe("anonymous");
  });
});
