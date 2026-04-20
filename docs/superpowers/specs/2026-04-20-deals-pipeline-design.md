# Deals Pipeline Tools — Design

**Date:** 2026-04-20
**Target version:** 1.7.0
**GitHub issue:** #23
**Branch:** `feat/deals-pipeline`

## Summary

Add six new tools exposing the Loxo deals pipeline API, modify `loxo_get_activity_types` to support workflow-scoped activity types, add `LOXO_DEFAULT_OWNER_EMAIL` env var for deal ownership defaults, and add an MIT license to the repo.

## Motivation

The primary user is a full-desk recruiter who actively tracks BD/deal pipelines in Loxo. The MCP server currently has no deals coverage, so deal work requires switching to the Loxo UI. Two key consumption patterns drive the design:

1. **n8n workflows** — programmatic automation needs clean, predictable tool schemas with structured responses.
2. **Conversational search** — Claude needs to search, read, and create deals within conversation flow.

The Loxo OAS documents six deal endpoints (`deal_workflows` CRUD, `deals` CRUD + events) that are fully functional but were not included in the original OAS analysis or any prior implementation work.

## API probe findings (2026-04-20)

Probed the live API to answer open questions:

- **Deal workflows:** Three active pipelines exist — "Job Leads Pipeline" (54622), "Prospect Client Pipeline" (70404), "RPO Hiring Partner - London Boutiques" (115131).
- **Activity types are workflow-scoped:** `GET /activity_types` without `workflow_id` returns candidate activity types (50+). With `workflow_id=54622` it returns deal-specific types like "Deal Won", "New Lead", "Terms Signed", "Lost" (23 types). The existing `loxo_get_activity_types` tool needs a `workflow_id` param — no new tool required.
- **No PATCH/PUT on deals:** The OAS documents no update endpoint. Deferred — out of scope for this spec.

## Design

### New tools

#### `loxo_list_deal_workflows`

Lists all deal workflows (pipelines) with their IDs and names.

**Endpoint:** `GET /{agency_slug}/deal_workflows`

**Schema:**

```ts
const ListDealWorkflowsSchema = z.object({
  response_format: z.enum(['json', 'markdown']).optional(),
});
```

**Behavior:** Direct pass-through. Returns array of workflow objects. Annotations: `readOnlyHint: true, idempotentHint: true`.

**Description guidance:** Tell callers to use the returned workflow ID with `loxo_get_deal_workflow` for stages or `loxo_get_activity_types` for deal-specific activity types.

#### `loxo_get_deal_workflow`

Gets a single deal workflow including its pipeline stages.

**Endpoint:** `GET /{agency_slug}/deal_workflows/{id}`

**Schema:**

```ts
const GetDealWorkflowSchema = z.object({
  id: z.coerce.string().regex(/^\d+$/, "id must be numeric")
    .describe("Deal workflow ID"),
  response_format: z.enum(['json', 'markdown']).optional(),
});
```

**Behavior:** Validate ID via `requireNumericId`, fetch, format, truncate. Annotations: `readOnlyHint: true, idempotentHint: true`.

**Description guidance:** Mention that the response includes pipeline stage IDs needed for `loxo_create_deal`.

#### `loxo_search_deals`

Search/list deals with optional Lucene query, owner filter, and cursor pagination.

**Endpoint:** `GET /{agency_slug}/deals`

**Schema:**

```ts
const SearchDealsSchema = z.object({
  query: z.string().optional()
    .describe("Lucene query string"),
  owner_emails: z.array(z.string().email()).optional()
    .describe("Filter by owner email addresses"),
  scroll_id: z.string().optional()
    .describe("Pagination cursor from previous search"),
  response_format: z.enum(['json', 'markdown']).optional(),
});
```

**Behavior:**
- Build `URLSearchParams`: append `query` if provided; append each `owner_emails` entry as `owner_emails[]=<email>`.
- Wrap response in `{ results: [...], pagination: { scroll_id, has_more, total_count, returned_count } }` — same structure as `loxo_search_candidates`.
- Format and truncate.
- Annotations: `readOnlyHint: true, idempotentHint: true`.

**Assumption:** The API returns `{ deals: [...], scroll_id, total_count }` at the top level, matching the pattern used by `/people` and `/companies`. If the response shape differs, adjust the result-wrapping logic accordingly during implementation.

#### `loxo_get_deal`

Get a single deal by ID.

**Endpoint:** `GET /{agency_slug}/deals/{id}`

**Schema:**

```ts
const GetDealSchema = z.object({
  id: z.coerce.string().regex(/^\d+$/, "id must be numeric")
    .describe("Deal ID"),
  response_format: z.enum(['json', 'markdown']).optional(),
});
```

**Behavior:** Validate ID, fetch, format, truncate. Annotations: `readOnlyHint: true, idempotentHint: true`.

