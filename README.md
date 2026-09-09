# PavedPath AI

**A stateful AI reviewer that turns engineering standards into actionable guardrails before a change reaches production.**

PavedPath AI is a compact Cloudflare-native developer-productivity demo. A browser form captures a proposed change, deterministic policy checks run first, Workers AI suggests the safest implementation path, and a Durable Object retains the latest reviews for the session.

## Why this exists

Fast teams should not have to choose between velocity and operational discipline. PavedPath makes the safer path the easiest path:

- flags missing tests, rollback plans, and sensitive-data review;
- keeps deterministic policy decisions authoritative;
- uses an LLM for explanation and trade-off analysis—not as the policy engine;
- preserves a bounded review history with strongly consistent state;
- treats user-supplied change descriptions as untrusted input.

## Architecture

```text
Browser UI
   │  POST /api/review + opaque session ID
   ▼
Cloudflare Worker ── validates routing and session identity
   │
   ▼
Durable Object ── coordinates review + stores the latest 12 results
   ├── deterministic guardrail engine
   └── Workers AI ── generates safer-path guidance
```

The application ships as one Worker with Static Assets, a Workers AI binding, and a SQLite-backed Durable Object.

## Run locally

```bash
npm install
npm run check
npm run dev
```

Workers AI uses the Cloudflare account even during local development and may incur usage. To deploy:

```bash
npx wrangler login
npm run deploy
```

## Review contract

The client submits a bounded JSON object:

```json
{
  "summary": "Move session validation into a shared edge middleware",
  "riskLevel": "high",
  "touchesProduction": true,
  "tests": "Unit tests plus a 5% canary with auth-failure monitoring",
  "rollbackPlan": "Disable the route flag and restore the previous middleware",
  "dataClassification": "sensitive"
}
```

Free text is trimmed and bounded. Unknown enum values are rejected. High-risk production changes without tests or rollback plans are blocked before the model runs, as are changes involving sensitive data without a human review.

## Safety choices

- No secrets or account credentials are required by the application.
- Model output cannot override deterministic guardrail decisions.
- User input is delimited and explicitly treated as untrusted data.
- History is capped to 12 items per opaque browser session.
- Rendering uses DOM text nodes rather than HTML injection.
- Request bodies are capped at 8 KB.

## Development

```bash
npm test            # deterministic unit tests
npm run typecheck   # strict TypeScript
npx wrangler deploy --dry-run
```

The implementation was developed with AI assistance. The sanitized construction prompts are in [docs/prompt-history.md](docs/prompt-history.md); they contain no candidate, résumé, or application data.

## Built with

- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Workers AI](https://developers.cloudflare.com/workers-ai/)
- [Durable Objects](https://developers.cloudflare.com/durable-objects/)
- [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/)

## License

MIT
