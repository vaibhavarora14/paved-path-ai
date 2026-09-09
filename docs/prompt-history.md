# Sanitized AI prompt history

This project was built with AI assistance. The prompts below are a faithful, privacy-safe record of the technical direction used during construction. Candidate identity, résumé details, browser state, and application data were intentionally excluded.

## Prompt 1 — product and architecture

> Build a small Cloudflare-native developer-productivity application. It should turn engineering standards into a paved path for proposed changes. Use a browser UI, a Worker, Workers AI for concise staff-engineer guidance, and a Durable Object for session coordination and bounded review history. Deterministic policy checks must run before the model and remain authoritative.

Resulting decisions:

- one Worker serves both API and static assets;
- an opaque client-generated session ID maps to one Durable Object;
- the Durable Object stores at most 12 reviews;
- the LLM explains trade-offs but cannot change the policy decision.

## Prompt 2 — safety and validation

> Treat every change description as untrusted data. Bound request sizes and all free-text fields, allow only documented enum values, render output without injecting HTML, and prevent prompt text from overriding the system task. Block high-risk production changes that lack tests or rollback evidence, and require human review for sensitive data.

Resulting decisions:

- 8 KB request-body limit;
- 4,000-character change summary and 1,000-character supporting fields;
- deterministic `ready`, `needs-review`, or `blocked` decision;
- system prompt explicitly separates untrusted change data;
- UI uses `textContent` and created text nodes.

## Prompt 3 — verification and presentation

> Add focused tests for normalization, guardrail decisions, prompt construction, session identifiers, and Workers AI response shapes. Build a responsive interface that exposes the Cloudflare architecture and makes the deterministic decision visually distinct from AI guidance. Document local development, deployment, architecture, and safety choices.

Verification performed:

- unit tests for pure validation and model-response logic;
- strict TypeScript compilation;
- Wrangler deployment dry run;
- live `/healthz`, review, and history smoke tests after deployment.

## Human review boundary

AI-generated code and copy were reviewed before publication. No hidden instructions, production secrets, or private application content are included in this repository.