#### `loxo_create_deal`

Create a new deal in a pipeline.

**Endpoint:** `POST /{agency_slug}/deals`

**Schema:**

```ts
const CreateDealSchema = z.object({
  name: z.string().trim().min(1, "name is required")
    .describe("Deal name (required)"),
  amount: z.number()
    .describe("Deal value/amount (required)"),
  closes_at: z.string()
    .describe("Expected close date, ISO datetime (required)"),
  workflow_id: z.coerce.string().regex(/^\d+$/, "workflow_id must be numeric")
    .describe("Deal workflow/pipeline ID (required). Use loxo_list_deal_workflows to find."),
  pipeline_stage_id: z.coerce.string().regex(/^\d+$/, "pipeline_stage_id must be numeric")
    .describe("Initial pipeline stage ID (required). Use loxo_get_deal_workflow to find stage IDs."),
  owner_email: z.string().email().optional()
    .describe("Owner email. Falls back to LOXO_DEFAULT_OWNER_EMAIL env var."),
  company_id: z.coerce.string().regex(/^\d+$/, "company_id must be numeric").optional()
    .describe("Associated company ID"),
  person_id: z.coerce.string().regex(/^\d+$/, "person_id must be numeric").optional()
    .describe("Associated person/contact ID"),
  job_id: z.coerce.string().regex(/^\d+$/, "job_id must be numeric").optional()
    .describe("Associated job ID"),
});
```

**Behavior:**
- Resolve `owner_email` via `resolveOwnerEmail(args.owner_email)`. If neither arg nor env is set, return `isError: true` with message pointing to `loxo_list_users` — `owner_email` is required by the API.
- Build `URLSearchParams` with bracket notation: `deal[name]`, `deal[amount]`, `deal[closes_at]`, `deal[workflow_id]`, `deal[pipeline_stage_id]`, `deal[owner_email]`. Optional fields appended only if provided.
- POST with `Content-Type: application/x-www-form-urlencoded`.
- Annotations: `readOnlyHint: false, destructiveHint: false, idempotentHint: false`.

#### `loxo_log_deal_activity`

Log an activity/event on a deal.

**Endpoint:** `POST /{agency_slug}/deals/{deal_id}/events`

**Schema:**

```ts
const LogDealActivitySchema = z.object({
  deal_id: z.coerce.string().regex(/^\d+$/, "deal_id must be numeric")
    .describe("Deal ID"),
  activity_type_id: z.coerce.string().regex(/^\d+$/, "activity_type_id must be numeric")
    .describe("Activity type ID. Use loxo_get_activity_types with the deal's workflow_id to find valid IDs."),
  notes: z.string().optional()
    .describe("Optional notes for this activity"),
});
```

**Behavior:**
- Validate `deal_id` via `requireNumericId` for URL path.
- Build `URLSearchParams` with flat params (no bracket notation per OAS): `activity_type_id`, `notes`.
- POST with `Content-Type: application/x-www-form-urlencoded`.
- Annotations: `readOnlyHint: false, destructiveHint: false, idempotentHint: false`.

**`dragged_and_dropped`** from the OAS is omitted — it's a Loxo UI concern with no value for API/n8n callers.

### Modified tool

#### `loxo_get_activity_types` — add `workflow_id` param

**Change:** Add optional `workflow_id` to the tool's `inputSchema` and handler.

**inputSchema addition:**

```json
"workflow_id": {
  "type": "string",
  "description": "Optional: Filter by workflow ID. Pass a deal workflow ID to get deal-specific activity types instead of candidate activity types."
}
```

**Handler change:** If `workflow_id` is provided, validate via `requireNumericId` and append `?workflow_id=<id>` to the endpoint URL. Otherwise, existing behavior is unchanged.

**Description update:** Add guidance that deal activity types require passing the deal's workflow_id.

### New env var

**`LOXO_DEFAULT_OWNER_EMAIL`** — optional string. Added to `src/config.ts` with no startup validation beyond type (email format validated at call time by Zod).

**`resolveOwnerEmail` helper** (near existing `resolveOwnerId`):

```ts
function resolveOwnerEmail(explicitArg: string | undefined): string | undefined {
  if (explicitArg) return explicitArg;
  return process.env.LOXO_DEFAULT_OWNER_EMAIL || undefined;
}
```

**`tests/setup.ts`:** Add `LOXO_DEFAULT_OWNER_EMAIL: ''` to fake env (empty string = not set). Same pattern as other optional env vars.

### MIT license

- Add `LICENSE` file to repo root (MIT, copyright 2025-present Tarran Benson-West).
- Add `"license": "MIT"` to `package.json`.

## Architecture

All changes land in `src/server.ts` following existing patterns:

- **Schemas** — six new Zod schemas near existing ones (~line 415-460).
- **Tool definitions** — six new entries in `ListToolsRequestSchema` handler; one existing entry (`loxo_get_activity_types`) modified.
- **Handlers** — six new cases in `CallToolRequestSchema` switch; one existing case modified.
- **Helpers** — one new function (`resolveOwnerEmail`), near `resolveOwnerId`.
- **Config** — `src/config.ts` gains one optional env var.
- **Types** — no new interfaces needed initially; we pass through API responses. If the deal response shape is useful to type, add interfaces after probing a real response.

No new modules. No changes to `src/index.ts`.

## Testing (TDD)

All tests use existing `InMemoryTransport.createLinkedPair` + mocked `globalThis.fetch` infrastructure. No live API calls.

### `loxo_list_deal_workflows`

- Returns array of workflows on success.

### `loxo_get_deal_workflow`

- Returns workflow object on success.
- Non-numeric `id` rejected before fetch.

### `loxo_search_deals`

- Returns `{ results, pagination }` structure.
- `owner_emails` produces repeated `owner_emails[]=` query params.
- `query` forwarded as query param.

### `loxo_get_deal`

- Returns deal object on success.
- Non-numeric `id` rejected before fetch.

### `loxo_create_deal`

- POSTs form-encoded body with `deal[name]`, `deal[amount]`, `deal[closes_at]`, `deal[workflow_id]`, `deal[pipeline_stage_id]`, `deal[owner_email]`.
- Optional fields (`company_id`, `person_id`, `job_id`) included when provided.
- Env fallback: `LOXO_DEFAULT_OWNER_EMAIL=heather@example.com` + no arg → body contains `deal[owner_email]=heather@example.com`.
- Explicit `owner_email` overrides env.
- Neither arg nor env → `isError: true` before fetch.
- Missing required field (e.g. no `name`) → Zod rejection before fetch.

### `loxo_log_deal_activity`

- POSTs `activity_type_id` and `notes` to `/deals/{deal_id}/events`.
- Non-numeric `deal_id` rejected before fetch.
- Missing `activity_type_id` rejected before fetch.

### `loxo_get_activity_types` (modified)

- With `workflow_id` → URL includes `?workflow_id=<id>`.
- Without `workflow_id` → URL unchanged (backward compat).
- Non-numeric `workflow_id` rejected before fetch.

### Test-writing order (TDD)

Red → green → refactor, one tool at a time:

1. Config: `LOXO_DEFAULT_OWNER_EMAIL` env var + `resolveOwnerEmail` helper.
2. `loxo_get_activity_types` workflow_id param (modify existing).
3. `loxo_list_deal_workflows` (simplest new tool).
4. `loxo_get_deal_workflow`.
5. `loxo_search_deals`.
6. `loxo_get_deal`.
7. `loxo_create_deal` (most complex — owner resolution, form encoding).
8. `loxo_log_deal_activity`.

`tests/setup.ts` must NOT include `LOXO_DEFAULT_OWNER_EMAIL` with a real value — each owner-related test stubs via `vi.stubEnv()` within the test, with `vi.unstubAllEnvs()` in `afterEach`.

## Error handling

All tools route through existing `makeRequest<T>`, which handles HTTP errors, redacts bodies in stderr, and surfaces errors via the global handler. No new error paths.

Validation errors (non-numeric IDs, missing required fields, invalid emails) short-circuit before any network call and return `isError: true`.

Special case: `loxo_create_deal` returns a clear error if `owner_email` cannot be resolved from either the arg or env var, since the API requires it.

## Docs

| Doc | Change |
|---|---|
| `README.md` | Add `LOXO_DEFAULT_OWNER_EMAIL` to env var table; add six new deal tools to tool list; add `workflow_id` param note on `loxo_get_activity_types`. |
| `docs/getting-started/installation.md` | Document `LOXO_DEFAULT_OWNER_EMAIL` — purpose, optional. |
| New: `docs/reference/deals.md` | Full reference for all six deal tools with examples and workflow guidance. |
| `docs/reference/activities-tasks.md` | Document `workflow_id` param on `loxo_get_activity_types`; explain candidate vs deal activity types. |

## Release

- Version bump: `1.6.0` → `1.7.0` (six new tools + new env var = minor bump per semver).
- Follow existing flow: feature branch → PR → merge to main → separate version-bump PR.

## Out of scope (intentionally deferred)

- `loxo_update_deal` / `PATCH /deals/{id}` — no update endpoint in the OAS. Revisit if the API supports it undocumented.
- Deal Lucene field discovery — start with raw `query` pass-through; add convenience params when real search patterns emerge.
- `loxo_get_deal_brief` composite tool — wait for usage patterns showing repeated chained calls before adding enrichment.
- `dragged_and_dropped` param on deal events — UI-only concern.
